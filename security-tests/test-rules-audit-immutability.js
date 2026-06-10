/**
 * Firestore rules — audit immutability tests (Sprint 13).
 * Run: node security-tests/test-rules-audit-immutability.js
 *
 * Audit collections (activityFeed, appointmentAudit, documentAudit,
 * clinicalAudit) must be APPEND-ONLY:
 *   1. ALLOW authenticated create of an audit event
 *   2. DENY  update of that audit event
 *   3. DENY  delete of that audit event
 *   4. DENY  unauthenticated create
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
  return (await r.json()).idToken;
}

async function fsFetch(path, { method = 'GET', token, body, qs = '' } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(`${BASE}/${path}?key=${API_KEY}${qs}`, { method, headers, body: body && JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

(async () => {
  console.log('── Audit immutability ───────────────────────────────────');
  const token = await anonToken();
  const id = `security-test-${Date.now()}`;
  const event = (action) => ({ fields: {
    id: { stringValue: id }, module: { stringValue: 'billing' }, refId: { stringValue: 'TEST' },
    action: { stringValue: action }, at: { stringValue: 'test' }, iso: { stringValue: new Date().toISOString() },
  } });

  // 1. Authenticated create → allow (createDocument, not upsert-PATCH)
  const r1 = await fsFetch('activityFeed', { method: 'POST', token, body: event('created'), qs: `&documentId=${id}` });
  check('authenticated create of audit event is ALLOWED', r1.status === 200, `status ${r1.status}`);

  // 2. Update → deny
  const r2 = await fsFetch(`activityFeed/${id}`, { method: 'PATCH', token, body: event('tampered') });
  check('update of audit event is DENIED', r2.status === 403, `status ${r2.status}`);

  // 3. Delete → deny
  const r3 = await fsFetch(`activityFeed/${id}`, { method: 'DELETE', token });
  check('delete of audit event is DENIED', r3.status === 403, `status ${r3.status}`);

  // 4. Unauthenticated create → deny
  const r4 = await fsFetch('activityFeed', { method: 'POST', body: event('anon'), qs: `&documentId=anon-${Date.now()}` });
  check('unauthenticated create of audit event is DENIED', r4.status === 403, `status ${r4.status}`);

  // Same immutability spot-check on appointmentAudit
  const r5 = await fsFetch(`appointmentAudit/nonexistent-${Date.now()}`, { method: 'DELETE', token });
  check('delete on appointmentAudit is DENIED', r5.status === 403, `status ${r5.status}`);

  console.log(`\n${pass} passed, ${fail} failed`);
  console.log(`note: test event ${id} remains in activityFeed by design — audit rows cannot be deleted.`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('SUITE ERROR', e); process.exit(1); });
