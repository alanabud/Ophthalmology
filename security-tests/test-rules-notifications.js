/**
 * Firestore rules — notification access tests (Sprint 19).
 * Run: node security-tests/test-rules-notifications.js
 *
 * Uses the Clermont pilot staff session (claims minted by claims-admin.js) to
 * prove clinic-scoped, field-restricted, append-safe notification access:
 *   1. ALLOW read of a clermont notification
 *   2. DENY  read of a winter-park notification (cross-clinic)
 *   3. ALLOW mark-read on a clermont notification (status/readAt only)
 *   4. DENY  editing message on a clermont notification
 *   5. DENY  editing severity
 *   6. DENY  editing clinicId (cross-clinic move)
 *   7. DENY  client delete of a notification
 *   8. ALLOW sandbox (claimless anonymous) read — documented demo mode
 *
 * Requires seed notifications NTF-100004 (clermont) and NTF-100001 (winter-park).
 */
const PROJECT = 'ophthalmology-abd50';
const API_KEY = 'AIzaSyB7BBvEiWasbV1vDrQoF7sJSMlwBu_sdU8';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const CLERMONT_USER = { email: 'pilot.clermont@acuityeye.app', password: 'Cl-Pilot-2026!x' };

let pass = 0, fail = 0;
function check(name, ok, info = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? ' — ' + info : ''}`);
  ok ? pass++ : fail++;
}

async function signIn(email, password) {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const j = await r.json();
  if (!j.idToken) throw new Error('staff sign-in failed: ' + JSON.stringify(j.error ?? j));
  return j.idToken;
}
async function anonToken() {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"returnSecureToken":true}',
  });
  return (await r.json()).idToken;
}
async function getDoc(token, path) {
  const r = await fetch(`${BASE}/${path}?key=${API_KEY}`, { headers: { Authorization: `Bearer ${token}` } });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}
// Full-document overwrite via PATCH (mirrors the app's setDoc(merge) full-record write).
async function patch(token, path, fields) {
  const r = await fetch(`${BASE}/${path}?key=${API_KEY}`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}
const S = (v) => ({ stringValue: v });

(async () => {
  console.log('── Notification access (clermont staff session) ─────────');
  const token = await signIn(CLERMONT_USER.email, CLERMONT_USER.password);

  // Fetch the live clermont notification so we echo its real immutable fields.
  const own = await getDoc(token, 'notifications/NTF-100004');
  check('read of own-clinic notification is ALLOWED', own.status === 200, `status ${own.status}`);
  const f = own.body.fields || {};

  // 2. cross-clinic read
  const other = await getDoc(token, 'notifications/NTF-100001');
  check('read of another clinic notification is DENIED', other.status === 403, `status ${other.status}`);

  // Helper to rebuild the full record with overrides.
  const base = () => ({
    id: f.id, clinicId: f.clinicId, recipientUserId: f.recipientUserId, type: f.type,
    severity: f.severity, title: f.title, message: f.message, createdAt: f.createdAt,
    ...(f.recipientRole ? { recipientRole: f.recipientRole } : {}),
    ...(f.entityType ? { entityType: f.entityType } : {}),
    ...(f.entityId ? { entityId: f.entityId } : {}),
    ...(f.actionLabel ? { actionLabel: f.actionLabel } : {}),
    ...(f.actionRoute ? { actionRoute: f.actionRoute } : {}),
  });

  // 3. legitimate mark-read (status + readAt only)
  const r3 = await patch(token, 'notifications/NTF-100004', { ...base(), status: S('read'), readAt: S(new Date().toISOString()) });
  check('mark-read (status/readAt only) is ALLOWED', r3.status === 200, `status ${r3.status}`);

  // 4. tamper message
  const r4 = await patch(token, 'notifications/NTF-100004', { ...base(), message: S('TAMPERED MESSAGE'), status: S('read') });
  check('editing message is DENIED', r4.status === 403, `status ${r4.status}`);

  // 5. tamper severity
  const r5 = await patch(token, 'notifications/NTF-100004', { ...base(), severity: S('info'), status: S('read') });
  check('editing severity is DENIED', r5.status === 403, `status ${r5.status}`);

  // 6. tamper clinicId (cross-clinic move)
  const r6 = await patch(token, 'notifications/NTF-100004', { ...base(), clinicId: S('winter-park'), status: S('read') });
  check('editing clinicId is DENIED', r6.status === 403, `status ${r6.status}`);

  // 7. client delete
  const r7 = await fetch(`${BASE}/notifications/NTF-100004?key=${API_KEY}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  check('client delete of a notification is DENIED', r7.status === 403, `status ${r7.status}`);

  // 8. sandbox read
  const anon = await anonToken();
  const r8 = await getDoc(anon, 'notifications/NTF-100001');
  check('sandbox (claimless) notification read retains demo access', r8.status === 200, `status ${r8.status}`);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('SUITE ERROR', e); process.exit(1); });
