"""
Additional coverage beyond test_auth.py and test_flows.py:
- Delete permissions (admin-only)
- Members cannot reassign leads
- Members only ever see leads assigned to them
- Adding a note produces a NOTE_ADDED activity log entry
"""


def login(client, email, password):
    """Helper: logs in and returns the raw access_token cookie value."""
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.cookies.get("access_token")


def create_public_lead(client, name="Test Lead", email="lead@example.com"):
    response = client.post("/api/leads/public", json={"name": name, "email": email})
    assert response.status_code == 201
    return response.json()["id"]


# --- Delete permissions ---

def test_admin_can_delete_lead(client, setup_users):
    lead_id = create_public_lead(client, email="delete-me@example.com")
    admin_token = login(client, "admin@test.com", "pass123")

    delete_response = client.delete(f"/api/leads/{lead_id}", cookies={"access_token": admin_token})
    assert delete_response.status_code == 200

    # Confirm the lead can no longer be updated (i.e., it's actually gone)
    update_response = client.put(
        f"/api/leads/{lead_id}", json={"status": "contacted"}, cookies={"access_token": admin_token}
    )
    assert update_response.status_code == 404


def test_member_cannot_delete_lead(client, setup_users):
    lead_id = create_public_lead(client, email="protected@example.com")
    member_token = login(client, "member@test.com", "pass123")

    response = client.delete(f"/api/leads/{lead_id}", cookies={"access_token": member_token})
    assert response.status_code == 403
    assert response.json()["detail"] == "Admin privileges required"


def test_unauthenticated_cannot_delete_lead(client, setup_users):
    lead_id = create_public_lead(client, email="anon-delete@example.com")

    response = client.delete(f"/api/leads/{lead_id}")
    assert response.status_code == 401


def test_delete_nonexistent_lead_returns_404(client, setup_users):
    admin_token = login(client, "admin@test.com", "pass123")
    fake_id = "00000000-0000-0000-0000-000000000000"

    response = client.delete(f"/api/leads/{fake_id}", cookies={"access_token": admin_token})
    assert response.status_code == 404


# --- Assignment restrictions ---

def test_member_cannot_assign_lead(client, setup_users):
    lead_id = create_public_lead(client, email="assign-test@example.com")
    admin_token = login(client, "admin@test.com", "pass123")
    member_id = str(setup_users["member"].id)

    # Admin assigns the lead to the member first, so the member has edit rights on it
    assign_response = client.put(
        f"/api/leads/{lead_id}", json={"assigned_to": member_id}, cookies={"access_token": admin_token}
    )
    assert assign_response.status_code == 200

    # Member tries to reassign it to themselves again (a no-op change is fine),
    # but reassigning to someone else must be blocked
    member_token = login(client, "member@test.com", "pass123")
    other_id = str(setup_users["admin"].id)
    reassign_response = client.put(
        f"/api/leads/{lead_id}", json={"assigned_to": other_id}, cookies={"access_token": member_token}
    )
    assert reassign_response.status_code == 403
    assert reassign_response.json()["detail"] == "Members cannot assign leads"


def test_member_only_sees_assigned_leads(client, setup_users):
    unassigned_lead_id = create_public_lead(client, email="unassigned@example.com")
    admin_token = login(client, "admin@test.com", "pass123")
    member_id = str(setup_users["member"].id)

    # Assign a fresh lead to the member
    assigned_lead_id = create_public_lead(client, email="assigned-to-member@example.com")
    client.put(
        f"/api/leads/{assigned_lead_id}", json={"assigned_to": member_id}, cookies={"access_token": admin_token}
    )

    member_token = login(client, "member@test.com", "pass123")
    response = client.get("/api/leads/", cookies={"access_token": member_token})
    assert response.status_code == 200
    lead_ids = [lead["id"] for lead in response.json()]

    assert assigned_lead_id in lead_ids
    assert unassigned_lead_id not in lead_ids


# --- Notes ---

def test_add_note_creates_activity_log_entry(client, setup_users):
    lead_id = create_public_lead(client, email="note-test@example.com")
    admin_token = login(client, "admin@test.com", "pass123")

    note_response = client.post(
        f"/api/leads/{lead_id}/notes", json={"content": "Called, left voicemail."}, cookies={"access_token": admin_token}
    )
    assert note_response.status_code == 201
    assert note_response.json()["content"] == "Called, left voicemail."

    # Fetch the lead back and confirm the activity log picked up the NOTE_ADDED entry
    leads_response = client.get("/api/leads/", cookies={"access_token": admin_token})
    lead = next(l for l in leads_response.json() if l["id"] == lead_id)
    actions = [a["action"] for a in lead["activities"]]
    assert "NOTE_ADDED" in actions