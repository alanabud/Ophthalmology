# Backup, Export & Restore Runbook

Two backup paths: a **logical JSON export** for pilot scale (built in, owner CLI)
and a **managed Firestore export to GCS** for production scale.

---

## A. Pilot logical export (owner CLI — works today)

```bash
# Full export of every collection → backups/export-all-<timestamp>.json
node backend/export-data.js

# Clinic-scoped export (respects clinic isolation; audit feeds always whole)
node backend/export-data.js --clinic clermont

# Counts only, no file written
node backend/export-data.js --list
```

- Output lands in `backups/` (gitignored — exports may contain PHI; never commit them).
- Read-only: the tool only issues Firestore GETs.
- Clinic-scoped exports filter app collections by `clinicId`. Append-only audit
  feeds (`activityFeed`, `appointmentAudit`, `documentAudit`, `clinicalAudit`)
  carry no `clinicId` and are exported whole so the trail stays intact.

### Collections covered (30)

**Application (25):** patients, patientFlow, clinicalRecords, encounters,
flowMoves, appointments, waitlist, providers, locations, claims, claimWork,
insurancePayers, guarantors, glAccounts, referrals, documents, imagingStudies,
imagingWork, surgeryCases, surgicalReadiness, injectionSafety, opticalOrders,
inventory, canonicalIdentityMappings, identityMatchDecisions.

**Audit (append-only, 4):** activityFeed, appointmentAudit, documentAudit, clinicalAudit.

**Registry (1):** staffDirectory (claims mirror; the authoritative source is the
Firebase Auth custom claims themselves).

> Files in Firebase **Storage** (document binaries) are NOT in the JSON export.
> Once Storage is provisioned, back those up with `gcloud storage rsync`
> (see section B) — Firestore only stores `storagePath`, never the file bytes.

## B. Production export to GCS (managed, after Blaze)

```bash
# One-off Firestore export (requires Blaze + a GCS bucket):
gcloud firestore export gs://ophthalmology-abd50-backups/$(date +%F) \
  --project ophthalmology-abd50

# Storage object backup, once the bucket exists:
gcloud storage rsync -r gs://ophthalmology-abd50.firebasestorage.app/documents \
  gs://ophthalmology-abd50-backups/documents
```

Schedule daily via Cloud Scheduler + the managed export API for real PHI.

## C. Restore (owner-only, destructive — read before running)

> ⚠️ Restore overwrites live documents **by id**. It does not delete records that
> exist live but are absent from the backup. Restore into a fresh/empty project
> for a true point-in-time recovery, or accept a merge-overwrite into the current one.

- **Managed export (preferred):** `gcloud firestore import gs://.../<timestamp>`.
- **Logical JSON:** write a small owner script that PATCHes each
  `collections[name][i]` back by `_id` using the owner OAuth token (same auth
  path as `export-data.js`). Keep it owner-credentialed; never expose restore to clients.
- **Always** take a fresh export immediately before any restore.
- Rules and clinic claims are **not** part of these backups — they live in
  `firestore.rules` / `storage.rules` (redeploy from git) and in Firebase Auth
  custom claims (re-mint with `backend/claims-admin.js`).

## D. What is NOT in any data backup (recreate from source)

- Security rules → `firestore.rules`, `storage.rules` in git (`firebase deploy`).
- Clinic claims → re-mint via `backend/claims-admin.js` (mirror restores from `staffDirectory`).
- Hosting build → `npx ng build` + `firebase deploy --only hosting`.
