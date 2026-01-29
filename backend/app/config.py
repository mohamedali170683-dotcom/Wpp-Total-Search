"""
Configuration management for Wpp-Total-Search
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # App settings
    APP_NAME: str = "Wpp-Total-Search"
    DEBUG: bool = True
    USE_DEMO_DATA: bool = True
    
    # KeywordTool.io API
    KEYWORDTOOL_API_KEY: Optional[str] = None
    KEYWORDTOOL_BASE_URL: str = "https://api.keywordtool.io/v2"
    KEYWORDTOOL_RATE_LIMIT: int = 5  # requests per minute
    
    # Meta Ad Library
    META_APP_ID: Optional[str] = None
    META_APP_SECRET: Optional[str] = None
    META_ACCESS_TOKEN: Optional[str] = None
    
    # TikTok Commercial Content API
    TIKTOK_CLIENT_KEY: Optional[str] = None
    TIKTOK_CLIENT_SECRET: Optional[str] = None
    TIKTOK_ACCESS_TOKEN: Optional[str] = None
    
    # Alternative API wrappers
    SERPAPI_KEY: Optional[str] = None
    SEARCHAPI_KEY: Optional[str] = None
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()
