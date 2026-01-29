"""
KeywordTool.io API client for cross-platform keyword research

API Documentation: https://keywordtool.io/api/documentation
Endpoints:
- Suggestions: POST /v2/search/suggestions/{platform}
- Volume: POST /v2/search/volume/{platform}
"""
import httpx
import asyncio
import json
from typing import List, Dict, Optional
from pathlib import Path
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings
from app.models.keyword import (
    Platform, PlatformData, CrossPlatformKeyword, KeywordSuggestion
)


class KeywordToolService:
    """
    Client for KeywordTool.io API
    
    Supports both demo mode (local JSON) and live API calls.
    """
    
    # Map Platform enum to API endpoint names
    PLATFORM_ENDPOINTS = {
        Platform.GOOGLE: "google",
        Platform.YOUTUBE: "youtube",
        Platform.TIKTOK: "tiktok",
        Platform.INSTAGRAM: "instagram",
        Platform.PINTEREST: "pinterest",
        Platform.AMAZON: "amazon",
        Platform.TWITTER: "twitter",
        Platform.BING: "bing",
        Platform.EBAY: "ebay",
        Platform.APP_STORE: "appstore",
        Platform.PLAY_STORE: "playstore",
        Platform.ETSY: "etsy",
        Platform.NAVER: "naver",
        Platform.PERPLEXITY: "perplexity",
    }
    
    # Platforms with precise volume from keyword planners
    PRECISE_VOLUME_PLATFORMS = {Platform.GOOGLE, Platform.BING}
    
    def __init__(self):
        self.api_key = settings.KEYWORDTOOL_API_KEY
        self.base_url = settings.KEYWORDTOOL_BASE_URL
        self.use_demo = settings.USE_DEMO_DATA or not self.api_key
        self._demo_data: Optional[Dict] = None
    
    def _load_demo_data(self) -> Dict:
        """Load demo data from JSON file"""
        if self._demo_data is None:
            demo_path = Path(__file__).parent.parent.parent / "demo_data" / "keywords_sample.json"
            if demo_path.exists():
                with open(demo_path, "r") as f:
                    self._demo_data = json.load(f)
            else:
                self._demo_data = {"keywords": []}
        return self._demo_data
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def get_suggestions(
        self,
        keyword: str,
        platform: Platform,
        country: str = "us",
        language: str = "en"
    ) -> List[KeywordSuggestion]:
        """
        Get keyword suggestions from a specific platform's autocomplete.
        
        Args:
            keyword: Seed keyword
            platform: Target platform
            country: 2-letter country code
            language: 2-letter language code
            
        Returns:
            List of keyword suggestions with volume data
        """
        if self.use_demo:
            return self._get_demo_suggestions(keyword, platform)
        
        endpoint = f"{self.base_url}/search/suggestions/{self.PLATFORM_ENDPOINTS[platform]}"
        
        payload = {
            "apikey": self.api_key,
            "keyword": keyword,
            "country": country.upper(),
            "language": language,
            "metrics": True,
            "output": "json"
        }
        
        # Add metrics location for precise volume platforms
        if platform in self.PRECISE_VOLUME_PLATFORMS:
            payload["metrics_location"] = [2840]  # US location ID
            payload["metrics_language"] = ["en"]
            payload["metrics_network"] = "googlesearchnetwork"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=payload, timeout=30.0)
            response.raise_for_status()
            data = response.json()
        
        return self._parse_suggestions(data, platform)
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def get_volume(
        self,
        keywords: List[str],
        platform: Platform,
        country: str = "us"
    ) -> Dict[str, PlatformData]:
        """
        Get search volume for a list of keywords on a specific platform.
        
        API accepts up to 1,000 keywords per request.
        
        Args:
            keywords: List of keywords to check
            platform: Target platform
            country: 2-letter country code
            
        Returns:
            Dict mapping keyword -> PlatformData
        """
        if self.use_demo:
            return self._get_demo_volume(keywords, platform)
        
        endpoint = f"{self.base_url}/search/volume/{self.PLATFORM_ENDPOINTS[platform]}"
        
        payload = {
            "apikey": self.api_key,
            "keyword": keywords[:1000],  # Max 1000 per request
            "output": "json"
        }
        
        if platform in self.PRECISE_VOLUME_PLATFORMS:
            payload["metrics_location"] = [2840]
            payload["metrics_language"] = ["en"]
            payload["metrics_network"] = "googlesearchnetwork"
        else:
            payload["country"] = country.upper()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=payload, timeout=60.0)
            response.raise_for_status()
            data = response.json()
        
        return self._parse_volume_data(data, platform)
    
    async def get_cross_platform_data(
        self,
        keyword: str,
        platforms: Optional[List[Platform]] = None,
        country: str = "us"
    ) -> CrossPlatformKeyword:
        """
        Get keyword data across multiple platforms in parallel.
        
        Args:
            keyword: Keyword to analyze
            platforms: List of platforms (defaults to all)
            country: Country code
            
        Returns:
            CrossPlatformKeyword with data from all platforms
        """
        if platforms is None:
            # Default to main platforms
            platforms = [
                Platform.GOOGLE, Platform.YOUTUBE, Platform.TIKTOK,
                Platform.INSTAGRAM, Platform.AMAZON, Platform.PINTEREST
            ]
        
        if self.use_demo:
            return self._get_demo_cross_platform(keyword)
        
        # Fetch volume for all platforms in parallel
        tasks = [
            self.get_volume([keyword], platform, country)
            for platform in platforms
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        platform_data = {}
        for platform, result in zip(platforms, results):
            if isinstance(result, Exception):
                print(f"Error fetching {platform}: {result}")
                continue
            
            keyword_lower = keyword.lower()
            if keyword_lower in result:
                platform_data[platform] = result[keyword_lower]
        
        kw = CrossPlatformKeyword(keyword=keyword, platforms=platform_data)
        kw.calculate_totals()
        return kw
    
    async def get_batch_cross_platform(
        self,
        keywords: List[str],
        platforms: Optional[List[Platform]] = None,
        country: str = "us"
    ) -> List[CrossPlatformKeyword]:
        """
        Get cross-platform data for multiple keywords.
        
        Args:
            keywords: List of keywords
            platforms: Target platforms
            country: Country code
            
        Returns:
            List of CrossPlatformKeyword objects
        """
        results = []
        for kw in keywords:
            data = await self.get_cross_platform_data(kw, platforms, country)
            results.append(data)
        return results
    
    # ==================== Demo Data Methods ====================
    
    def _get_demo_suggestions(
        self, 
        keyword: str, 
        platform: Platform
    ) -> List[KeywordSuggestion]:
        """Return demo suggestions matching the keyword"""
        demo = self._load_demo_data()
        suggestions = []
        
        for kw_data in demo.get("keywords", []):
            if keyword.lower() in kw_data["keyword"].lower():
                platform_key = platform.value
                if platform_key in kw_data.get("platforms", {}):
                    p_data = kw_data["platforms"][platform_key]
                    suggestions.append(KeywordSuggestion(
                        keyword=kw_data["keyword"],
                        platform=platform,
                        volume=p_data.get("volume"),
                        trend=p_data.get("trend", []),
                        cpc=p_data.get("cpc"),
                        competition=p_data.get("competition")
                    ))
        
        return suggestions
    
    def _get_demo_volume(
        self, 
        keywords: List[str], 
        platform: Platform
    ) -> Dict[str, PlatformData]:
        """Return demo volume data"""
        demo = self._load_demo_data()
        result = {}
        
        keywords_lower = [k.lower() for k in keywords]
        
        for kw_data in demo.get("keywords", []):
            if kw_data["keyword"].lower() in keywords_lower:
                platform_key = platform.value
                if platform_key in kw_data.get("platforms", {}):
                    p_data = kw_data["platforms"][platform_key]
                    result[kw_data["keyword"].lower()] = PlatformData(
                        platform=platform,
                        volume=p_data.get("volume", 0),
                        trend=p_data.get("trend", []),
                        cpc=p_data.get("cpc"),
                        competition=p_data.get("competition"),
                        is_estimated=platform not in self.PRECISE_VOLUME_PLATFORMS
                    )
        
        return result
    
    def _get_demo_cross_platform(self, keyword: str) -> CrossPlatformKeyword:
        """Return demo cross-platform data"""
        demo = self._load_demo_data()
        
        for kw_data in demo.get("keywords", []):
            if kw_data["keyword"].lower() == keyword.lower():
                platform_data = {}
                for platform_key, p_data in kw_data.get("platforms", {}).items():
                    try:
                        platform = Platform(platform_key)
                        platform_data[platform] = PlatformData(
                            platform=platform,
                            volume=p_data.get("volume", 0),
                            trend=p_data.get("trend", []),
                            cpc=p_data.get("cpc"),
                            competition=p_data.get("competition"),
                            is_estimated=platform not in self.PRECISE_VOLUME_PLATFORMS
                        )
                    except ValueError:
                        continue  # Skip unknown platforms
                
                kw = CrossPlatformKeyword(keyword=keyword, platforms=platform_data)
                kw.calculate_totals()
                return kw
        
        # Return empty if not found
        return CrossPlatformKeyword(keyword=keyword, platforms={})
    
    # ==================== Response Parsing ====================
    
    def _parse_suggestions(
        self, 
        data: Dict, 
        platform: Platform
    ) -> List[KeywordSuggestion]:
        """Parse API response into KeywordSuggestion objects"""
        suggestions = []
        
        results = data.get("results", [])
        for item in results:
            suggestions.append(KeywordSuggestion(
                keyword=item.get("string", ""),
                platform=platform,
                volume=item.get("volume"),
                trend=item.get("trend", []),
                cpc=item.get("cpc"),
                competition=item.get("competition")
            ))
        
        return suggestions
    
    def _parse_volume_data(
        self, 
        data: Dict, 
        platform: Platform
    ) -> Dict[str, PlatformData]:
        """Parse volume API response"""
        result = {}
        
        results = data.get("results", {})
        for keyword, metrics in results.items():
            result[keyword.lower()] = PlatformData(
                platform=platform,
                volume=metrics.get("volume", 0),
                trend=metrics.get("trend", []),
                cpc=metrics.get("cpc"),
                competition=metrics.get("competition"),
                is_estimated=platform not in self.PRECISE_VOLUME_PLATFORMS
            )
        
        return result
