from fastapi import APIRouter, Depends, HTTPException
from app.modules.auth.services import get_current_user
from app.modules.timeline.services import (
    create_timeline_event,
    get_timeline_events_with_user_info
)
from app.modules.timeline.schemas import (
    TimelineEventCreate,
    TimelineEventResponse,
    TimelineResponse
)

router = APIRouter()


@router.post("/{case_id}/timeline", response_model=TimelineEventResponse)
def add_manual_note(
    case_id: str,
    note_data: TimelineEventCreate,
    current_user=Depends(get_current_user)
):
    """Add a manual note to a case's timeline."""
    try:
        # Create the timeline event
        event_id = create_timeline_event(
            case_id=case_id,
            firm_id=current_user.firm_id,
            event_type="note",
            content=note_data.content,
            user_id=current_user.email  # Using email as user identifier
        )
        
        if not event_id:
            raise HTTPException(status_code=404, detail="Case not found or access denied")
        
        # Get the created event with user info
        timeline_events = get_timeline_events_with_user_info(case_id, current_user.firm_id)
        
        # Find the newly created event
        created_event = None
        for event in timeline_events:
            if event["id"] == event_id:
                created_event = event
                break
        
        if not created_event:
            raise HTTPException(status_code=500, detail="Failed to retrieve created note")
        
        return TimelineEventResponse(
            id=created_event["id"],
            case_id=created_event["case_id"],
            firm_id=created_event["firm_id"],
            user_id=created_event["user_id"],
            user_name=created_event["user_name"],
            type=created_event["type"],
            content=created_event["content"],
            created_at=created_event["created_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding note: {str(e)}")


@router.get("/{case_id}/timeline", response_model=TimelineResponse)
def get_case_timeline(
    case_id: str,
    current_user=Depends(get_current_user)
):
    """Get the full timeline for a case."""
    try:
        # Get timeline events with user information
        timeline_events = get_timeline_events_with_user_info(case_id, current_user.firm_id)
        
        # Convert to response format
        event_responses = []
        for event in timeline_events:
            event_response = TimelineEventResponse(
                id=event["id"],
                case_id=event["case_id"],
                firm_id=event["firm_id"],
                user_id=event["user_id"],
                user_name=event["user_name"],
                type=event["type"],
                content=event["content"],
                created_at=event["created_at"]
            )
            event_responses.append(event_response)
        
        return TimelineResponse(
            case_id=case_id,
            events=event_responses,
            total=len(event_responses)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving timeline: {str(e)}")