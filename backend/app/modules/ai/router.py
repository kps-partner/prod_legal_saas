"""AI insights router for FastAPI."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
import logging

from app.modules.auth.services import get_current_user
from app.modules.ai.schemas import (
    AIInsightGenerateRequest,
    AIInsightResponse,
    AIInsightTaskResponse,
    AIInsightError
)
from app.modules.ai.tasks import generate_ai_insights
from app.core.db import get_database

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Insights"])


@router.post("/insights/generate", response_model=AIInsightTaskResponse)
async def generate_case_insights(
    case_id: str = Query(..., description="Case ID to generate insights for"),
    notes_text: str = Query(..., description="Combined text from selected notes"),
    current_user = Depends(get_current_user)
):
    """
    Generate AI insights for a case based on selected notes.
    
    This endpoint starts an asynchronous task to generate AI insights.
    Use the task_id to check the status and retrieve results.
    """
    try:
        # Validate case exists and user has access
        db = get_database()
        case = db.cases.find_one({
            "_id": ObjectId(case_id),
            "firm_id": current_user.firm_id
        })
        
        if not case:
            raise HTTPException(
                status_code=404,
                detail="Case not found or access denied"
            )
        
        # Validate notes_text is not empty
        if not notes_text or not notes_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Notes text cannot be empty"
            )
        
        # Start the Celery task
        task = generate_ai_insights.delay(
            case_id=case_id,
            notes_text=notes_text.strip(),
            firm_id=current_user.firm_id,
            user_id=current_user.id
        )
        
        logger.info(f"Started AI insights generation task {task.id} for case {case_id}")
        
        return AIInsightTaskResponse(
            task_id=task.id,
            status="processing",
            message="AI insights generation started",
            case_id=case_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting AI insights generation: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to start AI insights generation"
        )


@router.get("/insights/{case_id}", response_model=List[AIInsightResponse])
async def get_case_insights(
    case_id: str,
    limit: int = Query(10, ge=1, le=50, description="Maximum number of insights to return"),
    current_user = Depends(get_current_user)
):
    """
    Get AI insights for a specific case.
    
    Returns the most recent AI insights generated for the case.
    """
    try:
        # Validate case exists and user has access
        db = get_database()
        case = db.cases.find_one({
            "_id": ObjectId(case_id),
            "firm_id": current_user.firm_id
        })
        
        if not case:
            raise HTTPException(
                status_code=404,
                detail="Case not found or access denied"
            )
        
        # Find AI insights timeline events for this case
        insights_events = list(db.timeline_events.find({
            "case_id": case_id,
            "type": "ai_insights",  # Fixed: use 'type' instead of 'event_type'
            "firm_id": current_user.firm_id
        }).sort("created_at", -1).limit(limit))
        
        # Convert to response format
        insights = []
        for event in insights_events:
            metadata = event.get("metadata", {})
            
            insight = AIInsightResponse(
                case_id=case_id,
                summary=metadata.get("summary", ""),
                recommendations=metadata.get("recommendations", ""),
                recommendation_type=metadata.get("recommendation_type", "undecided"),
                confidence_score=metadata.get("confidence_score", 0.5),
                generated_at=event["created_at"],
                status="completed"
            )
            insights.append(insight)
        
        logger.info(f"Retrieved {len(insights)} AI insights for case {case_id}")
        return insights
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving AI insights for case {case_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve AI insights"
        )


@router.get("/insights/task/{task_id}")
async def get_task_status(
    task_id: str,
    current_user = Depends(get_current_user)
):
    """
    Get the status of an AI insights generation task.
    
    Returns the current status and result (if completed) of the task.
    """
    try:
        from app.celery_app import celery_app
        
        # Get task result
        task_result = celery_app.AsyncResult(task_id)
        
        if task_result.state == "PENDING":
            return {
                "task_id": task_id,
                "status": "pending",
                "message": "Task is waiting to be processed"
            }
        elif task_result.state == "PROGRESS":
            return {
                "task_id": task_id,
                "status": "processing",
                "message": "Task is being processed",
                "progress": task_result.info
            }
        elif task_result.state == "SUCCESS":
            result = task_result.result
            return {
                "task_id": task_id,
                "status": "completed",
                "message": "Task completed successfully",
                "result": result
            }
        elif task_result.state == "FAILURE":
            return {
                "task_id": task_id,
                "status": "failed",
                "message": "Task failed",
                "error": str(task_result.info)
            }
        else:
            return {
                "task_id": task_id,
                "status": task_result.state.lower(),
                "message": f"Task is in {task_result.state} state"
            }
            
    except Exception as e:
        logger.error(f"Error getting task status for {task_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get task status"
        )


@router.delete("/insights/{insight_id}")
async def delete_insight(
    insight_id: str,
    current_user = Depends(get_current_user)
):
    """
    Delete a specific AI insight.
    
    This removes the timeline event containing the AI insight.
    """
    try:
        db = get_database()
        
        # Find the insight timeline event
        insight_event = db.timeline_events.find_one({
            "_id": ObjectId(insight_id),
            "type": "ai_insights",  # Fixed: use 'type' instead of 'event_type'
            "firm_id": current_user.firm_id
        })
        
        if not insight_event:
            raise HTTPException(
                status_code=404,
                detail="AI insight not found or access denied"
            )
        
        # Delete the timeline event
        result = db.timeline_events.delete_one({
            "_id": ObjectId(insight_id)
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="AI insight not found"
            )
        
        logger.info(f"Deleted AI insight {insight_id}")
        return {
            "message": "AI insight deleted successfully",
            "insight_id": insight_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting AI insight {insight_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete AI insight"
        )


@router.post("/insights/{case_id}/refresh", response_model=AIInsightTaskResponse)
async def refresh_case_insights(
    case_id: str,
    request: AIInsightGenerateRequest,
    current_user = Depends(get_current_user)
):
    """
    Refresh AI insights for a case with new notes selection.
    
    This generates new AI insights based on the provided notes text.
    """
    try:
        # Validate case exists and user has access
        db = get_database()
        case = db.cases.find_one({
            "_id": ObjectId(case_id),
            "firm_id": current_user.firm_id
        })
        
        if not case:
            raise HTTPException(
                status_code=404,
                detail="Case not found or access denied"
            )
        
        # Validate notes_text is not empty
        if not request.notes_text or not request.notes_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Notes text cannot be empty"
            )
        
        # Start the Celery task
        task = generate_ai_insights.delay(
            case_id=case_id,
            notes_text=request.notes_text.strip(),
            firm_id=current_user.firm_id,
            user_id=current_user.id
        )
        
        logger.info(f"Started AI insights refresh task {task.id} for case {case_id}")
        
        return AIInsightTaskResponse(
            task_id=task.id,
            status="processing",
            message="AI insights refresh started",
            case_id=case_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error refreshing AI insights for case {case_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to refresh AI insights"
        )