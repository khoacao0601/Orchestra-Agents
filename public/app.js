/**
 * WorldPulse Orchestra - Public Reader Portal Frontend Script (Clean News Reader Portal)
 */

let allArticles = [];
let currentCategory = 'all';
let currentRegion = 'Global';
let currentLanguage = 'en';
let ws = null;

document.addEventListener('DOMContentLoaded', () => {
  initWebSocket();
  initEventListeners();
  fetchInitialArticles();
});

// WebSocket Connection & Real-Time News Stream Management
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('[WebSocket Reader] Connected to server.');
    updateOrchestraStatus('LIVE WIRE UPDATED', 'active');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'system_status') {
        if (data.payload?.latestArticles) {
          allArticles = data.payload.latestArticles;
          renderArticles();
        }
      }

      if (data.type === 'news_pipeline_started') {
        showLoading(true);
        updateTicker(`🚀 Gathering stories for: "${data.payload.topic}"...`);
        updateOrchestraStatus('UPDATING WIRE', 'running');
      }

      if (data.type === 'news_published') {
        if (data.payload?.articles) {
          allArticles = data.payload.articles;
          renderArticles();
          showLoading(false);
          const topTitle = allArticles[0]?.title || 'New breaking stories published!';
          updateTicker(`🔥 JUST PUBLISHED: ${topTitle}`);
        }
      }

      if (data.type === 'news_pipeline_completed') {
        showLoading(false);
        updateOrchestraStatus('LIVE WIRE UPDATED', 'active');
      }

      if (data.type === 'news_pipeline_error') {
        showLoading(false);
        updateOrchestraStatus('WIRE ERROR', 'error');
        alert(`Wire Error: ${data.payload}`);
      }
    } catch (e) {
      console.error('[WebSocket Error]', e);
    }
  };

  ws.onclose = () => {
    updateOrchestraStatus('RECONNECTING', 'idle');
    setTimeout(initWebSocket, 3000);
  };
}

// Fetch initial stories fallback via REST API
async function fetchInitialArticles() {
  try {
    const res = await fetch('/api/articles');
    const data = await res.json();
    if (data.status === 'success' && data.articles) {
      allArticles = data.articles;
      renderArticles();
    }
  } catch (err) {
    console.warn('[API Fetch Notice]', err.message);
  }
}

function initEventListeners() {
  // Category tabs
  const tabs = document.querySelectorAll('.topic-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.cat;
      renderArticles();
    });
  });

  // Region dropdown
  const regionSelect = document.getElementById('regionSelect');
  if (regionSelect) {
    regionSelect.addEventListener('change', (e) => {
      currentRegion = e.target.value;
      renderArticles();
    });
  }

  // Language dropdown
  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      currentLanguage = e.target.value;
      triggerNewsDispatch(document.getElementById('readerTopicInput')?.value || 'Breaking News');
    });
  }

  // Reader topic search bar
  const searchBtn = document.getElementById('readerSearchBtn');
  const topicInput = document.getElementById('readerTopicInput');
  if (searchBtn && topicInput) {
    searchBtn.addEventListener('click', () => {
      const topic = topicInput.value.trim() || 'Global Breaking News';
      triggerNewsDispatch(topic);
    });

    topicInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const topic = topicInput.value.trim() || 'Global Breaking News';
        triggerNewsDispatch(topic);
      }
    });
  }

  // Modal Close
  const closeBtn = document.getElementById('modalCloseBtn');
  const modal = document.getElementById('articleModal');
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }
}

function triggerNewsDispatch(topic) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  showLoading(true);
  ws.send(JSON.stringify({
    type: 'start_news_pipeline',
    payload: {
      topic,
      category: currentCategory,
      region: currentRegion,
      language: currentLanguage
    }
  }));
}

function renderArticles() {
  const grid = document.getElementById('newsGrid');
  const countEl = document.getElementById('articleCount');
  if (!grid) return;

  // Filter logic
  let filtered = allArticles.filter(art => {
    const matchCategory = currentCategory === 'all' || art.category === currentCategory;
    const matchRegion = currentRegion === 'Global' || art.region?.includes(currentRegion) || art.region === 'Global Wire';
    return matchCategory && matchRegion;
  });

  if (countEl) countEl.innerText = `${filtered.length} stories`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: #64748b;">
        <p style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem; color: #0f172a;">No stories found under this filter.</p>
        <p>Click "Search News" above to fetch fresh coverage!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(art => `
    <article class="editorial-card" onclick="openModal('${art.id}')">
      <div>
        <div class="card-header-meta">
          <span class="badge-cat" style="background-color: ${art.cardColor || '#2563eb'}">
            ${art.cardIcon || '📰'} ${art.categoryLabel || art.category}
          </span>
          <span class="badge-region">📍 ${art.region || 'Global'}</span>
        </div>
        <h3 class="story-title">${art.title}</h3>
        <p class="story-tldr">${art.tldr || art.snippet}</p>
      </div>

      <div class="card-footer">
        <div class="factcheck-badge">
          <span>✓ ${art.factCheckRating || 'Verified'}</span>
          <span>(${art.confidenceScore || 96}%)</span>
        </div>
        <span class="read-link">Read Full Story &rarr;</span>
      </div>
    </article>
  `).join('');
}

window.openModal = function(articleId) {
  const art = allArticles.find(a => a.id === articleId);
  if (!art) return;

  const modal = document.getElementById('articleModal');
  document.getElementById('modalCategoryBadge').innerText = `${art.cardIcon || '📰'} ${art.categoryLabel || art.category}`;
  document.getElementById('modalCategoryBadge').style.backgroundColor = art.cardColor || '#2563eb';
  document.getElementById('modalRegionTag').innerText = `📍 ${art.region || 'Global'}`;
  document.getElementById('modalConfidenceTag').innerText = `✓ ${art.factCheckRating || 'Verified'} (${art.confidenceScore || 96}%)`;
  
  document.getElementById('modalTitle').innerText = art.title;
  document.getElementById('modalSource').innerText = `Source: ${art.source || 'Orchestra Wire'}`;
  document.getElementById('modalTime').innerText = `Published: ${new Date(art.publishedAt || Date.now()).toLocaleTimeString()}`;
  document.getElementById('modalTldr').innerText = art.tldr || art.snippet;

  const takeawaysList = document.getElementById('modalKeyTakeaways');
  takeawaysList.innerHTML = (art.keyTakeaways || [art.snippet]).map(t => `<li>${t}</li>`).join('');

  document.getElementById('modalExpertAnalysis').innerText = art.expertAnalysis || art.snippet;

  const tagsContainer = document.getElementById('modalTags');
  tagsContainer.innerHTML = (art.tags || ['Global News']).map(t => `<span class="badge-region" style="font-size:0.75rem;">#${t}</span>`).join(' ');

  const speechBtn = document.getElementById('modalSpeechBtn');
  speechBtn.onclick = () => speakArticle(art.title + '. ' + art.tldr);

  modal.classList.remove('hidden');
};

function speakArticle(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLanguage === 'vi' ? 'vi-VN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  } else {
    alert('Browser speech synthesis is not supported.');
  }
}

function updateOrchestraStatus(text, mode) {
  const label = document.getElementById('orchestraStatusLabel');
  if (label) label.innerText = text;
}

function showLoading(show) {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) {
    if (show) spinner.classList.remove('hidden');
    else spinner.classList.add('hidden');
  }
}

function updateTicker(text) {
  const ticker = document.getElementById('tickerText');
  if (ticker) ticker.innerText = text;
}
