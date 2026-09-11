import hashlib
import hmac
import json
import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["app"] == "Daedalus AI"


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_list_users(client):
    response = client.get("/api/v1/users")
    assert response.status_code == 200
    users = response.json()
    assert isinstance(users, list)
    assert len(users) >= 4  # Seeded users exist
    assert "github_username" in users[0]
    assert "github_id" in users[0]
    assert "skills" in users[0]


def test_skill_scanning_ingestion(client):
    response = client.post(
        "/api/v1/users/scan-skills",
        json={"github_or_resume": "https://github.com/linustorvalds", "full_name": "Linus Torvalds"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "network_graph" in data
    assert len(data["network_graph"]["nodes"]) > 0
    assert "github_id" in data["user"]


def test_project_decomposition_and_retrieval(client):
    decomp_resp = client.post(
        "/api/v1/projects/decompose",
        json={
            "title": "Autonomous Hackathon Agent",
            "description": "Real-time task tracking with GitHub actions"
        }
    )
    assert decomp_resp.status_code == 200
    project = decomp_resp.json()
    assert "id" in project
    assert len(project["epics"]) > 0
    assert len(project["tasks"]) > 0

    # Test scaffold preview
    prev_resp = client.get(f"/api/v1/projects/scaffold/{project['id']}/preview")
    assert prev_resp.status_code == 200
    preview = prev_resp.json()
    assert preview["file_count"] > 0
    assert len(preview["files"]) > 0
    for f in preview["files"]:
        assert "content" in f
        assert len(f["content"]) > 0
    # Specifically verify core files are present with content
    paths = [f["path"] for f in preview["files"]]
    assert "backend/app/main.py" in paths
    assert "docker-compose.yml" in paths
    assert "README.md" in paths

    # Test scaffold ZIP download stream
    dl_resp = client.get(f"/api/v1/projects/scaffold/{project['id']}/download")
    assert dl_resp.status_code == 200
    assert dl_resp.headers["content-type"] == "application/zip"
    assert len(dl_resp.content) > 1000  # Non-empty ZIP archive

    # Test connecting GitHub repository to project
    repo_resp = client.patch(
        f"/api/v1/projects/{project['id']}/repo",
        json={"github_repo": "https://github.com/myteam/hackathon-tracker.git"}
    )
    assert repo_resp.status_code == 200
    repo_data = repo_resp.json()
    assert repo_data["status"] == "success"
    assert repo_data["github_repo"] == "myteam/hackathon-tracker"

    # Verify get_project_roadmap returns the linked repo
    get_proj = client.get(f"/api/v1/projects/{project['id']}")
    assert get_proj.status_code == 200
    assert get_proj.json()["github_repo"] == "myteam/hackathon-tracker"


def test_webhook_simulation(client):
    # Simulate a push
    resp = client.post(
        "/api/v1/webhooks/simulate",
        json={
            "event_type": "push",
            "task_code": "CORE-01",
            "commit_message": "feat: closes #CORE-01 initial schema setup",
            "branch_name": "task/CORE-01"
        }
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "simulated"

    # Simulate CI run pass
    ci_resp = client.post(
        "/api/v1/webhooks/simulate",
        json={
            "event_type": "check_run",
            "task_code": "CORE-01",
            "branch_name": "task/CORE-01",
            "ci_conclusion": "success"
        }
    )
    assert ci_resp.status_code == 200
    assert ci_resp.json()["result"]["completed_task"] == "CORE-01"


def test_team_matching_and_profile(client):
    # Test team match
    team_resp = client.get("/api/v1/users/team/match")
    assert team_resp.status_code == 200
    team_data = team_resp.json()
    assert "current_team" in team_data
    assert "overall_synergy" in team_data
    assert "recommended_teammates" in team_data

    # Test user profile
    users = client.get("/api/v1/users").json()
    user_id = users[0]["id"]
    prof_resp = client.get(f"/api/v1/users/{user_id}")
    assert prof_resp.status_code == 200
    prof = prof_resp.json()
    assert prof["id"] == user_id
    assert "skills" in prof


def test_task_splitting_and_dag_mutation(client):
    # 1. Decompose a project
    decomp_resp = client.post(
        "/api/v1/projects/decompose",
        json={
            "title": "Autonomous Clinical RAG",
            "description": "Biomedical literature chunking and PubMed vector retrieval"
        }
    )
    assert decomp_resp.status_code == 200
    project = decomp_resp.json()
    assert project["domain"] in ["ai_rag", "healthcare"]
    assert "metrics" in project
    assert project["metrics"]["critical_path_depth"] >= 1

    first_task = project["tasks"][0]
    first_task_id = first_task["id"]

    # 2. Split task into frontend & backend
    split_resp = client.post(
        f"/api/v1/projects/tasks/{first_task_id}/split",
        json={"strategy": "frontend_backend"}
    )
    assert split_resp.status_code == 200
    updated_project = split_resp.json()
    task_codes = [t["task_code"] for t in updated_project["tasks"]]
    assert f"{first_task['task_code']}a" in task_codes
    assert f"{first_task['task_code']}b" in task_codes

    # 3. Create a custom task
    epic_id = updated_project["epics"][0]["id"]
    create_resp = client.post(
        f"/api/v1/projects/{project['id']}/tasks",
        json={
            "epic_id": epic_id,
            "title": "Custom Integration Monitor",
            "description": "Verifies end-to-end integration and telemetry",
            "required_skills": "Python, Docker, Prometheus"
        }
    )
    assert create_resp.status_code == 200
    created_project = create_resp.json()
    titles = [t["title"] for t in created_project["tasks"]]
    assert "Custom Integration Monitor" in titles


def test_team_invitations_workflow(client):
    # 1. Fetch initial invitations (seeded)
    list_resp = client.get("/api/v1/users/team/invitations")
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert data["count"] >= 2
    assert any(inv["target_username"] == "alexc-dev" for inv in data["invitations"])

    # 2. Create an invitation to a developer
    create_resp = client.post(
        "/api/v1/users/team/invitations",
        json={
            "team_id": "squad_test_123",
            "squad_name": "Zero-Knowledge Vault",
            "target_username": "elena-ai",
            "role": "DEVOPS SENTINEL",
            "pitch_note": "Join our team to deploy zero-knowledge proof circuits!",
            "projected_synergy": 20,
            "invited_by_name": "Alex Chen",
            "invited_by_handle": "alexc-dev"
        }
    )
    assert create_resp.status_code == 200
    create_data = create_resp.json()
    assert create_data["status"] == "success"
    new_inv = create_data["invitation"]
    assert new_inv["target_username"] == "elena-ai"
    assert new_inv["status"] == "PENDING"
    invite_id = new_inv["id"]

    # 3. Filter invitations for elena-ai
    filter_resp = client.get("/api/v1/users/team/invitations?target_username=elena-ai")
    assert filter_resp.status_code == 200
    elena_invs = filter_resp.json()["invitations"]
    assert len(elena_invs) >= 1
    assert elena_invs[0]["id"] == invite_id

    # 4. Respond to invitation (accept)
    respond_resp = client.post(
        f"/api/v1/users/team/invitations/{invite_id}/respond",
        json={"action": "accept"}
    )
    assert respond_resp.status_code == 200
    assert respond_resp.json()["invitation"]["status"] == "ACCEPTED"

    # 5. Revoke / delete invitation
    del_resp = client.delete(f"/api/v1/users/team/invitations/{invite_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "success"


def test_squad_restricted_decomposition(client):
    # 1. Fetch available users
    users_resp = client.get("/api/v1/users")
    assert users_resp.status_code == 200
    users = users_resp.json()
    assert len(users) >= 2

    # Form a 2-member squad
    squad_member_ids = [users[0]["id"], users[1]["id"]]
    squad_name = "Autonomous CRDT Whiteboard Squad"

    # 2. Decompose with squad restriction
    decomp_resp = client.post(
        "/api/v1/projects/decompose",
        json={
            "title": "Conflict-Free Collaborative Whiteboard",
            "description": "CRDT real-time vector canvas with WebSockets sync",
            "team_user_ids": squad_member_ids,
            "squad_id": "squad-crdt",
            "squad_name": squad_name
        }
    )
    assert decomp_resp.status_code == 200
    project = decomp_resp.json()
    assert project["squad_id"] == "squad-crdt"
    assert project["squad_name"] == squad_name

    # 3. Assert EVERY single task is assigned strictly to one of the 2 squad members
    assert len(project["tasks"]) > 0
    for task in project["tasks"]:
        assert task["assignee"] is not None
        assert task["assignee"]["id"] in squad_member_ids

    # 4. Verify GET /api/v1/projects/{id} preserves squad metadata
    get_resp = client.get(f"/api/v1/projects/{project['id']}")
    assert get_resp.status_code == 200
    proj_data = get_resp.json()
    assert proj_data["squad_id"] == "squad-crdt"
    assert proj_data["squad_name"] == squad_name
    assert set(proj_data["squad_member_ids"]) == set(squad_member_ids)


def test_task_update_skill_persistence(client):
    # Decompose a project
    decomp_resp = client.post(
        "/api/v1/projects/decompose",
        json={"title": "Web3 Escrow Contract", "description": "Solidity automated escrow contracts"}
    )
    assert decomp_resp.status_code == 200
    project = decomp_resp.json()
    task_id = project["tasks"][0]["id"]

    # Update required skills
    update_resp = client.patch(
        f"/api/v1/projects/tasks/{task_id}",
        json={"required_skills": "Rust, Solana, Anchor, Web3"}
    )
    assert update_resp.status_code == 200

    # Retrieve roadmap and verify the skills persisted
    get_resp = client.get(f"/api/v1/projects/{project['id']}")
    assert get_resp.status_code == 200
    tasks = get_resp.json()["tasks"]
    updated_task = next(t for t in tasks if t["id"] == task_id)
    assert updated_task["required_skills"] == "Rust, Solana, Anchor, Web3"


def test_decompose_input_validation(client):
    # Empty title rejected with 422
    resp1 = client.post("/api/v1/projects/decompose", json={"title": "", "description": "Valid description"})
    assert resp1.status_code == 422

    # Non-existent squad member IDs rejected with 400
    resp2 = client.post(
        "/api/v1/projects/decompose",
        json={
            "title": "Valid Title",
            "description": "Valid Description",
            "team_user_ids": ["non_existent_user_id_xyz"]
        }
    )
    assert resp2.status_code == 400


def test_webhook_hmac_verification(client):
    from app.core.config import settings
    secret = settings.GITHUB_WEBHOOK_SECRET or "daedalus_secret_key_123"

    payload = {"action": "completed", "repository": {"full_name": "test/repo"}}
    payload_bytes = json.dumps(payload).encode("utf-8")

    # Correct HMAC signature
    signature = "sha256=" + hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()
    res_valid = client.post(
        "/api/v1/webhooks/github",
        content=payload_bytes,
        headers={"X-GitHub-Event": "push", "X-Hub-Signature-256": signature, "Content-Type": "application/json"}
    )
    assert res_valid.status_code == 200

    # Tampered HMAC signature
    res_invalid = client.post(
        "/api/v1/webhooks/github",
        content=payload_bytes,
        headers={"X-GitHub-Event": "push", "X-Hub-Signature-256": "sha256=invalid_signature_hash_xyz", "Content-Type": "application/json"}
    )
    assert res_invalid.status_code == 401


def test_user_auth_login_workflow(client):
    # 1. Login with seeded valid user
    login_resp = client.post(
        "/api/v1/users/login",
        json={"identifier": "alexc-dev"}
    )
    assert login_resp.status_code == 200
    data = login_resp.json()
    assert data["status"] == "success"
    assert data["user"]["github_username"] == "alexc-dev"
    assert "skills" in data["user"]
    assert "github_id" in data["user"]

    # 2. Login with non-existent user returns 404
    non_existent = client.post(
        "/api/v1/users/login",
        json={"identifier": "ghost_developer_nonexistent"}
    )
    assert non_existent.status_code == 404
    assert "no developer profile found" in non_existent.json()["detail"].lower()


def test_user_auth_signup_and_relogin_workflow(client):
    # 1. Sign up a brand new developer
    new_handle = "stellar-dev"
    signup_resp = client.post(
        "/api/v1/users/signup",
        json={
            "github_username": new_handle,
            "full_name": "Stella Quantum",
            "email": "stella@daedalus.hack",
            "role": "AI",
            "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=stellar"
        }
    )
    assert signup_resp.status_code == 200
    data = signup_resp.json()
    assert data["status"] == "success"
    user = data["user"]
    assert user["github_username"] == new_handle
    assert user["full_name"] == "Stella Quantum"
    assert len(user["skills"]) >= 3

    # 2. Immediately login with the new user's username
    login_resp = client.post(
        "/api/v1/users/login",
        json={"identifier": new_handle}
    )
    assert login_resp.status_code == 200
    logged_user = login_resp.json()["user"]
    assert logged_user["id"] == user["id"]
    assert logged_user["github_username"] == new_handle

    # 3. Invalid signup with whitespace-only username returns 400
    bad_resp = client.post(
        "/api/v1/users/signup",
        json={"full_name": "Ghost Developer", "github_username": "   "}
    )
    assert bad_resp.status_code == 400

