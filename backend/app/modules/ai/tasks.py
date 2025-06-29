"""Celery tasks for AI insights generation."""

import asyncio
from datetime import datetime
from typing import Dict, Any
from bson import ObjectId
import logging

from app.celery_app import celery_app
from app.core.db import get_database
from app.modules.ai.services import AIService

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def generate_ai_insights(self, case_id: str, notes_text: str, firm_id: str, user_id: str) -> Dict[str, Any]:
    """
    Celery task to generate AI insights for a case.
    
    Args:
        case_id: The case ID to generate insights for
        notes_text: Combined text from selected case notes
        firm_id: The firm ID for the case
        user_id: The user requesting the insights
        
    Returns:
        Dictionary with task result information
    """
    try:
        logger.info(f"Starting AI insights generation for case {case_id}")
        
        # Validate case exists and user has access
        db = get_database()
        try:
            # First check if case exists
            case = db.cases.find_one({"_id": ObjectId(case_id)})
            if not case:
                raise ValueError(f"Case {case_id} not found")
            
            # Then check if user has access (firm_id might be string or ObjectId)
            case_firm_id = str(case.get("firm_id"))
            if case_firm_id != firm_id:
                raise ValueError(f"Case {case_id} access denied - firm mismatch")
                
        except Exception as e:
            if "ObjectId" in str(e) and "invalid" in str(e).lower():
                raise ValueError(f"Invalid case ID format: {case_id}")
            raise ValueError(f"Case {case_id} not found or access denied")
        
        # Initialize AI service and generate insights
        ai_service = AIService()
        
        # Run the async function in the event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            insights = loop.run_until_complete(ai_service.generate_case_insights(notes_text))
        finally:
            loop.close()
        
        # Create timeline event for the AI insights
        # Store AI insights data in a metadata field for easy retrieval
        timeline_event = {
            "case_id": case_id,
            "firm_id": firm_id,
            "user_id": user_id,
            "type": "ai_insights",  # Fixed: use 'type' instead of 'event_type'
            "content": f"AI Case Analysis: {insights['summary'][:100]}..." if len(insights['summary']) > 100 else f"AI Case Analysis: {insights['summary']}",
            "metadata": {
                "summary": insights["summary"],
                "recommendations": insights["recommendations"],
                "recommendation_type": insights["recommendation_type"],
                "confidence_score": insights["confidence_score"],
                "notes_analyzed": len(notes_text.split()),
                "generated_at": datetime.utcnow().isoformat()
            },
            "created_at": datetime.utcnow()
        }
        
        # Insert the timeline event
        result = db.timeline_events.insert_one(timeline_event)
        timeline_event_id = str(result.inserted_id)
        
        logger.info(f"AI insights generated successfully for case {case_id}, timeline event {timeline_event_id}")
        
        return {
            "success": True,
            "case_id": case_id,
            "timeline_event_id": timeline_event_id,
            "insights": insights,
            "message": "AI insights generated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error generating AI insights for case {case_id}: {e}")
        
        # Create error timeline event
        try:
            db = get_database()
            error_event = {
                "case_id": case_id,
                "firm_id": firm_id,
                "user_id": user_id,
                "type": "ai_error",  # Fixed: use 'type' instead of 'event_type'
                "content": f"AI Analysis Failed: {str(e)[:200]}",
                "created_at": datetime.utcnow()
            }
            db.timeline_events.insert_one(error_event)
        except Exception as db_error:
            logger.error(f"Failed to create error timeline event: {db_error}")
        
        # Retry the task if we haven't exceeded max retries
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying AI insights generation for case {case_id} (attempt {self.request.retries + 1})")
            raise self.retry(exc=e)
        
        # If we've exceeded max retries, return error result
        return {
            "success": False,
            "case_id": case_id,
            "error": str(e),
            "message": "AI insights generation failed after maximum retries"
        }


@celery_app.task
def cleanup_old_ai_insights(days_old: int = 30) -> Dict[str, Any]:
    """
    Cleanup old AI insights timeline events.
    
    Args:
        days_old: Number of days old to consider for cleanup
        
    Returns:
        Dictionary with cleanup results
    """
    try:
        from datetime import timedelta
        
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        db = get_database()
        
        # Find old AI insights events
        old_events = db.timeline_events.find({
            "type": {"$in": ["ai_insights", "ai_error"]},  # Fixed: use 'type' instead of 'event_type'
            "created_at": {"$lt": cutoff_date}
        })
        
        old_event_ids = [event["_id"] for event in old_events]
        
        if old_event_ids:
            # Delete old events
            result = db.timeline_events.delete_many({
                "_id": {"$in": old_event_ids}
            })
            
            logger.info(f"Cleaned up {result.deleted_count} old AI insights events")
            
            return {
                "success": True,
                "deleted_count": result.deleted_count,
                "cutoff_date": cutoff_date.isoformat(),
                "message": f"Cleaned up {result.deleted_count} old AI insights events"
            }
        else:
            logger.info("No old AI insights events found for cleanup")
            return {
                "success": True,
                "deleted_count": 0,
                "cutoff_date": cutoff_date.isoformat(),
                "message": "No old AI insights events found for cleanup"
            }
            
    except Exception as e:
        logger.error(f"Error during AI insights cleanup: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "AI insights cleanup failed"
        }