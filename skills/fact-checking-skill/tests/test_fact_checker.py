import unittest
from unittest.mock import patch, MagicMock
import os
import sys
import json

# Ensure scripts directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'scripts')))
from fact_checker import FactChecker, TIER_1_SOURCES

class TestFactChecker(unittest.TestCase):
    def setUp(self):
        self.checker = FactChecker(factcheck_api_key=None)

    def test_extract_claims(self):
        article = {
            "title": "Tech Giants Announce $50B Semiconductor Alliance in 2026",
            "snippet": "Executives from Tokyo and Washington sign agreement delivering 45% capacity boost in Q2."
        }

        claims = self.checker.extract_claims(article)

        self.assertIn("Tokyo", claims["entities"])
        self.assertIn("Washington", claims["entities"])
        self.assertTrue(any("$50B" in num for num in claims["numbers"]))
        self.assertTrue(any("45%" in num for num in claims["numbers"]))
        self.assertIn("2026", claims["dates"])
        self.assertIn("Q2", claims["dates"])

    def test_evaluate_fake_news_heuristics_legitimate_tier1(self):
        article = {
            "title": "Global Central Banks Coordinate Policy Shift",
            "snippet": "Financial authorities announce $50B strategic liquidity adjustment.",
            "source": "Financial Times / Reuters"
        }
        claims = self.checker.extract_claims(article)
        heuristics = self.checker.evaluate_fake_news_heuristics(article, claims)

        self.assertTrue(heuristics["is_tier1"])
        self.assertEqual(heuristics["penalty"], 0)
        self.assertEqual(len(heuristics["warnings"]), 0)

    def test_evaluate_fake_news_heuristics_sensationalist_fake_news(self):
        article = {
            "title": "SHOCKING Secret Miracle Cure Gives 10000% Gain Overnight!",
            "snippet": "Unbelievable conspiracy reveals secret breakthrough.",
            "source": "Unknown Tech Blog"
        }
        claims = self.checker.extract_claims(article)
        heuristics = self.checker.evaluate_fake_news_heuristics(article, claims)

        self.assertFalse(heuristics["is_tier1"])
        self.assertGreater(heuristics["penalty"], 30)
        self.assertTrue(any("Sensationalist" in w for w in heuristics["warnings"]))
        self.assertTrue(any("Excessive capitalization" in w for w in heuristics["warnings"]))
        self.assertTrue(any("Unusually high percentage" in w for w in heuristics["warnings"]))

    @patch('urllib.request.urlopen')
    def test_verify_wikipedia_entity_success(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.read.return_value = json.dumps({
            "type": "standard",
            "title": "Semiconductor",
            "extract": "A semiconductor material has an electrical conductivity value falling between that of a conductor."
        }).encode('utf-8')
        mock_response.__enter__.return_value = mock_response

        mock_urlopen.return_value = mock_response

        res = self.checker.verify_wikipedia_entity("Semiconductor")
        self.assertTrue(res["found"])
        self.assertEqual(res["title"], "Semiconductor")
        self.assertIn("electrical conductivity", res["extract"])

    @patch('urllib.request.urlopen')
    def test_verify_wikipedia_entity_failure_or_missing(self, mock_urlopen):
        mock_urlopen.side_effect = Exception("Page not found")

        res = self.checker.verify_wikipedia_entity("NonExistentEntity12345")
        self.assertFalse(res["found"])
        self.assertEqual(res["title"], "NonExistentEntity12345")

    def test_check_google_factcheck_api_no_key(self):
        checker = FactChecker(factcheck_api_key=None)
        res = checker.check_google_factcheck_api("economy claim")
        self.assertIsNone(res)

    def test_verify_article_legitimate_verified_rating(self):
        article = {
            "id": "art-1",
            "title": "United Nations Peace & Maritime Security Summit",
            "snippet": "Delegates gather in Geneva to sign maritime pact in 2026.",
            "source": "BBC World News"
        }

        with patch.object(self.checker, 'verify_wikipedia_entity', return_value={"found": True, "title": "Geneva"}):
            verified = self.checker.verify_article(article)

            self.assertGreaterEqual(verified["trustScore"], 85)
            self.assertEqual(verified["factCheckRating"], "Verified")
            self.assertIn("Tier-1", verified["factCheckNotes"])
            self.assertTrue(verified["verificationDetails"]["isTier1Source"])

    def test_verify_article_suspicious_fake_news_rating(self):
        article = {
            "id": "art-2",
            "title": "SHOCKING Miracle Cure Discovered in Secret Conspiracy!",
            "snippet": "Guaranteed 10000% miracle returns in 24 hours.",
            "source": "Unverified Gossip Blog"
        }

        verified = self.checker.verify_article(article)

        self.assertLess(verified["trustScore"], 50)
        self.assertIn(verified["factCheckRating"], ["Suspicious", "Fake News Alert"])
        self.assertGreater(len(verified["warnings"]), 0)

    def test_process_articles_batch(self):
        articles = [
            {
                "id": "art-1",
                "title": "Global Semiconductor Alliance",
                "snippet": "Foundries expand capacity in 2026.",
                "source": "Reuters"
            },
            {
                "id": "art-2",
                "title": "SHOCKING Secret Miracle",
                "snippet": "10000% returns overnight.",
                "source": "Gossip Blog"
            }
        ]

        results = self.checker.process_articles(articles)
        self.assertEqual(len(results), 2)
        self.assertIn("trustScore", results[0])
        self.assertIn("factCheckRating", results[1])

if __name__ == '__main__':
    unittest.main()
