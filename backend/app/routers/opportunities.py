"""
Opportunity analysis API endpoints
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from app.models.keyword import Platform
from app.models.opportunity import OpportunityReport, PlatformGapOpportunity
from app.services.keywordtool import KeywordToolService
from app.services.opportunity_analyzer import OpportunityAnalyzer

router = APIRouter()
keyword_service = KeywordToolService()
analyzer = OpportunityAnalyzer()


@router.get("/analyze")
async def analyze_keyword(
    keyword: str = Query(..., min_length=1, description="Keyword to analyze"),
    country: str = Query("us", max_length=2, description="Country code")
):
    """
    Analyze a single keyword for cross-platform opportunities.
    
    Returns platform gaps, uniqueness classification, trend analysis,
    and overall opportunity score.
    """
    try:
        kw_data = await keyword_service.get_cross_platform_data(keyword, country=country)
        return analyzer.analyze_keyword(kw_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/report", response_model=OpportunityReport)
async def generate_report(
    seed_keywords: List[str],
    country: str = "us"
) -> OpportunityReport:
    """
    Generate comprehensive opportunity report for multiple keywords.
    
    Analyzes up to 20 seed keywords and returns:
    - Platform gaps with recommendations
    - Platform-unique keywords
    - Summary statistics
    """
    if len(seed_keywords) > 20:
        raise HTTPException(
            status_code=400,
            detail="Maximum 20 seed keywords per report"
        )
    
    if not seed_keywords:
        raise HTTPException(
            status_code=400,
            detail="At least one keyword required"
        )
    
    try:
        keywords_data = []
        for kw in seed_keywords:
            data = await keyword_service.get_cross_platform_data(kw, country=country)
            keywords_data.append(data)
        
        return analyzer.analyze_batch(keywords_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/gaps", response_model=List[PlatformGapOpportunity])
async def find_gaps(
    keyword: str = Query(..., min_length=1),
    high_platform: Platform = Query(..., description="Platform with expected high volume"),
    low_platform: Platform = Query(..., description="Platform with expected low volume"),
    country: str = Query("us", max_length=2)
) -> List[PlatformGapOpportunity]:
    """
    Find gaps between two specific platforms for a keyword.
    
    Useful for checking specific platform arbitrage opportunities.
    """
    try:
        kw_data = await keyword_service.get_cross_platform_data(keyword, country=country)
        all_gaps = analyzer._find_platform_gaps(kw_data)
        
        # Filter to requested platform pair
        filtered = [
            g for g in all_gaps
            if g.high_volume_platform == high_platform 
            and g.low_volume_platform == low_platform
        ]
        
        return filtered
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trending-migrations")
async def find_trending_migrations(
    keywords: str = Query(..., description="Comma-separated keywords to analyze"),
    country: str = Query("us", max_length=2)
):
    """
    Find keywords showing trend migration patterns.
    
    Identifies keywords that are growing on social platforms
    and may soon trend on search engines.
    """
    try:
        keyword_list = [k.strip() for k in keywords.split(",")][:20]
        
        results = []
        for kw in keyword_list:
            kw_data = await keyword_service.get_cross_platform_data(kw, country=country)
            analysis = analyzer.analyze_keyword(kw_data)
            
            # Check for social -> search migration patterns
            trends = analysis.get("trend_analysis", {})
            
            # Find if social platforms are growing while search is stable/low
            social_growing = any(
                trends.get(p, {}).get("direction") == "growing"
                for p in ["tiktok", "instagram"]
            )
            search_stable = trends.get("google", {}).get("direction") in ["stable", "declining", None]
            
            if social_growing and search_stable:
                results.append({
                    "keyword": kw,
                    "pattern": "social_to_search_migration",
                    "social_trend": {
                        p: trends.get(p, {})
                        for p in ["tiktok", "instagram", "youtube"]
                        if p in trends
                    },
                    "search_trend": trends.get("google", {}),
                    "recommendation": "Create SEO content now - this keyword is likely to grow on Google"
                })
        
        return {
            "keywords_analyzed": len(keyword_list),
            "migrations_detected": len(results),
            "migrations": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/platform-unique")
async def find_platform_unique(
    platform: Platform = Query(..., description="Platform to find unique keywords for"),
    seed_keywords: str = Query(..., description="Comma-separated seed keywords"),
    country: str = Query("us", max_length=2)
):
    """
    Find keywords that exist primarily on one platform.
    
    Useful for understanding platform-specific search behavior.
    """
    try:
        keyword_list = [k.strip() for k in seed_keywords.split(",")][:20]
        
        unique_keywords = []
        for kw in keyword_list:
            kw_data = await keyword_service.get_cross_platform_data(kw, country=country)
            unique = analyzer._find_platform_unique(kw_data)
            
            if unique and unique.platform == platform:
                unique_keywords.append(unique.model_dump())
        
        return {
            "platform": platform.value,
            "keywords_analyzed": len(keyword_list),
            "unique_keywords_found": len(unique_keywords),
            "keywords": unique_keywords
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
