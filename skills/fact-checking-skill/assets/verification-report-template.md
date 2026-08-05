# 🛡️ Fact-Checking Skill: Editorial Verification Audit Report

**Audit Date & Time:** `{{AUDIT_TIMESTAMP}}`  
**Agent Applied:** `WebScoutAgent`  
**Skill Name:** `fact-checking-skill` v1.0.0  

---

## 📈 Executive Audit Summary

- **Total Articles Evaluated:** `{{TOTAL_ARTICLES}}`
- **Average Trust Score:** `{{AVG_TRUST_SCORE}}%`
- **Verified Stories (85-100%):** `{{VERIFIED_COUNT}}`
- **High Confidence Stories (70-84%):** `{{HIGH_CONFIDENCE_COUNT}}`
- **Needs Revision / Warning Stories (<70%):** `{{WARNING_COUNT}}`
- **Fake News Alerts Triggered:** `{{FAKE_NEWS_ALERT_COUNT}}`

---

## 🔍 Detailed Article Audit Log

{{#ARTICLES}}
### Story #{{INDEX}}: {{TITLE}}
- **Source Outlet:** `{{SOURCE}}`
- **Category:** `{{CATEGORY}}`
- **Trust Score:** **`{{TRUST_SCORE}}%`** — Status: **`{{FACT_CHECK_RATING}}`**
- **Wikipedia Entities Cross-Checked:** `{{WIKI_ENTITIES}}`
- **Extracted Claims & Figures:** `{{CLAIMS_EXTRACTED}}`
- **Audit Findings:** {{FACT_CHECK_NOTES}}
- **Warnings / Alerts:** {{WARNINGS_LIST}}

---
{{/ARTICLES}}

*Report generated automatically by `fact-checking-skill` engine.*
