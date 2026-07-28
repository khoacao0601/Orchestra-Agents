import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { NewsOrchestrator } from './core/NewsOrchestrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

// Check if Angular production build dist exists, otherwise serve public/
const angularDistPath = path.join(__dirname, 'frontend', 'dist', 'frontend', 'browser');
const staticPath = fs.existsSync(angularDistPath) ? angularDistPath : path.join(__dirname, 'public');

console.log(`[Server] Serving static frontend from: ${staticPath}`);
app.use(express.static(staticPath));

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

// REST API Endpoints
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

// Angular SPA Client-Side Routing Fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.includes('.')) {
    return next();
  }
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
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

  ws.onclose = () => {
    clients.delete(ws);
    console.log('[WebSocket] Client disconnected. Remaining:', clients.size);
  };
});

const PORT = process.env.PORT || 3006;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 LangGraph Multi-Agent Newsroom Server Running!`);
  console.log(`📰 Reader Portal (Angular):   http://localhost:${PORT}`);
  console.log(`🎛️ Admin Control (Angular):  http://localhost:${PORT}/admin`);
  console.log(`=======================================================`);
});
