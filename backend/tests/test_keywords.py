"""
Tests for keyword research functionality
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.keyword import Platform, CrossPlatformKeyword, PlatformData
from app.services.keywordtool import KeywordToolService
from app.services.opportunity_analyzer import OpportunityAnalyzer

client = TestClient(app)


class TestKeywordModels:
    """Test keyword data models"""
    
    def test_platform_data_creation(self):
        """Test PlatformData model"""
        data = PlatformData(
            platform=Platform.GOOGLE,
            volume=100000,
            trend=[90000, 95000, 100000, 100000, 100000, 100000],
            cpc=1.50,
            competition=0.65,
            is_estimated=False
        )
        
        assert data.platform == Platform.GOOGLE
        assert data.volume == 100000
        assert data.cpc == 1.50
        assert data.is_estimated is False
    
    def test_cross_platform_keyword(self):
        """Test CrossPlatformKeyword model"""
        kw = CrossPlatformKeyword(
            keyword="protein powder",
            platforms={
                Platform.GOOGLE: PlatformData(
                    platform=Platform.GOOGLE,
                    volume=450000
                ),
                Platform.TIKTOK: PlatformData(
                    platform=Platform.TIKTOK,
                    volume=890000
                )
            }
        )
        
        kw.calculate_totals()
        
        assert kw.keyword == "protein powder"
        assert kw.total_volume == 1340000
        assert kw.primary_platform == Platform.TIKTOK
    
    def test_volume_ratio(self):
        """Test volume ratio calculation"""
        kw = CrossPlatformKeyword(
            keyword="test",
            platforms={
                Platform.TIKTOK: PlatformData(platform=Platform.TIKTOK, volume=100000),
                Platform.GOOGLE: PlatformData(platform=Platform.GOOGLE, volume=10000)
            }
        )
        
        ratio = kw.get_volume_ratio(Platform.TIKTOK, Platform.GOOGLE)
        assert ratio == 10.0


class TestKeywordService:
    """Test KeywordToolService in demo mode"""
    
    @pytest.fixture
    def service(self):
        return KeywordToolService()
    
    def test_service_uses_demo_mode(self, service):
        """Verify service is in demo mode"""
        assert service.use_demo is True
    
    @pytest.mark.asyncio
    async def test_get_cross_platform_data(self, service):
        """Test fetching cross-platform data"""
        result = await service.get_cross_platform_data("protein powder")
        
        assert result.keyword == "protein powder"
        assert len(result.platforms) > 0
        assert result.total_volume > 0
    
    @pytest.mark.asyncio
    async def test_get_suggestions(self, service):
        """Test fetching keyword suggestions"""
        result = await service.get_suggestions("protein", Platform.GOOGLE)
        
        # Demo data should return matching keywords
        assert isinstance(result, list)


class TestOpportunityAnalyzer:
    """Test opportunity analysis functionality"""
    
    @pytest.fixture
    def analyzer(self):
        return OpportunityAnalyzer()
    
    def test_find_platform_gaps(self, analyzer):
        """Test platform gap detection"""
        kw = CrossPlatformKeyword(
            keyword="grwm protein shake",
            platforms={
                Platform.TIKTOK: PlatformData(platform=Platform.TIKTOK, volume=340000),
                Platform.GOOGLE: PlatformData(platform=Platform.GOOGLE, volume=2400)
            }
        )
        
        gaps = analyzer._find_platform_gaps(kw)
        
        assert len(gaps) > 0
        assert gaps[0].high_volume_platform == Platform.TIKTOK
        assert gaps[0].low_volume_platform == Platform.GOOGLE
    
    def test_classify_uniqueness(self, analyzer):
        """Test platform uniqueness classification"""
        kw = CrossPlatformKeyword(
            keyword="grwm morning routine",
            platforms={
                Platform.TIKTOK: PlatformData(platform=Platform.TIKTOK, volume=500000)
            }
        )
        
        classification = analyzer._classify_uniqueness(kw)
        
        # Should detect "grwm" as TikTok-specific
        assert "tiktok" in classification
    
    def test_opportunity_score_calculation(self, analyzer):
        """Test opportunity score calculation"""
        kw = CrossPlatformKeyword(
            keyword="test keyword",
            platforms={
                Platform.TIKTOK: PlatformData(platform=Platform.TIKTOK, volume=1000000),
                Platform.GOOGLE: PlatformData(platform=Platform.GOOGLE, volume=10000)
            }
        )
        kw.calculate_totals()
        
        gaps = analyzer._find_platform_gaps(kw)
        score = analyzer._calculate_opportunity_score(kw, gaps)
        
        assert 0 <= score <= 100


class TestKeywordsAPI:
    """Test keywords API endpoints"""
    
    def test_health_endpoint(self):
        """Test health check"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        assert "Wpp-Total-Search" in response.json()["name"]
    
    def test_cross_platform_endpoint(self):
        """Test cross-platform keyword endpoint"""
        response = client.get("/api/keywords/cross-platform?keyword=protein%20powder")
        assert response.status_code == 200
        
        data = response.json()
        assert data["keyword"] == "protein powder"
        assert "platforms" in data
    
    def test_platforms_list(self):
        """Test platforms listing endpoint"""
        response = client.get("/api/keywords/platforms")
        assert response.status_code == 200
        
        data = response.json()
        assert "platforms" in data
        assert len(data["platforms"]) > 0


class TestOpportunitiesAPI:
    """Test opportunities API endpoints"""
    
    def test_analyze_endpoint(self):
        """Test single keyword analysis"""
        response = client.get("/api/opportunities/analyze?keyword=protein%20powder")
        assert response.status_code == 200
        
        data = response.json()
        assert data["keyword"] == "protein powder"
        assert "platform_gaps" in data
        assert "opportunity_score" in data
    
    def test_report_endpoint(self):
        """Test opportunity report generation"""
        response = client.post(
            "/api/opportunities/report",
            json={"seed_keywords": ["protein powder", "pre workout"]}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "platform_gaps" in data
        assert "summary" in data
    
    def test_report_max_keywords(self):
        """Test that report endpoint limits keywords"""
        keywords = [f"keyword_{i}" for i in range(25)]
        response = client.post(
            "/api/opportunities/report",
            json={"seed_keywords": keywords}
        )
        assert response.status_code == 400


class TestBrandAuditAPI:
    """Test brand audit API endpoints"""
    
    def test_get_meta_ads(self):
        """Test getting Meta ads for a brand"""
        response = client.get("/api/brand-audit/ads/meta?domain=optimumnutrition.com")
        assert response.status_code == 200
        
        data = response.json()
        assert "brand_domain" in data or "ads" in data
    
    def test_coverage_audit(self):
        """Test brand coverage audit"""
        response = client.post(
            "/api/brand-audit/coverage",
            json={
                "domain": "optimumnutrition.com",
                "keywords": ["protein powder", "whey protein"]
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            assert "gap_score" in data[0]
            assert "recommendation" in data[0]
