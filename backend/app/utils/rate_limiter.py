"""
Simple rate limiting utilities

For production, consider using Redis-based rate limiting.
"""
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List
from collections import deque


class RateLimiter:
    """
    Simple in-memory rate limiter using sliding window.
    
    Usage:
        limiter = RateLimiter(max_requests=5, window_seconds=60)
        
        if limiter.is_allowed("keywordtool"):
            # Make request
            limiter.record_request("keywordtool")
        else:
            # Wait or raise error
            wait_time = limiter.time_until_allowed("keywordtool")
    """
    
    def __init__(self, max_requests: int = 5, window_seconds: int = 60):
        """
        Initialize rate limiter.
        
        Args:
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: Dict[str, deque] = {}
    
    def is_allowed(self, key: str) -> bool:
        """
        Check if a request is allowed for the given key.
        
        Args:
            key: Identifier for the rate limit bucket
            
        Returns:
            True if request is allowed, False otherwise
        """
        self._cleanup(key)
        
        if key not in self._requests:
            return True
        
        return len(self._requests[key]) < self.max_requests
    
    def record_request(self, key: str) -> None:
        """
        Record a request for the given key.
        
        Args:
            key: Identifier for the rate limit bucket
        """
        if key not in self._requests:
            self._requests[key] = deque()
        
        self._requests[key].append(datetime.now())
    
    def time_until_allowed(self, key: str) -> float:
        """
        Get time in seconds until next request is allowed.
        
        Args:
            key: Identifier for the rate limit bucket
            
        Returns:
            Seconds until allowed (0 if already allowed)
        """
        if self.is_allowed(key):
            return 0.0
        
        oldest = self._requests[key][0]
        unlock_time = oldest + timedelta(seconds=self.window_seconds)
        wait_time = (unlock_time - datetime.now()).total_seconds()
        
        return max(0.0, wait_time)
    
    async def wait_if_needed(self, key: str) -> None:
        """
        Wait if rate limit is exceeded.
        
        Args:
            key: Identifier for the rate limit bucket
        """
        wait_time = self.time_until_allowed(key)
        if wait_time > 0:
            await asyncio.sleep(wait_time)
    
    def _cleanup(self, key: str) -> None:
        """Remove expired entries from the window"""
        if key not in self._requests:
            return
        
        cutoff = datetime.now() - timedelta(seconds=self.window_seconds)
        
        while self._requests[key] and self._requests[key][0] < cutoff:
            self._requests[key].popleft()
    
    def get_stats(self, key: str) -> dict:
        """
        Get rate limit stats for a key.
        
        Args:
            key: Identifier for the rate limit bucket
            
        Returns:
            Dict with remaining requests, reset time, etc.
        """
        self._cleanup(key)
        
        current = len(self._requests.get(key, []))
        remaining = max(0, self.max_requests - current)
        
        return {
            "key": key,
            "max_requests": self.max_requests,
            "window_seconds": self.window_seconds,
            "current_requests": current,
            "remaining_requests": remaining,
            "is_allowed": remaining > 0,
            "reset_in_seconds": self.time_until_allowed(key) if remaining == 0 else 0
        }


# Global rate limiter instance for KeywordTool.io
keywordtool_limiter = RateLimiter(max_requests=5, window_seconds=60)
