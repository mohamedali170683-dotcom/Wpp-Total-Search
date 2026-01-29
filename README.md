# Wpp-Total-Search

> Cross-Platform Search Intelligence Tool - Identify keyword opportunities across Google, TikTok, YouTube, Instagram, Amazon, and more.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🎯 What is This?

Wpp-Total-Search is a search intelligence platform that:

1. **Aggregates keyword data** across 13+ platforms via KeywordTool.io API
2. **Identifies platform gaps** - Find keywords with high TikTok volume but zero Google presence
3. **Tracks unique platform keywords** - Discover platform-specific search behavior
4. **Audits brand coverage** - Match keyword demand against actual paid ad presence
5. **Extracts competitor ads** - Pull creative data from Meta, TikTok, and Google ad libraries

## 🚀 Key Features

### Cross-Platform Keyword Analysis
```
Keyword: "grwm protein shake"
├── TikTok:    340,000/month  ████████████████████ 
├── Instagram:  89,000/month  █████
├── YouTube:    45,000/month  ███
├── Google:      2,400/month  ▌
└── Amazon:          0/month  
    
⚠️ OPPORTUNITY: Social-first keyword with massive Google SEO potential
```

### Platform Gap Detection
- Identify keywords trending on social platforms before they hit Google
- Find arbitrage opportunities between platforms
- Track trend migration patterns (TikTok → YouTube → Google)

### Brand Coverage Audit
- Compare keyword demand vs. actual ad presence
- Identify gaps in paid strategy
- Generate actionable recommendations

## 📦 Installation

### Prerequisites
- Python 3.11+
- Redis (optional, for caching)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/Wpp-Total-Search.git
cd Wpp-Total-Search/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run in demo mode (no API keys needed)
uvicorn app.main:app --reload --port 8000
```

### Access the API
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

## 🔧 Configuration

### Environment Variables

```env
# App settings
APP_NAME=Wpp-Total-Search
DEBUG=true
USE_DEMO_DATA=true  # Set to false to use real APIs

# KeywordTool.io API (required for live data)
KEYWORDTOOL_API_KEY=your_api_key

# Meta Ad Library (optional)
META_ACCESS_TOKEN=your_token

# TikTok Commercial Content API (optional)
TIKTOK_ACCESS_TOKEN=your_token

# Google Ads Transparency (optional)
SEARCHAPI_KEY=your_key

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

## 📊 API Endpoints

### Keywords

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/keywords/cross-platform` | GET | Get keyword data across all platforms |
| `/api/keywords/suggestions/{platform}` | GET | Get suggestions from specific platform |
| `/api/keywords/batch` | POST | Batch process multiple keywords |

### Opportunities

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/opportunities/analyze` | GET | Analyze single keyword |
| `/api/opportunities/report` | POST | Generate full opportunity report |
| `/api/opportunities/gaps` | GET | Find gaps between two platforms |

### Brand Audit

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/brand-audit/ads/{platform}` | GET | Get brand's ads from platform |
| `/api/brand-audit/coverage` | POST | Full coverage audit |

## 🔌 Data Sources

| Source | Type | Status | Notes |
|--------|------|--------|-------|
| KeywordTool.io | Official API | ✅ | $89-199/mo, 13 platforms |
| Meta Ad Library | Official API | ✅ | Free, identity verification required |
| TikTok Ad Library | Official API | ✅ | Free, application approval required |
| Google Ads Transparency | Scraper/Wrapper | ✅ | Free PyPI package or paid wrapper |

## 📁 Project Structure

```
Wpp-Total-Search/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Settings management
│   │   ├── models/              # Pydantic models
│   │   ├── services/            # Business logic & API clients
│   │   ├── routers/             # API endpoints
│   │   └── utils/               # Helpers
│   ├── demo_data/               # Sample data for testing
│   ├── tests/                   # Test suite
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                    # React dashboard (coming soon)
├── docker-compose.yml
└── README.md
```

## 🧪 Running Tests

```bash
cd backend
pytest tests/ -v
```

## 🐳 Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build backend only
cd backend
docker build -t wpp-total-search .
docker run -p 8000:8000 wpp-total-search
```

## 📈 Example Usage

### Python Client

```python
import httpx

# Get cross-platform data for a keyword
response = httpx.get(
    "http://localhost:8000/api/keywords/cross-platform",
    params={"keyword": "protein powder"}
)
data = response.json()

print(f"Total volume: {data['total_volume']:,}")
print(f"Primary platform: {data['primary_platform']}")
for platform, info in data['platforms'].items():
    print(f"  {platform}: {info['volume']:,}/month")
```

### cURL

```bash
# Analyze opportunities
curl "http://localhost:8000/api/opportunities/analyze?keyword=gym%20aesthetic"

# Generate report
curl -X POST "http://localhost:8000/api/opportunities/report" \
  -H "Content-Type: application/json" \
  -d '{"seed_keywords": ["protein powder", "pre workout", "creatine"]}'

# Brand coverage audit
curl -X POST "http://localhost:8000/api/brand-audit/coverage" \
  -H "Content-Type: application/json" \
  -d '{"domain": "myprotein.com", "keywords": ["whey protein", "vegan protein"]}'
```

## 🗺️ Roadmap

- [x] Core keyword aggregation
- [x] Platform gap detection
- [x] Demo mode with sample data
- [x] Meta Ad Library integration
- [x] TikTok Ad Library integration
- [x] Google Ads Transparency scraping
- [ ] React frontend dashboard
- [ ] Redis caching layer
- [ ] Scheduled opportunity alerts
- [ ] MCP server integration
- [ ] Trend prediction ML model

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [KeywordTool.io](https://keywordtool.io) for the keyword data API
- [FastAPI](https://fastapi.tiangolo.com) for the excellent framework
- [Meta](https://www.facebook.com/ads/library/api/) for the Ad Library API

---

**Built for WPP Media Germany** | Cross-platform search intelligence for enterprise clients
