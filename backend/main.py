"""
MRT Guessr leaderboard API — speedrun only.

Endpoints
---------
POST /scores/speedrun          Submit a speedrun score.
GET  /scores/speedrun/top      Return the top 10 speedrun scores (lowest ms first).
GET  /health                   Basic health check.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from db import DB_PATH, get_conn, init_db


# ── Pydantic models ────────────────────────────────────────────────────────────

class ScoreCreate(BaseModel):
    username: str = Field(..., min_length=1, max_length=32)
    score_ms: int = Field(..., ge=0, description="Elapsed milliseconds — lower is better")

    @field_validator("username")
    @classmethod
    def strip_username(cls, v: str) -> str:
        return v.strip()


class ScoreRow(BaseModel):
    id:         int
    username:   str
    score_ms:   int
    created_at: str


# ── App setup ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db(DB_PATH)
    yield


app = FastAPI(title="MRT Guessr Leaderboard", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to Vercel domain in production
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/scores/speedrun", response_model=ScoreRow, status_code=201)
def create_speedrun_score(payload: ScoreCreate):
    """Record a speedrun score."""
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO scores (username, score_ms) VALUES (?, ?)",
            (payload.username, payload.score_ms),
        )
        row = conn.execute(
            "SELECT id, username, score_ms, created_at FROM scores WHERE id = ?",
            (cur.lastrowid,),
        ).fetchone()
    return dict(row)


@app.get("/scores/speedrun/top", response_model=list[ScoreRow])
def top_speedrun_scores(limit: int = Query(10, ge=1, le=100)):
    """Return the top N speedrun scores, sorted by score_ms ascending (lowest = best)."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, username, score_ms, created_at FROM scores ORDER BY score_ms ASC LIMIT ?",
            (limit,),
        ).fetchall()
    return [dict(r) for r in rows]
