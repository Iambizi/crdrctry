# 🧠 FashionNewsAgent — Architecture Overview

## 📌 Purpose

The FashionNewsAgent is an AI-powered pipeline designed to monitor fashion news sources, extract structured information about designer movements and brand relationships, and enrich a centralized fashion genealogy database (PocketBase + GraphQL).

It supports two core use cases:
1. Live Monitoring — Periodically scans fashion news to detect real-time designer updates.
2. Historical Backfilling — Parses archival or overlooked articles to retroactively populate the database.

---

## ✅ Current Implementation Summary

### Agent Scaffold

Located at: `src/agents/fashionNewsAgent/`

The agent is structured as follows:

| File | Responsibility |
| --- | --- |
| index.ts | Orchestrates agent run (mode-aware) |
| sources.ts | Fetches and normalizes news articles (e.g., via RSS) |
| processor.ts | Uses OpenAI GPT-4 to extract structured data |
| verifier.ts | (WIP) Validates update accuracy and structure |
| submitter.ts | Submits verified updates to the database via GraphQL |
| types.ts | Shared type definitions (NewsItem, FashionUpdate) |

### Key Features Implemented
* ✅ Modular agent scaffold with live vs historical mode
* ✅ OpenAI GPT-4 integration in processUpdate() for smart extraction
* ✅ Console logging for traceability
* ✅ Error handling + fallback in case of bad GPT responses

---

## 🔜 Remaining Work (High Priority)

### 🔁 Confidence Scoring (Verifier Layer)
* Validate GPT outputs based on completeness and source quality
* Optional: request confidenceScore from GPT and threshold submissions

### 🧪 Local Test Harness
* Simple script to run the agent on a single or test item
* Helps during GPT prompt tuning and debugging

### 🕰️ Historical Ingestion Utilities
* Extend fetchSources() to crawl or replay articles from past years
* Useful for backfilling key designer-brand tenures

### 🧰 Retry Logic
* Handle OpenAI API rate limits or transient failures with exponential backoff or retries

---

## ⚙️ Optional / Future Enhancements

| Feature | Description |
| --- | --- |
| Manual Review Queue | Queue uncertain updates for human validation |
| Fine-tuned LLM | Train on fashion-specific data for better entity detection |
| CrewAI / LangGraph Agents | Use agent orchestration for more advanced planning/extraction loops |
| LLM Confidence Metrics | Use GPT to self-assess accuracy or ambiguity of articles |
| Draft/Pending Record Flow | Allow updates to land in a review state instead of publishing immediately |

## 🔧 Next Steps
* Implement verifier.ts logic
* Build an ingestion runner CLI or test harness
* Add a historicalSources.ts variant
* Improve robustness with retries and environment checks

---

## 🕓 Progress Log

**2025-05-21**  
- Scaffold implementation complete  
- GPT-4 extraction integrated into `processUpdate()`  
- Fallback and logging added for parsing GPT responses  
- Next up: build confidence scoring in `verifier.ts`, test harness, and historical ingestion logic