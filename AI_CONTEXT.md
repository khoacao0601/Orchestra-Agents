# AI_CONTEXT.md - High-Efficiency Codebase Context for AI Agents

> **Purpose**: Read this file first to gain 100% architectural context of this project in a single step, minimizing token consumption.

---

## 🎯 System Architecture at a Glance

```
User / Admin
    │
    ├── [Angular 19 SPA Frontend] (Port 3006)
    │     ├── Public Reader Portal:  http://localhost:3006/
    │     └── Admin Control Room:   http://localhost:3006/admin
    │
    └── [Node.js + WebSockets + LangGraph Engine]
          ├── NewsOrchestrator.js
          ├── newsroomGraph.js (StateGraph Workflow)
          └── 6 Autonomous Agent Classes (Gemini 2.5 Flash / Demo Mode)
```

---

## 📂 Core File & Symbol Index

| File Path | Role | Key Exported Symbols | Description |
| :--- | :--- | :--- | :--- |
| `server.js` | Express & WS Entry | `server`, `wss`, `app` | Serves Angular build, routes REST `/api/articles` & `/api/topology`, manages WebSocket broadcast. |
| `config.js` | Gemini Client | `getAiClient()`, `DEFAULT_MODEL` | Initializes `@google/genai` with `GEMINI_API_KEY`. Defaults to `gemini-2.5-flash`. |
| `core/NewsOrchestrator.js` | Orchestrator Core | `NewsOrchestrator` | Holds in-memory `latestArticles`, `agentTopology`, runs LangGraph pipeline, broadcasts events. |
| `langgraph/newsroomState.js` | LangGraph State | `NewsroomStateAnnotation` | Defines State schema (`topic`, `targetCategory`, `targetRegion`, `targetLanguage`, `rawArticles`, `filteredArticles`, `topicInsights`, `translatedArticles`, `publishedArticles`, `activeNodes`, `logs`). |
| `langgraph/newsroomGraph.js` | LangGraph Builder | `createNewsroomGraph()` | Compiles `StateGraph` linking all agent nodes with conditional category edges. |
| `agents/BaseAgent.js` | Base Agent | `BaseAgent` | Handles Gemini API `generateContent` calls with fallback to `mockResponseHandler` when key is absent. |
| `agents/WebScoutAgent.js` | Agent Node 1 | `WebScoutAgent` | Fetches Google News RSS feeds & extracts raw articles. |
| `agents/RegionFilterAgent.js` | Agent Node 2 | `RegionFilterAgent` | Evaluates geo region tags, coordinates, and relevance scores. |
| `agents/TopicSpecialistAgent.js` | Agent Node 3 | `TopicSpecialistAgent` | Domain analysis for 3 categories: `'economy'`, `'politics'`, `'weather'`. |
| `agents/TranslatorAgent.js` | Agent Node 4 | `TranslatorAgent` | Localizes articles into `'en'`, `'vi'`, `'fr'`, `'es'`, `'ja'`. |
| `agents/JournalistPublisherAgent.js` | Agent Node 5 | `JournalistPublisherAgent` | Formats final story cards (TL;DR, key takeaways, confidence meter, tags) & publishes. |
| `frontend/src/app/core/models/news.model.ts` | TS Contracts | `Article`, `AgentNode`, `Topology`, `LogEntry` | Angular TypeScript interfaces. |
| `frontend/src/app/core/services/websocket.service.ts` | Angular Service | `WebSocketService` | RxJS BehaviorSubject stream manager (`articles$`, `topology$`, `logs$`, `agentStates$`, `pipelineStatus$`). |
| `frontend/src/app/features/reader-portal/` | Angular Reader | `ReaderPortalComponent` | Public editorial news reader with filters, modal popup & speech synthesis TTS. |
| `frontend/src/app/features/admin-control/` | Angular Admin | `AdminControlComponent` | Dark cyber command room with SVG drag & drop canvas, task dispatcher, and terminal log console. |

---

## 📡 WebSocket Event Payload Schema

### Server -> Client (Broadcast)
- `system_status`: `{ latestArticles: Article[], topology: Topology }`
- `agent_log`: `{ agentId, agentName, status, message }`
- `agent_state_update`: `{ agentId, status: 'idle' | 'thinking' | 'completed' | 'error', data }`
- `news_pipeline_started`: `{ topic, category, region, language, timestamp }`
- `news_published`: `{ articles: Article[] }`
- `news_pipeline_completed`: `{ totalArticles, timestamp }`
- `news_pipeline_error`: `errorMessageString`
- `topology_updated`: `Topology`

### Client -> Server (Requests)
- `start_news_pipeline`: `{ payload: { topic, category, region, language } }`
- `update_topology`: `{ payload: Topology }`
- `fetch_latest_news`: `{}`

---

## ⚙️ Key Rules & Design Contracts

1. **Language Policy**: 100% English across source code, template strings, comments, default dataset, logs, and Web UI.
2. **Framework Standard**: Angular 19 with Standalone Components (`imports: [CommonModule, FormsModule, RouterLink]`), Signals (`signal()`), and RxJS (`BehaviorSubject`).
3. **Execution Safety**: Dual-mode engine. If `GEMINI_API_KEY` is not present in `.env`, agents automatically execute rich simulation mode without throwing runtime errors.
4. **Build Location**: Angular production bundle builds to `frontend/dist/frontend/browser` and is served statically by Express at `server.js`.
