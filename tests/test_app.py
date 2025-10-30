import copy

import pytest
from fastapi.testclient import TestClient

from src.app import app, activities as activities_db


@pytest.fixture(autouse=True)
def restore_activities():
    """Ensure the in-memory activities DB is restored after each test to avoid ordering
    dependent failures.
    """
    original = copy.deepcopy(activities_db)
    yield
    activities_db.clear()
    activities_db.update(original)


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


def test_get_activities(client):
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # Basic sanity - known activity from sample data
    assert "Chess Club" in data


def test_signup_success(client):
    email = "test.user@mergington.edu"
    activity = "Chess Club"

    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert res.json()["message"] == f"Signed up {email} for {activity}"

    # Verify the participant is present in the activity payload
    res2 = client.get("/activities")
    assert email in res2.json()[activity]["participants"]


def test_signup_duplicate(client):
    activity = "Chess Club"
    existing = activities_db[activity]["participants"][0]

    res = client.post(f"/activities/{activity}/signup?email={existing}")
    assert res.status_code == 400
    assert res.json()["detail"] == "Student already signed up for this activity"


def test_signup_not_found(client):
    res = client.post("/activities/Nonexistent/signup?email=a@b.com")
    assert res.status_code == 404
