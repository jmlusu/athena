from conftest import HEADERS


def test_athena_jobs_endpoint(client):
    response = client.get("/api/v1/athena/jobs", headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "jobs" in data
    assert "total" in data


def test_athena_pipeline_stats(client):
    response = client.get("/api/v1/athena/stats/pipeline", headers=HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "total_jobs" in data
    assert "new" in data
