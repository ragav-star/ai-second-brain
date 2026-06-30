require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const { initDB } = require('./db');
const { initChroma } = require('./memory');
const ingestRoutes = require('./routes/ingest');
const queryRoutes = require('./routes/query');
const statsRoutes = require('./routes/stats');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, '../dashboard')));

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/ingest', ingestRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '🧠 AI Second Brain is running' });
});

// Socket.IO for real-time updates to dashboard
io.on('connection', (socket) => {
  console.log('📊 Dashboard connected');
  socket.on('disconnect', () => {
    console.log('📊 Dashboard disconnected');
  });
});

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    console.log('🧠 Starting AI Second Brain...');
    await initDB();
    console.log('✅ SQLite database ready');
    await initChroma();
    console.log('✅ ChromaDB vector store ready');
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Server running at http://localhost:${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}`);
      console.log(`\n📌 Next steps:`);
      console.log(`   1. Install the Chrome Extension from /chrome-extension folder`);
      console.log(`   2. Open dashboard at http://localhost:${PORT}`);
      console.log(`   3. Browse Stack Overflow, GitHub, blogs — brain captures automatically!\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  }
}

start();
