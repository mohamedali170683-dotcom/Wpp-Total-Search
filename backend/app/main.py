"""
Wpp-Total-Search - Cross-Platform Search Intelligence API

Main FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import keywords, opportunities, brand_audit

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    Cross-Platform Search Intelligence Tool
    
    Analyze keyword opportunities across Google, TikTok, YouTube, Instagram, 
    Amazon, and more. Identify platform gaps and audit brand coverage.
    
    ## Features
    
    * **Keyword Research** - Get search volume across 13+ platforms
    * **Opportunity Analysis** - Find platform gaps and arbitrage opportunities  
    * **Brand Audit** - Compare keyword demand vs ad coverage
    
    ## Data Sources
    
    * KeywordTool.io API (keyword data)
    * Meta Ad Library API (Facebook/Instagram ads)
    * TikTok Commercial Content API (TikTok ads)
    * Google Ads Transparency Center (Google ads)
    """,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    keywords.router, 
    prefix="/api/keywords", 
    tags=["Keywords"]
)
app.include_router(
    opportunities.router, 
    prefix="/api/opportunities", 
    tags=["Opportunities"]
)
app.include_router(
    brand_audit.router, 
    prefix="/api/brand-audit", 
    tags=["Brand Audit"]
)


@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint - API information
    """
    return {
        "name": settings.APP_NAME,
        "version": "0.1.0",
        "description": "Cross-Platform Search Intelligence API",
        "demo_mode": settings.USE_DEMO_DATA,
        "docs": "/docs",
        "endpoints": {
            "keywords": "/api/keywords",
            "opportunities": "/api/opportunities",
            "brand_audit": "/api/brand-audit"
        }
    }


@app.get("/health", tags=["Health"])
async def health():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "demo_mode": settings.USE_DEMO_DATA,
        "services": {
            "keywordtool": "demo" if settings.USE_DEMO_DATA else ("configured" if settings.KEYWORDTOOL_API_KEY else "not_configured"),
            "meta_ads": "demo" if settings.USE_DEMO_DATA else ("configured" if settings.META_ACCESS_TOKEN else "not_configured"),
            "tiktok_ads": "demo" if settings.USE_DEMO_DATA else ("configured" if settings.TIKTOK_ACCESS_TOKEN else "not_configured"),
            "google_ads": "demo" if settings.USE_DEMO_DATA else ("configured" if settings.SEARCHAPI_KEY else "scraper")
        }
    }


@app.get("/config", tags=["Config"])
async def get_config():
    """
    Get current configuration (non-sensitive)
    """
    return {
        "app_name": settings.APP_NAME,
        "debug": settings.DEBUG,
        "demo_mode": settings.USE_DEMO_DATA,
        "api_configured": {
            "keywordtool": bool(settings.KEYWORDTOOL_API_KEY),
            "meta": bool(settings.META_ACCESS_TOKEN),
            "tiktok": bool(settings.TIKTOK_ACCESS_TOKEN),
            "searchapi": bool(settings.SEARCHAPI_KEY)
        }
    }


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )


# Startup event
@app.on_event("startup")
async def startup_event():
    """Application startup"""
    print(f"Starting {settings.APP_NAME}...")
    print(f"Demo mode: {settings.USE_DEMO_DATA}")
    print(f"Debug mode: {settings.DEBUG}")
    print("API docs available at /docs")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown"""
    print(f"Shutting down {settings.APP_NAME}...")
