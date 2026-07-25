def test_core_flow_public_lead_to_dashboard(client, setup_users):
    """Flow 1: Create lead via public form -> appears in admin dashboard."""
    
    public_response = client.post("/api/leads/public", json={
        "name": "John Doe",
        "email": "john@example.com",
        "message": "Interested in pricing."
    })
    assert public_response.status_code == 201
    lead_id = public_response.json()["id"]

    # 1. Admin logs in
    login_response = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "pass123"})
    token = login_response.cookies.get("access_token") # Extract raw token
    
    # 2. Admin checks dashboard
    dashboard_response = client.get("/api/leads/", cookies={"access_token": token})
    assert dashboard_response.status_code == 200
    leads = dashboard_response.json()
    
    assert len(leads) >= 1
    assert any(lead["id"] == lead_id for lead in leads)


def test_core_flow_status_change_logs_activity(client, setup_users):
    """Flow 2: Change lead status -> activity log updates."""
    
    lead_response = client.post("/api/leads/public", json={
        "name": "Jane Smith",
        "email": "jane@example.com"
    })
    lead_id = lead_response.json()["id"]

    # 1. Admin logs in
    login_response = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "pass123"})
    token = login_response.cookies.get("access_token") # Extract raw token
    
    # 2. Admin changes status
    update_response = client.put(f"/api/leads/{lead_id}", json={
        "status": "qualified"
    }, cookies={"access_token": token})
    
    assert update_response.status_code == 200
    assert update_response.json()["status"] == "qualified"

    updated_lead = update_response.json()
    activities = updated_lead["activities"]
    
    assert len(activities) >= 1
    assert activities[-1]["action"] == "LEAD_UPDATED"
    assert "Status changed" in activities[-1]["details"]