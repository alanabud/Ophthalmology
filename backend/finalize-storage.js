/**
 * Storage finalization gate (Sprint 18 — pilot launch freeze).
 * ─────────────────────────────────────────────────────────────────────────────
 * One owner command to close the last readiness gate AFTER attaching Blaze and
 * provisioning the Storage bucket. It refuses to proceed (and explains exactly
 * what to do) until the bucket actually exists — it never fakes success.
 *
 * Sequence when the bucket is live:
 *   1. deploy storage.rules         (firebase deploy --only storage)
 *   2. run the storage deny-suite   (security-tests/test-rules-storage-documents.js)
 *   3. report PASS/FAIL and print the release-tag command for 12/0/0.
 *
 * Usage (project owner, after Blaze + Console → Build → Storage → Get Started):
 *   node backend/finalize-storage.js
 */
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT = 'ophthalmology-abd50';
const BUCKET = 'ophthalmology-abd50.firebasestorage.app';
const CLI_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLI_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';
const ROOT = path.join(__dirname, '..');

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

function step(n, msg) { console.log(`\n[${n}] ${msg}`); }

(async () => {
  console.log('── Storage finalization gate ────────────────────────────');
  const token = await ownerToken();

  // Preflight: billing + bucket must exist. Never proceed otherwise.
  const bill = await (await fetch(`https://cloudbilling.googleapis.com/v1/projects/${PROJECT}/billingInfo`, { headers: { Authorization: `Bearer ${token}` } })).json();
  const probe = await fetch(`https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o?maxResults=1`);

  if (probe.status === 404) {
    console.log('\nNOT READY — the Storage bucket does not exist yet.');
    console.log(`  billingEnabled: ${bill.billingEnabled === true}`);
    console.log('\nOwner steps to unblock (one-time):');
    if (!bill.billingEnabled) {
      console.log('  1. Firebase Console → upgrade project to the Blaze plan');
      console.log('     (free-tier quotas still apply; a billing account must be attached).');
    }
    console.log('  2. Console → Build → Storage → Get Started (accept default location).');
    console.log('  3. Re-run: node backend/finalize-storage.js');
    console.log('\nNothing was deployed. This tool will not fake a passing gate.');
    process.exit(0);
  }

  console.log(`  billingEnabled: ${bill.billingEnabled === true}`);
  console.log(`  bucket reachable: yes (status ${probe.status})`);

  step(1, 'Deploying storage.rules …');
  execSync(`firebase deploy --only storage --project ${PROJECT}`, { cwd: ROOT, stdio: 'inherit' });

  step(2, 'Running storage deny-suite …');
  let suiteOk = true;
  try {
    execSync('node security-tests/test-rules-storage-documents.js', { cwd: ROOT, stdio: 'inherit' });
  } catch { suiteOk = false; }

  step(3, suiteOk ? 'Storage gate PASSED.' : 'Storage suite FAILED — do not tag the release.');
  if (suiteOk) {
    console.log('\nReadiness board should now read 12 PASS · 0 FAIL · 0 ACTION REQUIRED.');
    console.log('Verify in the app at /admin/pilot-readiness, then tag the launch:');
    console.log('  git tag -a pilot-v1.0-ready -m "First-clinic pilot baseline: 12/0/0"');
    console.log('  git push origin pilot-v1.0-ready');
  }
  process.exit(suiteOk ? 0 : 1);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
