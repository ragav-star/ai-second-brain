const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Detect what kind of page this is
function detectSourceType(url, title) {
  if (url.includes('stackoverflow.com')) return 'stackoverflow';
  if (url.includes('github.com')) return 'github';
  if (url.includes('developer.mozilla.org')) return 'mdn';
  if (url.includes('dev.to')) return 'devto';
  if (url.includes('medium.com')) return 'medium';
  if (url.includes('youtube.com')) return 'youtube';
  if (url.includes('npmjs.com')) return 'npm';
  return 'blog';
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

// Clean raw content — strip noise
function cleanContent(content, sourceType) {
  if (!content) return '';

  let cleaned = content
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{3,}/g, ' ')
    .trim();

  // Limit to 8000 chars for AI processing
  if (cleaned.length > 8000) {
    cleaned = cleaned.substring(0, 8000) + '...';
  }

  return cleaned;
}

// Use AI to extract structured knowledge from the page
async function extractKnowledge(content, url, title, sourceType) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are a developer knowledge extractor. Analyze this ${sourceType} page and extract key information.

URL: ${url}
Title: ${title}
Content:
${content.substring(0, 4000)}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "summary": "2-3 sentence summary of what this page teaches or solves",
  "topics": ["topic1", "topic2", "topic3"],
  "key_concepts": ["concept1", "concept2"],
  "language": "programming language if applicable, else null",
  "problem_solved": "what problem does this solve? (1 sentence)",
  "usefulness_score": 7
}

Topics should be specific tech terms like: react, nodejs, postgresql, docker, typescript, css, api, debugging, etc.
usefulness_score: 1-10 (10 = extremely useful reference)`
      }]
    });

    const text = response.content[0].text.trim();
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    // Fallback if AI fails
    return {
      summary: title || 'No summary available',
      topics: guessTopics(content + ' ' + title),
      key_concepts: [],
      language: null,
      problem_solved: 'Unknown',
      usefulness_score: 5
    };
  }
}

// Simple topic guesser as fallback
function guessTopics(text) {
  const techTerms = [
    'javascript', 'typescript', 'python', 'react', 'vue', 'angular',
    'nodejs', 'express', 'mongodb', 'postgresql', 'mysql', 'redis',
    'docker', 'kubernetes', 'aws', 'git', 'css', 'html', 'api',
    'graphql', 'rest', 'websocket', 'testing', 'debugging', 'performance',
    'security', 'authentication', 'deployment', 'linux', 'bash', 'rust', 'go'
  ];
  const lower = text.toLowerCase();
  return techTerms.filter(term => lower.includes(term)).slice(0, 5);
}

// Main ingest function
async function ingestPage({ url, title, content, timeSpent }) {
  const sourceType = detectSourceType(url, title);
  const domain = extractDomain(url);
  const cleaned = cleanContent(content, sourceType);

  if (cleaned.length < 100) {
    return { success: false, reason: 'Content too short to be useful' };
  }

  const knowledge = await extractKnowledge(cleaned, url, title, sourceType);

  return {
    success: true,
    sourceType,
    domain,
    cleanedContent: cleaned,
    knowledge
  };
}

module.exports = { ingestPage, detectSourceType, extractDomain };
