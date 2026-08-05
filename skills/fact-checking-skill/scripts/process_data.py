#!/usr/bin/env python3
"""
Data Processing & Report Formatting Helper for fact-checking-skill
Target Agent: WebScoutAgent
"""

import sys
import json
import os

def generate_markdown_report(verified_data, template_path=None):
    """Formats verification JSON into an editorial markdown verification report."""
    articles = verified_data.get("articles", [])
    summary = verified_data.get("summary", {})

    report_lines = [
        "# 🛡️ Editorial Fact-Checking Audit Report",
        f"**Timestamp:** {summary.get('timestamp', 'Real-time Audit')}",
        f"**Total Articles Scanned:** {summary.get('totalProcessed', len(articles))}",
        f"**Average Trust Score:** {summary.get('averageTrustScore', 'N/A')}%",
        f"**Verified Stories:** {summary.get('verifiedCount', 0)} | **Fake News Alerts:** {summary.get('fakeNewsAlertCount', 0)}",
        "\n---",
        "## 📰 Article Verification Breakdown\n"
    ]

    for idx, art in enumerate(articles, 1):
        score = art.get("trustScore", 0)
        rating = art.get("factCheckRating", "Unverified")
        icon = "✅" if score >= 85 else ("🟢" if score >= 70 else ("🟡" if score >= 50 else "🔴"))
        
        report_lines.append(f"### {idx}. {icon} {art.get('title')}")
        report_lines.append(f"- **Source:** {art.get('source')} | **Category:** {art.get('rawCategory', 'General')}")
        report_lines.append(f"- **Trust Score:** `{score}%` ({rating})")
        report_lines.append(f"- **Audit Notes:** {art.get('factCheckNotes', 'None')}")
        
        warnings = art.get("warnings", [])
        if warnings:
            report_lines.append(f"- ⚠️ **Warnings:** {'; '.join(warnings)}")
        report_lines.append("")

    return "\n".join(report_lines)

def main():
    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            data = json.load(f)
    elif not sys.stdin.isatty():
        data = json.load(sys.stdin)
    else:
        print("Usage: python process_data.py <verified_articles.json>")
        sys.exit(1)

    markdown = generate_markdown_report(data)
    print(markdown)

if __name__ == "__main__":
    main()
