"""
Pytest fixtures: uses a fresh temp-file SQLite DB per test to avoid
the shared-connection limitation of :memory:.
"""

import os
import tempfile
import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def fresh_db(tmp_path, monkeypatch):
    """Create a temp DB file per test and wire it up via env var."""
    db_file = str(tmp_path / "test.db")
    monkeypatch.setenv("DB_PATH", db_file)

    # Reload db module so DB_PATH constant is updated
    import importlib
    import db as db_mod
    importlib.reload(db_mod)

    db_mod.init_db(db_file)
    yield db_file


@pytest.fixture()
def client(fresh_db):
    # Import main fresh so it picks up the new DB_PATH
    import importlib
    import main as app_module
    importlib.reload(app_module)

    with TestClient(app_module.app) as c:
        yield c
