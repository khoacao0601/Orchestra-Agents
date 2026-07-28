# WorldPulse - Multi-Agent Global News Orchestra

A real-time global news intelligence wire powered by **LangGraph JS (`@langchain/langgraph`)**, **Gemini 2.5 Flash AI**, **Node.js Express + WebSockets**, and **Angular 19**.

---

## 🏗️ File Structure Map

```
Orchestra/
├── README.md                    # Project documentation & setup guide
├── AI_CONTEXT.md                # Token-optimized context map for AI Coding Assistants
├── package.json                 # Project dependencies & build scripts
├── server.js                    # Express + WebSocket server entrypoint
├── config.js                    # Gemini API client configuration
├── .env.example                 # Environment variables template
│
├── agents/                      # Specialized Autonomous AI Agents
│   ├── BaseAgent.js             # Base agent class with Gemini API & Demo fallback
│   ├── WebScoutAgent.js         # Real-time RSS & Web news crawler
│   ├── RegionFilterAgent.js     # Geographic location & relevance analyst
│   ├── TopicSpecialistAgent.js  # Domain specialists (Economy, Politics, Weather)
│   ├── TranslatorAgent.js       # Multi-lingual polyglot localization agent
│   └── JournalistPublisherAgent.js # Chief editor & broadcast publisher agent
│
├── core/                        # Core Orchestrator Engine
│   └── NewsOrchestrator.js      # News pipeline runner & in-memory cache manager
│
├── langgraph/                   # LangGraph StateGraph Architecture
│   ├── newsroomState.js         # LangGraph Annotation state schema
│   └── newsroomGraph.js         # Compiled StateGraph workflow & edges
│
├── public/                      # Static fallback assets
│   └── index.html               # Minimal server startup fallback page
│
└── frontend/                    # Latest Angular 19 Production Workspace
    ├── angular.json             # Angular workspace configuration
    ├── package.json             # Angular package dependencies
    └── src/
        ├── index.html           # Main Angular HTML template
        ├── styles.css           # Global unified design system
        ├── main.ts              # Angular application entrypoint
        └── app/
            ├── app.ts           # Root component shell
            ├── app.html         # Root router outlet
            ├── app.routes.ts    # Angular Router (/ and /admin)
            ├── app.config.ts    # Angular providers configuration
            │
            ├── core/            # Services, Models & State
            │   ├── models/
            │   │   └── news.model.ts      # TypeScript interfaces & types
            │   └── services/
            │       └── websocket.service.ts # RxJS WebSocket streaming service
            │
            └── features/        # Feature Components
                ├── reader-portal/
                │   ├── reader-portal.component.ts   # Public news portal logic
                │   ├── reader-portal.component.html # Editorial HTML template
                │   └── reader-portal.component.css  # Reader styles
                └── admin-control/
                    ├── admin-control.component.ts   # Admin control room logic
                    ├── admin-control.component.html # Drag & Drop canvas HTML
                    └── admin-control.component.css  # Dark cyber command styles
```

---

## ⚡ Tech Stack

- **AI & Multi-Agent Framework**: `@langchain/langgraph`, `@langchain/core`, `@google/genai` (Gemini 2.5 Flash)
- **Backend**: Node.js, Express, `ws` (WebSockets), `rss-parser`, `dotenv`
- **Frontend**: Angular 19 (Standalone Components, Signals, RxJS, Angular Router)
- **Design System**: Dual-Theme UI (Bright Editorial Theme for Readers & Dark Cyber Theme for Admin)

---

## 🚀 Quick Start Guide

### 1. Installation
```bash
# Install backend dependencies
npm install

# Install Angular frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3006
```
*(Note: If no API key is provided, the system automatically runs in **Demo Simulation Mode**).*

### 3. Build & Run
```bash
# Build Angular production bundle
npm run build

# Start the unified Node.js server
npm start
```

### 4. Access URLs
- **Public Reader Portal**: [http://localhost:3006/](http://localhost:3006/)
- **Admin Agent Control Room**: [http://localhost:3006/admin](http://localhost:3006/admin)

---

## 📄 License
MIT License.
