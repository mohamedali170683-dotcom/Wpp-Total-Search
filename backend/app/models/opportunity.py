"""
Opportunity analysis models for identifying cross-platform gaps
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

from app.models.keyword import Platform


class OpportunityType(str, Enum):
    """Types of opportunities detected"""
    PLATFORM_GAP = "platform_gap"           # High on A, zero/low on B
    TREND_MIGRATION = "trend_migration"     # Growing on social, moving to search
    PLATFORM_UNIQUE = "platform_unique"     # Only exists on one platform
    VOLUME_DISPARITY = "volume_disparity"   # Same keyword, big difference
    BRAND_COVERAGE_GAP = "brand_coverage_gap"  # Demand exists, brand absent


class PlatformGapOpportunity(BaseModel):
    """A detected gap between two platforms for a keyword"""
    
    keyword: str
    opportunity_type: OpportunityType = OpportunityType.PLATFORM_GAP
    high_volume_platform: Platform
    high_volume: int
    low_volume_platform: Platform
    low_volume: int
    volume_ratio: float = Field(description="Ratio of high/low volume")
    opportunity_score: float = Field(ge=0, le=100, description="Score from 0-100")
    recommendation: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "keyword": "grwm protein shake",
                "opportunity_type": "platform_gap",
                "high_volume_platform": "tiktok",
                "high_volume": 340000,
                "low_volume_platform": "google",
                "low_volume": 2400,
                "volume_ratio": 141.67,
                "opportunity_score": 92.5,
                "recommendation": "Social-first keyword with massive SEO potential"
            }
        }


class UniqueKeyword(BaseModel):
    """A keyword that exists primarily on one platform"""
    
    keyword: str
    platform: Platform
    volume: int
    uniqueness_category: str = Field(
        description="Category: format_driven, platform_slang, audience_specific, unknown"
    )
    reason: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "keyword": "fyp protein tips",
                "platform": "tiktok",
                "volume": 125000,
                "uniqueness_category": "format_driven",
                "reason": "Contains 'fyp' which is TikTok-specific"
            }
        }


class TrendMigration(BaseModel):
    """A keyword showing trend migration between platforms"""
    
    keyword: str
    origin_platform: Platform
    destination_platform: Platform
    origin_peak_month: int = Field(description="Month index when origin peaked (0-11)")
    destination_growth_start: int = Field(description="Month index when destination started growing")
    lead_time_months: int = Field(description="Months between origin peak and destination growth")
    current_origin_volume: int
    current_destination_volume: int
    prediction: str


class OpportunitySummary(BaseModel):
    """Summary statistics for an opportunity report"""
    
    total_search_volume_analyzed: int
    gap_opportunities_found: int
    top_gap_types: Dict[str, int] = Field(description="Gap type -> count")
    primary_platform_distribution: Dict[str, int] = Field(description="Platform -> keyword count")
    highest_opportunity_keywords: List[str]
    average_opportunity_score: float


class OpportunityReport(BaseModel):
    """Full opportunity analysis report"""
    
    seed_keyword: str
    analyzed_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    total_keywords_analyzed: int
    platform_gaps: List[PlatformGapOpportunity]
    unique_keywords: Dict[Platform, List[UniqueKeyword]]
    trend_migrations: List[TrendMigration] = Field(default_factory=list)
    summary: Dict[str, Any]
    
    class Config:
        json_schema_extra = {
            "example": {
                "seed_keyword": "protein powder",
                "analyzed_at": "2025-01-27T12:00:00",
                "total_keywords_analyzed": 50,
                "platform_gaps": [],
                "unique_keywords": {},
                "summary": {
                    "total_search_volume_analyzed": 5000000,
                    "gap_opportunities_found": 15
                }
            }
        }
