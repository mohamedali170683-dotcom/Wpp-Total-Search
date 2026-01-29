"""
Meta Ad Library API client

Official API: https://www.facebook.com/ads/library/api/
Endpoint: GET /ads_archive

Requirements:
- Meta Developer App
- Identity Verification (facebook.com/ID)
- Access Token with ads_read permission

Limitations:
- Full data: EU ads + Political/social issue ads
- Limited data: Other regions
- Rate limited
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


class MetaAdsService:
    """
    Client for Meta Ad Library API.
    
    Supports both demo mode and live API calls.
    """
    
    BASE_URL = "https://graph.facebook.com/v18.0/ads_archive"
    
    def __init__(self):
        self.access_token = settings.META_ACCESS_TOKEN
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
                self._demo_data = {"ads": {"meta": []}}
        return self._demo_data
    
    async def search_ads(
        self,
        search_term: Optional[str] = None,
        page_id: Optional[str] = None,
        ad_reached_countries: List[str] = None,
        ad_active_status: str = "ACTIVE",
        limit: int = 100
    ) -> List[AdCreative]:
        """
        Search Meta Ad Library for ads.
        
        Args:
            search_term: Keyword to search in ad content
            page_id: Specific Facebook Page ID
            ad_reached_countries: Countries where ads were shown
            ad_active_status: ACTIVE, INACTIVE, or ALL
            limit: Maximum results
            
        Returns:
            List of AdCreative objects
        """
        if ad_reached_countries is None:
            ad_reached_countries = ["US"]
            
        if self.use_demo:
            return self._get_demo_ads(search_term)
        
        params = {
            "access_token": self.access_token,
            "ad_reached_countries": ad_reached_countries,
            "ad_active_status": ad_active_status,
            "fields": ",".join([
                "id", "ad_creation_time", "ad_creative_bodies",
                "ad_creative_link_captions", "ad_creative_link_titles",
                "ad_delivery_start_time", "ad_delivery_stop_time",
                "page_id", "page_name", "publisher_platforms",
                "impressions", "spend", "currency",
                "demographic_distribution", "delivery_by_region"
            ]),
            "limit": limit
        }
        
        if search_term:
            params["search_terms"] = search_term
        if page_id:
            params["search_page_ids"] = page_id
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.BASE_URL, params=params, timeout=30.0)
            response.raise_for_status()
            data = response.json()
        
        return self._parse_meta_response(data)
    
    async def get_ads_by_domain(
        self,
        domain: str,
        country: str = "US"
    ) -> BrandAdLibrary:
        """
        Get all ads for a brand by their domain.
        
        Args:
            domain: Brand domain (e.g., 'optimumnutrition.com')
            country: Country code
            
        Returns:
            BrandAdLibrary with all found ads
        """
        if self.use_demo:
            demo = self._load_demo_data()
            if domain.lower() in demo.get("domain", "").lower():
                return self._build_demo_brand_library(demo)
            return BrandAdLibrary(
                brand_name=domain,
                brand_domain=domain,
                ads=[],
                total_ads=0,
                platforms_present=[]
            )
        
        # Search for brand name derived from domain
        brand_name = domain.replace(".com", "").replace(".de", "").replace("-", " ")
        ads = await self.search_ads(search_term=brand_name)
        
        library = BrandAdLibrary(
            brand_name=brand_name,
            brand_domain=domain,
            ads=ads,
            total_ads=len(ads),
            platforms_present=[AdPlatform.META] if ads else []
        )
        library.calculate_stats()
        
        return library
    
    def _get_demo_ads(self, search_term: Optional[str] = None) -> List[AdCreative]:
        """Return demo ad data"""
        demo = self._load_demo_data()
        ads = []
        
        for ad_data in demo.get("ads", {}).get("meta", []):
            ad = self._parse_demo_ad(ad_data)
            
            if search_term:
                # Filter by search term
                ad_text = f"{ad.headline or ''} {ad.body_text or ''}".lower()
                if search_term.lower() not in ad_text:
                    continue
            
            ads.append(ad)
        
        return ads
    
    def _build_demo_brand_library(self, demo: Dict) -> BrandAdLibrary:
        """Build BrandAdLibrary from demo data"""
        ads = self._get_demo_ads()
        
        library = BrandAdLibrary(
            brand_name=demo.get("brand", "Unknown"),
            brand_domain=demo.get("domain", ""),
            ads=ads,
            total_ads=len(ads),
            platforms_present=[AdPlatform.META] if ads else [],
            keywords_in_ads=demo.get("keywords_in_ads", [])
        )
        
        return library
    
    def _parse_demo_ad(self, ad_data: Dict) -> AdCreative:
        """Parse demo JSON into AdCreative"""
        return AdCreative(
            id=ad_data.get("id", ""),
            platform=AdPlatform.META,
            advertiser_name=ad_data.get("advertiser_name", ""),
            ad_format=AdFormat(ad_data.get("ad_format", "image")),
            first_shown=self._parse_date(ad_data.get("first_shown")),
            last_shown=self._parse_date(ad_data.get("last_shown")),
            status=ad_data.get("status", "active"),
            headline=ad_data.get("headline"),
            body_text=ad_data.get("body_text"),
            landing_url=ad_data.get("landing_url"),
            impressions_range=ad_data.get("impressions_range"),
            target_countries=ad_data.get("target_countries", []),
            target_age_ranges=ad_data.get("target_age_ranges", []),
            keywords_detected=ad_data.get("keywords_detected", [])
        )
    
    def _parse_meta_response(self, data: Dict) -> List[AdCreative]:
        """Parse Meta API response into AdCreative objects"""
        ads = []
        
        for item in data.get("data", []):
            ad = AdCreative(
                id=item.get("id", ""),
                platform=AdPlatform.META,
                advertiser_name=item.get("page_name", ""),
                advertiser_id=item.get("page_id"),
                ad_format=self._detect_format(item),
                first_shown=self._parse_datetime(item.get("ad_delivery_start_time")),
                last_shown=self._parse_datetime(item.get("ad_delivery_stop_time")),
                status="active" if not item.get("ad_delivery_stop_time") else "inactive",
                headline=self._get_first(item.get("ad_creative_link_titles", [])),
                body_text=self._get_first(item.get("ad_creative_bodies", [])),
                impressions_range=self._format_impressions(item.get("impressions")),
                spend_range=self._format_spend(item.get("spend")),
            )
            ads.append(ad)
        
        return ads
    
    def _detect_format(self, item: Dict) -> AdFormat:
        """Detect ad format from API response"""
        # Simplified - would need more logic for real detection
        return AdFormat.IMAGE
    
    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse date string"""
        if date_str:
            try:
                return datetime.fromisoformat(date_str)
            except (ValueError, TypeError):
                pass
        return None
    
    def _parse_datetime(self, dt_str: Optional[str]) -> Optional[datetime]:
        """Parse ISO datetime string"""
        if dt_str:
            try:
                return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
            except (ValueError, TypeError):
                pass
        return None
    
    def _get_first(self, lst: List) -> Optional[str]:
        """Get first item from list"""
        return lst[0] if lst else None
    
    def _format_impressions(self, imp: Optional[Dict]) -> Optional[str]:
        """Format impressions range"""
        if imp:
            lower = imp.get("lower_bound", 0)
            upper = imp.get("upper_bound", 0)
            return f"{lower:,}-{upper:,}"
        return None
    
    def _format_spend(self, spend: Optional[Dict]) -> Optional[str]:
        """Format spend range"""
        if spend:
            lower = spend.get("lower_bound", 0)
            upper = spend.get("upper_bound", 0)
            return f"${lower:,}-${upper:,}"
        return None
