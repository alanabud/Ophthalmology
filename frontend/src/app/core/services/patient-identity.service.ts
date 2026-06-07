import { computed, inject, Injectable } from '@angular/core';

import { CanonicalPatient } from '../models/enterprise.models';
import { EnterpriseStoreService } from './enterprise-store.service';

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

  /** The unified canonical patient list across both datasets. */
  readonly canonicalPatients = computed<CanonicalPatient[]>(() => {
    const roster = this.store.patients();
    const flow = this.store.patientFlow();
    const rosterByName = new Map(roster.map(r => [this.norm(r.fullName), r]));
    const usedRoster = new Set<string>();
    const out: CanonicalPatient[] = [];

    // 1) Clinically-active patients first — these carry encounter data.
    for (const f of flow) {
      const exact = rosterByName.get(this.norm(f.name));
      if (exact) {
        usedRoster.add(exact.id);
        out.push({
          id: f.id, canonicalMrn: f.mrn, legacyMrns: [exact.mrn], name: f.name, age: f.age,
          insurance: f.insurance ?? exact.insurance, flowId: f.id, rosterId: exact.id,
          source: 'merged', matchStatus: 'linked', hasEncounter: true,
          dob: exact.dob, status: exact.status, lastEncounter: exact.lastEncounter,
          nextVisit: exact.nextVisit, balance: exact.balance, careGap: exact.careGap,
        });
      } else {
        const maybe = roster.find(r => !usedRoster.has(r.id) && this.similar(r.fullName, f.name));
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

  getCanonicalPatient(key: string): CanonicalPatient | null {
    return this.canonicalPatients().find(c =>
      c.id === key || c.canonicalMrn === key || c.flowId === key ||
      c.rosterId === key || c.legacyMrns.includes(key)
    ) ?? null;
  }

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
