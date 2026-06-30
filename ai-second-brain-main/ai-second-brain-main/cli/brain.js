#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const fetch = require('node-fetch');
const readline = require('readline');

// Use chalk v4 (CommonJS compatible)
let chalk;
try { chalk = require('chalk'); } catch { chalk = { blue: s=>s, green: s=>s, yellow: s=>s, red: s=>s, gray: s=>s, bold: s=>s, cyan: s=>s }; }

const API = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}/api`;

async function ask(question) {
  process.stdout.write(chalk.blue('\n🔍 Searching your knowledge base...\n'));

  try {
    const res = await fetch(`${API}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const data = await res.json();

    console.log('\n' + chalk.green('─'.repeat(60)));
    console.log(chalk.bold('🧠 Your Brain Says:\n'));
    console.log(data.answer);

    if (data.sources?.length) {
      console.log('\n' + chalk.gray('─'.repeat(60)));
      console.log(chalk.yellow('📎 Sources:'));
      data.sources.forEach((s, i) => {
        console.log(chalk.gray(`  [${i+1}] ${s.title?.substring(0, 60) || s.url}`));
        console.log(chalk.gray(`       ${s.url}`));
      });
    }
    console.log(chalk.green('─'.repeat(60)) + '\n');
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.error(chalk.red('\n❌ Brain server is not running!'));
      console.error(chalk.yellow('   Run: npm start\n'));
    } else {
      console.error(chalk.red('\n❌ Error: ' + err.message + '\n'));
    }
    process.exit(1);
  }
}

async function interactive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log(chalk.cyan('\n🧠 AI Second Brain — Interactive Mode'));
  console.log(chalk.gray('   Type your question and press Enter. Type "exit" to quit.\n'));

  const prompt = () => {
    rl.question(chalk.blue('> '), async (input) => {
      const q = input.trim();
      if (!q) { prompt(); return; }
      if (q === 'exit' || q === 'quit') { console.log(chalk.gray('\nGoodbye! 👋\n')); rl.close(); return; }
      await ask(q);
      prompt();
    });
  };
  prompt();
}

async function listRecent(limit) {
  try {
    const res = await fetch(`${API}/ingest/recent?limit=${limit}`);
    const pages = await res.json();
    console.log(chalk.cyan(`\n📚 ${pages.length} most recent captures:\n`));
    pages.forEach((p, i) => {
      console.log(chalk.bold(`${i+1}. ${p.title || 'Untitled'}`));
      console.log(chalk.gray(`   ${p.url}`));
      if (p.topics?.length) console.log(chalk.yellow(`   Topics: ${p.topics.join(', ')}`));
      console.log('');
    });
  } catch {
    console.error(chalk.red('❌ Could not reach server. Is it running? (npm start)'));
  }
}

async function showStats() {
  try {
    const res = await fetch(`${API}/stats`);
    const data = await res.json();
    console.log(chalk.cyan('\n📊 Brain Statistics:\n'));
    console.log(`  Pages captured: ${chalk.bold(data.totalPages)}`);
    console.log(`  Questions asked: ${chalk.bold(data.totalQueries)}`);
    console.log(`  Vector embeddings: ${chalk.bold(data.vectorCount || 'N/A')}`);
    if (data.topTopics?.length) {
      console.log(`\n  Top topics: ${data.topTopics.slice(0,8).map(t=>t.name).join(', ')}`);
    }
    console.log('');
  } catch {
    console.error(chalk.red('❌ Could not reach server.'));
  }
}

program
  .name('brain')
  .description('🧠 AI Second Brain CLI — query your developer knowledge base')
  .version('1.0.0');

program
  .command('ask [question...]')
  .description('Ask your brain a question')
  .action(async (words) => {
    if (!words?.length) { await interactive(); return; }
    await ask(words.join(' '));
  });

program
  .command('list')
  .description('List recently captured pages')
  .option('-n, --limit <number>', 'Number of pages to show', '10')
  .action(async (opts) => { await listRecent(parseInt(opts.limit)); });

program
  .command('stats')
  .description('Show brain statistics')
  .action(async () => { await showStats(); });

program
  .command('chat')
  .description('Start interactive chat mode')
  .action(async () => { await interactive(); });

// Default: if run without command, start interactive
if (process.argv.length === 2) {
  interactive();
} else {
  program.parse();
}
