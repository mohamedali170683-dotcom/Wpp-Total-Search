"""
Opportunity analyzer for identifying cross-platform keyword gaps
"""
from typing import List, Dict, Tuple, Any, Optional
from datetime import datetime

from app.models.keyword import Platform, CrossPlatformKeyword, PlatformData
from app.models.opportunity import (
    OpportunityType, PlatformGapOpportunity, UniqueKeyword, 
    OpportunityReport, TrendMigration
)


class OpportunityAnalyzer:
    """
    Analyzes cross-platform keyword data to identify opportunities.
    
    Detects:
    - Platform gaps (high volume on A, low/zero on B)
    - Platform-unique keywords (only exists on one platform)
    - Trend migrations (growing on social, moving to search)
    """
    
    # Strategic platform pairs to compare for gaps
    # Format: (high_volume_platform, low_volume_platform)
    STRATEGIC_PAIRS = [
        (Platform.TIKTOK, Platform.GOOGLE),      # Social -> Search
        (Platform.INSTAGRAM, Platform.GOOGLE),    # Social -> Search
        (Platform.YOUTUBE, Platform.GOOGLE),      # Video -> Search
        (Platform.TIKTOK, Platform.YOUTUBE),      # Short-form -> Long-form
        (Platform.AMAZON, Platform.GOOGLE),       # Commerce -> Search
        (Platform.PINTEREST, Platform.GOOGLE),    # Visual -> Search
    ]
    
    # Patterns indicating platform-specific content
    PLATFORM_PATTERNS = {
        Platform.TIKTOK: {
            "format_driven": [
                "grwm", "pov", "storytime", "ib", "fyp", "greenscreen", 
                "duet", "stitch", "transition", "asmr"
            ],
            "platform_slang": [
                "viral", "trending", "blew up", "went viral", "for you",
                "foryoupage", "tiktok made me"
            ],
            "audience_specific": [
                "gen z", "aesthetic", "vibe", "core", "coded", 
                "that girl", "clean girl", "mob wife"
            ]
        },
        Platform.INSTAGRAM: {
            "format_driven": ["reels", "carousel", "story", "feed", "collab"],
            "platform_slang": ["inspo", "ootd", "aesthetic", "flatlay"],
            "audience_specific": ["influencer", "creator", "ugc"]
        },
        Platform.YOUTUBE: {
            "format_driven": [
                "tutorial", "review", "unboxing", "haul", "vlog", 
                "how to", "compilation", "reaction", "explained"
            ],
            "platform_slang": ["subscribe", "like and subscribe", "watch time"],
            "audience_specific": []
        },
        Platform.AMAZON: {
            "format_driven": ["best seller", "prime", "review", "vs"],
            "platform_slang": [],
            "audience_specific": ["buy", "purchase", "deal", "discount", "coupon"]
        },
        Platform.PINTEREST: {
            "format_driven": ["pin", "board", "idea", "inspiration"],
            "platform_slang": ["aesthetic", "moodboard"],
            "audience_specific": ["diy", "craft", "recipe"]
        }
    }
    
    # Thresholds
    MIN_VOLUME_THRESHOLD = 1000  # Minimum volume to consider
    GAP_RATIO_THRESHOLD = 5.0   # Minimum ratio to flag as gap
    
    def analyze_keyword(self, keyword_data: CrossPlatformKeyword) -> Dict[str, Any]:
        """
        Comprehensive analysis of a single keyword across platforms.
        
        Args:
            keyword_data: CrossPlatformKeyword object
            
        Returns:
            Dict with gaps, uniqueness, trends, and opportunity score
        """
        gaps = self._find_platform_gaps(keyword_data)
        uniqueness = self._classify_uniqueness(keyword_data)
        trend_direction = self._analyze_trend_direction(keyword_data)
        
        return {
            "keyword": keyword_data.keyword,
            "total_volume": keyword_data.total_volume,
            "primary_platform": keyword_data.primary_platform.value if keyword_data.primary_platform else None,
            "platforms": {
                p.value: {
                    "volume": d.volume,
                    "cpc": d.cpc,
                    "competition": d.competition,
                    "trend_direction": d.trend_direction
                }
                for p, d in keyword_data.platforms.items()
            },
            "platform_gaps": [g.model_dump() for g in gaps],
            "uniqueness_classification": uniqueness,
            "trend_analysis": trend_direction,
            "opportunity_score": self._calculate_opportunity_score(keyword_data, gaps)
        }
    
    def analyze_batch(
        self, 
        keywords: List[CrossPlatformKeyword]
    ) -> OpportunityReport:
        """
        Analyze multiple keywords and generate comprehensive report.
        
        Args:
            keywords: List of CrossPlatformKeyword objects
            
        Returns:
            OpportunityReport with all findings
        """
        all_gaps: List[PlatformGapOpportunity] = []
        unique_by_platform: Dict[Platform, List[UniqueKeyword]] = {p: [] for p in Platform}
        
        for kw in keywords:
            # Find gaps
            gaps = self._find_platform_gaps(kw)
            all_gaps.extend(gaps)
            
            # Find unique keywords
            unique = self._find_platform_unique(kw)
            if unique:
                unique_by_platform[unique.platform].append(unique)
        
        # Sort gaps by opportunity score (highest first)
        all_gaps.sort(key=lambda x: x.opportunity_score, reverse=True)
        
        # Generate summary
        summary = self._generate_summary(keywords, all_gaps)
        
        return OpportunityReport(
            seed_keyword=keywords[0].keyword if keywords else "",
            analyzed_at=datetime.now().isoformat(),
            total_keywords_analyzed=len(keywords),
            platform_gaps=all_gaps[:50],  # Top 50 gaps
            unique_keywords=unique_by_platform,
            summary=summary
        )
    
    def _find_platform_gaps(
        self, 
        keyword_data: CrossPlatformKeyword
    ) -> List[PlatformGapOpportunity]:
        """
        Identify significant volume gaps between platforms.
        """
        gaps = []
        
        for high_platform, low_platform in self.STRATEGIC_PAIRS:
            high_data = keyword_data.platforms.get(high_platform)
            low_data = keyword_data.platforms.get(low_platform)
            
            if not high_data:
                continue
            
            high_vol = high_data.volume
            low_vol = low_data.volume if low_data else 0
            
            # Check if this is a significant gap
            if high_vol >= self.MIN_VOLUME_THRESHOLD:
                if low_vol == 0:
                    ratio = 999.0  # Represent infinity
                    opportunity_score = 95.0
                elif high_vol / max(low_vol, 1) >= self.GAP_RATIO_THRESHOLD:
                    ratio = high_vol / low_vol
                    opportunity_score = min(90.0, 50 + (ratio * 2))
                else:
                    continue  # Not a significant gap
                
                recommendation = self._generate_gap_recommendation(
                    keyword_data.keyword, high_platform, low_platform, high_vol, low_vol
                )
                
                gaps.append(PlatformGapOpportunity(
                    keyword=keyword_data.keyword,
                    opportunity_type=OpportunityType.PLATFORM_GAP,
                    high_volume_platform=high_platform,
                    high_volume=high_vol,
                    low_volume_platform=low_platform,
                    low_volume=low_vol,
                    volume_ratio=ratio,
                    opportunity_score=opportunity_score,
                    recommendation=recommendation
                ))
        
        return gaps
    
    def _find_platform_unique(
        self, 
        keyword_data: CrossPlatformKeyword
    ) -> Optional[UniqueKeyword]:
        """
        Identify if keyword exists primarily on one platform.
        """
        active_platforms = [
            (p, data) for p, data in keyword_data.platforms.items()
            if data.volume >= self.MIN_VOLUME_THRESHOLD
        ]
        
        if len(active_platforms) == 1:
            platform, data = active_platforms[0]
            category, reason = self._classify_platform_uniqueness(
                keyword_data.keyword, platform
            )
            
            return UniqueKeyword(
                keyword=keyword_data.keyword,
                platform=platform,
                volume=data.volume,
                uniqueness_category=category,
                reason=reason
            )
        
        return None
    
    def _classify_uniqueness(self, keyword_data: CrossPlatformKeyword) -> Dict:
        """
        Classify why a keyword might be platform-specific.
        """
        keyword_lower = keyword_data.keyword.lower()
        classifications = {}
        
        for platform, patterns in self.PLATFORM_PATTERNS.items():
            for category, terms in patterns.items():
                for term in terms:
                    if term in keyword_lower:
                        classifications[platform.value] = {
                            "category": category,
                            "matched_term": term
                        }
                        break
        
        return classifications
    
    def _classify_platform_uniqueness(
        self, 
        keyword: str, 
        platform: Platform
    ) -> Tuple[str, str]:
        """
        Determine why a keyword is unique to a platform.
        """
        keyword_lower = keyword.lower()
        patterns = self.PLATFORM_PATTERNS.get(platform, {})
        
        for category, terms in patterns.items():
            for term in terms:
                if term in keyword_lower:
                    return category, f"Contains '{term}' which is {platform.value}-specific"
        
        return "unknown", "Platform-specific for unknown reasons"
    
    def _analyze_trend_direction(self, keyword_data: CrossPlatformKeyword) -> Dict:
        """
        Analyze trend direction across platforms.
        """
        trends = {}
        
        for platform, data in keyword_data.platforms.items():
            if len(data.trend) >= 6:
                first_half = sum(data.trend[:6]) / 6
                second_half_data = data.trend[6:] if len(data.trend) >= 12 else data.trend[6:]
                second_half = sum(second_half_data) / max(len(second_half_data), 1)
                
                if second_half > first_half * 1.1:
                    direction = "growing"
                elif second_half < first_half * 0.9:
                    direction = "declining"
                else:
                    direction = "stable"
                
                growth_rate = ((second_half - first_half) / max(first_half, 1) * 100)
                
                trends[platform.value] = {
                    "direction": direction,
                    "growth_rate": round(growth_rate, 1)
                }
        
        return trends
    
    def _calculate_opportunity_score(
        self, 
        keyword_data: CrossPlatformKeyword,
        gaps: List[PlatformGapOpportunity]
    ) -> float:
        """
        Calculate overall opportunity score for a keyword (0-100).
        """
        score = 0.0
        
        # Base score from total volume
        if keyword_data.total_volume > 1000000:
            score += 30
        elif keyword_data.total_volume > 100000:
            score += 20
        elif keyword_data.total_volume > 10000:
            score += 10
        
        # Bonus for platform gaps
        if gaps:
            max_gap_score = max(g.opportunity_score for g in gaps)
            score += max_gap_score * 0.5
        
        # Bonus for growing trends
        for platform, data in keyword_data.platforms.items():
            if len(data.trend) >= 12:
                if data.trend[-1] > data.trend[0] * 1.2:  # 20% growth
                    score += 10
                    break
        
        return min(100.0, score)
    
    def _generate_gap_recommendation(
        self,
        keyword: str,
        high_platform: Platform,
        low_platform: Platform,
        high_vol: int,
        low_vol: int
    ) -> str:
        """
        Generate actionable recommendation for a gap.
        """
        if low_vol == 0:
            return (
                f"'{keyword}' has {high_vol:,} monthly searches on {high_platform.value} "
                f"but ZERO on {low_platform.value}. Create {low_platform.value} content "
                f"to capture this untapped demand."
            )
        else:
            ratio = high_vol / low_vol
            return (
                f"'{keyword}' has {ratio:.1f}x more searches on {high_platform.value} "
                f"({high_vol:,}) vs {low_platform.value} ({low_vol:,}). "
                f"Opportunity to expand {low_platform.value} presence."
            )
    
    def _generate_summary(
        self, 
        keywords: List[CrossPlatformKeyword],
        gaps: List[PlatformGapOpportunity]
    ) -> Dict[str, Any]:
        """
        Generate summary statistics for the report.
        """
        total_volume = sum(kw.total_volume for kw in keywords)
        
        # Count gaps by platform pair
        gap_counts: Dict[str, int] = {}
        for gap in gaps:
            pair = f"{gap.high_volume_platform.value} → {gap.low_volume_platform.value}"
            gap_counts[pair] = gap_counts.get(pair, 0) + 1
        
        # Count primary platforms
        primary_counts: Dict[str, int] = {}
        for kw in keywords:
            if kw.primary_platform:
                p = kw.primary_platform.value
                primary_counts[p] = primary_counts.get(p, 0) + 1
        
        return {
            "total_search_volume_analyzed": total_volume,
            "gap_opportunities_found": len(gaps),
            "top_gap_types": dict(sorted(gap_counts.items(), key=lambda x: x[1], reverse=True)[:5]),
            "primary_platform_distribution": primary_counts,
            "highest_opportunity_keywords": [g.keyword for g in gaps[:5]],
            "average_opportunity_score": (
                sum(g.opportunity_score for g in gaps) / len(gaps) if gaps else 0
            )
        }
