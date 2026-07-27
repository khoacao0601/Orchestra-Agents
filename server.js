import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { NewsOrchestrator } from './core/NewsOrchestrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create single instance of NewsOrchestrator
const clients = new Set();

const newsOrchestrator = new NewsOrchestrator((msg) => {
  const strMsg = JSON.stringify(msg);
  clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(strMsg);
    }
  });
});

// Explicit routes for Reader Portal & Admin Control Room
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/articles', (req, res) => {
  res.json({
    status: 'success',
    articles: newsOrchestrator.getLatestArticles()
  });
});

app.get('/api/topology', (req, res) => {
  res.json({
    status: 'success',
    topology: newsOrchestrator.getTopology()
  });
});

// Seed initial news run on startup if empty
setTimeout(async () => {
  if (newsOrchestrator.getLatestArticles().length === 0) {
    try {
      console.log('[Server Startup] Running initial LangGraph news pipeline...');
      await newsOrchestrator.runNewsPipeline({
        topic: 'Global Breaking News This Week',
        category: 'all',
        region: 'Global',
        language: 'en'
      });
    } catch (e) {
      console.warn('[Server Startup Notice]', e.message);
    }
  }
}, 2000);

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('[WebSocket] Client connected. Total active clients:', clients.size);

  // Send initial state & topology on connection
  ws.send(JSON.stringify({
    type: 'system_status',
    payload: {
      message: 'Connected to LangGraph Multi-Agent Newsroom Server',
      topology: newsOrchestrator.getTopology(),
      latestArticles: newsOrchestrator.getLatestArticles()
    }
  }));

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'start_news_pipeline') {
        const { topic = 'Global Breaking News', category = 'all', region = 'Global', language = 'en' } = data.payload || {};
        console.log('[Orchestrator] Starting LangGraph News Pipeline for:', topic);
        await newsOrchestrator.runNewsPipeline({ topic, category, region, language });
      }

      if (data.type === 'update_topology') {
        console.log('[Orchestrator] Admin updated agent topology.');
        newsOrchestrator.updateTopology(data.payload);
      }

      if (data.type === 'fetch_latest_news') {
        ws.send(JSON.stringify({
          type: 'news_published',
          payload: { articles: newsOrchestrator.getLatestArticles() }
        }));
      }
    } catch (err) {
      console.error('[WebSocket Error]', err);
      ws.send(JSON.stringify({
        type: 'news_pipeline_error',
        payload: err.message
      }));
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('[WebSocket] Client disconnected. Remaining:', clients.size);
  });
});

const PORT = process.env.PORT || 3006;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 LangGraph Multi-Agent Newsroom Server Running!`);
  console.log(`📰 Reader Portal (Public):   http://localhost:${PORT}`);
  console.log(`🎛️ Admin Control Room:      http://localhost:${PORT}/admin.html`);
  console.log(`=======================================================`);
});
