const API = window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file://')
  ? `${window.location.origin}/api`
  : 'http://localhost:3001/api';

const socket = io(window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file://')
  ? window.location.origin
  : 'http://localhost:3001');

// ── VIEW SWITCHING ──────────────────────────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');

  if (name === 'library') loadPages();
  if (name === 'stats') loadStats();
  if (name === 'ask') loadQueryHistory();
}

// ── ASK BRAIN ──────────────────────────────────────────────
async function askBrain() {
  const input = document.getElementById('query-input');
  const question = input.value.trim();
  if (!question) return;

  const btn = document.getElementById('ask-btn');
  const thinkingEl = document.getElementById('thinking');
  const answerBox = document.getElementById('answer-box');
  const answerText = document.getElementById('answer-text');
  const answerSources = document.getElementById('answer-sources');

  btn.disabled = true;
  thinkingEl.style.display = 'flex';
  answerBox.classList.remove('visible');

  try {
    const res = await fetch(`${API}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    const data = await res.json();

    answerText.textContent = data.answer;

    if (data.sources?.length > 0) {
      answerSources.innerHTML = `
        <div class="answer-sources-label">📎 Sources from your knowledge</div>
        ${data.sources.map(s => `
          <a href="${s.url}" target="_blank" class="source-chip">
            ${sourceIcon(s.source_type)} ${s.title?.substring(0, 45) || s.domain}
          </a>
        `).join('')}
      `;
    } else {
      answerSources.innerHTML = '';
    }

    answerBox.classList.add('visible');
  } catch (err) {
    answerText.textContent = '❌ Error: Could not reach the brain server. Is it running?';
    answerBox.classList.add('visible');
  } finally {
    btn.disabled = false;
    thinkingEl.style.display = 'none';
  }
}

// ── PAGES / LIBRARY ─────────────────────────────────────────
let allPages = [];

async function loadPages() {
  const listEl = document.getElementById('pages-list');
  const countEl = document.getElementById('library-count');
  listEl.innerHTML = '<div class="loading">Loading your knowledge...</div>';

  try {
    const res = await fetch(`${API}/ingest/recent?limit=100`);
    allPages = await res.json();
    countEl.textContent = `${allPages.length} pages captured`;
    renderPages(allPages);
  } catch {
    listEl.innerHTML = '<div class="loading">❌ Could not connect to server</div>';
  }
}

function renderPages(pages) {
  const listEl = document.getElementById('pages-list');
  if (!pages.length) {
    listEl.innerHTML = `<div class="empty">
      <div class="empty-icon">📭</div>
      <h3>Nothing here yet</h3>
      <p>Install the Chrome Extension and browse some dev pages.<br>They'll appear here automatically!</p>
    </div>`;
    return;
  }

  listEl.innerHTML = pages.map(p => `
    <div class="page-card">
      <div class="page-card-top">
        <div class="page-card-title">
          <a href="${p.url}" target="_blank">${p.title || p.url}</a>
        </div>
        <span class="source-badge badge-${p.source_type}">${sourceLabel(p.source_type)}</span>
      </div>
      ${p.summary ? `<div class="page-card-summary">${p.summary}</div>` : ''}
      <div class="page-card-bottom">
        ${(p.topics || []).slice(0,6).map(t => `<span class="page-topic">${t}</span>`).join('')}
        <span class="page-date">${formatDate(p.captured_at)}</span>
      </div>
    </div>
  `).join('');
}

function searchPages(query) {
  if (!query) { renderPages(allPages); return; }
  const q = query.toLowerCase();
  const filtered = allPages.filter(p =>
    (p.title || '').toLowerCase().includes(q) ||
    (p.summary || '').toLowerCase().includes(q) ||
    (p.topics || []).some(t => t.toLowerCase().includes(q))
  );
  document.getElementById('library-count').textContent = `${filtered.length} of ${allPages.length} pages`;
  renderPages(filtered);
}

// ── QUERY HISTORY ───────────────────────────────────────────
async function loadQueryHistory() {
  const histEl = document.getElementById('query-history');
  try {
    const res = await fetch(`${API}/query/history?limit=10`);
    const history = await res.json();

    if (!history.length) {
      histEl.innerHTML = `<div class="empty">
        <div class="empty-icon">🤔</div>
        <h3>No questions yet</h3>
        <p>Ask your brain something above!</p>
      </div>`;
      return;
    }

    histEl.innerHTML = history.map(q => `
      <div class="page-card" onclick="document.getElementById('query-input').value='${q.question.replace(/'/g,'')}'">
        <div class="page-card-top">
          <div class="page-card-title">❓ ${q.question}</div>
          <span class="page-date">${formatDate(q.asked_at)}</span>
        </div>
        <div class="page-card-summary">${q.answer?.substring(0, 150)}...</div>
      </div>
    `).join('');
  } catch {
    histEl.innerHTML = '<div class="loading">❌ Could not load history</div>';
  }
}

// ── STATS ───────────────────────────────────────────────────
async function loadStats() {
  try {
    const res = await fetch(`${API}/stats`);
    const data = await res.json();

    document.getElementById('st-pages').textContent = data.totalPages;
    document.getElementById('st-topics').textContent = data.topTopics?.length || 0;
    document.getElementById('st-queries').textContent = data.totalQueries;
    document.getElementById('st-vectors').textContent = data.vectorCount || '—';
    document.getElementById('sb-pages').textContent = data.totalPages;
    document.getElementById('sb-queries').textContent = data.totalQueries;

    // Source breakdown
    document.getElementById('source-breakdown').innerHTML = (data.bySourceType || []).map(s => `
      <div class="page-card" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px">
        <span>${sourceIcon(s.source_type)} ${sourceLabel(s.source_type)}</span>
        <span style="color:var(--accent);font-weight:800">${s.count}</span>
      </div>
    `).join('');

    // Domain breakdown
    document.getElementById('domain-breakdown').innerHTML = (data.topDomains || []).map(d => `
      <div class="page-card" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px">
        <span style="color:var(--dim)">${d.domain}</span>
        <span style="color:var(--accent);font-weight:800">${d.count}</span>
      </div>
    `).join('');

    // Topics
    document.getElementById('topic-pills').innerHTML = (data.topTopics || []).map(t => `
      <span class="topic-pill" onclick="filterByTopic('${t.name}')">${t.name} <small style="opacity:0.6">${t.count}</small></span>
    `).join('');

  } catch (err) {
    console.error('Stats error:', err);
  }
}

function filterByTopic(topic) {
  showView('library');
  document.getElementById('search-input').value = topic;
  searchPages(topic);
}

// ── LIVE FEED (Socket.IO) ───────────────────────────────────
socket.on('new_page', (data) => {
  const feedEl = document.getElementById('live-feed');

  // Remove empty state if present
  if (feedEl.querySelector('.empty')) feedEl.innerHTML = '';

  const item = document.createElement('div');
  item.className = 'live-item';
  item.innerHTML = `
    <div class="live-title">${data.title || data.url}</div>
    <div class="live-meta">
      ${sourceIcon(data.sourceType)} ${data.domain}
      ${data.topics?.length ? '· ' + data.topics.slice(0,3).join(', ') : ''}
      · just now
    </div>
  `;
  feedEl.prepend(item);

  // Keep max 20 items
  const items = feedEl.querySelectorAll('.live-item');
  if (items.length > 20) items[items.length - 1].remove();

  // Update sidebar count
  const countEl = document.getElementById('sb-pages');
  countEl.textContent = parseInt(countEl.textContent || 0) + 1;
});

// ── HELPERS ─────────────────────────────────────────────────
function sourceIcon(type) {
  const icons = {
    stackoverflow: '🟠',
    github: '⚫',
    mdn: '🔵',
    devto: '🟣',
    medium: '🟤',
    npm: '🔴',
    youtube: '▶️',
    blog: '📝'
  };
  return icons[type] || '🌐';
}

function sourceLabel(type) {
  const labels = {
    stackoverflow: 'Stack Overflow',
    github: 'GitHub',
    mdn: 'MDN',
    devto: 'Dev.to',
    medium: 'Medium',
    npm: 'npm',
    youtube: 'YouTube',
    blog: 'Blog'
  };
  return labels[type] || type || 'Web';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return d.toLocaleDateString();
}

// ── INIT ─────────────────────────────────────────────────────
loadStats();
loadQueryHistory();
