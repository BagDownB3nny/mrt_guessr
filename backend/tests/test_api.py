"""
API tests for MRT Guessr leaderboard.
"""


# ── Health check ──────────────────────────────────────────────────────────────

def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


# ── POST /scores ──────────────────────────────────────────────────────────────

def test_create_score_quickplay(client):
    r = client.post("/scores", json={"username": "Alice", "game_mode": "quickplay", "score_ms": 1200})
    assert r.status_code == 201
    data = r.json()
    assert data["username"] == "Alice"
    assert data["game_mode"] == "quickplay"
    assert data["score_ms"] == 1200
    assert "id" in data
    assert "created_at" in data


def test_create_score_speedrun(client):
    r = client.post("/scores", json={"username": "Bob", "game_mode": "speedrun", "score_ms": 45000})
    assert r.status_code == 201
    assert r.json()["game_mode"] == "speedrun"


def test_create_score_singaporetour(client):
    r = client.post("/scores", json={"username": "Charlie", "game_mode": "singaporetour", "score_ms": 300})
    assert r.status_code == 201


def test_create_score_strips_whitespace(client):
    r = client.post("/scores", json={"username": "  Dave  ", "game_mode": "quickplay", "score_ms": 50})
    assert r.status_code == 201
    assert r.json()["username"] == "Dave"


def test_create_score_empty_username(client):
    r = client.post("/scores", json={"username": "", "game_mode": "quickplay", "score_ms": 100})
    assert r.status_code == 422


def test_create_score_username_too_long(client):
    r = client.post("/scores", json={"username": "x" * 33, "game_mode": "quickplay", "score_ms": 100})
    assert r.status_code == 422


def test_create_score_invalid_game_mode(client):
    r = client.post("/scores", json={"username": "Eve", "game_mode": "unknown", "score_ms": 100})
    assert r.status_code == 422


def test_create_score_negative_score(client):
    r = client.post("/scores", json={"username": "Frank", "game_mode": "quickplay", "score_ms": -1})
    assert r.status_code == 422


# ── GET /scores/top ───────────────────────────────────────────────────────────

def _seed(client, entries: list[tuple[str, str, int]]):
    for username, game_mode, score_ms in entries:
        client.post("/scores", json={"username": username, "game_mode": game_mode, "score_ms": score_ms})


def test_top_scores_empty(client):
    r = client.get("/scores/top", params={"game_mode": "quickplay"})
    assert r.status_code == 200
    assert r.json() == []


def test_top_scores_missing_game_mode(client):
    r = client.get("/scores/top")
    assert r.status_code == 422


def test_top_scores_quickplay_sorted_desc(client):
    _seed(client, [
        ("A", "quickplay", 500),
        ("B", "quickplay", 300),
        ("C", "quickplay", 700),
    ])
    r = client.get("/scores/top", params={"game_mode": "quickplay"})
    scores = [e["score_ms"] for e in r.json()]
    assert scores == sorted(scores, reverse=True), "quickplay should be sorted highest first"


def test_top_scores_speedrun_sorted_asc(client):
    _seed(client, [
        ("A", "speedrun", 90000),
        ("B", "speedrun", 45000),
        ("C", "speedrun", 120000),
    ])
    r = client.get("/scores/top", params={"game_mode": "speedrun"})
    scores = [e["score_ms"] for e in r.json()]
    assert scores == sorted(scores), "speedrun should be sorted lowest first"


def test_top_scores_respects_limit(client):
    _seed(client, [("U", "quickplay", i * 10) for i in range(20)])
    r = client.get("/scores/top", params={"game_mode": "quickplay", "limit": 5})
    assert len(r.json()) == 5


def test_top_scores_default_limit_is_10(client):
    _seed(client, [("U", "quickplay", i * 10) for i in range(15)])
    r = client.get("/scores/top", params={"game_mode": "quickplay"})
    assert len(r.json()) == 10


def test_top_scores_only_returns_correct_game_mode(client):
    _seed(client, [
        ("A", "quickplay", 100),
        ("B", "speedrun",  50000),
        ("C", "quickplay", 200),
    ])
    r = client.get("/scores/top", params={"game_mode": "speedrun"})
    modes = {e["game_mode"] for e in r.json()}
    assert modes == {"speedrun"}


def test_top_scores_limit_above_max(client):
    """Limit > 100 should be rejected."""
    r = client.get("/scores/top", params={"game_mode": "quickplay", "limit": 200})
    assert r.status_code == 422
