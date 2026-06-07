import { computed, inject, Injectable } from '@angular/core';

import { CanonicalPatient } from '../models/enterprise.models';
import { EnterpriseStoreService } from './enterprise-store.service';

export interface MatchScore { score: number; band: 'High' | 'Medium' | 'Low'; reasons: string[]; }

/**
 * PatientIdentityService (Sprint 8)
 * ─────────────────────────────────────────────────────────────────────────────
 * The single source of canonical patient identity. Resolves the demographic
 * roster and the clinically-active encounter dataset into one unified patient
 * list — deterministically linking by normalized name where possible, and
 * surfacing honest match statuses (never a silent merge) everywhere else.
 *
 *   One Patient → Many Encounters → Clinical / Imaging / Billing / Flow / History
 */
@Injectable({ providedIn: 'root' })
export class PatientIdentityService {
  private readonly store = inject(EnterpriseStoreService);

  private norm(name: string): string { return name.toLowerCase().replace(/[^a-z]/g, ''); }

  /** Loose similarity for "possible match" (shared surname + first initial). */
  private similar(a: string, b: string): boolean {
    const pa = a.toLowerCase().split(/\s+/), pb = b.toLowerCase().split(/\s+/);
    if (pa.length < 2 || pb.length < 2) return false;
    const lastA = pa[pa.length - 1], lastB = pb[pb.length - 1];
    return lastA === lastB && pa[0][0] === pb[0][0];
  }

  pairKey(a: string, b: string): string { return [a, b].sort().join('|'); }

  /** The unified canonical patient list — applies confirmed links + rejections. */
  readonly canonicalPatients = computed<CanonicalPatient[]>(() => {
    const roster = this.store.patients();
    const flow = this.store.patientFlow();
    const rosterByName = new Map(roster.map(r => [this.norm(r.fullName), r]));
    const usedRoster = new Set<string>();
    const out: CanonicalPatient[] = [];

    // Governance state.
    const confirmed = new Map<string, string>(); // flowId -> rosterId
    for (const m of this.store.identityMappings()) if (m.sourceType === 'roster') confirmed.set(m.canonicalPatientId, m.sourcePatientId);
    const rejected = new Set(
      this.store.identityDecisions().filter(d => d.decision === 'rejected').map(d => this.pairKey(d.candidateA, d.candidateB))
    );

    // 1) Clinically-active patients first — these carry encounter data.
    for (const f of flow) {
      const confirmRosterId = confirmed.get(f.id);
      const linkRoster = confirmRosterId ? roster.find(r => r.id === confirmRosterId) : rosterByName.get(this.norm(f.name));
      if (linkRoster) {
        usedRoster.add(linkRoster.id);
        out.push({
          id: f.id, canonicalMrn: f.mrn, legacyMrns: [linkRoster.mrn], name: f.name, age: f.age,
          insurance: f.insurance ?? linkRoster.insurance, flowId: f.id, rosterId: linkRoster.id,
          source: 'merged', matchStatus: 'linked', hasEncounter: true,
          dob: linkRoster.dob, status: linkRoster.status, lastEncounter: linkRoster.lastEncounter,
          nextVisit: linkRoster.nextVisit, balance: linkRoster.balance, careGap: linkRoster.careGap,
        });
      } else {
        const maybe = roster.find(r => !usedRoster.has(r.id) && this.similar(r.fullName, f.name) && !rejected.has(this.pairKey(f.id, r.id)));
        out.push({
          id: f.id, canonicalMrn: f.mrn, legacyMrns: maybe ? [maybe.mrn] : [], name: f.name, age: f.age,
          insurance: f.insurance, flowId: f.id, rosterId: maybe?.id,
          source: 'flow', matchStatus: maybe ? 'possible-match' : 'unmatched-encounter', hasEncounter: true,
        });
      }
    }

    // 2) Remaining roster patients — demographic-only, no active encounter.
    for (const r of roster) {
      if (usedRoster.has(r.id)) continue;
      out.push({
        id: r.id, canonicalMrn: r.mrn, legacyMrns: [], name: r.fullName,
        insurance: r.insurance, rosterId: r.id, source: 'registry',
        matchStatus: 'unmatched-roster', hasEncounter: false,
        dob: r.dob, status: r.status, lastEncounter: r.lastEncounter,
        nextVisit: r.nextVisit, balance: r.balance, careGap: r.careGap,
      });
    }

    // 3) Flag likely duplicate identities (same normalized name appears twice).
    const counts = new Map<string, number>();
    for (const c of out) counts.set(this.norm(c.name), (counts.get(this.norm(c.name)) ?? 0) + 1);
    for (const c of out) if ((counts.get(this.norm(c.name)) ?? 0) > 1) c.possibleDuplicate = true;

    return out;
  });

