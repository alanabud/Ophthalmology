/**
 * Firestore rules — custom-claim clinic isolation tests (Sprint 15).
 * Run: node security-tests/test-rules-clinic-claims.js
 *
 * Signs in as the Clermont pilot staff account (claims minted by the trusted
 * backend/claims-admin.js tool) and proves cross-clinic access is impossible
 * even when the client tampers with clinicId:
 *   1. ALLOW read of a record in the user's own clinic (clermont)
 *   2. DENY  read of a record in another clinic (winter-park)
 *   3. DENY  write that tampers clinicId to another clinic
 *   4. ALLOW write inside the user's own clinic (then cleans up)
 *   5. DENY  unfiltered collection list (would leak other clinics)
 *   6. DENY  client write to staffDirectory (claims registry is read-only)
 *   7. ALLOW sandbox (anonymous, claimless) network read — documented demo mode
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

async function fsFetch(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(`${BASE}/${path}?key=${API_KEY}`, { method, headers, body: body && JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

(async () => {
  console.log('── Custom-claim clinic isolation (clermont staff session) ──');
  const token = await signIn(CLERMONT_USER.email, CLERMONT_USER.password);

  // 1. Own-clinic read (APT-100203 is a clermont appointment)
  const r1 = await fsFetch('appointments/APT-100203', { token });
  check('read of own-clinic record is ALLOWED', r1.status === 200, `status ${r1.status}`);

  // 2. Cross-clinic read (APT-100201 is winter-park)
  const r2 = await fsFetch('appointments/APT-100201', { token });
  check('read of another clinic\'s record is DENIED', r2.status === 403, `status ${r2.status}`);

  // 3. Tampered write: clermont user pushes a winter-park record
  const r3 = await fsFetch('patients/CLAIMS-TEST-TAMPER', {
    method: 'PATCH', token,
    body: { fields: { id: { stringValue: 'CLAIMS-TEST-TAMPER' }, clinicId: { stringValue: 'winter-park' } } },
  });
  check('write tampering clinicId to another clinic is DENIED', r3.status === 403, `status ${r3.status}`);

  // 4. Own-clinic write allowed (then cleanup)
  const r4 = await fsFetch('patients/CLAIMS-TEST-OWN', {
    method: 'PATCH', token,
    body: { fields: { id: { stringValue: 'CLAIMS-TEST-OWN' }, clinicId: { stringValue: 'clermont' } } },
  });
  check('write inside own clinic is ALLOWED', r4.status === 200, `status ${r4.status}`);
  const r4d = await fsFetch('patients/CLAIMS-TEST-OWN', { method: 'DELETE', token });
  check('cleanup delete of own-clinic test record succeeded', r4d.status === 200, `status ${r4d.status}`);

  // 5. Unfiltered list would expose other clinics → denied for claim sessions
  const r5 = await fsFetch('appointments', { token });
  check('unfiltered collection list is DENIED for claim sessions', r5.status === 403, `status ${r5.status}`);

  // 6. staffDirectory is read-only for clients
  const r6 = await fsFetch('staffDirectory/hijack', {
    method: 'PATCH', token,
    body: { fields: { email: { stringValue: 'hijack@evil.test' }, clinicId: { stringValue: 'network' } } },
  });
  check('client write to staffDirectory is DENIED', r6.status === 403, `status ${r6.status}`);

  // 7. Sandbox anonymous session (no claim) keeps documented demo access
  const anon = await anonToken();
  const r7 = await fsFetch('appointments/APT-100201', { token: anon });
  check('sandbox (claimless) session retains demo access', r7.status === 200, `status ${r7.status}`);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('SUITE ERROR', e); process.exit(1); });
