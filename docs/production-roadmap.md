# Production Roadmap

## Assumptions Chosen for This Foundation

- PostgreSQL is the primary transactional store.
- Redis backs caching, broker, and short-lived operational concerns.
- JWTs are used with persisted session records for revocation-aware refresh flows.
- Tenant isolation is enforced in both the data model and service layer.
- The platform starts as a modular monolith and only splits into services when operational pressure justifies it.

## Remaining Phase 1 Work

- patient module implementation
- scheduling module implementation
- ophthalmology EMR encounter module implementation
- billing foundation implementation
- Alembic configuration and initial revisions
- seed scripts for roles, permissions, appointment types, ICD-10, and CPT data
- Angular shell and Phase 1 feature pages
- Docker, compose, and CI workflow
- broader backend integration tests

## Phase 2 Direction

- richer encounter authoring and ophthalmic exam workflows
- document ingestion and storage abstraction
- notification and reminder jobs
- claim lifecycle expansion and payment posting
- tenant administration and user management UI
- stronger audit analytics and export workflows

## Phase 3 Direction

- HIPAA-oriented encryption and key management enhancements
- advanced reporting and operational dashboards
- interoperability foundations such as FHIR/HL7 integration points
- fine-grained consent and patient portal capabilities
- service extraction where scale or compliance boundaries warrant it
