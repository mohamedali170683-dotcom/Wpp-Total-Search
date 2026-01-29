"""
TikTok Commercial Content API client

Official API: https://developers.tiktok.com/products/commercial-content-api
Endpoints:
- POST /v2/research/adlib/ad/query - Search ads
- POST /v2/research/adlib/ad/detail - Get ad details

Requirements:
- TikTok Developer Account
- Application approval
- OAuth access token

Available Data:
- Ad creatives (images, videos)
- First/last shown dates
- Targeting info
- Reach estimates
"""
import httpx
import json
from typing import List, Dict, Optional
from pathlib import Path
from datetime import datetime

from app.config import settings
from app.models.ad_creative import (
    AdCreative, AdPlatform, AdFormat, BrandAdLibrary
)


class TikTokAdsService:
    """
    Client for TikTok Commercial Content API.
    
    Supports both demo mode and live API calls.
    """
    
    BASE_URL = "https://open.tiktokapis.com/v2/research/adlib"
    
    def __init__(self):
        self.access_token = settings.TIKTOK_ACCESS_TOKEN
        self.use_demo = settings.USE_DEMO_DATA or not self.access_token
        self._demo_data: Optional[Dict] = None
    
    def _load_demo_data(self) -> Dict:
        """Load demo data from JSON file"""
        if self._demo_data is None:
            demo_path = Path(__file__).parent.parent.parent / "demo_data" / "ads_sample.json"
            if demo_path.exists():
                with open(demo_path, "r") as f:
                    self._demo_data = json.load(f)
            else:
                self._demo_data = {"ads": {"tiktok": []}}
        return self._demo_data
    
    async def search_ads(
        self,
        search_term: Optional[str] = None,
        advertiser_name: Optional[str] = None,
        country_codes: List[str] = None,
        start_date: Optional[str] = None,  # YYYYMMDD format
        end_date: Optional[str] = None,
        max_count: int = 100
    ) -> List[AdCreative]:
        """
        Search TikTok Ad Library.
        
        Args:
            search_term: Text to search in ad content
            advertiser_name: Advertiser/business name
            country_codes: Target countries
            start_date: Start date (YYYYMMDD)
            end_date: End date (YYYYMMDD)
            max_count: Maximum results
            
        Returns:
            List of AdCreative objects
        """
        if country_codes is None:
            country_codes = ["US"]
            
        if self.use_demo:
            return self._get_demo_ads(search_term)
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        # Build query
        query = {
            "max_count": max_count,
            "fields": [
                "ad.id", "ad.first_shown_date", "ad.last_shown_date",
                "ad.status", "ad.image_urls", "ad.videos",
                "ad.reach.unique_users_seen",
                "ad_group.target.country", "ad_group.target.age",
                "business.name", "business.id"
            ]
        }
        
        # Build filters
        filters = []
        if search_term:
            filters.append({
                "field": "ad.text",
                "operation": "CONTAINS",
                "values": [search_term]
            })
        if advertiser_name:
            filters.append({
                "field": "business.name",
                "operation": "CONTAINS",
                "values": [advertiser_name]
            })
        if country_codes:
            filters.append({
                "field": "ad_group.target.country",
                "operation": "IN",
                "values": country_codes
            })
        
        if filters:
            query["filters"] = {"and": filters}
        
        if start_date:
            query["search_start_date"] = start_date
        if end_date:
            query["search_end_date"] = end_date
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/ad/query",
                headers=headers,
                json=query,
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
        
        return self._parse_tiktok_response(data)
    
    async def get_ad_details(self, ad_id: str) -> Optional[AdCreative]:
        """
        Get detailed info for a specific ad.
        
        Args:
            ad_id: TikTok ad ID
            
        Returns:
            AdCreative or None if not found
        """
        if self.use_demo:
            return None
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        query = {
            "ad_id": ad_id,
            "fields": [
                "ad.id", "ad.first_shown_date", "ad.last_shown_date",
                "ad.status", "ad.image_urls", "ad.videos",
                "ad.reach", "ad_group.target",
                "business.name", "business.id"
            ]
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/ad/detail",
                headers=headers,
                json=query,
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
        
        if data.get("data", {}).get("ad"):
            return self._parse_single_ad(data["data"])
        return None
    
    async def get_ads_by_domain(
        self,
        domain: str,
        country: str = "US"
    ) -> BrandAdLibrary:
        """
        Get ads for a brand by domain.
        
        Args:
            domain: Brand domain
            country: Country code
            
        Returns:
            BrandAdLibrary
        """
        brand_name = domain.replace(".com", "").replace("-", " ")
        ads = await self.search_ads(
            advertiser_name=brand_name,
            country_codes=[country]
        )
        
        return BrandAdLibrary(
            brand_name=brand_name,
            brand_domain=domain,
            ads=ads,
            total_ads=len(ads),
            platforms_present=[AdPlatform.TIKTOK] if ads else []
        )
    
    def _get_demo_ads(self, search_term: Optional[str] = None) -> List[AdCreative]:
        """Return demo ad data (TikTok section is empty in demo)"""
        demo = self._load_demo_data()
        ads = []
        
        for ad_data in demo.get("ads", {}).get("tiktok", []):
            ad = self._parse_demo_ad(ad_data)
            
            if search_term:
                ad_text = f"{ad.headline or ''} {ad.body_text or ''}".lower()
                if search_term.lower() not in ad_text:
                    continue
            
            ads.append(ad)
        
        return ads
    
    def _parse_demo_ad(self, ad_data: Dict) -> AdCreative:
        """Parse demo JSON into AdCreative"""
        return AdCreative(
            id=ad_data.get("id", ""),
            platform=AdPlatform.TIKTOK,
            advertiser_name=ad_data.get("advertiser_name", ""),
            ad_format=AdFormat(ad_data.get("ad_format", "video")),
            first_shown=self._parse_date(ad_data.get("first_shown")),
            last_shown=self._parse_date(ad_data.get("last_shown")),
            status=ad_data.get("status", "active"),
            headline=ad_data.get("headline"),
            body_text=ad_data.get("body_text"),
            video_url=ad_data.get("video_url"),
            landing_url=ad_data.get("landing_url"),
            impressions_range=ad_data.get("impressions_range"),
            target_countries=ad_data.get("target_countries", []),
            target_age_ranges=ad_data.get("target_age_ranges", [])
        )
    
    def _parse_tiktok_response(self, data: Dict) -> List[AdCreative]:
        """Parse TikTok API response"""
        ads = []
        
        for item in data.get("data", {}).get("ads", []):
            ad = self._parse_single_ad(item)
            if ad:
                ads.append(ad)
        
        return ads
    
    def _parse_single_ad(self, item: Dict) -> AdCreative:
        """Parse a single TikTok ad from API response"""
        ad_data = item.get("ad", {})
        business = item.get("business", {})
        ad_group = item.get("ad_group", {})
        target = ad_group.get("target", {})
        
        # Determine format
        has_video = bool(ad_data.get("videos"))
        ad_format = AdFormat.VIDEO if has_video else AdFormat.IMAGE
        
        return AdCreative(
            id=str(ad_data.get("id", "")),
            platform=AdPlatform.TIKTOK,
            advertiser_name=business.get("name", ""),
            advertiser_id=str(business.get("id", "")),
            ad_format=ad_format,
            first_shown=self._parse_int_date(ad_data.get("first_shown_date")),
            last_shown=self._parse_int_date(ad_data.get("last_shown_date")),
            status=ad_data.get("status", "unknown"),
            image_url=self._get_first(ad_data.get("image_urls", [])),
            video_url=self._get_first_video(ad_data.get("videos", [])),
            impressions_range=ad_data.get("reach", {}).get("unique_users_seen"),
            target_countries=target.get("country", []),
            target_age_ranges=self._parse_age_ranges(target.get("age", {}))
        )
    
    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse date string"""
        if date_str:
            try:
                return datetime.fromisoformat(date_str)
            except (ValueError, TypeError):
                pass
        return None
    
    def _parse_int_date(self, date_int: Optional[int]) -> Optional[datetime]:
        """Parse YYYYMMDD integer to datetime"""
        if date_int:
            try:
                return datetime.strptime(str(date_int), "%Y%m%d")
            except (ValueError, TypeError):
                pass
        return None
    
    def _get_first(self, lst: List) -> Optional[str]:
        """Get first item from list"""
        return lst[0] if lst else None
    
    def _get_first_video(self, videos: List[Dict]) -> Optional[str]:
        """Get first video URL"""
        if videos:
            return videos[0].get("url")
        return None
    
    def _parse_age_ranges(self, age_dict: Dict) -> List[str]:
        """Parse age targeting dict to list of enabled ranges"""
        ranges = []
        for range_str, enabled in age_dict.items():
            if enabled:
                ranges.append(range_str)
        return ranges
