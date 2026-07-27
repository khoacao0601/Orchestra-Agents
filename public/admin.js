/**
 * WorldPulse Orchestra - Admin Drag & Drop Agent Canvas & Command Center (100% English)
 */

let ws = null;
let agentTopology = {
  nodes: [
    { id: 'web_scout', name: 'Web Scout Agent', type: 'Scout', avatar: '🌐', x: 50, y: 180, active: true, status: 'idle', color: '#3b82f6' },
    { id: 'region_filter', name: 'Region Filter Agent', type: 'Filter', avatar: '📍', x: 260, y: 180, active: true, status: 'idle', color: '#10b981' },
    { id: 'topic_economy', name: 'Economy Specialist', type: 'Domain', avatar: '📊', x: 480, y: 60, active: true, status: 'idle', color: '#f59e0b' },
    { id: 'topic_politics', name: 'Politics Specialist', type: 'Domain', avatar: '🏛️', x: 480, y: 180, active: true, status: 'idle', color: '#8b5cf6' },
    { id: 'topic_weather', name: 'Weather Specialist', type: 'Domain', avatar: '🌤️', x: 480, y: 300, active: true, status: 'idle', color: '#06b6d4' },
    { id: 'translator', name: 'Translator Agent', type: 'Localization', avatar: '🔤', x: 700, y: 180, active: true, status: 'idle', color: '#ec4899' },
    { id: 'journalist_publisher', name: 'Journalist & Publisher', type: 'Publisher', avatar: '📰', x: 920, y: 180, active: true, status: 'idle', color: '#f43f5e' }
  ],
  connections: [
    { from: 'web_scout', to: 'region_filter' },
    { from: 'region_filter', to: 'topic_economy' },
    { from: 'region_filter', to: 'topic_politics' },
    { from: 'region_filter', to: 'topic_weather' },
    { from: 'topic_economy', to: 'translator' },
    { from: 'topic_politics', to: 'translator' },
    { from: 'topic_weather', to: 'translator' },
    { from: 'translator', to: 'journalist_publisher' }
  ]
};

let draggedNode = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

document.addEventListener('DOMContentLoaded', () => {
  initAdminWebSocket();
  initCanvasUI();
  initFormControls();
  initTabs();
});

function initAdminWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    updateServerStatus(true, 'Connected to WebSocket Server (LangGraph Ready)');
    appendLog('system-log', '[SYSTEM] Connected to LangGraph Orchestra Control Server.');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'system_status') {
        if (data.payload?.topology) {
          agentTopology.nodes = agentTopology.nodes.map(n => {
            const serverNode = data.payload.topology.nodes.find(sn => sn.id === n.id);
            return serverNode ? { ...n, x: serverNode.x, y: serverNode.y } : n;
          });
          renderCanvas();
        }
      }

      if (data.type === 'agent_log') {
        const log = data.payload;
        appendLog(log.status || 'info', `[${log.agentName || 'AGENT'}] ${log.message}`);
      }

      if (data.type === 'agent_state_update') {
        const { agentId, status } = data.payload;
        updateAgentNodeStatus(agentId, status);
      }

      if (data.type === 'news_pipeline_started') {
        appendLog('thinking', `🚀 DISPATCHING LANGGRAPH: "${data.payload.topic}" [Category: ${data.payload.category}]`);
        resetAllNodeStatuses('thinking_reset');
      }

      if (data.type === 'news_pipeline_completed') {
        appendLog('completed', `🎉 PIPELINE COMPLETED! Orchestra published ${data.payload.totalArticles} stories.`);
      }

      if (data.type === 'news_pipeline_error') {
        appendLog('error', `❌ PIPELINE ERROR: ${data.payload}`);
      }
    } catch (e) {
      console.error('[WebSocket Admin Error]', e);
    }
  };

  ws.onclose = () => {
    updateServerStatus(false, 'Server disconnected. Retrying...');
    setTimeout(initAdminWebSocket, 3000);
  };
}

