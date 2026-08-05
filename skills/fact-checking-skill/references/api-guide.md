# 🌐 API Integration Guide: Fact-Checking & Verification Sources

This document details the external APIs and data sources used by `fact-checking-skill` for cross-referencing news facts, named entities, dates, and statistics.

---

## 1. Wikipedia REST API & MediaWiki Action API

### Overview
Wikipedia provides open, high-reliability REST endpoints for querying entity definitions, historical events, dates, and background context without requiring authentication.

### Endpoint 1: Summary REST API
- **URL**: `GET https://en.wikipedia.org/api/rest_v1/page/summary/{title}`
- **User-Agent**: Required (e.g. `NewsroomFactChecker/1.0`)
- **Use Case**: Quick entity validation (e.g. "European Union", "Semiconductor", "Typhoon").
- **Sample Response**:
  ```json
  {
    "type": "standard",
    "title": "Semiconductor",
    "displaytitle": "Semiconductor",
    "extract": "A semiconductor is a material which has an electrical conductivity value falling between that of a conductor..."
  }
  ```

### Endpoint 2: Action Search API
- **URL**: `GET https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}&format=json`
- **Use Case**: Searching historical event names and multi-word terms when exact page title is unknown.

---

## 2. Google Fact Check Claim Search API

### Overview
Google Fact Check Tools API provides access to claims reviewed by independent fact-checking organizations worldwide (e.g., PolitiFact, Snopes, FactCheck.org, AFP Fact Check).

### Endpoint
- **URL**: `GET https://factchecktools.googleapis.com/v1alpha1/claims:search`
- **Parameters**:
  - `query`: The claim or topic phrase to search (e.g. "central bank interest rate hike").
  - `key`: Google Cloud API Key (or `GOOGLE_FACTCHECK_API_KEY` / `GEMINI_API_KEY`).
  - `languageCode`: Optional (e.g. `en`, `vi`).

### Sample Response
```json
{
  "claims": [
    {
      "text": "Claim text evaluated by fact checkers",
      "claimant": "Public Figure or Web Source",
      "claimDate": "2026-08-01T00:00:00Z",
      "claimReview": [
        {
          "publisher": {
            "name": "FactCheck.org",
            "site": "factcheck.org"
          },
          "url": "https://www.factcheck.org/...",
          "title": "Article Title",
          "textualRating": "False / Misleading"
        }
      ]
    }
  ]
}
```

---

## 3. Heuristic Source Reputation List

The skill includes a list of Tier-1 verified media outlets and international organizations:
- **Tier-1 Outlets**: Reuters, Bloomberg, Financial Times, BBC World, Associated Press, The New York Times, Wall Street Journal, The Economist.
- **International Bodies**: United Nations (UN), World Meteorological Organization (WMO), Climate Action Network.

Articles originating from or citing these sources receive an initial baseline trust bonus of `+8%`.
