# Flow Bhopal API

FastAPI publishes an interactive OpenAPI explorer at `/docs` and the machine-readable schema at `/openapi.json`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Kubernetes liveness and readiness check. |
| `GET` | `/api/v1/city/metrics` | Current city mobility KPIs. |
| `POST` | `/api/v1/routes/optimize` | Dynamic A* routing with fastest, shortest, eco, forecast, and emergency weights. |
| `POST` | `/api/v1/predictions/congestion` | Baseline congestion probability, density, and delay forecast. |
| `GET` | `/api/v1/signals/{junction_id}/recommendation` | Adaptive traffic signal recommendation. |

## Example route request

```json
{
  "origin": "Rani Kamlapati Station",
  "destination": "Raja Bhoj Airport",
  "preference": "fastest",
  "forecast_minutes": 15,
  "emergency": false
}
```

## Production model integration

The deterministic `engine.py` baseline makes the service immediately runnable and testable. A production deployment should place feature ingestion in front of the same API contracts: Timescale/PostGIS observations feed an XGBoost short-horizon model, an LSTM temporal model, and a reinforcement-learning signal policy. Version models in a registry and progressively roll them out behind the stable response schemas.
