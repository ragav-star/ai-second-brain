const { ChromaClient } = require('chromadb');

const client = new ChromaClient({
  path: `http://${process.env.CHROMA_HOST || 'localhost'}:${process.env.CHROMA_PORT || 8000}`
});

let collection;
const COLLECTION_NAME = 'developer_brain';

async function initChroma() {
  try {
    collection = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { description: 'Developer knowledge base' }
    });
    console.log('✅ ChromaDB collection ready:', COLLECTION_NAME);
  } catch (err) {
    console.warn('⚠️  ChromaDB not available. Using fallback mode (no vector search).');
    console.warn('   To enable: run `docker run -p 8000:8000 chromadb/chroma`');
    collection = null;
  }
}

async function storeEmbedding(id, text, metadata) {
  if (!collection) return false;
  try {
    // Split into chunks of ~500 words for better retrieval
    const chunks = chunkText(text, 500);
    const ids = chunks.map((_, i) => `${id}_chunk_${i}`);
    const metadatas = chunks.map(() => ({ ...metadata, parent_id: id }));
    const documents = chunks;

    await collection.add({ ids, documents, metadatas });
    return true;
  } catch (err) {
    // Handle duplicate IDs gracefully
    if (err.message?.includes('already exists')) return true;
    console.error('ChromaDB store error:', err.message);
    return false;
  }
}

async function searchSimilar(query, nResults = 5) {
  if (!collection) return [];
  try {
    const results = await collection.query({
      queryTexts: [query],
      nResults: Math.min(nResults, 10)
    });

    if (!results.documents?.[0]) return [];

    return results.documents[0].map((doc, i) => ({
      content: doc,
      metadata: results.metadatas[0][i],
      distance: results.distances?.[0]?.[i] || 0
    }));
  } catch (err) {
    console.error('ChromaDB search error:', err.message);
    return [];
  }
}

async function deleteEmbedding(id) {
  if (!collection) return;
  try {
    const existing = await collection.get({ where: { parent_id: id } });
    if (existing.ids.length > 0) {
      await collection.delete({ ids: existing.ids });
    }
  } catch (err) {
    console.error('ChromaDB delete error:', err.message);
  }
}

async function getCollectionCount() {
  if (!collection) return 0;
  try {
    return await collection.count();
  } catch {
    return 0;
  }
}

function chunkText(text, maxWords) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  return chunks.length > 0 ? chunks : [text];
}

module.exports = { initChroma, storeEmbedding, searchSimilar, deleteEmbedding, getCollectionCount };
