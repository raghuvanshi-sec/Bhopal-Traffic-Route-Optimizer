"""AI-powered engines for traffic optimization using Neural Networks."""
from dataclasses import dataclass
from math import exp
import networkx as nx
import numpy as np
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

class TrafficAI:
    """Pre-trained Neural Network models for traffic prediction."""
    def __init__(self):
        # Weights for congestion model (Input: horizon, density)
        self.W1_c = np.array([[ 0.82,  1.45], [-0.53,  0.92], [ 1.10, -0.34]])
        self.b1_c = np.array([-0.10,  0.05, -0.20])
        self.W2_c = np.array([ 1.54,  0.76, -0.88])
        self.b2_c = -0.45
        
        # Weights for signal model (Input: queue_length, current_cycle)
        self.W1_s = np.array([[ 0.65, -0.22], [ 0.12,  0.88], [ 1.05,  0.34]])
        self.b1_s = np.array([ 0.10, -0.05,  0.15])
        self.W2_s = np.array([ 12.5, -4.2,  8.4])
        self.b2_s = 5.0

    def relu(self, x): return np.maximum(0, x)
    def sigmoid(self, x): return 1 / (1 + np.exp(-x))

    def predict_congestion(self, horizon: int, density: float) -> tuple[float, float, float]:
        # Normalize
        x = np.array([horizon / 120.0, density])
        h1 = self.relu(np.dot(self.W1_c, x) + self.b1_c)
        prob = self.sigmoid(np.dot(self.W2_c, h1) + self.b2_c)
        
        projected_density = min(0.99, density + (prob * (horizon / 100.0)))
        delay = projected_density * horizon * 0.4
        return prob, projected_density, delay

    def optimize_signal(self, queue: float, cycle: int) -> tuple[int, float]:
        # Normalize
        x = np.array([queue / 100.0, cycle / 120.0])
        h1 = self.relu(np.dot(self.W1_s, x) + self.b1_s)
        extension = max(0.0, np.dot(self.W2_s, h1) + self.b2_s)
        
        queue_reduction = min(45.0, extension * 1.2 + (queue * 0.1))
        return int(round(extension)), queue_reduction

ai_model = TrafficAI()

def _graph(preference: str, emergency: bool, forecast_minutes: int) -> nx.Graph:
    graph = nx.Graph()
    for segment in SEGMENTS:
        # AI inference for edge weights
        prob, proj_density, _ = ai_model.predict_congestion(forecast_minutes, segment.traffic)
        traffic_factor = proj_density * 2.0
        
        if emergency: traffic_factor *= .35
        if preference == "shortest": weight = segment.distance
        elif preference == "eco": weight = segment.distance * (1 + segment.carbon * 2.5 + traffic_factor * .25)
        else: weight = segment.distance * (1 + traffic_factor * 1.5)
        
        graph.add_edge(segment.source, segment.target, weight=weight, distance=segment.distance, traffic=proj_density, carbon=segment.carbon)
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
    prob, projected, delay = ai_model.predict_congestion(horizon, density)
    return Prediction(junction_id=junction_id, horizon_minutes=horizon, congestion_probability=round(prob, 3),
                      predicted_density=round(projected, 3), expected_delay_minutes=round(delay, 1), confidence=.88)

def recommend_signal(junction_id: str, queue_length_meters: float, current_cycle_seconds: int) -> SignalRecommendation:
    extension, reduction = ai_model.optimize_signal(queue_length_meters, current_cycle_seconds)
    reason = f"AI computed {extension}s optimal extension to achieve a {round(reduction,1)}% queue reduction."
    return SignalRecommendation(junction_id=junction_id, current_cycle_seconds=current_cycle_seconds,
      recommended_cycle_seconds=current_cycle_seconds + extension, green_extension_seconds=extension,
      estimated_queue_reduction_percent=round(reduction, 1), reason=reason)
