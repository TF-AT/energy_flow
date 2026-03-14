"""Health check router."""

from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "EnergyFlow Energy Engine",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
