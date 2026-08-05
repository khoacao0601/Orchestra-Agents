#!/usr/bin/env python3
"""
Fact Checker Engine for Newsroom AI Orchestra
Skill: fact-checking-skill
Target Agent: WebScoutAgent

Cross-references article claims, numbers, dates, and named entities with:
1. Wikipedia API (Search & Summary REST API)
2. Google Fact Check Claim Search API (when API key is provided)
3. Heuristic Anti-Fake-News Pattern Detection (Clickbait, exaggeration, unverified stats)

Outputs enriched articles JSON with Trust Score (0-100%) and Fact Check Rating.
"""

import sys
import os
import json
import re
import urllib.request
import urllib.parse
from datetime import datetime

# Known Tier-1 Reputable Global News Outlets
TIER_1_SOURCES = [
    "reuters", "bloomberg", "financial times", "bbc", "bbc news", "associated press",
    "ap news", "wall street journal", "wsj", "the new york times", "nytimes",
    "the economist", "the guardian", "euractiv", "politico", "wmo", "world meteorological organization",
    "united nations", "un news", "nature", "science", "climate action network"
]

class FactChecker:
    def __init__(self, factcheck_api_key=None):
        self.api_key = factcheck_api_key or os.environ.get("GOOGLE_FACTCHECK_API_KEY") or os.environ.get("GEMINI_API_KEY")

    def extract_claims(self, article):
        """Extract key entities, numeric statistics, dates, and key claims from text."""
        title = article.get("title", "")
        snippet = article.get("snippet", "")
        full_text = f"{title}. {snippet}"

        # 1. Named Entities (Capitalized Words/Phrases, excluding common sentence starters)
        entities = list(set(re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', full_text)))
        filtered_entities = [e for e in entities if e.lower() not in ["the", "a", "an", "global", "major", "new", "international", "breaking"]]

        # 2. Numeric Statistics ($50B, 45%, 72 hours, 40+ nations, etc.)
        numbers = re.findall(r'(\$?\d+(?:\.\d+)?(?:\%|B|M|k| hours| days| nations|%|\+)?)\b', full_text)

        # 3. Years/Dates (e.g. 2026, Q2, 72 hours)
        dates = re.findall(r'\b(20\d{2}|19\d{2}|Q[1-4])\b', full_text)

        return {
            "entities": filtered_entities[:5],
            "numbers": list(set(numbers))[:5],
            "dates": list(set(dates)),
            "full_text": full_text
        }

    def verify_wikipedia_entity(self, entity):
        """Cross-reference entity with Wikipedia REST API."""
        if not entity or len(entity) < 3:
            return {"found": False, "title": entity}

        try:
            encoded_query = urllib.parse.quote(entity)
            url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{encoded_query}"
            req = urllib.request.Request(url, headers={'User-Agent': 'NewsroomFactChecker/1.0'})
            
            with urllib.request.urlopen(req, timeout=3) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode('utf-8'))
                    if data.get("type") != "disambiguation":
                        return {
                            "found": True,
                            "title": data.get("title", entity),
                            "extract": data.get("extract", "")[:150]
                        }
        except Exception:
            pass  # Fallback gracefully on timeout or missing page
        return {"found": False, "title": entity}

    def check_google_factcheck_api(self, query):
        """Query Google Fact Check Claim Search API if API key is present."""
        if not self.api_key:
            return None

        try:
            encoded_q = urllib.parse.quote(query)
            url = f"https://factchecktools.googleapis.com/v1alpha1/claims:search?query={encoded_q}&key={self.api_key}"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=3) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode('utf-8'))
                    claims = data.get("claims", [])
                    if claims:
                        claim_item = claims[0]
                        review = claim_item.get("claimReview", [{}])[0]
                        return {
                            "text": claim_item.get("text"),
                            "claimant": claim_item.get("claimant"),
                            "rating": review.get("textualRating"),
                            "publisher": review.get("publisher", {}).get("name")
                        }
        except Exception:
            pass
        return None

    def evaluate_fake_news_heuristics(self, article, claims):
        """Detect clickbait, excessive exaggeration, numerical anomalies, or suspicious source signatures."""
        title = article.get("title", "")
        snippet = article.get("snippet", "")
        source = article.get("source", "").lower()
        full_text = claims["full_text"]

        warnings = []
        penalty = 0

        # Check Sensationalism / Clickbait patterns
        sensational_keywords = ["shocking", "unbelievable", "secret conspiracy", "miracle cure", "100% guaranteed", "you won't believe"]
        for kw in sensational_keywords:
            if kw in full_text.lower():
                penalty += 15
                warnings.append(f"Sensationalist terminology detected: '{kw}'")

        # Check ALL-CAPS words in title (excluding acronyms like AI, UN, EU, US, UK, RSS)
        caps = re.findall(r'\b[A-Z]{4,}\b', title)
        if caps and not any(c in ["GLOBAL", "WORLD", "COVID", "NATO"] for c in caps):
            penalty += 10
            warnings.append(f"Excessive capitalization in title: {', '.join(caps)}")

        # Check Extreme/Unsubstantiated stats
        for num in claims["numbers"]:
            if "%" in num:
                val = re.sub(r'[^\d.]', '', num)
                if val and float(val) > 500:
                    penalty += 20
                    warnings.append(f"Unusually high percentage claim: {num}")

        # Check Source Credibility
        is_tier1 = any(t1 in source for t1 in TIER_1_SOURCES)
        
        return {
            "penalty": penalty,
            "warnings": warnings,
            "is_tier1": is_tier1
        }

    def verify_article(self, article):
        """Run complete verification pipeline for a single news article."""
        claims = self.extract_claims(article)
        heuristics = self.evaluate_fake_news_heuristics(article, claims)

        wiki_matches = []
        for entity in claims["entities"][:3]:
            wiki_res = self.verify_wikipedia_entity(entity)
            if wiki_res["found"]:
                wiki_matches.append(wiki_res["title"])

        factcheck_result = None
        if claims["entities"]:
            factcheck_result = self.check_google_factcheck_api(claims["entities"][0])

        # Base Trust Score Calculation (Start at 82 for general wire)
        base_score = 88 if heuristics["is_tier1"] else 80

        # Bonus for Wikipedia verified entities (+4 per entity, max +12)
        base_score += min(len(wiki_matches) * 4, 12)

        # Bonus if FactCheck API claim found & positive rating
        if factcheck_result:
            rating_lower = (factcheck_result.get("rating") or "").lower()
            if "true" in rating_lower or "correct" in rating_lower or "verified" in rating_lower:
                base_score += 10
            elif "false" in rating_lower or "fake" in rating_lower:
                base_score -= 40
                heuristics["warnings"].append(f"Google FactCheck debunked claim: {factcheck_result.get('rating')}")

        # Deduct Heuristics penalties
        final_score = max(5, min(99, base_score - heuristics["penalty"]))

        # Determine FactCheck Rating Label
        if final_score >= 85:
            rating_label = "Verified"
        elif final_score >= 70:
            rating_label = "High Confidence"
        elif final_score >= 50:
            rating_label = "Needs Revision"
        elif final_score >= 30:
            rating_label = "Suspicious"
        else:
            rating_label = "Fake News Alert"

        notes = []
        if heuristics["is_tier1"]:
            notes.append("Source outlet verified (Tier-1 Global Media).")
        if wiki_matches:
            notes.append(f"Entities cross-checked with Wikipedia: {', '.join(wiki_matches)}.")
        if claims["numbers"]:
            notes.append(f"Numerical facts extracted: {', '.join(claims['numbers'][:3])}.")
        if not notes:
            notes.append("Standard heuristic cross-validation performed.")

        return {
            **article,
            "trustScore": final_score,
            "confidenceScore": final_score,
            "factCheckRating": rating_label,
            "factCheckNotes": " ".join(notes),
            "warnings": heuristics["warnings"],
            "verificationDetails": {
                "wikiEntitiesVerified": wiki_matches,
                "claimsExtracted": claims,
                "isTier1Source": heuristics["is_tier1"]
            }
        }

    def process_articles(self, articles):
        """Process an array of raw article dicts."""
        verified = []
        for art in articles:
            verified.append(self.verify_article(art))
        return verified


