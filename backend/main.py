"""
MRT Guessr leaderboard API.

Endpoints
---------
POST /scores          Create a new score entry.
GET  /scores/top      Return the top 10 scores for a given game mode.
GET  /health          Basic health check.
"""

from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from db import DB_PATH, get_conn, init_db

GameMode = Literal["quickplay", "singaporetour", "speedrun"]


# ── Pydantic models ────────────────────────────────────────────────────────────

class ScoreCreate(BaseModel):
    username:  str      = Field(..., min_length=1, max_length=32)
    game_mode: GameMode
    score_ms:  int      = Field(..., ge=0, description="Raw elapsed milliseconds (lower = better)")

    @field_validator("username")
    @classmethod
    def strip_username(cls, v: str) -> str:
        return v.strip()


class ScoreRow(BaseModel):
    id:         int
    username:   str
    game_mode:  str
    score_ms:   int
    created_at: str


# ── App setup ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db(DB_PATH)
    yield

app = FastAPI(title="MRT Guessr Leaderboard", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to your Vercel domain in production
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/scores", response_model=ScoreRow, status_code=201)
def create_score(payload: ScoreCreate):
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO scores (username, game_mode, score_ms)
            VALUES (?, ?, ?)
            """,
            (payload.username, payload.game_mode, payload.score_ms),
        )
        row = conn.execute(
            "SELECT * FROM scores WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    return dict(row)


@app.get("/scores/top", response_model=list[ScoreRow])
def top_scores(
    game_mode: GameMode = Query(..., description="Game mode to fetch scores for"),
    limit: int = Query(10, ge=1, le=100),
):
    """
    Return the top N scores for a given game mode.
    - For speedrun: lower score_ms = better (sorted ASC).
    - For quickplay / singaporetour: higher score_ms = better (sorted DESC).
      (In these modes score_ms can be repurposed as a raw point total.)
    """
    order = "ASC" if game_mode == "speedrun" else "DESC"
    with get_conn() as conn:
        rows = conn.execute(
            f"SELECT * FROM scores WHERE game_mode = ? ORDER BY score_ms {order} LIMIT ?",
            (game_mode, limit),
        ).fetchall()
    return [dict(r) for r in rows]
