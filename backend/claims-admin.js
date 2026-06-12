/**
 * Trusted clinic-claims administration tool (Sprint 15).
 * ─────────────────────────────────────────────────────────────────────────────
 * Mints Firebase custom claims (clinicId, role) for staff accounts and mirrors
 * them into the read-only `staffDirectory` Firestore collection for the Admin
 * UI. Claims are the authoritative, rules-enforced source of clinic access.
 *
 * TRUST BOUNDARY: this tool authenticates with the project OWNER's OAuth
 * credentials (the local firebase-tools login). It can never run in the
 * browser; clients cannot mint or alter claims. Custom claims only change
 * through this tool (or an equivalent server with admin credentials).
 *
 * Usage:
 *   node backend/claims-admin.js list
 *   node backend/claims-admin.js create <email> <password> <clinicId> <role>
 *   node backend/claims-admin.js assign <email> <clinicId> <role>
 *   node backend/claims-admin.js revoke <email>
 *
 * Valid clinicIds: winter-park | clermont | lake-nona | tampa-asc | network
 */
const os = require('os');
const path = require('path');

const PROJECT = 'ophthalmology-abd50';
const API = 'https://identitytoolkit.googleapis.com/v1';
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const CLINICS = ['winter-park', 'clermont', 'lake-nona', 'tampa-asc', 'network'];
const ROLES = ['admin', 'provider', 'billing', 'optical', 'scheduling', 'surgery'];

// Standard public OAuth client of the official firebase-tools CLI (not a secret).
const CLI_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLI_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

async function ownerToken() {
  const cfgPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const cfg = require(cfgPath);
  const rt = (cfg.tokens && cfg.tokens.refresh_token) || (cfg.user && cfg.user.refresh_token);
  if (!rt) throw new Error('No firebase-tools login found. Run `firebase login` as the project owner first.');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLI_ID, client_secret: CLI_SECRET, refresh_token: rt, grant_type: 'refresh_token' }).toString(),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('Owner token exchange failed: ' + JSON.stringify(j));
  return j.access_token;
}

async function idp(token, method, body) {
  const r = await fetch(`${API}/projects/${PROJECT}/${method}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (j.error) throw new Error(`${method}: ${j.error.message}`);
  return j;
}

async function lookupByEmail(token, email) {
  const j = await idp(token, 'accounts:lookup', { email: [email] });
  return j.users?.[0] ?? null;
}

/** Mirror a claims assignment into staffDirectory (admin-credentialed write bypasses client rules). */
async function mirror(token, email, fields) {
  const docId = email.replace(/[^a-zA-Z0-9]/g, '_');
  const body = { fields: Object.fromEntries(Object.entries({ email, ...fields, updatedAt: new Date().toISOString() })
    .map(([k, v]) => [k, typeof v === 'boolean' ? { booleanValue: v } : { stringValue: String(v) }])) };
  const r = await fetch(`${FS}/staffDirectory/${docId}`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`staffDirectory mirror failed: ${r.status}`);
}

async function setClaims(token, localId, claims) {
  await idp(token, 'accounts:update', { localId, customAttributes: JSON.stringify(claims) });
}

(async () => {
  const [, , cmd, ...args] = process.argv;
  const token = await ownerToken();

  if (cmd === 'list') {
    const r = await fetch(`${API}/projects/${PROJECT}/accounts:batchGet?maxResults=500`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await r.json();
    if (j.error) throw new Error('batchGet: ' + j.error.message);
    const users = (j.users ?? []).map((u) => ({
      email: u.email ?? `(anonymous ${u.localId.slice(0, 8)}…)`,
      claims: u.customAttributes ? JSON.parse(u.customAttributes) : null,
    }));
    const staff = users.filter((u) => u.claims);
    console.log(`${users.length} account(s); ${staff.length} with clinic claims:`);
    for (const u of staff) console.log(`  ${u.email}  →  clinic=${u.claims.clinicId}  role=${u.claims.role}`);
    return;
  }

  if (cmd === 'create') {
    const [email, password, clinicId, role] = args;
    if (!email || !password || !CLINICS.includes(clinicId) || !ROLES.includes(role)) {
      throw new Error(`Usage: create <email> <password> <clinicId ∈ ${CLINICS.join('|')}> <role ∈ ${ROLES.join('|')}>`);
    }
    const created = await idp(token, 'accounts', { email, password, emailVerified: true });
    await setClaims(token, created.localId, { clinicId, role });
    await mirror(token, email, { clinicId, role, active: true });
    console.log(`Created ${email} with claims { clinicId: ${clinicId}, role: ${role} }`);
    return;
  }

  if (cmd === 'assign') {
    const [email, clinicId, role] = args;
    if (!email || !CLINICS.includes(clinicId) || !ROLES.includes(role)) {
      throw new Error(`Usage: assign <email> <clinicId ∈ ${CLINICS.join('|')}> <role ∈ ${ROLES.join('|')}>`);
    }
    const user = await lookupByEmail(token, email);
    if (!user) throw new Error(`No account for ${email}`);
    await setClaims(token, user.localId, { clinicId, role });
    await mirror(token, email, { clinicId, role, active: true });
    console.log(`Assigned ${email} → { clinicId: ${clinicId}, role: ${role} }`);
    return;
  }

  if (cmd === 'revoke') {
    const [email] = args;
    const user = await lookupByEmail(token, email);
    if (!user) throw new Error(`No account for ${email}`);
    await idp(token, 'accounts:update', { localId: user.localId, customAttributes: '{}' });
    await mirror(token, email, { clinicId: '', role: '', active: false });
    console.log(`Revoked clinic claims for ${email}`);
    return;
  }

  console.log('Commands: list | create <email> <pw> <clinic> <role> | assign <email> <clinic> <role> | revoke <email>');
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
