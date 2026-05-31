from typing import Literal
from pydantic import BaseModel, Field

class Coordinate(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)

class RouteRequest(BaseModel):
    origin: str
    destination: str
    preference: Literal["fastest", "shortest", "eco"] = "fastest"
    forecast_minutes: int = Field(0, ge=0, le=60)
    emergency: bool = False

class RouteOption(BaseModel):
    id: str
    label: str
    via: str
    eta_minutes: int
    distance_km: float
    congestion_risk: float
    fuel_liters: float
    carbon_kg: float
    path: list[str]

class PredictionRequest(BaseModel):
    junction_id: str
    horizon_minutes: int = Field(15, ge=5, le=120)
    current_density: float = Field(..., ge=0, le=1)

class Prediction(BaseModel):
    junction_id: str
    horizon_minutes: int
    congestion_probability: float
    predicted_density: float
    expected_delay_minutes: float
    confidence: float

class SignalRecommendation(BaseModel):
    junction_id: str
    current_cycle_seconds: int
    recommended_cycle_seconds: int
    green_extension_seconds: int
    estimated_queue_reduction_percent: float
    reason: str