function initCanvasUI() {
  renderCanvas();

  const viewport = document.getElementById('canvasViewport');
  if (viewport) {
    viewport.addEventListener('mousemove', onCanvasMouseMove);
    viewport.addEventListener('mouseup', onCanvasMouseUp);
  }

  const resetBtn = document.getElementById('resetLayoutBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const defaultPositions = {
        'web_scout': { x: 50, y: 180 },
        'region_filter': { x: 260, y: 180 },
        'topic_economy': { x: 480, y: 60 },
        'topic_politics': { x: 480, y: 180 },
        'topic_weather': { x: 480, y: 300 },
        'translator': { x: 700, y: 180 },
        'journalist_publisher': { x: 920, y: 180 }
      };

      agentTopology.nodes.forEach(n => {
        if (defaultPositions[n.id]) {
          n.x = defaultPositions[n.id].x;
          n.y = defaultPositions[n.id].y;
        }
      });
      renderCanvas();
      saveTopologyToServer();
    });
  }

  const addAgentBtn = document.getElementById('addAgentBtn');
  if (addAgentBtn) {
    addAgentBtn.addEventListener('click', () => {
      const name = prompt('Enter new Agent name to add to Orchestra:', 'Custom Analyst Agent');
      if (name) {
        const id = `agent_${Date.now()}`;
        const newAgent = {
          id,
          name,
          type: 'Custom',
          avatar: '🤖',
          x: 480,
          y: 420,
          active: true,
          status: 'idle',
          color: '#a855f7'
        };
        agentTopology.nodes.push(newAgent);
        agentTopology.connections.push({ from: 'region_filter', to: id });
        agentTopology.connections.push({ from: id, to: 'translator' });
        renderCanvas();
        saveTopologyToServer();
        appendLog('system-log', `[SYSTEM] Added new custom agent: "${name}" to LangGraph graph!`);
      }
    });
  }
}

function renderCanvas() {
  const container = document.getElementById('nodesContainer');
  if (!container) return;

  container.innerHTML = agentTopology.nodes.map(n => `
    <div class="agent-node ${n.status || 'idle'}" 
         id="node_${n.id}" 
         style="left: ${n.x}px; top: ${n.y}px; border-color: ${n.color || '#6366f1'};"
         onmousedown="onNodeMouseDown(event, '${n.id}')">
      <div class="node-header">
        <span class="node-avatar">${n.avatar}</span>
        <div>
          <div class="node-title">${n.name}</div>
          <div class="node-role">${n.type}</div>
        </div>
      </div>
      <div class="node-status-badge" style="color: ${getStatusColor(n.status)}">
        ● ${getStatusText(n.status)}
      </div>
    </div>
  `).join('');

  drawSvgConnectors();
  renderAgentCards();
}

function drawSvgConnectors() {
  const svg = document.getElementById('svgConnectors');
  if (!svg) return;

  const nodeWidth = 190;
  const nodeHeight = 80;

  const paths = agentTopology.connections.map(conn => {
    const fromNode = agentTopology.nodes.find(n => n.id === conn.from);
    const toNode = agentTopology.nodes.find(n => n.id === conn.to);

    if (!fromNode || !toNode) return '';

    const x1 = fromNode.x + nodeWidth;
    const y1 = fromNode.y + nodeHeight / 2;
    const x2 = toNode.x;
    const y2 = toNode.y + nodeHeight / 2;

    const dx = Math.abs(x2 - x1) * 0.5;
    const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

    const isActive = fromNode.status === 'thinking' || fromNode.status === 'completed';
    const strokeColor = isActive ? '#10b981' : (fromNode.color || '#6366f1');

    return `<path d="${pathD}" style="stroke: ${strokeColor}; stroke-width: ${isActive ? 4 : 2.5}; opacity: ${isActive ? 1 : 0.6};" />`;
  }).join('');

  svg.innerHTML = paths;
}

window.onNodeMouseDown = function(e, nodeId) {
  draggedNode = agentTopology.nodes.find(n => n.id === nodeId);
  if (draggedNode) {
    const nodeEl = document.getElementById(`node_${nodeId}`);
    const rect = nodeEl.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
  }
};

function onCanvasMouseMove(e) {
  if (draggedNode) {
    const viewport = document.getElementById('canvasViewport');
    const rect = viewport.getBoundingClientRect();
    let x = e.clientX - rect.left - dragOffsetX;
    let y = e.clientY - rect.top - dragOffsetY;

    x = Math.max(10, Math.min(x, viewport.clientWidth - 200));
    y = Math.max(10, Math.min(y, viewport.clientHeight - 90));

    draggedNode.x = x;
    draggedNode.y = y;

    const nodeEl = document.getElementById(`node_${draggedNode.id}`);
    if (nodeEl) {
      nodeEl.style.left = `${x}px`;
      nodeEl.style.top = `${y}px`;
    }

    drawSvgConnectors();
  }
}

