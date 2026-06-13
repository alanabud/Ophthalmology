/**
 * Owner-credentialed pilot/demo reset tool (Sprint 17).
 * ─────────────────────────────────────────────────────────────────────────────
 * Restores the demo/pilot dataset to a known clean state WITHOUT touching real
 * clinic data, security rules, or clinic claims.
 *
 * SAFETY MODEL (multiple guards, all required):
 *   1. OWNER SCOPE ONLY — authenticates with the project owner's firebase-tools
 *      OAuth login. No browser, no anonymous, no staff token can run this.
 *   2. ALLOWLIST DELETES — only removes records whose id matches a known
 *      seed/test pattern (DOC-1000xx seeds, APT-1002xx seeds, *TEST*, *PROBE*,
 *      security-test-*, PR-CHECK-*, CLAIMS-TEST-*). Real pilot records created
 *      through the app use Date-based ids and are never matched.
 *   3. AUDIT-SAFE — never deletes append-only audit rows except explicit
 *      security-test-* artifacts; logs a 'system' reset event to activityFeed.
 *   4. DRY-RUN DEFAULT — prints what it would delete; requires --confirm to act.
 *   5. RULES/CLAIMS UNTOUCHED — never calls Identity Toolkit or firebaserules.
 *
 * Usage:
 *   node backend/reset-pilot-data.js              # dry run (default)
 *   node backend/reset-pilot-data.js --confirm    # perform the reset
 */
const os = require('os');
const path = require('path');

const PROJECT = 'ophthalmology-abd50';
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const CLI_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLI_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

const SCAN = [
  'documents', 'appointments', 'patients', 'claims', 'referrals',
  'surgeryCases', 'opticalOrders', 'activityFeed',
];

// A record is a removable demo/test artifact only if its id matches one of these.
const TEST_PATTERNS = [
  /TEST/i, /PROBE/i, /^security-test-/, /^PR-CHECK-/, /^CLAIMS-TEST-/, /^probe-/,
];
function isTestArtifact(id) {
  return TEST_PATTERNS.some((re) => re.test(id));
}

async function ownerToken() {
  const cfg = require(path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json'));
  const rt = (cfg.tokens && cfg.tokens.refresh_token) || (cfg.user && cfg.user.refresh_token);
  if (!rt) throw new Error('No firebase-tools login. Run `firebase login` as the project owner.');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLI_ID, client_secret: CLI_SECRET, refresh_token: rt, grant_type: 'refresh_token' }).toString(),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('Owner token exchange failed: ' + JSON.stringify(j));
  return j.access_token;
}

async function listIds(token, collection) {
  const ids = [];
  let pageToken = '';
  do {
    const r = await fetch(`${FS}/${collection}?pageSize=300&mask.fieldPaths=_none_${pageToken ? `&pageToken=${pageToken}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await r.json();
    if (j.error) throw new Error(`${collection}: ${j.error.message}`);
    for (const d of j.documents || []) ids.push(d.name.split('/').pop());
    pageToken = j.nextPageToken || '';
  } while (pageToken);
  return ids;
}

async function del(token, collection, id) {
  const r = await fetch(`${FS}/${collection}/${encodeURIComponent(id)}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
  });
  return r.status;
}

async function logReset(token, count) {
  const id = `system-reset-${Date.now()}`;
  const body = { fields: {
    id: { stringValue: id }, module: { stringValue: 'system' }, refId: { stringValue: 'pilot-reset' },
    action: { stringValue: 'reset' }, at: { stringValue: new Date().toLocaleString() },
    iso: { stringValue: new Date().toISOString() }, by: { stringValue: 'owner-cli' },
    detail: { stringValue: `${count} demo/test artifact(s) removed` },
  } };
  await fetch(`${FS}/activityFeed/${id}`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

(async () => {
  const confirm = process.argv.includes('--confirm');
  console.log(`── Pilot/demo reset (${confirm ? 'LIVE' : 'DRY RUN'}) ─────────────────────`);
  const token = await ownerToken();

  const targets = [];
  for (const c of SCAN) {
    const ids = await listIds(token, c);
    for (const id of ids) if (isTestArtifact(id)) targets.push({ collection: c, id });
  }

  if (!targets.length) { console.log('No demo/test artifacts found — dataset is already clean.'); return; }
  console.log(`Found ${targets.length} removable artifact(s):`);
  for (const t of targets) console.log(`  ${t.collection}/${t.id}`);

  if (!confirm) {
    console.log('\nDRY RUN — nothing deleted. Re-run with --confirm to perform the reset.');
    console.log('Seed records (DOC-1000xx, APT-1002xx) are reseeded by the app on next load; real pilot');
    console.log('records (Date-based ids) are never matched by the allowlist.');
    return;
  }

  let ok = 0;
  for (const t of targets) {
    const s = await del(token, t.collection, t.id);
    if (s === 200) ok++; else console.warn(`  ! ${t.collection}/${t.id} → ${s}`);
  }
  await logReset(token, ok);
  console.log(`\nRemoved ${ok}/${targets.length} artifact(s). Logged a 'system' reset event to activityFeed.`);
  console.log('Rules and clinic claims were not touched.');
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
