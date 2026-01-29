"""
Brand audit API endpoints - Compare keyword demand vs ad coverage
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from app.models.ad_creative import AdPlatform, BrandAdLibrary, BrandCoverageAudit
from app.models.keyword import Platform
from app.services.meta_ads import MetaAdsService
from app.services.tiktok_ads import TikTokAdsService
from app.services.google_ads_transparency import GoogleAdsTransparencyService
from app.services.keywordtool import KeywordToolService
from app.services.opportunity_analyzer import OpportunityAnalyzer

router = APIRouter()

meta_service = MetaAdsService()
tiktok_service = TikTokAdsService()
google_service = GoogleAdsTransparencyService()
keyword_service = KeywordToolService()
analyzer = OpportunityAnalyzer()


@router.get("/ads/{platform}")
async def get_brand_ads(
    platform: AdPlatform,
    domain: str = Query(..., min_length=3, description="Brand domain"),
    search_term: Optional[str] = Query(None, description="Filter by search term")
):
    """
    Get ads for a brand from a specific ad library.
    
    Returns ad creatives with available metadata.
    """
    try:
        if platform == AdPlatform.META:
            library = await meta_service.get_ads_by_domain(domain)
            return library.model_dump()
        
        elif platform == AdPlatform.TIKTOK:
            library = await tiktok_service.get_ads_by_domain(domain)
            return library.model_dump()
        
        elif platform == AdPlatform.GOOGLE:
            library = await google_service.get_ads_by_domain(domain)
            return library.model_dump()
        
        else:
            raise HTTPException(status_code=400, detail="Unknown platform")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ads/all")
async def get_all_brand_ads(
    domain: str = Query(..., min_length=3, description="Brand domain")
):
    """
    Get ads for a brand from all ad libraries.
    
    Aggregates results from Meta, TikTok, and Google.
    """
    try:
        meta_library = await meta_service.get_ads_by_domain(domain)
        tiktok_library = await tiktok_service.get_ads_by_domain(domain)
        google_library = await google_service.get_ads_by_domain(domain)
        
        all_ads = meta_library.ads + tiktok_library.ads + google_library.ads
        
        return {
            "brand_domain": domain,
            "total_ads": len(all_ads),
            "by_platform": {
                "meta": {
                    "count": len(meta_library.ads),
                    "ads": [a.model_dump() for a in meta_library.ads[:10]]  # Limit to 10 per platform
                },
                "tiktok": {
                    "count": len(tiktok_library.ads),
                    "ads": [a.model_dump() for a in tiktok_library.ads[:10]]
                },
                "google": {
                    "count": len(google_library.ads),
                    "ads": [a.model_dump() for a in google_library.ads[:10]]
                }
            },
            "platforms_active": [
                p for p, lib in [
                    ("meta", meta_library),
                    ("tiktok", tiktok_library),
                    ("google", google_library)
                ]
                if lib.ads
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/coverage", response_model=List[BrandCoverageAudit])
async def audit_brand_coverage(
    domain: str,
    keywords: List[str],
    country: str = "us"
) -> List[BrandCoverageAudit]:
    """
    Audit brand coverage against keyword demand.
    
    Compares search demand on each platform against the brand's
    ad presence to identify coverage gaps.
    
    Returns gap analysis with recommendations.
    """
    if len(keywords) > 20:
        raise HTTPException(
            status_code=400,
            detail="Maximum 20 keywords per audit"
        )
    
    try:
        # Get keyword demand data
        keyword_data = []
        for kw in keywords:
            data = await keyword_service.get_cross_platform_data(kw, country=country)
            keyword_data.append(data)
        
        # Get brand's ad presence across platforms
        meta_library = await meta_service.get_ads_by_domain(domain)
        google_library = await google_service.get_ads_by_domain(domain)
        tiktok_library = await tiktok_service.get_ads_by_domain(domain)
        
        # Extract keywords from ads for matching
        brand_keywords = set()
        for ad in meta_library.ads + google_library.ads + tiktok_library.ads:
            if ad.headline:
                brand_keywords.update(ad.headline.lower().split())
            if ad.body_text:
                brand_keywords.update(ad.body_text.lower().split())
            brand_keywords.update(ad.keywords_detected)
        
        # Generate coverage audit for each keyword
        audits = []
        for kw_data in keyword_data:
            # Build demand dict
            demand = {
                p.value: d.volume 
                for p, d in kw_data.platforms.items()
            }
            
            # Check coverage (simplified - checks if brand has ANY ads on platform)
            kw_lower = kw_data.keyword.lower()
            has_meta_ads = len(meta_library.ads) > 0
            has_google_ads = len(google_library.ads) > 0
            has_tiktok_ads = len(tiktok_library.ads) > 0
            
            # More precise: check if keyword appears in ads
            kw_in_meta = any(
                kw_lower in (ad.headline or "").lower() or kw_lower in (ad.body_text or "").lower()
                for ad in meta_library.ads
            )
            kw_in_google = any(
                kw_lower in (ad.headline or "").lower() or kw_lower in (ad.body_text or "").lower()
                for ad in google_library.ads
            )
            
            coverage = {
                "meta_ads": has_meta_ads,
                "google_ads": has_google_ads,
                "tiktok_ads": has_tiktok_ads,
                "keyword_in_meta": kw_in_meta,
                "keyword_in_google": kw_in_google
            }
            
            # Calculate gap score
            total_demand = sum(demand.values())
            covered_demand = 0
            if has_google_ads:
                covered_demand += demand.get("google", 0)
            if has_meta_ads:
                covered_demand += demand.get("instagram", 0)
            if has_tiktok_ads:
                covered_demand += demand.get("tiktok", 0)
            
            gap_score = ((total_demand - covered_demand) / max(total_demand, 1)) * 100
            
            # Find uncovered high-demand platforms
            uncovered = []
            if demand.get("tiktok", 0) > 10000 and not has_tiktok_ads:
                uncovered.append(f"TikTok ({demand['tiktok']:,})")
            if demand.get("google", 0) > 10000 and not has_google_ads:
                uncovered.append(f"Google ({demand['google']:,})")
            if demand.get("instagram", 0) > 10000 and not has_meta_ads:
                uncovered.append(f"Instagram ({demand['instagram']:,})")
            
            # Generate recommendation
            if uncovered:
                recommendation = f"High demand on {', '.join(uncovered)} but no ad presence. Consider expanding paid coverage."
            elif gap_score > 30:
                recommendation = f"Partial coverage. {gap_score:.0f}% of demand is on platforms without ads."
            else:
                recommendation = "Good coverage across high-demand platforms."
            
            audits.append(BrandCoverageAudit(
                brand_name=domain,
                keyword=kw_data.keyword,
                demand=demand,
                coverage=coverage,
                gap_score=round(gap_score, 1),
                recommendation=recommendation,
                total_demand=total_demand,
                covered_demand=covered_demand,
                uncovered_platforms=[p.split(" ")[0] for p in uncovered]
            ))
        
        # Sort by gap score (highest gaps first)
        audits.sort(key=lambda x: x.gap_score, reverse=True)
        
        return audits
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def get_coverage_summary(
    domain: str = Query(..., min_length=3),
    keywords: str = Query(..., description="Comma-separated keywords"),
    country: str = Query("us", max_length=2)
):
    """
    Get a summary of brand coverage vs demand.
    
    High-level overview without full audit details.
    """
    try:
        keyword_list = [k.strip() for k in keywords.split(",")][:20]
        
        # Get ad counts
        meta_library = await meta_service.get_ads_by_domain(domain)
        google_library = await google_service.get_ads_by_domain(domain)
        tiktok_library = await tiktok_service.get_ads_by_domain(domain)
        
        # Get total demand
        total_demand = {}
        for kw in keyword_list:
            kw_data = await keyword_service.get_cross_platform_data(kw, country=country)
            for p, d in kw_data.platforms.items():
                total_demand[p.value] = total_demand.get(p.value, 0) + d.volume
        
        return {
            "brand_domain": domain,
            "keywords_analyzed": len(keyword_list),
            "ad_presence": {
                "meta": len(meta_library.ads),
                "google": len(google_library.ads),
                "tiktok": len(tiktok_library.ads)
            },
            "total_demand_by_platform": total_demand,
            "coverage_status": {
                "meta": "active" if meta_library.ads else "none",
                "google": "active" if google_library.ads else "none",
                "tiktok": "active" if tiktok_library.ads else "none"
            },
            "top_demand_platform": max(total_demand.items(), key=lambda x: x[1])[0] if total_demand else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
