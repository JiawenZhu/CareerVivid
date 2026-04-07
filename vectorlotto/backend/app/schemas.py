from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from datetime import datetime

class Ticket(BaseModel):
    wb: List[int] = Field(..., description="5 white balls from 1-70")
    mb: int = Field(..., description="1 mega ball from 1-25")
    strategy: Optional[str] = None
    source: Optional[str] = "ensemble"

class PredictionResponse(BaseModel):
    run_id: str
    target_draw_date: str
    predictions: List[Ticket]
    budget: int
    bankroll_at_pred: float
    ensemble_weights: Dict[str, Dict]

class DistributionValue(BaseModel):
    number: int
    probability: float

class DistributionResponse(BaseModel):
    wb_distribution: List[DistributionValue]
    mb_distribution: List[DistributionValue]
    last_updated: datetime

class SimulationRequest(BaseModel):
    tickets: List[Ticket]
    draw_count: int = 100 # Number of virtual draws to run against these tickets

class SimulationResult(BaseModel):
    total_spent: float
    total_won: float
    net_profit: float
    roi: float
    win_count: int
    draw_count: int
