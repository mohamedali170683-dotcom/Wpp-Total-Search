"""
Simple caching utilities

For production, consider using Redis with the redis package.
"""
import functools
import hashlib
import json
from typing import Any, Callable, Optional
from datetime import datetime, timedelta


# Simple in-memory cache
_cache: dict = {}
_cache_expiry: dict = {}


def cache_result(ttl_seconds: int = 3600):
    """
    Decorator to cache function results.
    
    Args:
        ttl_seconds: Time to live in seconds (default: 1 hour)
        
    Usage:
        @cache_result(ttl_seconds=300)
        async def get_data(keyword: str):
            ...
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            key_data = {
                "func": func.__name__,
                "args": str(args),
                "kwargs": str(sorted(kwargs.items()))
            }
            cache_key = hashlib.md5(
                json.dumps(key_data, sort_keys=True).encode()
            ).hexdigest()
            
            # Check if cached and not expired
            if cache_key in _cache:
                expiry = _cache_expiry.get(cache_key)
                if expiry and datetime.now() < expiry:
                    return _cache[cache_key]
            
            # Call function and cache result
            result = await func(*args, **kwargs)
            _cache[cache_key] = result
            _cache_expiry[cache_key] = datetime.now() + timedelta(seconds=ttl_seconds)
            
            return result
        
        return wrapper
    return decorator


def clear_cache():
    """Clear all cached data"""
    _cache.clear()
    _cache_expiry.clear()


def get_cache_stats() -> dict:
    """Get cache statistics"""
    now = datetime.now()
    valid_entries = sum(
        1 for k, v in _cache_expiry.items() 
        if v and v > now
    )
    return {
        "total_entries": len(_cache),
        "valid_entries": valid_entries,
        "expired_entries": len(_cache) - valid_entries
    }
