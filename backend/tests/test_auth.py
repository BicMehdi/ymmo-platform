"""Tests des endpoints d'authentification."""


def test_register_and_login(client):
    # Inscription
    resp = client.post("/api/v1/auth/register", json={
        "email": "test@ymmo.fr",
        "password": "ymmo1234",
        "role": "agent",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "test@ymmo.fr"
    assert data["role"] == "agent"
    assert "password" not in data

    # Connexion
    resp = client.post("/api/v1/auth/login", json={
        "email": "test@ymmo.fr",
        "password": "ymmo1234",
    })
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    assert token

    # Profil
    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@ymmo.fr"


def test_login_wrong_password(client):
    client.post("/api/v1/auth/register", json={
        "email": "x@ymmo.fr",
        "password": "ymmo1234",
        "role": "client",
    })
    resp = client.post("/api/v1/auth/login", json={
        "email": "x@ymmo.fr",
        "password": "mauvais",
    })
    assert resp.status_code == 401


def test_duplicate_email(client):
    payload = {"email": "dup@ymmo.fr", "password": "ymmo1234", "role": "client"}
    client.post("/api/v1/auth/register", json=payload)
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 400


def test_me_without_token(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 403
