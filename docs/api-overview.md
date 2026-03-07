# API Overview

## Base Layout

- Public health endpoints are exposed at `/health/*`.
- Application endpoints are exposed under `/api/v1`.
- Authentication uses bearer tokens and server-side session validation.

## Implemented Endpoints

### Auth

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### Tenants

- `GET /api/v1/tenants`
- `GET /api/v1/tenants/{tenant_id}`
- `POST /api/v1/tenants`

### Clinics

- `GET /api/v1/clinics`
- `GET /api/v1/clinics/{clinic_id}`
- `POST /api/v1/clinics`

### Audit

- `GET /api/v1/audit/logs`

### System

- `GET /health/liveness`
- `GET /health/readiness`

## Response Conventions

Current conventions:

- Pydantic request and response schemas on all implemented routes
- structured error envelope with request id
- permission checks via dependency injection
- tenant and clinic context derived from token plus optional headers

## Phase 1 Endpoints Planned Next

- `GET /patients`
- `POST /patients`
- `GET /patients/{id}`
- `POST /appointments`
- `PATCH /appointments/{id}/cancel`
- `PATCH /appointments/{id}/reschedule`
- `POST /encounters`
- `POST /encounters/{id}/visual-acuity`
- `POST /encounters/{id}/refraction`
- `POST /encounters/{id}/tonometry`
- `POST /encounters/{id}/slit-lamp`
- `POST /encounters/{id}/retina`
- `POST /billing/claims/draft`