function onCanvasMouseUp() {
  if (draggedNode) {
    draggedNode = null;
    saveTopologyToServer();
  }
}

function saveTopologyToServer() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'update_topology',
      payload: agentTopology
    }));
  }
}

function updateAgentNodeStatus(agentId, status) {
  const node = agentTopology.nodes.find(n => n.id === agentId);
  if (node) {
    node.status = status;
    const nodeEl = document.getElementById(`node_${agentId}`);
    if (nodeEl) {
      nodeEl.className = `agent-node ${status}`;
      const badge = nodeEl.querySelector('.node-status-badge');
      if (badge) {
        badge.innerText = `● ${getStatusText(status)}`;
        badge.style.color = getStatusColor(status);
      }
    }
  }
  drawSvgConnectors();
  renderAgentCards();
}

function resetAllNodeStatuses() {
  agentTopology.nodes.forEach(n => n.status = 'idle');
  renderCanvas();
}

function getStatusText(status) {
  switch (status) {
    case 'thinking': return 'Thinking / Processing...';
    case 'completed': return 'Ready / Active';
    case 'error': return 'Error';
    default: return 'Idle';
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'thinking': return '#f59e0b';
    case 'completed': return '#10b981';
    case 'error': return '#ef4444';
    default: return '#94a3b8';
  }
}

function initFormControls() {
  const runBtn = document.getElementById('runPipelineBtn');
  if (runBtn) {
    runBtn.addEventListener('click', () => {
      const topic = document.getElementById('adminTopicInput')?.value || 'Global Breaking News';
      const category = document.getElementById('adminCategorySelect')?.value || 'all';
      const region = document.getElementById('adminRegionSelect')?.value || 'Global';
      const language = document.getElementById('adminLangSelect')?.value || 'en';

      if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('Not connected to WebSocket Server.');
        return;
      }

      ws.send(JSON.stringify({
        type: 'start_news_pipeline',
        payload: { topic, category, region, language }
      }));
    });
  }
}

function initTabs() {
  const logsBtn = document.getElementById('tabLogsBtn');
  const agentsBtn = document.getElementById('tabAgentsBtn');
  const logsTab = document.getElementById('logsTabContent');
  const agentsTab = document.getElementById('agentsTabContent');

  if (logsBtn && agentsBtn && logsTab && agentsTab) {
    logsBtn.addEventListener('click', () => {
      logsBtn.classList.add('active');
      agentsBtn.classList.remove('active');
      logsTab.classList.remove('hidden');
      agentsTab.classList.add('hidden');
    });

    agentsBtn.addEventListener('click', () => {
      agentsBtn.classList.add('active');
      logsBtn.classList.remove('active');
      agentsTab.classList.remove('hidden');
      logsTab.classList.add('hidden');
    });
  }
}

function appendLog(type, text) {
  const box = document.getElementById('terminalBox');
  if (!box) return;

  const time = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.className = `log-line ${type}`;
  line.innerText = `[${time}] ${text}`;

  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

function renderAgentCards() {
  const list = document.getElementById('agentCardsList');
  if (!list) return;

  list.innerHTML = agentTopology.nodes.map(n => `
    <div style="background: rgba(30, 41, 59, 0.6); padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 0.75rem; border: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 1.2rem;">${n.avatar}</span>
        <div>
          <div style="font-weight: 700; font-size: 0.85rem; color: #fff;">${n.name}</div>
          <div style="font-size: 0.7rem; color: #94a3b8;">Type: ${n.type}</div>
        </div>
      </div>
      <span style="font-size: 0.75rem; font-weight: 700; color: ${getStatusColor(n.status)}; background: rgba(255,255,255,0.05); padding: 0.2rem 0.5rem; border-radius: 4px;">
        ● ${getStatusText(n.status)}
      </span>
    </div>
  `).join('');
}

function updateServerStatus(connected, text) {
  const dot = document.getElementById('serverStatusDot');
  const textEl = document.getElementById('serverStatusText');
  if (dot) dot.style.backgroundColor = connected ? '#10b981' : '#ef4444';
  if (textEl) textEl.innerText = text;
}
