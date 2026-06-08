import { LowerCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { CanonicalPatient, PatientFlowRecord, PatientRecord, ReferralRecord } from '../../core/models/enterprise.models';
import { AuthStateService } from '../../core/services/auth-state.service';
import { EncounterService } from '../../core/services/encounter.service';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { PatientIdentityService } from '../../core/services/patient-identity.service';
import { NewPatientModalComponent } from '../../shared/ui/new-patient-modal.component';
import { ReferralModalComponent } from '../../shared/ui/referral-modal.component';

type RegFilter =
  | 'all' | 'active-encounter' | 'demographic' | 'possible-duplicate'
  | 'needs-charting' | 'imaging-pending' | 'billing-blocker'
  | 'elevated-iop' | 'reduced-acuity' | 'glaucoma' | 'diabetic' | 'no-diagnosis';

@Component({
  selector: 'app-patients-page',
  imports: [LowerCasePipe, NewPatientModalComponent, ReferralModalComponent],
  templateUrl: './patients-page.component.html',
  styleUrl: './patients-page.component.scss',
})
export class PatientsPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly enc = inject(EncounterService);
  protected readonly identity = inject(PatientIdentityService);
  private readonly auth = inject(AuthStateService);
  private readonly router = inject(Router);

  /** Identity governance is gated to supervisors / superusers. */
  protected readonly canGovern = computed(() =>
    this.auth.isSandboxSession() || this.auth.context()?.user.is_superuser === true
  );
  private reviewer(): string { return this.auth.displayName() || 'Supervisor'; }

  protected readonly query = signal('');
  protected readonly filter = signal<RegFilter>('all');
  protected setFilter(f: RegFilter): void { this.filter.set(f); }

  protected readonly chartTab = signal<'identity' | 'summary' | 'clinical' | 'imaging' | 'billing' | 'history'>('identity');
  protected setChartTab(t: 'identity' | 'summary' | 'clinical' | 'imaging' | 'billing' | 'history'): void { this.chartTab.set(t); }

  protected readonly selectedId = signal<string | null>(null);
  protected readonly selected = computed<CanonicalPatient | null>(() =>
    this.identity.canonicalPatients().find(c => c.id === this.selectedId()) ?? null
  );
  /** Flow record behind a canonical patient (clinical access point). */
  protected flowOf(c: CanonicalPatient | null): PatientFlowRecord | null {
    return c?.flowId ? (this.store.patientFlow().find(p => p.id === c.flowId) ?? null) : null;
  }

  // ── Operational helpers ─────────────────────────────────────────────────────
  protected imagingPending(p: PatientFlowRecord): boolean {
    const ws = this.store.imagingWork()[p.id];
    if (ws?.status && ws.status !== 'Interpreted') return true;
    return p.readinessItems.some(r => r.required && !r.done && /imag|biometr|topograph|oct|field/i.test(r.label));
  }
  private dxText(p: PatientFlowRecord): string {
    const cr = this.enc.clinicalFor(p.id);
    return [
      ...(cr?.diagnosis ?? []).map(d => `${d.icd10 ?? ''} ${d.description ?? ''}`),
      ...(cr?.ocularHistory ?? []), ...(cr?.systemicHistory ?? []),
    ].join(' ').toLowerCase();
  }

  // ── Canonical registry rows ─────────────────────────────────────────────────
  protected readonly rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const f = this.filter();
    return this.identity.canonicalPatients()
      .filter(c => {
        if (q && !(`${c.name} ${c.canonicalMrn} ${c.legacyMrns.join(' ')}`.toLowerCase().includes(q))) return false;
        const p = this.flowOf(c);
        switch (f) {
          case 'all': return true;
          case 'active-encounter': return c.hasEncounter && !!p && this.enc.nextStage(p) !== null;
          case 'demographic': return !c.hasEncounter;
          case 'possible-duplicate': return !!c.possibleDuplicate;
          case 'needs-charting': { if (!p) return false; const cr = this.enc.clinicalFor(p.id); return !cr || this.enc.missingClinical(cr).length > 0; }
          case 'imaging-pending': return !!p && this.imagingPending(p);
          case 'billing-blocker': return !!p && !this.enc.billingReady(p).ready;
          case 'elevated-iop': { const cr = p ? this.enc.clinicalFor(p.id) : null; return !!cr && Math.max(cr.iop?.od ?? 0, cr.iop?.os ?? 0) > 21; }
          case 'reduced-acuity': { const cr = p ? this.enc.clinicalFor(p.id) : null; const w = cr ? this.enc.worstVa(cr) : null; return !!w && Number(w.va.split('/')[1]) >= 50; }
          case 'glaucoma': return !!p && /glaucoma|h40/.test(this.dxText(p));
          case 'diabetic': return !!p && /diabet|e11|retinopathy/.test(this.dxText(p));
          case 'no-diagnosis': return !!p && !(this.enc.clinicalFor(p.id)?.diagnosis ?? []).some(d => d.icd10);
        }
      })
      .map(c => {
        const p = this.flowOf(c);
        return {
          c, p,
          clinical: p ? this.enc.clinicalFor(p.id) : null,
          badges: p ? this.enc.clinicalBadges(p.id) : [],
          risk: p ? this.enc.riskFlags(p).slice(0, 3) : [],
          next: p ? this.enc.nextStage(p) : null,
          progress: p ? this.enc.encounterProgressPct(p) : 0,
          billing: p ? this.enc.billingReady(p) : null,
          imaging: p ? this.imagingPending(p) : false,
        };
      });
  });

  /** Cap rendered cards for performance; search/filter narrows the set. */
  protected readonly visibleRows = computed(() => this.rows().slice(0, 150));
  protected readonly totalCount = computed(() => this.identity.canonicalPatients().length);

  protected readonly filterDefs: { id: RegFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active-encounter', label: 'Active encounter' },
    { id: 'demographic', label: 'Demographic only' },
    { id: 'possible-duplicate', label: 'Possible duplicate' },
    { id: 'needs-charting', label: 'Needs charting' },
    { id: 'imaging-pending', label: 'Imaging pending' },
    { id: 'billing-blocker', label: 'Billing blocker' },
    { id: 'elevated-iop', label: 'Elevated IOP' },
    { id: 'reduced-acuity', label: 'Reduced acuity' },
    { id: 'glaucoma', label: 'Glaucoma' },
    { id: 'diabetic', label: 'Diabetic' },
    { id: 'no-diagnosis', label: 'No diagnosis' },
  ];

  // ── KPIs ────────────────────────────────────────────────────────────────────
  protected readonly activeCount = computed(() => this.identity.canonicalPatients().filter(c => c.hasEncounter).length);
  protected readonly demographicCount = computed(() => this.identity.canonicalPatients().filter(c => !c.hasEncounter).length);
  protected readonly needsChartingCount = computed(() =>
    this.store.patientFlow().filter(p => { const c = this.enc.clinicalFor(p.id); return !c || this.enc.missingClinical(c).length > 0; }).length
  );
  protected readonly duplicateCount = computed(() => this.identity.possibleDuplicates().length);

  protected openChart(c: CanonicalPatient): void { this.selectedId.set(c.id); this.chartTab.set(c.hasEncounter ? 'summary' : 'identity'); }
  protected closeChart(): void { this.selectedId.set(null); }

  /** Reuse the single Command Center cockpit — no duplicate workflow. */
  protected openInCockpit(c: CanonicalPatient): void {
    if (!c.flowId) return;
    void this.router.navigate(['/command-center'], { queryParams: { patient: c.flowId } });
  }

  protected encounterOrders(p: PatientFlowRecord) { return this.enc.encounterFor(p.id)?.orders ?? []; }

  // ── Patient maintenance — reuse the premium 12-tab wizard for edit ──────────
  protected readonly editTarget = signal<PatientRecord | null>(null);
  protected hasRosterRecord(c: CanonicalPatient): boolean { return !!c.rosterId; }
  protected editPatient(c: CanonicalPatient): void {
    const rec = c.rosterId ? this.store.patients().find(p => p.id === c.rosterId) ?? null : null;
    if (rec) this.editTarget.set(rec);
  }
  protected closeEdit(): void { this.editTarget.set(null); }

  // ── Referrals maintenance (Sprint 9C) ───────────────────────────────────────
  protected readonly referrals = this.store.referralsList;
  protected readonly refOpen = signal(false);
  protected readonly refToEdit = signal<ReferralRecord | null>(null);
  protected newReferral(): void { this.refToEdit.set(null); this.refOpen.set(true); }
  protected editReferral(r: ReferralRecord): void { this.refToEdit.set(r); }
  protected closeReferral(): void { this.refOpen.set(false); this.refToEdit.set(null); }
  protected openCreate(): void {
    // Reuse the same wizard in create mode (header "New patient record").
    this.editTarget.set(null);
    this.createOpen.set(true);
  }
  protected readonly createOpen = signal(false);
  protected closeCreate(): void { this.createOpen.set(false); }

  protected openIssues(c: CanonicalPatient): string[] {
    const p = this.flowOf(c);
    if (!p) return [];
    const out: string[] = [];
    if (this.imagingPending(p)) out.push('Imaging pending');
    const b = this.enc.billingReady(p);
    out.push(b.ready ? 'Billing ready' : `Billing: ${b.blockers.length} blocker(s)`);
    if (p.urgent) out.push('Flagged urgent');
    return out;
  }

  // ── Identity governance: review / confirm / reject ──────────────────────────
  protected readonly reviewOpen = signal(false);
  protected readonly reviewA = signal<CanonicalPatient | null>(null);
  protected readonly reviewB = signal<CanonicalPatient | null>(null);
  protected readonly reviewReason = signal('');
  protected readonly candidateQuery = signal('');

  protected openReview(a: CanonicalPatient): void {
    this.reviewA.set(a);
    this.reviewB.set(a.rosterId && a.flowId ? null : null);
    this.reviewReason.set('');
    this.candidateQuery.set('');
    this.reviewOpen.set(true);
  }
  protected closeReview(): void { this.reviewOpen.set(false); this.reviewA.set(null); this.reviewB.set(null); }

  protected readonly candidates = computed(() => {
    const a = this.reviewA();
    if (!a) return [];
    const q = this.candidateQuery().trim().toLowerCase();
    return this.identity.candidatesFor(a).filter(b => !q || `${b.name} ${b.canonicalMrn}`.toLowerCase().includes(q)).slice(0, 30);
  });
  protected pickCandidate(b: CanonicalPatient): void { this.reviewB.set(b); }
  protected readonly reviewScore = computed(() => {
    const a = this.reviewA(), b = this.reviewB();
    return a && b ? this.identity.scoreMatch(a, b) : null;
  });

  private resolvePair(a: CanonicalPatient, b: CanonicalPatient): { flowP: CanonicalPatient; rosterP: CanonicalPatient } | null {
    const flowP = a.hasEncounter ? a : b;
    const rosterP = a.hasEncounter ? b : a;
    if (!flowP.flowId || !rosterP.rosterId) return null;
    return { flowP, rosterP };
  }

  protected confirmLink(): void {
    const a = this.reviewA(), b = this.reviewB();
    if (!a || !b || !this.canGovern() || !this.reviewReason().trim()) return;
    const pr = this.resolvePair(a, b);
    if (!pr) return;
    const iso = new Date().toISOString();
    const score = this.identity.scoreMatch(pr.flowP, pr.rosterP).score;
    this.store.confirmIdentityLink(
      {
        id: `map-${pr.flowP.flowId}-${pr.rosterP.rosterId}`,
        canonicalPatientId: pr.flowP.flowId!, sourceType: 'roster', sourcePatientId: pr.rosterP.rosterId!,
        legacyMrn: pr.rosterP.canonicalMrn, confidence: score, confirmedBy: this.reviewer(), confirmedAt: iso, auditReason: this.reviewReason().trim(),
      },
      {
        id: this.identity.pairKey(pr.flowP.flowId!, pr.rosterP.rosterId!),
        candidateA: pr.flowP.flowId!, candidateB: pr.rosterP.rosterId!, decision: 'confirmed',
        reason: this.reviewReason().trim(), confidence: score, reviewedBy: this.reviewer(), reviewedAt: iso,
      },
    );
    this.closeReview();
  }

  protected rejectMatch(): void {
    const a = this.reviewA(), b = this.reviewB();
    if (!a || !b || !this.canGovern() || !this.reviewReason().trim()) return;
    const pr = this.resolvePair(a, b);
    if (!pr) return;
    this.store.rejectIdentityMatch({
      id: this.identity.pairKey(pr.flowP.flowId!, pr.rosterP.rosterId!),
      candidateA: pr.flowP.flowId!, candidateB: pr.rosterP.rosterId!, decision: 'rejected',
      reason: this.reviewReason().trim(), reviewedBy: this.reviewer(), reviewedAt: new Date().toISOString(),
    });
    this.closeReview();
  }
}
