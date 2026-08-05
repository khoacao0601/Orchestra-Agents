---
name: fact-checking-skill
description: Automatic fact-checking and anti-fake-news skill for Newsroom Agents. Verifies claims, stats, dates, and entities against Wikipedia API, Google Fact Check API, and heuristic credibility rules. Assigns Trust Score (0-100%) and fake news warnings.
version: 1.0.0
author: Newsroom AI Orchestra
applied_agent: WebScoutAgent
---

# 🛡️ Fact-Checking & Anti-Fake News Skill (`fact-checking-skill`)

## 📌 Overview
The **Fact-Checking Skill** equips newsroom agents (specifically `WebScoutAgent`) with automated capabilities to detect false, exaggerated, or misleading information in newly scraped news articles before they enter the editorial workflow.

By cross-referencing key entities, numerical figures, dates, and historical events against **Wikipedia API**, **Google Fact Check Claim API**, and **Heuristic Pattern Analysis**, this skill automatically computes a **Trust Score (0 - 100%)** and attaches verification flags to every story.

---

## 📁 Skill Directory Structure
```
skills/fact-checking-skill/
├── SKILL.md                          # Main skill specification & integration documentation
├── scripts/
│   ├── fact_checker.py              # Main Python verification engine & claim matcher
│   └── process_data.py              # Data formatting & verification report generator
├── references/
│   ├── api-guide.md                 # API documentation for Google Fact Check & Wikipedia REST APIs
│   └── trust-score-rules.md         # Trust Score calculation weights & fake news heuristic rules
└── assets/
    └── verification-report-template.md # Template for editorial fact-checking reports
```

---

## ⚙️ Execution & Usage

### 1. Direct Python Execution
```bash
python skills/fact-checking-skill/scripts/fact_checker.py --input input_articles.json --output verified_articles.json
```
Or via Stdin:
```bash
cat input_articles.json | python skills/fact-checking-skill/scripts/fact_checker.py
```

### 2. Integration in `WebScoutAgent`
`WebScoutAgent` calls the Python skill after fetching raw news items from RSS feeds or web sources:

```javascript
// Step 1: Scout raw news
const rawArticles = await this.fetchLiveRss(topic);

// Step 2: Apply fact-checking-skill
const verifiedArticles = await this.applyFactCheckingSkill(rawArticles, onLog);
```

---

## 📊 Trust Score & Rating Brackets

| Trust Score | Fact-Check Rating | Status / Description |
| :--- | :--- | :--- |
| **85% - 100%** | `Verified` | ✅ Fully verified across authoritative sources (Wikipedia, FactCheck API, Tier-1 media). |
| **70% - 84%** | `High Confidence` | 🟢 Credible source and facts aligned; minor unverified secondary details. |
| **50% - 69%** | `Needs Revision` | 🟡 Discrepancies in numbers, dates, or unverified claims requiring editor review. |
| **30% - 49%** | `Suspicious` | 🟠 High sensationalism index or uncorroborated sensational stats. |
| **0% - 29%** | `Fake News Alert` | 🔴 High probability of fake/fabricated news or debunked claim. |

---

## 🔧 Inputs & Outputs Schema

### Input JSON (`rawArticles`)
```json
{
  "articles": [
    {
      "id": "raw-1722800000-1",
      "title": "Global Central Banks Coordinate Policy Amid Inflation Shift",
      "snippet": "Major financial authorities announce strategic adjustment in interest rates...",
      "source": "Financial Times / Bloomberg",
      "publishedAt": "2026-08-05T04:00:00Z",
      "rawCategory": "Economy"
    }
  ]
}
```

### Output JSON (`verifiedArticles`)
```json
{
  "articles": [
    {
      "id": "raw-1722800000-1",
      "title": "Global Central Banks Coordinate Policy Amid Inflation Shift",
      "snippet": "Major financial authorities announce strategic adjustment in interest rates...",
      "source": "Financial Times / Bloomberg",
      "publishedAt": "2026-08-05T04:00:00Z",
      "rawCategory": "Economy",
      "trustScore": 95,
      "factCheckRating": "Verified",
      "factCheckNotes": "Cross-referenced with Wikipedia & FactCheck APIs. Source Financial Times verified.",
      "warnings": []
    }
  ]
}
```
