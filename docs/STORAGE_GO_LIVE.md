# Storage Provisioning & Pilot Launch Freeze — Final Gate

This is the **only** remaining item for first-clinic pilot readiness. Every other
gate is green (security board 11 PASS · 0 FAIL · 1 ACTION REQUIRED). Closing this
brings the board to **12 PASS · 0 FAIL · 0 ACTION REQUIRED**.

It requires one owner decision — attaching a billing account — that no script can
or should make on the owner's behalf.

---

## Current state (verified)

| Item | State |
|---|---|
| `billingEnabled` | `false` (no billing account attached) |
| Storage default bucket | 404 — not provisioned |
| `storage.rules` | written, clinic-scoped, deny-tested, committed (deploys on demand) |
| Storage deny-suite | `security-tests/test-rules-storage-documents.js` — 10 assertions, ready |
| Document paths | already clinic-scoped (`documents/{clinicId}/…`); seeds migrated |

New Firebase projects require the **Blaze plan** to provision Cloud Storage. The
free-tier quotas still apply after upgrading — Blaze attaches a billing account
but does not imply charges at pilot scale.

## Owner steps (one-time)

1. **Firebase Console → upgrade to Blaze.** Attach a billing account.
2. **Console → Build → Storage → Get Started.** Accept the default location.
3. **Run the finalizer:**
   ```bash
   node backend/finalize-storage.js
   ```
   It re-checks the bucket, deploys `storage.rules`, runs the 10-assertion deny
   suite, and reports. It refuses to proceed (and changes nothing) if the bucket
   still isn't there — it never fakes a passing gate.

## Verification after provisioning

- [ ] `node backend/finalize-storage.js` → storage suite **10/10 PASS**.
- [ ] App `/admin/pilot-readiness` → **Run all checks** → *Document upload configured* flips to **PASS**; board reads **12 PASS · 0 FAIL · 0 ACTION REQUIRED**.
- [ ] First-clinic doc upload smoke test (per `docs/PILOT_ONBOARDING.md` §8): upload a PDF as staff, confirm preview/download via token URL, confirm cross-clinic download is denied.

## Tag the launch (only when the board is genuinely 12/0/0)

```bash
git tag -a pilot-v1.0-ready -m "First-clinic pilot baseline: 12/0/0"
git push origin pilot-v1.0-ready
```

> Do not create this tag while any gate is open. The current honest freeze point
> is the `pilot-rc1` tag (11/0/1). `pilot-v1.0-ready` is reserved for a truly
> green board so the tag never overstates readiness.

## First-clinic onboarding dry-run (documented)

A pre-Storage dry-run of the onboarding path has been exercised live across prior
sprints and is repeatable from `docs/PILOT_ONBOARDING.md`:

- Owner setup + rules deployed — verified (clinic-isolation suite 6/6).
- Staff claims minted — `pilot.winterpark@…` / `pilot.clermont@…` (claims suite 8/8).
- First patient / appointment / claim — created and persisted; dashboard + analytics
  reflected them; activity events logged.
- First document — metadata + audit path verified; **binary upload pending this gate**.

Only step 8 (binary upload) depends on Storage; the rest of onboarding is proven.
