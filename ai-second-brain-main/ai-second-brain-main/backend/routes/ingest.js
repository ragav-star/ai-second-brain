const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { ingestPage } = require('../ingestor');
const { storeEmbedding } = require('../memory');
const { getDB } = require('../db');

// Auth middleware
function checkSecret(req, res, next) {
  const secret = req.headers['x-brain-secret'];
  if (process.env.EXTENSION_SECRET && secret !== process.env.EXTENSION_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// POST /api/ingest - receive page from Chrome extension
router.post('/', checkSecret, async (req, res) => {
  try {
    const { url, title, content, timeSpent } = req.body;

    if (!url || !content) {
      return res.status(400).json({ error: 'url and content are required' });
    }

    const db = getDB();

    // Check if already stored (deduplication)
    const existing = db.prepare('SELECT id FROM pages WHERE url = ?').get(url);
    if (existing) {
      // Update last_accessed and time_spent
      db.prepare(`
        UPDATE pages SET last_accessed = datetime('now'),
        time_spent = time_spent + ?
        WHERE url = ?
      `).run(timeSpent || 0, url);
      return res.json({ success: true, status: 'already_known', id: existing.id });
    }

    // Process and extract knowledge
    const result = await ingestPage({ url, title, content, timeSpent });

    if (!result.success) {
      return res.json({ success: false, reason: result.reason });
    }

    const { sourceType, domain, cleanedContent, knowledge } = result;
    const id = uuidv4();

    // Save to SQLite
    db.prepare(`
      INSERT INTO pages (id, url, title, source_type, domain, topics, summary, raw_content, word_count, time_spent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      url,
      title || 'Untitled',
      sourceType,
      domain,
      JSON.stringify(knowledge.topics || []),
      knowledge.summary || '',
      cleanedContent,
      cleanedContent.split(/\s+/).length,
      timeSpent || 0
    );

    // Update topic counts
    (knowledge.topics || []).forEach(topic => {
      db.prepare(`
        INSERT INTO topics (name, count, last_seen)
        VALUES (?, 1, datetime('now'))
        ON CONFLICT(name) DO UPDATE SET count = count + 1, last_seen = datetime('now')
      `).run(topic.toLowerCase());
    });

    // Store in vector DB
    const embeddingText = `${title}\n${knowledge.summary}\n${cleanedContent}`;
    await storeEmbedding(id, embeddingText, {
      url, title: title || 'Untitled',
      source_type: sourceType,
      domain,
      topics: (knowledge.topics || []).join(','),
      captured_at: new Date().toISOString()
    });

    // Notify dashboard via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('new_page', {
        id, url, title, sourceType, domain,
        topics: knowledge.topics,
        summary: knowledge.summary
      });
    }

    console.log(`✅ Captured: ${title?.substring(0, 50)} (${domain})`);

    res.json({
      success: true,
      status: 'captured',
      id,
      summary: knowledge.summary,
      topics: knowledge.topics
    });

  } catch (err) {
    console.error('Ingest error:', err.message);
    res.status(500).json({ error: 'Failed to ingest page', detail: err.message });
  }
});

// GET /api/ingest/recent - get recently captured pages
router.get('/recent', (req, res) => {
  const db = getDB();
  const limit = parseInt(req.query.limit) || 20;
  const pages = db.prepare(`
    SELECT id, url, title, source_type, domain, topics, summary, captured_at, time_spent
    FROM pages ORDER BY captured_at DESC LIMIT ?
  `).all(limit);

  res.json(pages.map(p => ({
    ...p,
    topics: JSON.parse(p.topics || '[]')
  })));
});

// DELETE /api/ingest/:id - remove a page
router.delete('/:id', (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM pages WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
