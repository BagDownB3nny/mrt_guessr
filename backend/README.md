# MRT Guessr — Leaderboard Backend

**Stack:** FastAPI · SQLite · Python 3.11+

## Setup

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
```

## Run

```bash
uvicorn main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

## Test

```bash
pytest tests/ -v
```

## Endpoints

| Method | Path           | Description                                |
|--------|----------------|--------------------------------------------|
| GET    | `/health`      | Health check                               |
| POST   | `/scores`      | Submit a score                             |
| GET    | `/scores/top`  | Top N scores (`?game_mode=speedrun&limit=10`) |

### POST `/scores` body

```json
{
  "username":  "Alice",
  "game_mode": "speedrun",
  "score_ms":  45231
}
```

`game_mode` must be one of: `quickplay`, `singaporetour`, `speedrun`.  
`score_ms` is the raw elapsed milliseconds.  
For speedrun, lower is better. For the others, higher is better.
