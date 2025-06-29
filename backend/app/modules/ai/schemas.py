"""Pydantic schemas for AI insights module."""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class AIInsightGenerateRequest(BaseModel):
    """Request schema for generating AI insights."""
    case_id: str = Field(..., description="Case ID to generate insights for")
    notes_text: str = Field(..., description="Combined notes text to analyze")


class AIInsightResponse(BaseModel):
    """Response schema for AI insights."""
    case_id: str
    summary: str
    recommendations: str
    recommendation_type: Literal["approve", "reject", "undecided"]
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    generated_at: datetime
    status: Literal["processing", "completed", "failed"]


class AIInsightTaskResponse(BaseModel):
    """Response schema for AI insight task initiation."""
    task_id: str
    case_id: str
    status: Literal["processing"]
    message: str


class AIInsightError(BaseModel):
    """Error response schema for AI insights."""
    error: str
    case_id: str
    details: Optional[str] = None