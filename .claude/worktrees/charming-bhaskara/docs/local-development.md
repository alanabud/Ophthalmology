# Local Development

## Current Scope

This document covers the backend foundation delivered so far. Docker, compose, frontend runtime setup, and CI will be added in the next delivery step.

## Prerequisites

- Python 3.13
- PostgreSQL
- Redis

## Backend Setup

From `backend/`:

1. Create a virtual environment.
2. Install the package with development dependencies.
3. Copy `.env.example` to `.env` and set real local values.
4. Start the API with Uvicorn.

Example commands:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .[dev]
copy .env.example .env
uvicorn app.main:app --reload
```

## Test Commands

From `backend/`:

```powershell
pytest
ruff check .
mypy app
```

## Current Limitations

- migrations are not yet generated in this step
- reference data seeding is not yet implemented in this step
- frontend application shell is not yet implemented in this step
