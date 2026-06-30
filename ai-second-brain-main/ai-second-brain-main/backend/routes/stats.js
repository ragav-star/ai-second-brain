const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { getCollectionCount } = require('../memory');

// GET /api/stats - overall brain statistics
router.get('/', async (req, res) => {
  try {
    const db = getDB();

    const totalPages = db.prepare('SELECT COUNT(*) as count FROM pages').get().count;
    const totalQueries = db.prepare('SELECT COUNT(*) as count FROM queries').get().count;

    const topTopics = db.prepare(`
      SELECT name, count FROM topics
      ORDER BY count DESC LIMIT 10
    `).all();

    const bySourceType = db.prepare(`
      SELECT source_type, COUNT(*) as count
      FROM pages GROUP BY source_type
      ORDER BY count DESC
    `).all();

    const recentActivity = db.prepare(`
      SELECT DATE(captured_at) as date, COUNT(*) as count
      FROM pages
      WHERE captured_at >= datetime('now', '-30 days')
      GROUP BY DATE(captured_at)
      ORDER BY date ASC
    `).all();

    const topDomains = db.prepare(`
      SELECT domain, COUNT(*) as count
      FROM pages GROUP BY domain
      ORDER BY count DESC LIMIT 8
    `).all();

    const vectorCount = await getCollectionCount();

    res.json({
      totalPages,
      totalQueries,
      vectorCount,
      topTopics,
      bySourceType,
      recentActivity,
      topDomains
    });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// GET /api/stats/search - search pages
router.get('/search', (req, res) => {
  const db = getDB();
  const { q, topic, source } = req.query;
  const limit = parseInt(req.query.limit) || 20;

  let query = 'SELECT id, url, title, source_type, domain, topics, summary, captured_at FROM pages WHERE 1=1';
  const params = [];

  if (q) {
    query += ' AND (title LIKE ? OR summary LIKE ? OR topics LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (topic) {
    query += ' AND topics LIKE ?';
    params.push(`%${topic}%`);
  }
  if (source) {
    query += ' AND source_type = ?';
    params.push(source);
  }

  query += ' ORDER BY captured_at DESC LIMIT ?';
  params.push(limit);

  const results = db.prepare(query).all(...params);
  res.json(results.map(p => ({ ...p, topics: JSON.parse(p.topics || '[]') })));
});

module.exports = router;