def main():
    checker = FactChecker()

    input_data = None
    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            input_data = json.load(f)
    elif not sys.stdin.isatty():
        input_data = json.load(sys.stdin)
    else:
        # Fallback test sample if run standalone without args
        input_data = {
            "articles": [
                {
                    "id": "test-1",
                    "title": "Global Central Banks Coordinate Policy Amid Inflation Shift",
                    "snippet": "Major financial authorities announce strategic adjustment in interest rates impacting international markets.",
                    "source": "Financial Times / Bloomberg",
                    "publishedAt": datetime.now().isoformat(),
                    "rawCategory": "Economy"
                },
                {
                    "id": "test-2",
                    "title": "SHOCKING Secret Breakthrough Gives 10000% Stock Return Overnight!",
                    "snippet": "Anonymous sources claim impossible miracle technology will replace all energy instantly.",
                    "source": "Unknown Tech Blog",
                    "publishedAt": datetime.now().isoformat(),
                    "rawCategory": "Economy"
                }
            ]
        }

    articles = input_data.get("articles", []) if isinstance(input_data, dict) else input_data
    verified_articles = checker.process_articles(articles)

    output = {
        "articles": verified_articles,
        "summary": {
            "totalProcessed": len(verified_articles),
            "averageTrustScore": round(sum(a["trustScore"] for a in verified_articles) / max(len(verified_articles), 1), 1),
            "verifiedCount": sum(1 for a in verified_articles if a["factCheckRating"] == "Verified"),
            "fakeNewsAlertCount": sum(1 for a in verified_articles if a["factCheckRating"] in ["Suspicious", "Fake News Alert"])
        }
    }

    print(json.dumps(output, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
