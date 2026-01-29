"""
Ad creative models for brand audit functionality
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class AdPlatform(str, Enum):
    """Ad library platforms"""
    META = "meta"
    TIKTOK = "tiktok"
    GOOGLE = "google"


class AdFormat(str, Enum):
    """Ad creative formats"""
    IMAGE = "image"
    VIDEO = "video"
    TEXT = "text"
    CAROUSEL = "carousel"


class AdCreative(BaseModel):
    """Individual ad creative from an ad library"""
    
    id: str
    platform: AdPlatform
    advertiser_name: str
    advertiser_id: Optional[str] = None
    ad_format: AdFormat
    
    # Timing
    first_shown: Optional[datetime] = None
    last_shown: Optional[datetime] = None
    status: str = "active"
    
    # Content
    headline: Optional[str] = None
    body_text: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    landing_url: Optional[str] = None
    
    # Metrics (when available)
    impressions_range: Optional[str] = Field(
        default=None, 
        description="Impression range e.g., '10K-50K'"
    )
    spend_range: Optional[str] = Field(
        default=None,
        description="Spend range e.g., '$1K-$5K'"
    )
    
    # Targeting (when available)
    target_countries: List[str] = Field(default_factory=list)
    target_age_ranges: List[str] = Field(default_factory=list)
    target_genders: List[str] = Field(default_factory=list)
    
    # Extracted keywords (for matching)
    keywords_detected: List[str] = Field(default_factory=list)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "meta_001",
                "platform": "meta",
                "advertiser_name": "Optimum Nutrition",
                "ad_format": "video",
                "first_shown": "2024-01-15T00:00:00",
                "last_shown": "2024-03-01T00:00:00",
                "status": "active",
                "headline": "Gold Standard Whey - #1 Selling Protein",
                "impressions_range": "1M-5M",
                "target_countries": ["US", "UK", "DE"]
            }
        }


class BrandAdLibrary(BaseModel):
    """Collection of ads for a brand across platforms"""
    
    brand_name: str
    brand_domain: str
    ads: List[AdCreative] = Field(default_factory=list)
    total_ads: int = 0
    platforms_present: List[AdPlatform] = Field(default_factory=list)
    
    # Aggregated insights
    keywords_in_ads: List[str] = Field(
        default_factory=list,
        description="Keywords detected across all ads"
    )
    active_since: Optional[datetime] = None
    
    def calculate_stats(self) -> None:
        """Calculate aggregate statistics"""
        self.total_ads = len(self.ads)
        self.platforms_present = list(set(ad.platform for ad in self.ads))
        
        # Extract all keywords
        all_keywords = set()
        for ad in self.ads:
            all_keywords.update(ad.keywords_detected)
            if ad.headline:
                all_keywords.update(ad.headline.lower().split())
        self.keywords_in_ads = list(all_keywords)
        
        # Find earliest ad
        dates = [ad.first_shown for ad in self.ads if ad.first_shown]
        if dates:
            self.active_since = min(dates)


class BrandCoverageAudit(BaseModel):
    """Audit result showing brand coverage vs keyword demand"""
    
    brand_name: str
    keyword: str
    
    # Demand by platform
    demand: Dict[str, int] = Field(
        description="Platform -> monthly volume"
    )
    
    # Coverage status
    coverage: Dict[str, bool] = Field(
        description="Coverage type -> exists (e.g., 'meta_ads': True)"
    )
    
    # Analysis
    gap_score: float = Field(
        ge=0, le=100,
        description="0-100, higher = bigger gap"
    )
    recommendation: str
    
    # Details
    total_demand: int = 0
    covered_demand: int = 0
    uncovered_platforms: List[str] = Field(default_factory=list)
    
    class Config:
        json_schema_extra = {
            "example": {
                "brand_name": "optimumnutrition.com",
                "keyword": "vegan protein powder",
                "demand": {
                    "google": 74000,
                    "youtube": 89000,
                    "tiktok": 245000,
                    "amazon": 156000
                },
                "coverage": {
                    "meta_ads": True,
                    "google_ads": True,
                    "tiktok_ads": False
                },
                "gap_score": 45.5,
                "recommendation": "High TikTok demand (245K) but no ad presence"
            }
        }


class CoverageReport(BaseModel):
    """Full brand coverage report"""
    
    brand_name: str
    brand_domain: str
    generated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    
    # Ad presence
    ads_by_platform: Dict[AdPlatform, int] = Field(
        default_factory=dict,
        description="Platform -> ad count"
    )
    
    # Keyword audits
    keyword_audits: List[BrandCoverageAudit] = Field(default_factory=list)
    
    # Summary
    total_keywords_analyzed: int = 0
    keywords_with_gaps: int = 0
    average_gap_score: float = 0.0
    top_opportunities: List[str] = Field(default_factory=list)
    
    def calculate_summary(self) -> None:
        """Calculate summary statistics"""
        self.total_keywords_analyzed = len(self.keyword_audits)
        self.keywords_with_gaps = sum(1 for a in self.keyword_audits if a.gap_score > 50)
        
        if self.keyword_audits:
            self.average_gap_score = sum(a.gap_score for a in self.keyword_audits) / len(self.keyword_audits)
            
            # Top opportunities by gap score
            sorted_audits = sorted(self.keyword_audits, key=lambda x: x.gap_score, reverse=True)
            self.top_opportunities = [a.keyword for a in sorted_audits[:5]]
