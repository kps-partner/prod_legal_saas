from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.modules.auth.services import get_current_user
from app.modules.cases.services import (
    get_cases_for_firm,
    update_case_status,
    get_case_by_id
)
from app.modules.cases.schemas import (
    CasesListResponse,
    CaseResponse,
    CaseUpdateRequest
)

router = APIRouter()


@router.get("", response_model=CasesListResponse)
def get_cases(
    include_archived: bool = Query(False, description="Include archived cases in the response"),
    current_user=Depends(get_current_user)
):
    """Get all cases for the current user's firm."""
    try:
        return get_cases_for_firm(current_user.firm_id, include_archived=include_archived)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving cases: {str(e)}")


@router.get("/archived", response_model=CasesListResponse)
def get_archived_cases(current_user=Depends(get_current_user)):
    """Get only archived cases for the current user's firm."""
    try:
        return get_cases_for_firm(current_user.firm_id, include_archived=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving archived cases: {str(e)}")


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(case_id: str, current_user=Depends(get_current_user)):
    """Get a specific case by ID."""
    try:
        case = get_case_by_id(case_id, current_user.firm_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        return case
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving case: {str(e)}")


@router.put("/{case_id}/status", response_model=CaseResponse)
def update_case_status_endpoint(
    case_id: str,
    update_request: CaseUpdateRequest,
    current_user=Depends(get_current_user)
):
    """Update the status of a case."""
    try:
        updated_case = update_case_status(case_id, update_request.status, current_user.firm_id)
        if not updated_case:
            raise HTTPException(status_code=404, detail="Case not found or could not be updated")
        return updated_case
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating case status: {str(e)}")