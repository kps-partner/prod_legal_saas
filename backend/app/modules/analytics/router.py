from fastapi import APIRouter, Depends, HTTPException, Query
from app.modules.auth.services import get_current_user
from app.modules.analytics.services import get_analytics_for_firm
from app.modules.analytics.schemas import AnalyticsResponse

router = APIRouter()

@router.get("", response_model=AnalyticsResponse)
def get_analytics(
    time_period: str = Query("last_30_days", description="Time period for analytics"),
    current_user=Depends(get_current_user)
):
    """
    Get analytics for the current user's firm.
    """
    try:
        return get_analytics_for_firm(current_user.firm_id, time_period)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving analytics: {str(e)}")