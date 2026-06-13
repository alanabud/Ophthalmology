# Pilot Onboarding Runbook — First Clinic

Step-by-step setup for the first ophthalmology clinic pilot. Each step lists the
actor, the action, and how to verify it. Owner = Firebase project owner running
the `backend/` CLIs with their `firebase login` session.

Live readiness board: **/admin/pilot-readiness** (run it after each major step).

---

## 0. Prerequisites (Owner)

- [ ] `firebase login` completed as the project owner on the machine running CLIs.
- [ ] `node --version` ≥ 18 (CLIs use the global `fetch`).
- [ ] Repo at tag `pilot-rc1` or later.

## 1. Owner setup (Owner)

- [ ] Confirm hosting is live: open https://ophthalmology-abd50.web.app and reach the login/sandbox screen.
- [ ] Confirm Firestore rules are deployed: `node security-tests/test-rules-clinic-isolation.js` → 6/6.
- **Verify:** readiness board shows *Firebase Auth session*, *Unauthenticated access blocked*, *Authenticated reads* all PASS.

## 2. Clinic creation / verification (Owner)

Clinics are defined in `frontend/src/app/core/data/context.data.ts` and enforced
in `firestore.rules` (`validClinic`). Valid ids: `winter-park`, `clermont`,
`lake-nona`, `tampa-asc`, `network`.

- [ ] Confirm the pilot clinic id is one of the allowed ids (add it to both the data file and the rules `validClinic`/clinic lists if introducing a new clinic, then redeploy rules).
- **Verify:** the clinic appears in the topbar clinic switcher and on the Admin → *Clinic provisioning* panel.

## 3. Staff claim assignment (Owner)

Clinic access is granted only by the trusted CLI — never from the browser.

```bash
# Create a new staff login with clinic + role claims:
node backend/claims-admin.js create jane.doe@clinic.example "StrongPassw0rd!" winter-park admin

# Or assign claims to an existing account:
node backend/claims-admin.js assign jane.doe@clinic.example winter-park provider

# Review everyone with claims:
node backend/claims-admin.js list
```

Roles: `admin`, `provider`, `billing`, `optical`, `scheduling`, `surgery`.

- **Verify:** Admin → *Clinic Access Claims* panel lists the new staff → clinic → role, status Active.

## 4. Role validation (Owner)

- [ ] Run `node security-tests/test-rules-clinic-claims.js` → 8/8.
- **Verify:** the suite proves the new account can read its own clinic, is denied cross-clinic reads, tampered writes, and unfiltered list queries.

## 5. First patient (Staff)

- [ ] Sign in as the pilot staff account at the hosted URL.
- [ ] Patients → **New patient record** → complete the wizard → Save.
- **Verify:** the patient appears in the registry; record carries the correct `clinicId`.

## 6. First appointment (Staff)

- [ ] Scheduling → **New appointment** → fill provider/date/time → Schedule.
- **Verify:** the card appears on the board; dragging it persists; the dashboard *Today's Schedule* reflects it.

## 7. First claim (Staff — billing role)

- [ ] Billing → **New claim** → patient, payer, amount, CPT/ICD → Save.
- **Verify:** Analytics → *Revenue* reflects the new claim amount; an activity event appears in the Command Center rail.

## 8. First document upload (Staff — after Storage is provisioned)

> Blocked until the owner provisions Firebase Storage (see `docs/BACKUP_RUNBOOK.md`
> and `/admin/pilot-readiness`). Until then, document metadata saves and
> `uploadStatus` is `failed` by design.

- [ ] Owner: upgrade project to Blaze → Console → Build → Storage → Get Started.
- [ ] Owner: `firebase deploy --only storage --project ophthalmology-abd50`.
- [ ] Owner: `node security-tests/test-rules-storage-documents.js` → 10/10.
- [ ] Staff: Patients → Documents → **New document** → attach a PDF → Save.
- **Verify:** preview/download resolve via authenticated token URLs; the file lands under `documents/{clinicId}/...`; cross-clinic download is denied.

---

## Go-live sign-off

Run the **First-Clinic Go-Live Validation** checklist on `/admin/pilot-readiness`
and confirm every item is green. Target after Storage provisioning:
**12 PASS · 0 FAIL · 0 ACTION REQUIRED**.
