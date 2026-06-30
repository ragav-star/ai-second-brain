🧠 AI Second Brain for Developers
Every Stack Overflow answer you read, every blog post, every GitHub issue you solve — AI indexes it all. When you're stuck, it searches your own past learning first.

Dashboard Preview License AI

✨ What It Does
Passively captures everything you read on Stack Overflow, GitHub, MDN, Dev.to, Medium, npm
AI extracts key concepts, summaries, and topics automatically
Stores everything in a local vector database (100% private, runs on your machine)
Answers your questions by searching YOUR past learning first
CLI + Dashboard + Chrome Extension — use however you prefer
🚀 Quick Start
1. Clone & Setup
git clone <your-repo>
cd ai-second-brain
chmod +x setup.sh && ./setup.sh
2. Add Your API Key
Edit .env:

ANTHROPIC_API_KEY=sk-ant-your-key-here
EXTENSION_SECRET=any-random-string-here
3. (Optional) Start ChromaDB for Vector Search
docker run -d -p 8000:8000 chromadb/chroma
4. Start the Server
npm start
# or for development:
npm run dev
5. Install Chrome Extension
Open chrome://extensions in Chrome
Enable Developer mode (top right toggle)
Click Load unpacked
Select the chrome-extension/ folder
Pin the extension to your toolbar
6. Start Browsing!
Visit Stack Overflow, GitHub issues, MDN docs, or any dev blog. The extension silently captures what you read. Check the dashboard at http://localhost:3001

💬 Asking Questions
Web Dashboard
Open http://localhost:3001 and type your question in the Ask Brain box.

CLI
# Single question
node cli/brain.js ask "how did I fix that CORS error"

# Interactive chat mode
node cli/brain.js chat

# List recent captures
node cli/brain.js list -n 20

# Show stats
node cli/brain.js stats
🏗️ Project Structure
ai-second-brain/
├── backend/
│   ├── index.js          # Express + Socket.IO server
│   ├── db.js             # SQLite initialization
│   ├── memory.js         # ChromaDB vector operations
│   ├── ingestor.js       # AI content extraction
│   ├── querier.js        # RAG query engine
│   └── routes/
│       ├── ingest.js     # POST /api/ingest
│       ├── query.js      # POST /api/query
│       └── stats.js      # GET /api/stats
├── chrome-extension/
│   ├── manifest.json     # MV3 extension config
│   ├── content.js        # Page content extractor
│   ├── background.js     # Service worker
│   ├── popup.html        # Extension popup
│   └── popup.js
├── dashboard/
│   ├── index.html        # Web dashboard
│   └── app.js            # Frontend logic
├── cli/
│   └── brain.js          # Terminal interface
├── data/                 # SQLite database (auto-created)
├── .env.example          # Environment template
├── package.json
└── setup.sh              # Automated setup
🔧 API Reference
Ingest a Page
POST /api/ingest
Content-Type: application/json
X-Brain-Secret: your-secret

{
  "url": "https://stackoverflow.com/questions/...",
  "title": "How to fix CORS in Express",
  "content": "...",
  "timeSpent": 120
}
Query the Brain
POST /api/query
Content-Type: application/json

{ "question": "how to handle CORS in express?" }
Get Stats
GET /api/stats
GET /api/ingest/recent?limit=20
GET /api/query/history?limit=10
GET /api/stats/search?q=react&topic=hooks
🌐 Supported Sites (Chrome Extension)
Site	What's Captured
Stack Overflow	Question + accepted/top answer
GitHub Issues/PRs	Issue body + discussion thread
MDN Web Docs	Full documentation page
Dev.to	Full article
Medium	Full article
npm	Package documentation
Any dev blog	Main article content
🛠️ How the AI Works
Ingest: Chrome Extension sends page content → backend cleans it → Claude extracts summary, topics, key concepts
Embed: Content is chunked and stored as vectors in ChromaDB
Query: Your question → vector similarity search → top matching chunks → Claude answers using YOUR knowledge
💡 Example Questions to Ask
"How did I fix that promise chaining issue?"
"What's the pattern for debouncing in React?"
"How do I configure CORS in Express?"
"What did I read about PostgreSQL indexing?"
"How to deploy a Node app to Railway?"
🔒 Privacy
Everything runs 100% locally on your machine
No data is sent anywhere except to Anthropic's API for AI processing
Your knowledge base is stored in data/brain.db on your disk
📈 Future Ideas
 VS Code extension for in-editor queries
 YouTube transcript capture
 PDF/article manual import
 Knowledge gap detection
 Weekly learning digest email
 Team shared brain mode
📄 License
MIT — build something great with it! "# ai-second-brain"
