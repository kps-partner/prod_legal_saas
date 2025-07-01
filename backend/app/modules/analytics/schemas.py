from pydantic import BaseModel
from typing import List

class KPIData(BaseModel):
    newLeads: dict
    consultations: dict
    engagedClients: dict
    avgEngageTime: dict
    engageRate: dict
    consultRate: dict
    avgCloseTime: dict

class ChartDataPoint(BaseModel):
    date: str
    signedClients: int
    displayDate: str

class AnalyticsResponse(BaseModel):
    kpis: KPIData
    chartData: List[ChartDataPoint]