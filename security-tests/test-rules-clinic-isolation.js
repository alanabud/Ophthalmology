/**
 * Firestore rules — clinic / access isolation tests (Sprint 13).
 * Run: node security-tests/test-rules-clinic-isolation.js
 *
 * Verifies against the LIVE project (REST API enforces security rules):
 *   1. DENY  unauthenticated read of an app collection
 *   2. ALLOW authenticated (anonymous) read of an app collection
 *   3. DENY  write carrying an unknown clinicId
 *   4. ALLOW write carrying a valid clinicId (then cleans up)
 *   5. DENY  read of a collection outside the application schema
 */
const PROJECT = 'ophthalmology-abd50';
const API_KEY = 'AIzaSyB7BBvEiWasbV1vDrQoF7sJSMlwBu_sdU8';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

let pass = 0, fail = 0;
function check(name, ok, info = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? ' — ' + info : ''}`);
  ok ? pass++ : fail++;
}

async function anonToken() {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"returnSecureToken":true}',
  });
  const j = await r.json();
  if (!j.idToken) throw new Error('anonymous sign-in failed: ' + JSON.stringify(j));
  return j.idToken;
}

async function fsFetch(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(`${BASE}/${path}?key=${API_KEY}`, { method, headers, body: body && JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

(async () => {
  console.log('── Clinic / access isolation ────────────────────────────');
  const token = await anonToken();

  // 1. Unauthenticated read → deny
  const r1 = await fsFetch('patients');
  check('unauthenticated read of patients is DENIED', r1.status === 403, `status ${r1.status}`);

  // 2. Authenticated read → allow
  const r2 = await fsFetch('patients', { token });
  check('authenticated read of patients is ALLOWED', r2.status === 200, `status ${r2.status}`);

  // 3. Write with bogus clinicId → deny
  const r3 = await fsFetch('patients/TEST-RULES-BAD-CLINIC', {
    method: 'PATCH', token,
    body: { fields: { id: { stringValue: 'TEST-RULES-BAD-CLINIC' }, clinicId: { stringValue: 'evil-clinic' } } },
  });
  check('write with unknown clinicId is DENIED', r3.status === 403, `status ${r3.status}`);

  // 4. Write with valid clinicId → allow (cleanup after)
  const r4 = await fsFetch('patients/TEST-RULES-OK', {
    method: 'PATCH', token,
    body: { fields: { id: { stringValue: 'TEST-RULES-OK' }, clinicId: { stringValue: 'winter-park' } } },
  });
  check('write with valid clinicId is ALLOWED', r4.status === 200, `status ${r4.status}`);
  const r4d = await fsFetch('patients/TEST-RULES-OK', { method: 'DELETE', token });
  check('cleanup delete of test record succeeded', r4d.status === 200, `status ${r4d.status}`);

  // 5. Unknown collection → deny even when authenticated
  const r5 = await fsFetch('secrets', { token });
  check('read of unknown collection is DENIED', r5.status === 403, `status ${r5.status}`);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('SUITE ERROR', e); process.exit(1); });
