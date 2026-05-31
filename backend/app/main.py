from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .engine import optimize_route, predict_congestion, recommend_signal
from .models import Prediction, PredictionRequest, RouteOption, RouteRequest, SignalRecommendation

app = FastAPI(title="Flow Bhopal Traffic Intelligence API", version="1.0.0", description="Real-time route, congestion, and adaptive signal intelligence for Bhopal.")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health() -> dict[str, str]: return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/api/v1/city/metrics")
def city_metrics() -> dict:
    return {"traffic_score": 82, "active_vehicles": 48291, "congestion_index": .24, "average_travel_minutes": 18.4, "co2_avoided_tons": 2.8, "optimized_junctions": 18}

@app.post("/api/v1/routes/optimize", response_model=RouteOption)
def route(request: RouteRequest) -> RouteOption:
    try: return optimize_route(request)
    except Exception as exc: raise HTTPException(status_code=422, detail=f"Unable to calculate route: {exc}") from exc

@app.post("/api/v1/predictions/congestion", response_model=Prediction)
def prediction(request: PredictionRequest) -> Prediction: return predict_congestion(request.junction_id, request.horizon_minutes, request.current_density)

@app.get("/api/v1/signals/{junction_id}/recommendation", response_model=SignalRecommendation)
def signal_recommendation(junction_id: str, queue_length_meters: float = 62, current_cycle_seconds: int = 90) -> SignalRecommendation:
    return recommend_signal(junction_id, queue_length_meters, current_cycle_seconds)
