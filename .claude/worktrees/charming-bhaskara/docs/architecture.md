# Architecture

## Summary

The Ophthalmology Enterprise Platform starts as a modular monolith inside a monorepo. The initial delivery favors operational simplicity, strong boundaries, and production-oriented foundations over premature service decomposition.

Top-level workspaces are separated into backend, frontend, database, infrastructure, documentation, and scripts so each concern can evolve without collapsing into a single delivery surface.

## Why a Modular Monolith First

Phase 1 needs real domain boundaries, auditability, and tenant isolation, but it does not yet need dozens of independently deployed services. A modular monolith is the fastest path to:

- one transactional boundary for early clinical workflows
- shared RBAC, tenant scoping, and audit infrastructure
- coherent migrations and consistent data modeling
- lower operational complexity while product requirements stabilize

The backend is organized by domain module so modules can later be extracted behind clear repository and service seams.

## Backend Structure

The backend uses FastAPI with SQLAlchemy 2.x and async PostgreSQL connectivity. Shared runtime concerns live in `backend/app/core` and `backend/app/db`. Domain modules live under `backend/app/modules` and own their routes, schemas, repositories, services, and ORM models.

Current implemented foundation modules:

- `auth`
- `tenants`
- `clinics`
- `audit`

Reserved Phase 1 modules already scaffolded for the next step:

- `patients`
- `scheduling`
- `emr`
- `billing`

## Tenant Isolation Strategy

Tenant isolation is implemented in three layers:

1. Data model layer
Every tenant-scoped business table includes `tenant_id` and clinic-scoped tables include `clinic_id` where appropriate.

2. Authentication context layer
Access tokens carry active tenant and clinic context, while server-side authorization rehydrates the authenticated user, session, accessible tenant list, accessible clinic list, and permission set from the database.

3. Service and route layer
Routes require permission checks and services reject access to tenants and clinics outside the authenticated context.

This approach keeps authorization decisions server-authoritative even when token context is present.

## Security Foundations

Implemented in this slice:

- Argon2-based password hashing through `pwdlib`
- JWT access and refresh tokens with token typing and issuer/audience validation
- persisted session records for refresh and revocation control
- RBAC permission dependency for route protection
- request validation through Pydantic schemas
- structured audit events for login, logout, refresh, tenant create, and clinic create
- environment-driven secrets and CORS configuration

## Observability Foundations

Implemented in this slice:

- request correlation via `X-Request-ID`
- structured JSON logging
- uniform API error envelope
- liveness and readiness endpoints
- request timing and status logging middleware

## Data and Compliance Posture

The data model already separates platform identity, tenancy, clinics, and audit concerns. The code is intentionally structured to support future PHI controls, patient access logging, retention rules, and encryption strategy additions without rewriting the module layout.

## Evolution Path

Planned next steps in Phase 1:

- patient registration and chart summary module
- appointment scheduling and conflict validation
- ophthalmology encounter and exam data capture
- billing foundation and claim draft generation
- Alembic revisions and reference data seeding
- Angular enterprise shell and feature pages
