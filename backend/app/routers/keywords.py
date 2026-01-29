"""
Keyword research API endpoints
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from app.models.keyword import Platform, CrossPlatformKeyword, KeywordSuggestion
from app.services.keywordtool import KeywordToolService

router = APIRouter()
keyword_service = KeywordToolService()


@router.get("/suggestions/{platform}", response_model=List[KeywordSuggestion])
async def get_suggestions(
    platform: Platform,
    keyword: str = Query(..., min_length=1, description="Seed keyword"),
    country: str = Query("us", max_length=2, description="Country code"),
    language: str = Query("en", max_length=2, description="Language code")
) -> List[KeywordSuggestion]:
    """
    Get keyword suggestions from a specific platform's autocomplete.
    
    Returns keyword suggestions with volume data (when available).
    """
    try:
        return await keyword_service.get_suggestions(keyword, platform, country, language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cross-platform", response_model=CrossPlatformKeyword)
async def get_cross_platform_data(
    keyword: str = Query(..., min_length=1, description="Keyword to analyze"),
    platforms: Optional[str] = Query(
        None, 
        description="Comma-separated platforms (e.g., 'google,tiktok,youtube')"
    ),
    country: str = Query("us", max_length=2, description="Country code")
) -> CrossPlatformKeyword:
    """
    Get keyword data across multiple platforms.
    
    Returns volume, trends, CPC, and competition for each platform.
    """
    try:
        platform_list = None
        if platforms:
            platform_list = [Platform(p.strip().lower()) for p in platforms.split(",")]
        
        return await keyword_service.get_cross_platform_data(keyword, platform_list, country)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid platform: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch", response_model=List[CrossPlatformKeyword])
async def get_batch_data(
    keywords: List[str],
    platforms: Optional[List[Platform]] = None,
    country: str = "us"
) -> List[CrossPlatformKeyword]:
    """
    Get cross-platform data for multiple keywords.
    
    Accepts up to 50 keywords per request.
    """
    if len(keywords) > 50:
        raise HTTPException(
            status_code=400, 
            detail="Maximum 50 keywords per request"
        )
    
    try:
        return await keyword_service.get_batch_cross_platform(keywords, platforms, country)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/volume/{platform}")
async def get_volume(
    platform: Platform,
    keywords: str = Query(..., description="Comma-separated keywords"),
    country: str = Query("us", max_length=2)
):
    """
    Get search volume for specific keywords on a platform.
    
    Returns volume and metrics for each keyword.
    """
    try:
        keyword_list = [k.strip() for k in keywords.split(",")]
        if len(keyword_list) > 100:
            raise HTTPException(
                status_code=400,
                detail="Maximum 100 keywords per request"
            )
        
        result = await keyword_service.get_volume(keyword_list, platform, country)
        return {
            "platform": platform.value,
            "keywords": {k: v.model_dump() for k, v in result.items()}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/platforms")
async def list_platforms():
    """
    List all supported platforms and their data availability.
    """
    return {
        "platforms": [
            {
                "id": p.value,
                "name": p.name.replace("_", " ").title(),
                "has_precise_volume": p in keyword_service.PRECISE_VOLUME_PLATFORMS,
                "volume_source": "Keyword Planner" if p in keyword_service.PRECISE_VOLUME_PLATFORMS else "Clickstream"
            }
            for p in Platform
        ]
    }
