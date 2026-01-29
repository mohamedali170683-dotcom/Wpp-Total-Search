"""
API routers for Wpp-Total-Search
"""
from app.routers.keywords import router as keywords_router
from app.routers.opportunities import router as opportunities_router
from app.routers.brand_audit import router as brand_audit_router

__all__ = [
    "keywords_router",
    "opportunities_router", 
    "brand_audit_router",
]
