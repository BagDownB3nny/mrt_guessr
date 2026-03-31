"""
API tests for MRT Guessr speedrun leaderboard.
"""


# ── Health check ──────────────────────────────────────────────────────────────

def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


# ── POST /scores/speedrun ─────────────────────────────────────────────────────

def test_create_speedrun_score(client):
    r = client.post("/scores/speedrun", json={"username": "Alice", "score_ms": 45000})
    assert r.status_code == 201
    d = r.json()
    assert d["username"] == "Alice"
    assert d["score_ms"] == 45000
    assert "id" in d
    assert "created_at" in d


def test_create_score_strips_whitespace(client):
    r = client.post("/scores/speedrun", json={"username": "  Dave  ", "score_ms": 50000})
    assert r.status_code == 201
    assert r.json()["username"] == "Dave"


def test_create_score_empty_username(client):
    r = client.post("/scores/speedrun", json={"username": "", "score_ms": 100})
    assert r.status_code == 422


def test_create_score_username_too_long(client):
    r = client.post("/scores/speedrun", json={"username": "x" * 33, "score_ms": 100})
    assert r.status_code == 422


def test_create_score_negative_score(client):
    r = client.post("/scores/speedrun", json={"username": "Frank", "score_ms": -1})
    assert r.status_code == 422


# ── GET /scores/speedrun/top ──────────────────────────────────────────────────

def _seed(client, entries: list[tuple[str, int]]):
    for username, score_ms in entries:
        client.post("/scores/speedrun", json={"username": username, "score_ms": score_ms})


def test_top_scores_empty(client):
    r = client.get("/scores/speedrun/top")
    assert r.status_code == 200
    assert r.json() == []


def test_top_scores_sorted_asc(client):
    _seed(client, [("A", 90000), ("B", 45000), ("C", 120000)])
    r = client.get("/scores/speedrun/top")
    scores = [e["score_ms"] for e in r.json()]
    assert scores == sorted(scores), "speedrun scores should be sorted lowest (best) first"


def test_top_scores_default_limit_is_10(client):
    _seed(client, [(f"U{i}", (i + 1) * 5000) for i in range(15)])
    r = client.get("/scores/speedrun/top")
    assert len(r.json()) == 10


def test_top_scores_respects_limit(client):
    _seed(client, [(f"U{i}", (i + 1) * 5000) for i in range(20)])
    r = client.get("/scores/speedrun/top", params={"limit": 3})
    assert len(r.json()) == 3


def test_top_scores_limit_above_max(client):
    r = client.get("/scores/speedrun/top", params={"limit": 200})
    assert r.status_code == 422


def test_top_scores_returns_correct_fields(client):
    _seed(client, [("Alice", 60000)])
    r = client.get("/scores/speedrun/top")
    entry = r.json()[0]
    assert set(entry.keys()) == {"id", "username", "score_ms", "created_at"}
