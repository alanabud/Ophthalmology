# Domain Modules

## Implemented in This Delivery

### Identity and Access

Current scope:

- users, roles, permissions, role_permissions, user_roles
- user_sessions and mfa_devices models
- login, refresh, logout, and current-user context endpoints
- RBAC dependency and server-side token validation

### Tenant Management

Current scope:

- tenant model, schemas, repository, service, and routes
- tenant list, get, and create flows
- tenant access verification against authenticated scope

### Clinic Management

Current scope:

- clinics, clinic_locations, provider_clinic_assignments, staff_clinic_assignments models
- clinic list, get, and create flows
- clinic creation with location payload support

### Audit

Current scope:

- immutable audit log model
- service for structured event creation
- audit listing route with tenant-aware filtering

## Reserved for the Next Delivery Step

### Patient Management

Planned tables:

- patients
- patient_addresses
- patient_contacts
- patient_emergency_contacts
- patient_insurances
- guarantors
- patient_allergies
- patient_medications
- patient_conditions
- patient_documents

### Scheduling

Planned tables:

- appointment_types
- appointments
- provider_availability
- provider_blocked_times
- appointment_status_history
- appointment_notes

### Core Ophthalmology EMR

Planned tables:

- encounters
- encounter_notes
- encounter_diagnoses
- visual_acuity_tests and results
- refractions and measurements
- intraocular_pressure_tests and tonometry_results
- slit_lamp_exams and findings
- retina_findings
- care_plans and followup_plans

### Billing Foundation

Planned tables:

- icd10_codes
- cpt_codes
- charge_master
- encounter_charges
- claims and claim_lines
- patient_payments
