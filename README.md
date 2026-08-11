# WorldPulse - Multi-Agent Global News Orchestra

A real-time global news intelligence wire powered by **LangGraph JS (`@langchain/langgraph`)**, **Gemini 2.5 Flash AI**, **Node.js Express + WebSockets**, and **Angular 19**.

---

## 🌟 Key Features

- **Multi-Agent News Orchestra**: 6 specialized LangGraph agents (`WebScout`, `RegionFilter`, `TopicSpecialist` [Economy, Politics, Weather], `Translator`, `JournalistPublisher`).
- **🛡️ Agentic Skills Capability**: Integrated `fact-checking-skill` directly for `WebScoutAgent` using Python engines to verify claims against Wikipedia API, Google Fact Check API, calculate Trust Scores (0-100%), and filter fake news.
- **Angular 19 Standalone Architecture**: Built with Standalone Components, Signals, RxJS WebSocket Services, and Angular Router.
- **Public Reader Portal**: Clean editorial news feed with topic search bar, region & language filters, executive summary modals, and Web Speech API TTS.
- **💬 Interactive Article Comment Section**:
  - Full discussion board built into each article modal.
  - Reader name, avatar badge, comment submission form.
  - Comment upvoting / liking system with dynamic count updates.
  - LocalStorage persistence for user comments across sessions.
- **Admin Orchestra Command Center**: Drag & drop interactive SVG bezier node graph canvas, task dispatcher, and live terminal log console.

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
│   ├── WebScoutAgent.js         # Real-time RSS crawler & fact-checking-skill invoker
│   ├── RegionFilterAgent.js     # Geographic location & relevance analyst
│   ├── TopicSpecialistAgent.js  # Domain specialists (Economy, Politics, Weather)
│   ├── TranslatorAgent.js       # Multi-lingual polyglot localization agent
│   └── JournalistPublisherAgent.js # Chief editor & broadcast publisher agent
│
├── skills/                      # Agentic Skills & Tooling Framework
│   └── fact-checking-skill/     # Fact checking & Anti-Fake-News Skill
│       ├── SKILL.md             # Main skill instructions & schema definition
│       ├── scripts/
│       │   ├── fact_checker.py  # Python claim verification & Wikipedia/FactCheck API engine
│       │   └── process_data.py  # Markdown audit report generator
│       ├── references/
│       │   ├── api-guide.md     # Wikipedia REST API & Google Fact Check API guide
│       │   └── trust-score-rules.md # Trust score weights & fake news heuristic rules
│       └── assets/
│           └── verification-report-template.md # Editorial audit report template
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
            │   │   └── news.model.ts      # TypeScript interfaces (Article, Comment, Topology)
            │   └── services/
            │       └── websocket.service.ts # RxJS WebSocket & Comment persistence service
            │
            └── features/        # Feature Components
                ├── reader-portal/
                │   ├── reader-portal.component.ts   # Reader portal & comment logic
                │   ├── reader-portal.component.html # Editorial template with comment board
                │   └── reader-portal.component.css  # Reader & comment styles
                └── admin-control/
                    ├── admin-control.component.ts   # Admin control room logic
                    ├── admin-control.component.html # Drag & Drop canvas HTML
                    └── admin-control.component.css  # Dark cyber command styles
```

---

## ⚡ Tech Stack

- **AI & Multi-Agent Framework**: `@langchain/langgraph`, `@langchain/core`, `@google/genai` (Gemini 2.5 Flash)
- **Agentic Skills & Verification**: Python 3, Wikipedia REST API, Google Fact Check Tools API, Heuristic Fake News Detection
- **Backend**: Node.js, Express, `ws` (WebSockets), `rss-parser`, `dotenv`
- **Frontend**: Angular 19 (Standalone Components, Signals, RxJS, Angular Router)
- **Design System**: Dual-Theme UI (Bright Editorial Theme for Readers & Dark Cyber Theme for Admin)

---

## 🛡️ Agentic Skills Architecture (`fact-checking-skill`)

The newsroom pipeline equips agents with domain capabilities via modular skill packages in `skills/`:

### 🛡️ `fact-checking-skill` (Applied Agent: `WebScoutAgent`)
- **Main Skill Spec**: [`skills/fact-checking-skill/SKILL.md`](file:///C:/Learning/Vibe-coding/Orchestra/skills/fact-checking-skill/SKILL.md)
- **Python Engine**: [`skills/fact-checking-skill/scripts/fact_checker.py`](file:///C:/Learning/Vibe-coding/Orchestra/skills/fact-checking-skill/scripts/fact_checker.py)
- **Features**:
  - **Entity & Claim Extraction**: Extracts named entities, statistical figures ($50B, 45%), dates/years.
  - **API Cross-Checking**: Queries Wikipedia REST API & Google Fact Check Claim API.
  - **Anti-Fake-News Filter**: Detects clickbait, exaggeration, or numerical anomalies.
  - **Trust Score Rating (0-100%)**: Assigns ratings (`Verified`, `High Confidence`, `Needs Revision`, `Suspicious`, `Fake News Alert`).
- **Resilience**: Executes via Python CLI script with automatic JS fallback engine if Python binary is unavailable.

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
