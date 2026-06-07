import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { CanonicalPatient, PatientFlowRecord } from '../../core/models/enterprise.models';
import { EncounterService } from '../../core/services/encounter.service';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { PatientIdentityService } from '../../core/services/patient-identity.service';

type RegFilter =
  | 'all' | 'active-encounter' | 'demographic' | 'possible-duplicate'
  | 'needs-charting' | 'imaging-pending' | 'billing-blocker'
  | 'elevated-iop' | 'reduced-acuity' | 'glaucoma' | 'diabetic' | 'no-diagnosis';

@Component({
  selector: 'app-patients-page',
  imports: [],
  templateUrl: './patients-page.component.html',
  styleUrl: './patients-page.component.scss',
})
export class PatientsPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly enc = inject(EncounterService);
  protected readonly identity = inject(PatientIdentityService);
  private readonly router = inject(Router);

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
}
