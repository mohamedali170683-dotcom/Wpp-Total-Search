"""
Google Ads Transparency Center client

NO OFFICIAL API - Using alternative methods:
1. PyPI package: Google-Ads-Transparency-Scraper (free)
2. SearchAPI.io wrapper (paid, more reliable)
3. SerpAPI wrapper (paid)

This implementation supports:
- Demo mode (local data)
- PyPI scraper (free)
- SearchAPI.io (paid)
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


class GoogleAdsTransparencyService:
    """
    Client for Google Ads Transparency Center.
    
    Since there's no official API, this uses:
    1. Demo mode for testing
    2. PyPI scraper for free access
    3. SearchAPI.io for reliable production use
    """
    
    SEARCHAPI_BASE = "https://www.searchapi.io/api/v1/search"
    
    def __init__(self):
        self.searchapi_key = settings.SEARCHAPI_KEY
        self.use_demo = settings.USE_DEMO_DATA
        self._demo_data: Optional[Dict] = None
    
    def _load_demo_data(self) -> Dict:
        """Load demo data from JSON file"""
        if self._demo_data is None:
            demo_path = Path(__file__).parent.parent.parent / "demo_data" / "ads_sample.json"
            if demo_path.exists():
                with open(demo_path, "r") as f:
                    self._demo_data = json.load(f)
            else:
                self._demo_data = {"ads": {"google": []}}
        return self._demo_data
    
    async def search_by_domain(
        self,
        domain: str,
        region: str = "anywhere",
        format_filter: Optional[str] = None,  # text, image, video
        time_period: str = "last_30_days",
        limit: int = 40
    ) -> List[AdCreative]:
        """
        Search Google Ads Transparency Center by domain.
        
        Args:
            domain: Advertiser domain (e.g., 'tesla.com')
            region: Geographic region
            format_filter: Filter by ad format
            time_period: Time range (today, last_7_days, last_30_days)
            limit: Maximum results
            
        Returns:
            List of AdCreative objects
        """
        if self.use_demo:
            return self._get_demo_ads(domain)
        
        if self.searchapi_key:
            return await self._search_via_searchapi(
                domain=domain,
                region=region,
                format_filter=format_filter,
                time_period=time_period,
                limit=limit
            )
        else:
            return self._search_via_scraper(domain, limit)
    
    async def search_by_advertiser_id(
        self,
        advertiser_id: str,
        region: str = "anywhere",
        limit: int = 40
    ) -> List[AdCreative]:
        """
        Search by advertiser ID (format: AR17828074650563772417).
        
        Args:
            advertiser_id: Google advertiser ID
            region: Geographic region
            limit: Maximum results
            
        Returns:
            List of AdCreative objects
        """
        if self.use_demo:
            return self._get_demo_ads(None)
        
        if self.searchapi_key:
            return await self._search_via_searchapi(
                advertiser_id=advertiser_id,
                region=region,
                limit=limit
            )
        else:
            return self._search_via_scraper_by_id(advertiser_id, limit)
    
    async def get_ads_by_domain(
        self,
        domain: str,
        country: str = "US"
    ) -> BrandAdLibrary:
        """
        Get all ads for a brand by domain.
        
        Args:
            domain: Brand domain
            country: Country code
            
        Returns:
            BrandAdLibrary
        """
        ads = await self.search_by_domain(domain)
        
        brand_name = domain.replace(".com", "").replace("-", " ").title()
        
        return BrandAdLibrary(
            brand_name=brand_name,
            brand_domain=domain,
            ads=ads,
            total_ads=len(ads),
            platforms_present=[AdPlatform.GOOGLE] if ads else []
        )
    
    async def _search_via_searchapi(
        self,
        domain: Optional[str] = None,
        advertiser_id: Optional[str] = None,
        region: str = "anywhere",
        format_filter: Optional[str] = None,
        time_period: Optional[str] = None,
        limit: int = 40
    ) -> List[AdCreative]:
        """
        Search using SearchAPI.io wrapper.
        
        Docs: https://www.searchapi.io/docs/google-ads-transparency-center-api
        """
        params = {
            "engine": "google_ads_transparency_center",
            "api_key": self.searchapi_key,
            "region": region,
            "num": limit
        }
        
        if domain:
            params["domain"] = domain
        if advertiser_id:
            params["advertiser_id"] = advertiser_id
        if format_filter:
            params["format"] = format_filter
        if time_period:
            params["time_period"] = time_period
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.SEARCHAPI_BASE, 
                params=params, 
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
        
        return self._parse_searchapi_response(data)
    
    def _search_via_scraper(self, domain: str, limit: int) -> List[AdCreative]:
        """
        Search using PyPI Google-Ads-Transparency-Scraper.
        
        Install: pip install Google-Ads-Transparency-Scraper
        """
        try:
            from GoogleAds.main import GoogleAds
            
            scraper = GoogleAds()
            
            # Get advertiser info from domain
            creatives = scraper.get_creative_Ids(domain, limit)
            
            if not creatives.get("Ad Count"):
                return []
            
            advertiser_id = creatives["Advertisor Id"]
            ads = []
            
            for creative_id in creatives.get("Creative_Ids", [])[:limit]:
                try:
                    ad_detail = scraper.get_detailed_ad(advertiser_id, creative_id)
                    ads.append(self._parse_scraper_ad(ad_detail, advertiser_id))
                except Exception:
                    continue
            
            return ads
            
        except ImportError:
            print("Google-Ads-Transparency-Scraper not installed. Run: pip install Google-Ads-Transparency-Scraper")
            return []
        except Exception as e:
            print(f"Scraper error: {e}")
            return []
    
    def _search_via_scraper_by_id(
        self, 
        advertiser_id: str, 
        limit: int
    ) -> List[AdCreative]:
        """Search by advertiser ID using PyPI scraper"""
        try:
            from GoogleAds.main import GoogleAds
            
            scraper = GoogleAds()
            creatives = scraper.get_creative_Ids_by_id(advertiser_id, limit)
            
            ads = []
            for creative_id in creatives.get("Creative_Ids", [])[:limit]:
                try:
                    ad_detail = scraper.get_detailed_ad(advertiser_id, creative_id)
                    ads.append(self._parse_scraper_ad(ad_detail, advertiser_id))
                except Exception:
                    continue
            
            return ads
            
        except ImportError:
            return []
        except Exception:
            return []
    
    def _get_demo_ads(self, search_term: Optional[str] = None) -> List[AdCreative]:
        """Return demo ad data"""
        demo = self._load_demo_data()
        ads = []
        
        for ad_data in demo.get("ads", {}).get("google", []):
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
            platform=AdPlatform.GOOGLE,
            advertiser_name=ad_data.get("advertiser_name", ""),
            ad_format=AdFormat(ad_data.get("ad_format", "text")),
            first_shown=self._parse_date(ad_data.get("first_shown")),
            last_shown=self._parse_date(ad_data.get("last_shown")),
            status=ad_data.get("status", "active"),
            headline=ad_data.get("headline"),
            body_text=ad_data.get("body_text"),
            landing_url=ad_data.get("landing_url"),
            keywords_detected=ad_data.get("keywords_detected", [])
        )
    
    def _parse_searchapi_response(self, data: Dict) -> List[AdCreative]:
        """Parse SearchAPI.io response"""
        ads = []
        
        for item in data.get("ad_creatives", []):
            ad_format = AdFormat.TEXT
            format_str = item.get("format", "").lower()
            if format_str == "image":
                ad_format = AdFormat.IMAGE
            elif format_str == "video":
                ad_format = AdFormat.VIDEO
            
            ad = AdCreative(
                id=item.get("id", ""),
                platform=AdPlatform.GOOGLE,
                advertiser_name=item.get("advertiser", {}).get("name", ""),
                advertiser_id=item.get("advertiser", {}).get("id"),
                ad_format=ad_format,
                first_shown=self._parse_datetime(item.get("first_shown_datetime")),
                last_shown=self._parse_datetime(item.get("last_shown_datetime")),
                status="active" if item.get("last_shown_datetime") else "unknown",
                landing_url=item.get("target_domain")
            )
            ads.append(ad)
        
        return ads
    
    def _parse_scraper_ad(self, ad_detail: Dict, advertiser_id: str) -> AdCreative:
        """Parse PyPI scraper response"""
        ad_format = AdFormat.TEXT
        format_str = ad_detail.get("Ad Format", "").lower()
        if "image" in format_str:
            ad_format = AdFormat.IMAGE
        elif "video" in format_str:
            ad_format = AdFormat.VIDEO
        
        return AdCreative(
            id=ad_detail.get("Creative Id", ""),
            platform=AdPlatform.GOOGLE,
            advertiser_name=ad_detail.get("Advertiser Name", ""),
            advertiser_id=advertiser_id,
            ad_format=ad_format,
            last_shown=self._parse_date_str(ad_detail.get("Last Shown")),
            landing_url=ad_detail.get("Ad Link")
        )
    
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
    
    def _parse_date_str(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse date string in various formats"""
        if date_str:
            for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"]:
                try:
                    return datetime.strptime(date_str, fmt)
                except (ValueError, TypeError):
                    continue
        return None
