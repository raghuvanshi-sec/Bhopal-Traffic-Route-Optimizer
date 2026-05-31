from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)
def test_health(): assert client.get('/health').status_code == 200
def test_route_optimizer_prefers_vip_road():
    response = client.post('/api/v1/routes/optimize', json={'origin':'Rani Kamlapati Station','destination':'Raja Bhoj Airport','preference':'fastest'})
    assert response.status_code == 200
    assert 'VIP Road' in response.json()['path']
def test_prediction_returns_probability():
    data = client.post('/api/v1/predictions/congestion', json={'junction_id':'board-office','current_density':.72}).json()
    assert 0 <= data['congestion_probability'] <= 1
def test_signal_recommends_extension():
    data = client.get('/api/v1/signals/board-office/recommendation?queue_length_meters=84').json()
    assert data['green_extension_seconds'] > 0
