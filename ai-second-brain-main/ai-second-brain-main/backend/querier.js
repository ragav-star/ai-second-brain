const Anthropic = require('@anthropic-ai/sdk');
const { searchSimilar } = require('./memory');
const { getDB } = require('./db');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function queryBrain(question) {
  const db = getDB();

  // 1. Search vector store for relevant chunks
  const vectorResults = await searchSimilar(question, 6);

  // 2. Also do keyword search in SQLite as backup (improved token matching)
  const keywords = question.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['how', 'why', 'what', 'where', 'when', 'who', 'the', 'and', 'for', 'you', 'are', 'with', 'from', 'this', 'that', 'fix', 'error', 'issue'].includes(w));

  let keywordResults = [];
  if (keywords.length > 0) {
    const clauses = keywords.map(() => `(title LIKE ? OR summary LIKE ? OR raw_content LIKE ? OR topics LIKE ?)`).join(' AND ');
    const params = [];
    keywords.forEach(kw => {
      params.push(`%${kw}%`, `%${kw}%`, `%${kw}%`, `%${kw}%`);
    });
    
    try {
      keywordResults = db.prepare(`
        SELECT id, url, title, summary, topics, source_type, domain, captured_at
        FROM pages
        WHERE ${clauses}
        ORDER BY captured_at DESC
        LIMIT 5
      `).all(...params);
    } catch (err) {
      console.warn('Advanced keyword search failed, falling back:', err.message);
    }
  }

  // Fallback to simple matching if no tokenized results found
  if (keywordResults.length === 0) {
    keywordResults = db.prepare(`
      SELECT id, url, title, summary, topics, source_type, domain, captured_at
      FROM pages
      WHERE raw_content LIKE ? OR title LIKE ? OR summary LIKE ? OR topics LIKE ?
      ORDER BY captured_at DESC
      LIMIT 5
    `).all(
      `%${question}%`, `%${question}%`, `%${question}%`, `%${question}%`
    );
  }

  // 3. Build context from results
  const contextSources = [];

  // Add vector search results
  vectorResults.forEach(result => {
    if (result.metadata?.url) {
      contextSources.push({
        content: result.content,
        url: result.metadata.url,
        title: result.metadata.title || result.metadata.url,
        source_type: result.metadata.source_type,
        domain: result.metadata.domain,
        captured_at: result.metadata.captured_at,
        relevance: 'vector_match'
      });
    }
  });

  // Add keyword results not already in context
  keywordResults.forEach(row => {
    const alreadyAdded = contextSources.some(s => s.url === row.url);
    if (!alreadyAdded) {
      contextSources.push({
        content: row.summary,
        url: row.url,
        title: row.title,
        source_type: row.source_type,
        domain: row.domain,
        captured_at: row.captured_at,
        relevance: 'keyword_match'
      });
    }
  });

  if (contextSources.length === 0) {
    return {
      answer: "I don't have anything in your knowledge base about this yet. Browse some relevant pages and I'll learn from them!",
      sources: [],
      hasAnswer: false
    };
  }

  // 4. Build context string for AI
  const contextString = contextSources.slice(0, 6).map((s, i) =>
    `[Source ${i + 1}: ${s.title || s.url} (${s.domain || s.source_type})]
${s.content}`
  ).join('\n\n---\n\n');

  // 5. Ask Claude with the retrieved context (with graceful fallback if API key is missing or fails)
  let answer;
  if (!process.env.ANTHROPIC_API_KEY) {
    answer = `⚠️  [AI Offline] Anthropic API key is not configured in your .env file.\n\nHere are the most relevant matches from your Knowledge Library:\n\n` + 
      contextSources.slice(0, 6).map((s, i) => `📌 [${i+1}] ${s.title}\nSource: ${s.url}\nSummary: ${s.content}`).join('\n\n');
  } else {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a developer's personal AI assistant with access to their personal knowledge base.
Answer the question using ONLY the knowledge base excerpts below.
Always cite which source the information came from using [Source N].
If the sources don't fully answer the question, say what you found and what's missing.
Be specific, technical, and practical.

QUESTION: ${question}

KNOWLEDGE BASE:
${contextString}

Give a clear, direct answer with code examples if relevant. Mention the source numbers.`
        }]
      });
      answer = response.content[0].text;
    } catch (err) {
      answer = `❌ [AI Error] Failed to generate response from Anthropic API: ${err.message}\n\nHere are the matching pages found in your library:\n\n` + 
        contextSources.slice(0, 6).map((s, i) => `📌 [${i+1}] ${s.title}\nSource: ${s.url}\nSummary: ${s.content}`).join('\n\n');
    }
  }

  // 6. Save this query to history
  const { v4: uuidv4 } = require('uuid');
  db.prepare(`
    INSERT INTO queries (id, question, answer, sources, asked_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(
    uuidv4(),
    question,
    answer,
    JSON.stringify(contextSources.map(s => ({ url: s.url, title: s.title })))
  );

  return {
    answer,
    sources: contextSources.slice(0, 6).map(s => ({
      url: s.url,
      title: s.title || s.url,
      domain: s.domain,
      source_type: s.source_type,
      captured_at: s.captured_at
    })),
    hasAnswer: true
  };
}

module.exports = { queryBrain };
