// Content script - runs on matching pages
// Extracts meaningful content and sends to backend

// Server URL is loaded dynamically from storage
const MIN_TIME_ON_PAGE = 15; // seconds - only capture if user spent 15s+
const startTime = Date.now();

function extractStackOverflow() {
  const question = document.querySelector('#question-header h1')?.innerText || '';
  const questionBody = document.querySelector('.question .s-prose')?.innerText || '';
  const acceptedAnswer = document.querySelector('.answer.accepted-answer .s-prose')?.innerText || '';
  const topAnswer = document.querySelector('.answer .s-prose')?.innerText || '';

  return {
    title: question,
    content: [
      'QUESTION:', question,
      questionBody,
      '\nACCEPTED ANSWER:',
      acceptedAnswer || topAnswer
    ].join('\n')
  };
}

function extractGitHub() {
  const title = document.querySelector('.js-issue-title, h1.gh-header-title')?.innerText || document.title;
  const issueBody = document.querySelector('.comment-body')?.innerText || '';
  const comments = Array.from(document.querySelectorAll('.timeline-comment .comment-body'))
    .slice(0, 5)
    .map(el => el.innerText)
    .join('\n\n---\n\n');

  return {
    title,
    content: [title, issueBody, '\nDISCUSSION:', comments].join('\n')
  };
}

function extractMDN() {
  const title = document.querySelector('h1')?.innerText || document.title;
  const content = document.querySelector('#content article, .main-page-content')?.innerText || '';

  return { title, content };
}

function extractGeneric() {
  const title = document.querySelector('h1')?.innerText || document.title;

  // Remove nav, footer, sidebar, ads
  const cloned = document.body.cloneNode(true);
  ['nav', 'footer', 'header', 'aside', '.sidebar', '.ad', '.advertisement',
    '.cookie', '.popup', '.modal', 'script', 'style'].forEach(sel => {
    cloned.querySelectorAll(sel).forEach(el => el.remove());
  });

  // Get main content area
  const main = cloned.querySelector('main, article, .content, .post, #content, .article-body')
    || cloned;

  const content = main.innerText || cloned.innerText;

  return { title, content: content.substring(0, 10000) };
}

function extractContent() {
  const url = window.location.href;

  if (url.includes('stackoverflow.com')) return extractStackOverflow();
  if (url.includes('github.com')) return extractGitHub();
  if (url.includes('developer.mozilla.org')) return extractMDN();
  return extractGeneric();
}

async function sendToBackend(data) {
  try {
    const settings = await chrome.storage.local.get(['secret', 'enabled', 'captured', 'serverUrl']);
    if (settings.enabled === false) return;

    const secret = settings.secret || '';
    const serverUrl = (settings.serverUrl || 'http://localhost:3001').replace(/\/$/, '');

    const response = await fetch(`${serverUrl}/api/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Brain-Secret': secret
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      // Track captured count
      const captured = (settings.captured || 0) + (result.status === 'captured' ? 1 : 0);
      await chrome.storage.local.set({ captured });

      if (result.status === 'captured') {
        // Show subtle notification via background
        chrome.runtime.sendMessage({
          type: 'CAPTURED',
          title: data.title,
          topics: result.topics
        });
      }
    }
  } catch (err) {
    // Backend not running — fail silently
    console.debug('[Brain] Backend not available:', err.message);
  }
}

// Wait for user to spend time on page before capturing
window.addEventListener('beforeunload', async () => {
  const timeSpent = Math.floor((Date.now() - startTime) / 1000);

  if (timeSpent < MIN_TIME_ON_PAGE) return;

  const { title, content } = extractContent();

  if (!content || content.length < 200) return;

  await sendToBackend({
    url: window.location.href,
    title,
    content,
    timeSpent
  });
});

// Also capture after 60 seconds if user is still on page
setTimeout(async () => {
  const { title, content } = extractContent();
  if (content && content.length > 200) {
    await sendToBackend({
      url: window.location.href,
      title,
      content,
      timeSpent: 60
    });
  }
}, 60000);
