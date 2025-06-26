from typing import List, Optional, Dict, Any
from bson import ObjectId
from datetime import datetime
from app.core.db import db
from app.shared.models import CaseStatus
from app.modules.cases.schemas import CaseResponse, CasesListResponse


def get_cases_for_firm(firm_id: str, include_archived: bool = False) -> CasesListResponse:
    """Get all cases for a firm, optionally including archived cases."""
    try:
        # Build query filter
        query_filter = {"firm_id": firm_id}
        if not include_archived:
            query_filter["status"] = {"$ne": CaseStatus.ARCHIVED.value}
        
        # Get cases sorted by created_at (oldest first as requested)
        cases_cursor = db.cases.find(query_filter).sort("created_at", 1)
        cases_list = list(cases_cursor)
        
        # Get case type names for each case
        case_type_ids = list(set(case.get("case_type_id") for case in cases_list if case.get("case_type_id")))
        case_types = {}
        if case_type_ids:
            case_types_cursor = db.case_types.find({"_id": {"$in": [ObjectId(ct_id) for ct_id in case_type_ids]}})
            case_types = {str(ct["_id"]): ct["name"] for ct in case_types_cursor}
        
        # Convert to response format
        case_responses = []
        for case in cases_list:
            case_response = CaseResponse(
                id=str(case["_id"]),
                client_name=case["client_name"],
                client_email=case["client_email"],
                client_phone=case["client_phone"],
                description=case["description"],
                case_type_id=case["case_type_id"],
                case_type_name=case_types.get(case["case_type_id"], "Unknown"),
                status=case["status"],
                priority=case.get("priority"),
                firm_id=case["firm_id"],
                created_at=case["created_at"],
                updated_at=case["updated_at"],
                last_activity=case.get("last_activity")
            )
            case_responses.append(case_response)
        
        # Calculate statistics by status
        status_counts = {}
        for case in cases_list:
            status = case["status"]
            status_counts[status] = status_counts.get(status, 0) + 1
        
        return CasesListResponse(
            cases=case_responses,
            total=len(case_responses),
            by_status=status_counts
        )
        
    except Exception as e:
        print(f"Error getting cases for firm {firm_id}: {e}")
        return CasesListResponse(cases=[], total=0, by_status={})


def update_case_status(case_id: str, new_status: CaseStatus, firm_id: str) -> Optional[CaseResponse]:
    """Update the status of a case."""
    try:
        # Verify the case belongs to the firm
        case = db.cases.find_one({
            "_id": ObjectId(case_id),
            "firm_id": firm_id
        })
        
        if not case:
            return None
        
        # Update the case status
        update_result = db.cases.update_one(
            {"_id": ObjectId(case_id)},
            {
                "$set": {
                    "status": new_status.value,
                    "updated_at": datetime.utcnow(),
                    "last_activity": datetime.utcnow()
                }
            }
        )
        
        if update_result.modified_count == 0:
            return None
        
        # Get the updated case
        updated_case = db.cases.find_one({"_id": ObjectId(case_id)})
        
        # Get case type name
        case_type_name = "Unknown"
        if updated_case.get("case_type_id"):
            case_type = db.case_types.find_one({"_id": ObjectId(updated_case["case_type_id"])})
            if case_type:
                case_type_name = case_type["name"]
        
        return CaseResponse(
            id=str(updated_case["_id"]),
            client_name=updated_case["client_name"],
            client_email=updated_case["client_email"],
            client_phone=updated_case["client_phone"],
            description=updated_case["description"],
            case_type_id=updated_case["case_type_id"],
            case_type_name=case_type_name,
            status=updated_case["status"],
            priority=updated_case.get("priority"),
            firm_id=updated_case["firm_id"],
            created_at=updated_case["created_at"],
            updated_at=updated_case["updated_at"],
            last_activity=updated_case.get("last_activity")
        )
        
    except Exception as e:
        print(f"Error updating case {case_id}: {e}")
        return None


def get_case_by_id(case_id: str, firm_id: str) -> Optional[CaseResponse]:
    """Get a single case by ID."""
    try:
        case = db.cases.find_one({
            "_id": ObjectId(case_id),
            "firm_id": firm_id
        })
        
        if not case:
            return None
        
        # Get case type name
        case_type_name = "Unknown"
        if case.get("case_type_id"):
            case_type = db.case_types.find_one({"_id": ObjectId(case["case_type_id"])})
            if case_type:
                case_type_name = case_type["name"]
        
        return CaseResponse(
            id=str(case["_id"]),
            client_name=case["client_name"],
            client_email=case["client_email"],
            client_phone=case["client_phone"],
            description=case["description"],
            case_type_id=case["case_type_id"],
            case_type_name=case_type_name,
            status=case["status"],
            priority=case.get("priority"),
            firm_id=case["firm_id"],
            created_at=case["created_at"],
            updated_at=case["updated_at"],
            last_activity=case.get("last_activity")
        )
        
    except Exception as e:
        print(f"Error getting case {case_id}: {e}")
        return None