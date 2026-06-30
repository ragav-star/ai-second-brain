const statusEl = document.getElementById('status');
const countEl = document.getElementById('count');
const enabledEl = document.getElementById('enabled');
const serverUrlEl = document.getElementById('server-url');
const extensionSecretEl = document.getElementById('extension-secret');
const dashboardBtn = document.getElementById('dashboard-btn');

async function loadSettings() {
  const data = await chrome.storage.local.get(['enabled', 'captured', 'serverUrl', 'secret']);
  enabledEl.checked = data.enabled !== false;
  countEl.textContent = data.captured || 0;
  
  const serverUrl = data.serverUrl || 'http://localhost:3001';
  serverUrlEl.value = serverUrl;
  extensionSecretEl.value = data.secret || '';
  dashboardBtn.href = serverUrl;
}

async function checkServer() {
  const data = await chrome.storage.local.get(['serverUrl']);
  const serverUrl = data.serverUrl || 'http://localhost:3001';
  
  try {
    const res = await fetch(`${serverUrl.replace(/\/$/, '')}/api/health`, { signal: AbortSignal.timeout(2000) });
    await res.json();
    statusEl.textContent = '🟢 Server online';
    statusEl.className = 'status online';
  } catch (err) {
    statusEl.textContent = '🔴 Server offline';
    statusEl.className = 'status offline';
  }
}

enabledEl.addEventListener('change', () => {
  chrome.storage.local.set({ enabled: enabledEl.checked });
});

serverUrlEl.addEventListener('change', () => {
  let val = serverUrlEl.value.trim();
  if (val && !val.startsWith('http://') && !val.startsWith('https://')) {
    val = 'http://' + val;
    serverUrlEl.value = val;
  }
  const serverUrl = val || 'http://localhost:3001';
  chrome.storage.local.set({ serverUrl });
  dashboardBtn.href = serverUrl;
  checkServer();
});

extensionSecretEl.addEventListener('change', () => {
  const secret = extensionSecretEl.value.trim();
  chrome.storage.local.set({ secret });
});

async function init() {
  await loadSettings();
  await checkServer();
}

init();
