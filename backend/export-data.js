/**
 * Owner-credentialed Firestore export / backup tool (Sprint 17).
 * ─────────────────────────────────────────────────────────────────────────────
 * Exports every application + audit collection to timestamped JSON under
 * backups/, for pilot backup and offline inspection. Optionally scopes the
 * export to a single clinic (matching the clinic-isolation model).
 *
 * TRUST BOUNDARY: authenticates with the project OWNER's firebase-tools OAuth
 * login (same path as claims-admin.js). Read-only — never writes or deletes.
 *
 * Usage:
 *   node backend/export-data.js                 # full export, all clinics
 *   node backend/export-data.js --clinic clermont   # clinic-scoped export
 *   node backend/export-data.js --list          # list collections + counts only
 *
 * NOTE: This is a logical JSON export for pilot scale (hundreds of docs). For
 * production-scale backups use managed Firestore export to GCS — see
 * docs/BACKUP_RUNBOOK.md.
 */
const os = require('os');
const fs = require('fs');
const path = require('path');

const PROJECT = 'ophthalmology-abd50';
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const CLI_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLI_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

// Every collection the app persists (kept in sync with firestore.rules).
const APP_COLLECTIONS = [
  'patients', 'patientFlow', 'clinicalRecords', 'encounters', 'flowMoves',
  'appointments', 'waitlist', 'providers', 'locations',
  'claims', 'claimWork', 'insurancePayers', 'guarantors', 'glAccounts',
  'referrals', 'documents',
  'imagingStudies', 'imagingWork', 'surgeryCases', 'surgicalReadiness',
  'injectionSafety', 'opticalOrders', 'inventory',
  'canonicalIdentityMappings', 'identityMatchDecisions',
];
const AUDIT_COLLECTIONS = ['activityFeed', 'appointmentAudit', 'documentAudit', 'clinicalAudit'];
const REGISTRY_COLLECTIONS = ['staffDirectory'];
const ALL = [...APP_COLLECTIONS, ...AUDIT_COLLECTIONS, ...REGISTRY_COLLECTIONS];

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

/** Decode Firestore REST typed values into plain JS. */
function decode(fields = {}) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v);
  return out;
}
function decodeValue(v) {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('mapValue' in v) return decode(v.mapValue.fields || {});
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
  return null;
}

async function getAll(token, collection) {
  const docs = [];
  let pageToken = '';
  do {
    const url = `${FS}/${collection}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json();
    if (j.error) throw new Error(`${collection}: ${j.error.message}`);
    for (const d of j.documents || []) docs.push({ _id: d.name.split('/').pop(), ...decode(d.fields) });
    pageToken = j.nextPageToken || '';
  } while (pageToken);
  return docs;
}

(async () => {
  const args = process.argv.slice(2);
  const listOnly = args.includes('--list');
  const clinicIdx = args.indexOf('--clinic');
  const clinic = clinicIdx >= 0 ? args[clinicIdx + 1] : null;

  const token = await ownerToken();
  const bundle = { exportedAt: new Date().toISOString(), project: PROJECT, clinic: clinic || 'all', collections: {} };
  let grand = 0;

  for (const c of ALL) {
    let rows = await getAll(token, c);
    // Audit feeds carry no clinicId; never clinic-filter them (keeps the trail whole).
    if (clinic && APP_COLLECTIONS.includes(c)) rows = rows.filter((r) => !('clinicId' in r) || r.clinicId === clinic);
    bundle.collections[c] = rows;
    grand += rows.length;
    console.log(`  ${c.padEnd(26)} ${rows.length}`);
  }
  console.log(`  ${'TOTAL'.padEnd(26)} ${grand}`);

  if (listOnly) return;

  const dir = path.join(__dirname, '..', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `export-${clinic || 'all'}-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(bundle, null, 2));
  console.log(`\nWrote ${grand} documents → ${path.relative(path.join(__dirname, '..'), file)}`);
  console.log('Restore guidance: docs/BACKUP_RUNBOOK.md (restore is owner-only and overwrites by document id).');
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