  /** Deterministic, explainable merge-confidence score. */
  scoreMatch(a: CanonicalPatient, b: CanonicalPatient): MatchScore {
    let score = 0; const reasons: string[] = [];
    if (this.norm(a.name) === this.norm(b.name)) { score += 40; reasons.push('Exact name match (+40)'); }
    else if (this.similar(a.name, b.name)) { score += 10; reasons.push('Same surname + first initial (+10)'); }
    else reasons.push('Name differs (0)');
    if (a.dob && b.dob) {
      if (a.dob === b.dob) { score += 30; reasons.push('DOB match (+30)'); }
      else { score -= 60; reasons.push('DOB conflict (−60)'); }
    }
    if (a.legacyMrns.includes(b.canonicalMrn) || b.legacyMrns.includes(a.canonicalMrn)) { score += 50; reasons.push('MRN cross-reference (+50)'); }
    score = Math.max(0, Math.min(100, score));
    return { score, band: score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low', reasons };
  }

  /** Candidate records from the opposite dataset to review for linking. */
  candidatesFor(a: CanonicalPatient): CanonicalPatient[] {
    const all = this.canonicalPatients();
    const rejected = new Set(
      this.store.identityDecisions().filter(d => d.decision === 'rejected').map(d => this.pairKey(d.candidateA, d.candidateB))
    );
    const wantEncounter = !a.hasEncounter; // demographic → look for clinical, and vice-versa
    return all
      .filter(b => b.id !== a.id && b.hasEncounter === wantEncounter && b.matchStatus !== 'linked')
      .filter(b => !rejected.has(this.pairKey(a.flowId ?? a.id, b.rosterId ?? b.flowId ?? b.id)))
      .sort((x, y) => this.scoreMatch(a, y).score - this.scoreMatch(a, x).score);
  }

  getCanonicalPatient(key: string): CanonicalPatient | null {
    return this.canonicalPatients().find(c =>
      c.id === key || c.canonicalMrn === key || c.flowId === key ||
      c.rosterId === key || c.legacyMrns.includes(key)
    ) ?? null;
  }

  // ── Identity resolution KPIs ────────────────────────────────────────────────
  readonly linkedCount = computed(() => this.canonicalPatients().filter(c => c.matchStatus === 'linked').length);
  readonly demographicOnlyCount = computed(() => this.canonicalPatients().filter(c => c.matchStatus === 'unmatched-roster').length);
  readonly needsReviewCount = computed(() => this.canonicalPatients().filter(c => c.matchStatus === 'unmatched-encounter').length);
  readonly possibleMatchCount = computed(() => this.canonicalPatients().filter(c => c.matchStatus === 'possible-match').length);
  readonly rejectedCount = computed(() => this.store.identityDecisions().filter(d => d.decision === 'rejected').length);

  /** Patients flagged as possible duplicate identities. */
  readonly possibleDuplicates = computed(() => this.canonicalPatients().filter(c => c.possibleDuplicate));

  matchStatusLabel(s: CanonicalPatient['matchStatus']): string {
    return ({
      linked: 'Linked', 'possible-match': 'Possible match',
      'unmatched-roster': 'Demographic only', 'unmatched-encounter': 'Clinical — needs review',
      merged: 'Merged',
    } as Record<string, string>)[s] ?? s;
  }
}
