/**
 * Storage rules — clinic-scoped document guard tests (Sprint 16).
 * Run: node security-tests/test-rules-storage-documents.js
 *
 * If the default bucket is not yet provisioned (owner gate: Blaze upgrade +
 * Console → Build → Storage → Get Started), the suite reports ACTION REQUIRED
 * and exits 0 — that state is expected and tracked on /admin/pilot-readiness.
 *
 * Once the bucket exists and storage.rules are deployed:
 *   1. DENY  unauthenticated upload to documents/**
 *   2. DENY  unauthenticated download from documents/**
 *   3. ALLOW staff upload inside their own clinic path (clermont)
 *   4. DENY  staff upload into another clinic's path (winter-park)
 *   5. DENY  staff download from another clinic's path
 *   6. ALLOW staff download from their own clinic path
 *   7. DENY  upload outside /documents/**
 *   8. DENY  disallowed content type (e.g. application/zip)
 *   9. ALLOW sandbox (claimless anonymous) read — documented demo mode
 *  10. cleanup: staff delete of own-clinic test object
 */
const PROJECT = 'ophthalmology-abd50';
const BUCKET = 'ophthalmology-abd50.firebasestorage.app';
const API_KEY = 'AIzaSyB7BBvEiWasbV1vDrQoF7sJSMlwBu_sdU8';
const BASE = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o`;
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

const enc = (p) => encodeURIComponent(p);
const upload = (path, token, type = 'application/pdf') => fetch(`${BASE}?name=${enc(path)}`, {
  method: 'POST',
  headers: { 'Content-Type': type, ...(token ? { Authorization: `Firebase ${token}` } : {}) },
  body: Buffer.from('%PDF-1.4 security-test'),
});
const download = (path, token) => fetch(`${BASE}/${enc(path)}?alt=media`, {
  headers: token ? { Authorization: `Firebase ${token}` } : {},
});

(async () => {
  console.log('── Storage clinic-scoped document rules ─────────────────');
  const probe = await fetch(`${BASE}?maxResults=1`);
  if (probe.status === 404) {
    console.log('ACTION REQUIRED  Storage bucket not provisioned yet (Blaze plan + Get Started).');
    console.log('  Owner steps: Firebase Console → upgrade to Blaze → Build → Storage → Get Started,');
    console.log('  then: firebase deploy --only storage --project ' + PROJECT);
    console.log('  then: re-run this suite. Exiting without failures (expected state).');
    process.exit(0);
  }

  const staff = await signIn(CLERMONT_USER.email, CLERMONT_USER.password);
  const ownPath = 'documents/clermont/patient/TEST/SEC-TEST/probe.pdf';
  const otherPath = 'documents/winter-park/patient/TEST/SEC-TEST/probe.pdf';

  const r1 = await upload(ownPath, null);
  check('unauthenticated upload is DENIED', r1.status === 401 || r1.status === 403, `status ${r1.status}`);

  const r2 = await download(ownPath, null);
  check('unauthenticated download is DENIED', [401, 403, 404].includes(r2.status), `status ${r2.status}`);

  const r3 = await upload(ownPath, staff);
  check('staff upload inside OWN clinic path is ALLOWED', r3.status === 200, `status ${r3.status}`);

  const r4 = await upload(otherPath, staff);
  check('staff upload into ANOTHER clinic path is DENIED', r4.status === 403, `status ${r4.status}`);

  const r5 = await download(otherPath, staff);
  check('staff download from another clinic path is DENIED', [403, 404].includes(r5.status), `status ${r5.status}`);

  const r6 = await download(ownPath, staff);
  check('staff download from own clinic path is ALLOWED', r6.status === 200, `status ${r6.status}`);

  const r7 = await upload('loose-file.pdf', staff);
  check('upload outside /documents/** is DENIED', r7.status === 403, `status ${r7.status}`);

  const r8 = await upload('documents/clermont/patient/TEST/SEC-TEST/probe.zip', staff, 'application/zip');
  check('disallowed content type is DENIED', r8.status === 403, `status ${r8.status}`);

  const anon = await anonToken();
  const r9 = await download(ownPath, anon);
  check('sandbox (claimless) read retains demo access', r9.status === 200, `status ${r9.status}`);

  const r10 = await fetch(`${BASE}/${enc(ownPath)}`, { method: 'DELETE', headers: { Authorization: `Firebase ${staff}` } });
  check('cleanup delete of own-clinic test object succeeded', r10.status === 204 || r10.status === 200, `status ${r10.status}`);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('SUITE ERROR', e); process.exit(1); });
