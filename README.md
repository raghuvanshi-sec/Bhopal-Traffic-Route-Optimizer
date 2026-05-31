# Flow Bhopal

**Flow Bhopal** is a premium urban mobility intelligence platform: a digital nervous system for Bhopal's road network. It combines a responsive city operations experience with AI-ready routing, predictive congestion intelligence, adaptive signal recommendations, emergency corridor foundations, and spatial time-series storage.

## Product experience

- Full-screen live traffic map with animated vehicles, traffic-coded corridors, congestion hotspots, forecast controls, and multiple route overlays.
- AI route planner for fastest, shortest, and eco-conscious journeys with transparent time, risk, fuel, and carbon metrics.
- Emergency-response mode, green-corridor styling, predictive congestion analytics, smart signal recommendations, and citizen impact storytelling.
- Responsive layouts for desktop, tablet, and mobile with keyboard-friendly controls and semantic labels.

## Architecture

```text
Next.js control surface -> FastAPI intelligence API -> PostgreSQL + PostGIS + TimescaleDB
                                           |-> A* weighted routing baseline
                                           |-> XGBoost / LSTM prediction adapter boundary
                                           |-> RL adaptive signal policy boundary
```

The included baseline intelligence engine is deterministic and testable. Its stable API contracts are ready for a production feature pipeline and model registry integration.

## Quick start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://localhost:8000/docs for the OpenAPI explorer. See [`docs/API.md`](docs/API.md) for endpoint details.

### Full stack

```bash
docker compose up --build
```

## Production deployment

- Build the two Docker images and publish them to the registry referenced by `infrastructure/k8s/platform.yaml`.
- Provision a managed PostgreSQL cluster with PostGIS and TimescaleDB, then apply `database/schema.sql`.
- Apply Kubernetes manifests with `kubectl apply -f infrastructure/k8s/platform.yaml`.
- Replace permissive CORS with the production web origin and inject the database connection string from a Kubernetes secret.

## Roadmap to city-scale operations

1. Stream AVL, camera, loop-detector, and incident feeds through Kafka.
2. Train short-horizon XGBoost and temporal LSTM models from `traffic_observations` hypertables.
3. Validate reinforcement-learning signal recommendations in simulation before controlled junction rollout.
4. Use vector tiles and WebSockets for dense road layers and sub-second map updates.
5. Add identity-aware operational roles, audit trails, observability, and SLO dashboards.
