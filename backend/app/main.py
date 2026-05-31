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
def city_metrics(emergency: bool = False) -> dict:
    if emergency:
        return {
            "traffic_score": 94,
            "active_vehicles": 51240,
            "congestion_index": .48,
            "average_travel_minutes": 22.8,
            "co2_avoided_tons": 1.4,
            "optimized_junctions": 18,
            "fuel_saved_liters": 10500,
            "commuter_hours_saved": 850,
            "peak_hour_delay_reduction": 8
        }
    return {
        "traffic_score": 82,
        "active_vehicles": 48291,
        "congestion_index": .24,
        "average_travel_minutes": 18.4,
        "co2_avoided_tons": 2.8,
        "optimized_junctions": 18,
        "fuel_saved_liters": 14200,
        "commuter_hours_saved": 1248,
        "peak_hour_delay_reduction": 18
    }

@app.post("/api/v1/routes/optimize", response_model=RouteOption)
def route(request: RouteRequest) -> RouteOption:
    try: return optimize_route(request)
    except Exception as exc: raise HTTPException(status_code=422, detail=f"Unable to calculate route: {exc}") from exc

@app.post("/api/v1/predictions/congestion", response_model=Prediction)
def prediction(request: PredictionRequest) -> Prediction: return predict_congestion(request.junction_id, request.horizon_minutes, request.current_density)

@app.get("/api/v1/signals", response_model=list[dict])
def get_signals() -> list[dict]:
    return [
        {"name": "Board Office Sq.", "queue": 84, "status": "Optimize", "gain": "−18%", "tone": "red"},
        {"name": "Roshanpura Sq.", "queue": 62, "status": "Adaptive", "gain": "−12%", "tone": "amber"},
        {"name": "Lalghati Circle", "queue": 38, "status": "Balanced", "gain": "−6%", "tone": "green"},
        {"name": "Polytechnic Sq.", "queue": 55, "status": "Optimize", "gain": "−14%", "tone": "amber"},
        {"name": "VIP Road", "queue": 29, "status": "Balanced", "gain": "−5%", "tone": "green"},
        {"name": "New Market", "queue": 73, "status": "Optimize", "gain": "−22%", "tone": "red"},
        {"name": "Peer Gate", "queue": 68, "status": "Optimize", "gain": "−19%", "tone": "red"},
        {"name": "Rani Kamlapati Station", "queue": 45, "status": "Adaptive", "gain": "−10%", "tone": "amber"},
        {"name": "Lake View Rd", "queue": 22, "status": "Balanced", "gain": "−4%", "tone": "green"}
    ]

@app.get("/api/v1/predictions/congestion/daily", response_model=list[dict])
def daily_congestion(emergency: bool = False) -> list[dict]:
    factor = 1.35 if emergency else 1.0
    return [
        {"name": "08:00", "actual": int(42 * factor), "predicted": 38},
        {"name": "10:00", "actual": int(56 * factor), "predicted": 52},
        {"name": "12:00", "actual": int(44 * factor), "predicted": 49},
        {"name": "14:00", "actual": int(61 * factor), "predicted": 60},
        {"name": "16:00", "actual": int(74 * factor), "predicted": 70},
        {"name": "18:00", "actual": int(88 * factor), "predicted": 92},
        {"name": "20:00", "actual": int(66 * factor), "predicted": 70},
        {"name": "22:00", "actual": int(38 * factor), "predicted": 42}
    ]

@app.get("/api/v1/signals/{junction_id}/recommendation", response_model=SignalRecommendation)
def signal_recommendation(junction_id: str, queue_length_meters: float = 62, current_cycle_seconds: int = 90) -> SignalRecommendation:
    return recommend_signal(junction_id, queue_length_meters, current_cycle_seconds)

