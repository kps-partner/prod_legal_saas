from datetime import datetime, timedelta
from app.core.db import db
from app.shared.models import CaseStatus
from app.modules.analytics.schemas import AnalyticsResponse, KPIData, ChartDataPoint

def get_analytics_for_firm(firm_id: str, time_period: str) -> AnalyticsResponse:
    """
    Get analytics for a firm for a given time period.
    """
    end_date = datetime.utcnow()
    if time_period == "last_7_days":
        start_date = end_date - timedelta(days=7)
    elif time_period == "last_30_days":
        start_date = end_date - timedelta(days=30)
    elif time_period == "this_quarter":
        start_of_quarter = datetime(end_date.year, 3 * ((end_date.month - 1) // 3) + 1, 1)
        start_date = start_of_quarter
    else: # all_time
        start_date = None

    # KPI Calculations
    new_leads = _get_new_leads(firm_id, start_date, end_date)
    consultations = _get_consultations(firm_id, start_date, end_date)
    engaged_clients = _get_engaged_clients(firm_id, start_date, end_date)
    avg_engage_time = _get_avg_engage_time(firm_id, start_date, end_date)
    engage_rate = (engaged_clients / new_leads) * 100 if new_leads > 0 else 0
    consult_rate = _get_consult_rate(firm_id, start_date, end_date)
    avg_close_time = _get_avg_close_time(firm_id, start_date, end_date)

    kpis = KPIData(
        newLeads={"value": new_leads, "description": "Total leads this period"},
        consultations={"value": consultations, "description": "Scheduled meetings"},
        engagedClients={"value": engaged_clients, "description": "Signed clients"},
        avgEngageTime={"value": f"{avg_engage_time:.1f} days", "description": "To engage clients"},
        engageRate={"value": f"{engage_rate:.0f}%", "description": "Conversion to signed"},
        consultRate={"value": f"{consult_rate:.0f}%", "description": "Show rate for meetings"},
        avgCloseTime={"value": f"{avg_close_time:.1f} days", "description": "To close cases"},
    )

    # Chart Data
    chart_data = _get_signed_clients_chart_data(firm_id, start_date, end_date)

    return AnalyticsResponse(kpis=kpis, chartData=chart_data)

def _get_new_leads(firm_id: str, start_date: datetime, end_date: datetime) -> int:
    query = {
        "firm_id": firm_id,
        "status": CaseStatus.NEW_LEAD.value,
    }
    if start_date:
        query["created_at"] = {"$gte": start_date, "$lt": end_date}
    return db.cases.count_documents(query)

def _get_consultations(firm_id: str, start_date: datetime, end_date: datetime) -> int:
    query = {
        "firm_id": firm_id,
        "status": CaseStatus.MEETING_SCHEDULED.value,
    }
    if start_date:
        query["created_at"] = {"$gte": start_date, "$lt": end_date}
    return db.cases.count_documents(query)

def _get_engaged_clients(firm_id: str, start_date: datetime, end_date: datetime) -> int:
    query = {
        "firm_id": firm_id,
        "status": CaseStatus.ENGAGED.value,
    }
    if start_date:
        query["created_at"] = {"$gte": start_date, "$lt": end_date}
    return db.cases.count_documents(query)

def _get_avg_engage_time(firm_id: str, start_date: datetime, end_date: datetime) -> float:
    # For simplicity, we'll calculate this based on the created_at and updated_at fields
    # A more accurate approach would be to use the timeline events
    query = {
        "firm_id": firm_id,
        "status": CaseStatus.ENGAGED.value,
    }
    if start_date:
        query["created_at"] = {"$gte": start_date, "$lt": end_date}
    
    total_time = 0
    count = 0
    for case in db.cases.find(query):
        time_diff = case["updated_at"] - case["created_at"]
        total_time += time_diff.days
        count += 1
    
    return total_time / count if count > 0 else 0

def _get_consult_rate(firm_id: str, start_date: datetime, end_date: datetime) -> float:
    consultations_query = {
        "firm_id": firm_id,
        "status": CaseStatus.MEETING_SCHEDULED.value,
    }
    if start_date:
        consultations_query["created_at"] = {"$gte": start_date, "$lt": end_date}
    
    scheduled_consultations = list(db.cases.find(consultations_query))
    if not scheduled_consultations:
        return 0

    completed_consultations = 0
    for case in scheduled_consultations:
        if db.timeline_events.count_documents({"case_id": str(case["_id"]), "type": "ai_insights"}) > 0:
            completed_consultations += 1
            
    return (completed_consultations / len(scheduled_consultations)) * 100

def _get_avg_close_time(firm_id: str, start_date: datetime, end_date: datetime) -> float:
    # For simplicity, we'll calculate this based on the created_at and updated_at fields
    # A more accurate approach would be to use the timeline events
    query = {
        "firm_id": firm_id,
        "status": CaseStatus.CLOSED.value,
    }
    if start_date:
        query["created_at"] = {"$gte": start_date, "$lt": end_date}
        
    total_time = 0
    count = 0
    for case in db.cases.find(query):
        time_diff = case["updated_at"] - case["created_at"]
        total_time += time_diff.days
        count += 1
        
    return total_time / count if count > 0 else 0

def _get_signed_clients_chart_data(firm_id: str, start_date: datetime, end_date: datetime) -> list[ChartDataPoint]:
    if not start_date:
        start_date = datetime.min
        
    pipeline = [
        {"$match": {
            "firm_id": firm_id,
            "status": CaseStatus.ENGAGED.value,
            "created_at": {"$gte": start_date, "$lt": end_date}
        }},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "signedClients": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    results = list(db.cases.aggregate(pipeline))
    
    chart_data = []
    for result in results:
        chart_data.append(ChartDataPoint(
            date=result["_id"],
            signedClients=result["signedClients"],
            displayDate=datetime.strptime(result["_id"], "%Y-%m-%d").strftime("%b %d")
        ))
        
    return chart_data