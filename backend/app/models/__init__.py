"""
Pydantic models for Wpp-Total-Search
"""
from app.models.keyword import (
    Platform,
    PlatformData,
    CrossPlatformKeyword,
    KeywordSuggestion,
)
from app.models.opportunity import (
    OpportunityType,
    PlatformGapOpportunity,
    UniqueKeyword,
    OpportunityReport,
)
from app.models.ad_creative import (
    AdPlatform,
    AdFormat,
    AdCreative,
    BrandAdLibrary,
    BrandCoverageAudit,
)

__all__ = [
    # Keyword models
    "Platform",
    "PlatformData", 
    "CrossPlatformKeyword",
    "KeywordSuggestion",
    # Opportunity models
    "OpportunityType",
    "PlatformGapOpportunity",
    "UniqueKeyword",
    "OpportunityReport",
    # Ad creative models
    "AdPlatform",
    "AdFormat",
    "AdCreative",
    "BrandAdLibrary",
    "BrandCoverageAudit",
]
