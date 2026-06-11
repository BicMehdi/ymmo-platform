"""Tests des endpoints de biens immobiliers."""


def _agent_token(client):
    client.post("/api/v1/auth/register", json={
        "email": "agent@test.fr", "password": "ymmo1234", "role": "agent",
    })
    return client.post("/api/v1/auth/login", json={
        "email": "agent@test.fr", "password": "ymmo1234",
    }).json()["access_token"]


def _client_token(client):
    client.post("/api/v1/auth/register", json={
        "email": "client@test.fr", "password": "ymmo1234", "role": "client",
    })
    return client.post("/api/v1/auth/login", json={
        "email": "client@test.fr", "password": "ymmo1234",
    }).json()["access_token"]


BIEN = {
    "title": "Appartement Test",
    "city": "Lyon",
    "price": 250000,
    "area_m2": 70,
    "property_type": "Appartement",
    "rooms": 3,
    "description": "Test",
}


def test_create_property_as_agent(client):
    token = _agent_token(client)
    resp = client.post("/api/v1/properties", json=BIEN,
                       headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Appartement Test"
    assert data["status"] == "published"


def test_create_property_as_client_forbidden(client):
    token = _client_token(client)
    resp = client.post("/api/v1/properties", json=BIEN,
                       headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


def test_list_properties(client):
    token = _agent_token(client)
    client.post("/api/v1/properties", json=BIEN,
                headers={"Authorization": f"Bearer {token}"})
    resp = client.get("/api/v1/properties")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_get_property_detail(client):
    token = _agent_token(client)
    create = client.post("/api/v1/properties", json=BIEN,
                         headers={"Authorization": f"Bearer {token}"})
    pid = create.json()["id"]
    resp = client.get(f"/api/v1/properties/{pid}")
    assert resp.status_code == 200
    assert resp.json()["id"] == pid


def test_update_property(client):
    token = _agent_token(client)
    create = client.post("/api/v1/properties", json=BIEN,
                         headers={"Authorization": f"Bearer {token}"})
    pid = create.json()["id"]
    resp = client.put(f"/api/v1/properties/{pid}", json={"price": 300000, "status": "sold"},
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["price"] == 300000
    assert resp.json()["status"] == "sold"


def test_delete_property(client):
    token = _agent_token(client)
    create = client.post("/api/v1/properties", json=BIEN,
                         headers={"Authorization": f"Bearer {token}"})
    pid = create.json()["id"]
    resp = client.delete(f"/api/v1/properties/{pid}",
                         headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 204

    resp = client.get(f"/api/v1/properties/{pid}")
    assert resp.status_code == 404


def test_filter_by_city(client):
    token = _agent_token(client)
    client.post("/api/v1/properties", json=BIEN,
                headers={"Authorization": f"Bearer {token}"})
    client.post("/api/v1/properties", json={**BIEN, "city": "Paris"},
                headers={"Authorization": f"Bearer {token}"})

    resp = client.get("/api/v1/properties?city=lyon")
    assert resp.status_code == 200
    assert all(p["city"] == "Lyon" for p in resp.json())
