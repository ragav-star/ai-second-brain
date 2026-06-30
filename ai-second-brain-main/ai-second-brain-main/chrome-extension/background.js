// Background service worker
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'CAPTURED') {
    // Show badge briefly
    chrome.action.setBadgeText({ text: '✓', tabId: sender.tab?.id });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '', tabId: sender.tab?.id });
    }, 3000);
  }
});

// Initialize default settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    enabled: true,
    captured: 0,
    secret: ''
  });
  console.log('🧠 AI Second Brain extension installed!');
});
