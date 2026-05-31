"""Deterministic baseline engines that provide stable APIs for production ML adapters."""
from dataclasses import dataclass
from math import exp
import networkx as nx
from .models import Prediction, RouteOption, RouteRequest, SignalRecommendation

@dataclass(frozen=True)
class Segment:
    source: str
    target: str
    distance: float
    traffic: float
    carbon: float

SEGMENTS = [
    Segment("Rani Kamlapati Station", "Board Office Sq.", 2.1, .42, .20),
    Segment("Board Office Sq.", "Polytechnic Sq.", 2.4, .34, .23),
    Segment("Polytechnic Sq.", "VIP Road", 2.0, .21, .16), Segment("VIP Road", "Raja Bhoj Airport", 2.1, .18, .18),
    Segment("Board Office Sq.", "New Market", 1.6, .78, .25), Segment("New Market", "Peer Gate", 2.0, .73, .28),
    Segment("Peer Gate", "Raja Bhoj Airport", 3.2, .66, .35), Segment("Rani Kamlapati Station", "Roshanpura Sq.", 2.5, .30, .15),
    Segment("Roshanpura Sq.", "Lake View Rd", 2.8, .22, .14), Segment("Lake View Rd", "Raja Bhoj Airport", 3.8, .25, .21),
]

def _graph(preference: str, emergency: bool, forecast_minutes: int) -> nx.Graph:
    graph = nx.Graph()
    for segment in SEGMENTS:
        traffic = segment.traffic * (1 + forecast_minutes / 180)
        if emergency: traffic *= .35
        if preference == "shortest": weight = segment.distance
        elif preference == "eco": weight = segment.distance * (1 + segment.carbon * 2 + traffic * .25)
        else: weight = segment.distance * (1 + traffic * 1.8)
        graph.add_edge(segment.source, segment.target, weight=weight, distance=segment.distance, traffic=traffic, carbon=segment.carbon)
    return graph

def optimize_route(request: RouteRequest) -> RouteOption:
    graph = _graph(request.preference, request.emergency, request.forecast_minutes)
    path = nx.astar_path(graph, request.origin, request.destination, weight="weight")
    edges = [graph[path[i]][path[i + 1]] for i in range(len(path) - 1)]
    distance = sum(edge["distance"] for edge in edges)
    risk = sum(edge["traffic"] for edge in edges) / len(edges)
    eta = round(distance / 0.52 * (1 + risk * 1.2))
    carbon = sum(edge["carbon"] for edge in edges)
    return RouteOption(id=request.preference, label=f"{request.preference.title()} route", via=" · ".join(path[1:-1]), eta_minutes=eta,
                       distance_km=round(distance, 1), congestion_risk=round(risk, 2), fuel_liters=round(distance * .075 * (1 + risk), 2),
                       carbon_kg=round(carbon, 2), path=path)

def predict_congestion(junction_id: str, horizon: int, density: float) -> Prediction:
    projected = min(.99, density * (1 + horizon / 140) + .04)
    probability = 1 / (1 + exp(-9 * (projected - .56)))
    return Prediction(junction_id=junction_id, horizon_minutes=horizon, congestion_probability=round(probability, 3),
                      predicted_density=round(projected, 3), expected_delay_minutes=round(projected * horizon * .32, 1), confidence=.94)

def recommend_signal(junction_id: str, queue_length_meters: float, current_cycle_seconds: int) -> SignalRecommendation:
    extension = min(22, max(0, round((queue_length_meters - 35) / 4)))
    return SignalRecommendation(junction_id=junction_id, current_cycle_seconds=current_cycle_seconds,
      recommended_cycle_seconds=current_cycle_seconds + extension, green_extension_seconds=extension,
      estimated_queue_reduction_percent=round(min(28, extension * 1.15), 1), reason="Adaptive green extension based on predicted arrival volume")
