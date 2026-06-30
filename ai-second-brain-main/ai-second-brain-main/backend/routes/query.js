const express = require('express');
const router = express.Router();
const { queryBrain } = require('../querier');
const { getDB } = require('../db');

// POST /api/query - ask the brain a question
router.post('/', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || question.trim().length < 3) {
      return res.status(400).json({ error: 'Question is too short' });
    }

    const result = await queryBrain(question.trim());
    res.json(result);
  } catch (err) {
    console.error('Query error:', err.message);
    res.status(500).json({ error: 'Failed to query brain', detail: err.message });
  }
});

// GET /api/query/history - recent queries
router.get('/history', (req, res) => {
  const db = getDB();
  const limit = parseInt(req.query.limit) || 20;
  const history = db.prepare(`
    SELECT id, question, answer, sources, asked_at
    FROM queries ORDER BY asked_at DESC LIMIT ?
  `).all(limit);

  res.json(history.map(q => ({
    ...q,
    sources: JSON.parse(q.sources || '[]')
  })));
});

module.exports = router;
