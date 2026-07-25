def test_unauthenticated_access_blocked(client):
    """An unauthenticated user cannot access protected routes."""
    response = client.get("/api/leads/")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_member_cannot_access_admin_routes(client, setup_users):
    """A Member cannot access admin-only routes."""
    # 1. Login as Member
    login_response = client.post("/api/auth/login", json={
        "email": "member@test.com",
        "password": "pass123"
    })
    assert login_response.status_code == 200
    
    # 2. Extract just the raw token string
    token = login_response.cookies.get("access_token")
    
    # 3. Force the cookie into the request using a dictionary
    response = client.get("/api/users/pending", cookies={"access_token": token})
    
    # 4. Verify it is forbidden
    assert response.status_code == 403
    assert response.json()["detail"] == "Admin privileges required"