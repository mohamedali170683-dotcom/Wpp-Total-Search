"""
Keyword data models for cross-platform search intelligence
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from enum import Enum


class Platform(str, Enum):
    """Supported search platforms"""
    GOOGLE = "google"
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"
    INSTAGRAM = "instagram"
    PINTEREST = "pinterest"
    AMAZON = "amazon"
    TWITTER = "twitter"
    BING = "bing"
    EBAY = "ebay"
    APP_STORE = "app_store"
    PLAY_STORE = "play_store"
    ETSY = "etsy"
    NAVER = "naver"
    PERPLEXITY = "perplexity"


class PlatformData(BaseModel):
    """Search data for a keyword on a specific platform"""
    
    platform: Platform
    volume: int = Field(default=0, description="Monthly search volume")
    trend: List[int] = Field(default_factory=list, description="12-month trend data")
    cpc: Optional[float] = Field(default=None, description="Cost per click (if available)")
    competition: Optional[float] = Field(default=None, description="Competition score 0-1")
    is_estimated: bool = Field(
        default=True, 
        description="True for clickstream estimates, False for precise planner data"
    )
    
    @property
    def trend_direction(self) -> str:
        """Calculate trend direction from historical data"""
        if len(self.trend) < 6:
            return "insufficient_data"
        
        first_half = sum(self.trend[:6]) / 6
        second_half = sum(self.trend[6:]) / max(len(self.trend[6:]), 1)
        
        if second_half > first_half * 1.1:
            return "growing"
        elif second_half < first_half * 0.9:
            return "declining"
        return "stable"


class CrossPlatformKeyword(BaseModel):
    """Keyword data aggregated across multiple platforms"""
    
    keyword: str
    platforms: Dict[Platform, PlatformData] = Field(default_factory=dict)
    total_volume: int = 0
    primary_platform: Optional[Platform] = None
    
    def calculate_totals(self) -> None:
        """Calculate aggregate metrics"""
        self.total_volume = sum(p.volume for p in self.platforms.values())
        
        if self.platforms:
            self.primary_platform = max(
                self.platforms.items(),
                key=lambda x: x[1].volume
            )[0]
    
    def get_platform_volume(self, platform: Platform) -> int:
        """Get volume for a specific platform"""
        if platform in self.platforms:
            return self.platforms[platform].volume
        return 0
    
    def get_volume_ratio(self, platform_a: Platform, platform_b: Platform) -> float:
        """Calculate volume ratio between two platforms"""
        vol_a = self.get_platform_volume(platform_a)
        vol_b = self.get_platform_volume(platform_b)
        
        if vol_b == 0:
            return float('inf') if vol_a > 0 else 0.0
        return vol_a / vol_b


class KeywordSuggestion(BaseModel):
    """Single keyword suggestion from a platform"""
    
    keyword: str
    platform: Platform
    volume: Optional[int] = None
    trend: List[int] = Field(default_factory=list)
    cpc: Optional[float] = None
    competition: Optional[float] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "keyword": "protein powder",
                "platform": "google",
                "volume": 450000,
                "trend": [420000, 430000, 445000, 460000, 470000, 480000],
                "cpc": 1.85,
                "competition": 0.72
            }
        }
