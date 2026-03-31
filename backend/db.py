"""
SQLite database setup.

- Uses a single `scores` table.
- DB file defaults to `mrt_guessr.db` next to this file.
  Override by setting the DB_PATH environment variable (use `:memory:` for tests).
"""

import os
import sqlite3
from contextlib import contextmanager

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "mrt_guessr.db"))


def _connect(path: str = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db(path: str = DB_PATH) -> None:
    """Create tables if they don't already exist."""
    with _connect(path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS scores (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                username   TEXT    NOT NULL CHECK(length(username) BETWEEN 1 AND 32),
                game_mode  TEXT    NOT NULL CHECK(game_mode IN ('quickplay', 'singaporetour', 'speedrun')),
                score_ms   INTEGER NOT NULL CHECK(score_ms >= 0),
                created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_scores_game_mode ON scores(game_mode, score_ms)")
        conn.commit()


@contextmanager
def get_conn():
    """Open a connection to the current DB_PATH and yield it."""
    path = os.environ.get("DB_PATH", DB_PATH)
    conn = _connect(path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
