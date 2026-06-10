/**
 * Storage rules — document upload/download guard tests (Sprint 13).
 * Run: node security-tests/test-rules-storage-documents.js
 *
 * If the default bucket is not yet provisioned (owner console action),
 * the suite reports ACTION REQUIRED and exits 0 — that state is expected
 * and tracked on /admin/pilot-readiness.
 *
 * Once the bucket exists:
 *   1. DENY  unauthenticated upload to documents/**
 *   2. DENY  unauthenticated download from documents/**
 *   3. ALLOW authenticated PDF upload inside the structured path (cleanup N/A — overwrite-safe test path)
 *   4. DENY  authenticated upload outside /documents/**
 */
const PROJECT = 'ophthalmology-abd50';
const BUCKET = 'ophthalmology-abd50.firebasestorage.app';
const API_KEY = 'AIzaSyB7BBvEiWasbV1vDrQoF7sJSMlwBu_sdU8';
const BASE = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o`;

let pass = 0, fail = 0;
function check(name, ok, info = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? ' — ' + info : ''}`);
  ok ? pass++ : fail++;
}

async function anonToken() {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"returnSecureToken":true}',
  });
  return (await r.json()).idToken;
}

(async () => {
  console.log('── Storage document rules ───────────────────────────────');
  const probe = await fetch(`${BASE}?maxResults=1`);
  if (probe.status === 404) {
    console.log('ACTION REQUIRED  Storage bucket not provisioned yet.');
    console.log('  → Firebase Console → Build → Storage → Get Started, then:');
    console.log('  → firebase deploy --only storage --project ' + PROJECT);
    console.log('  → re-run this suite. Exiting without failures (expected state).');
    process.exit(0);
  }

  const token = await anonToken();
  const path = encodeURIComponent('documents/patient/TEST/SEC-TEST/probe.pdf');
  const pdf = Buffer.from('%PDF-1.4 security-test');

  // 1. Unauthenticated upload → deny
  const r1 = await fetch(`${BASE}?name=${decodeURIComponent(path)}`, { method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: pdf });
  check('unauthenticated upload is DENIED', r1.status === 401 || r1.status === 403, `status ${r1.status}`);

  // 2. Unauthenticated download → deny
  const r2 = await fetch(`${BASE}/${path}?alt=media`);
  check('unauthenticated download is DENIED', r2.status === 401 || r2.status === 403 || r2.status === 404, `status ${r2.status}`);

  // 3. Authenticated structured-path PDF upload → allow
  const r3 = await fetch(`${BASE}?name=${decodeURIComponent(path)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/pdf', Authorization: `Firebase ${token}` }, body: pdf,
  });
  check('authenticated structured-path upload is ALLOWED', r3.status === 200, `status ${r3.status}`);

  // 4. Authenticated upload outside /documents → deny
  const r4 = await fetch(`${BASE}?name=loose-file.pdf`, {
    method: 'POST', headers: { 'Content-Type': 'application/pdf', Authorization: `Firebase ${token}` }, body: pdf,
  });
  check('upload outside /documents/** is DENIED', r4.status === 403, `status ${r4.status}`);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('SUITE ERROR', e); process.exit(1); });
