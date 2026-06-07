import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { PatientFlowRecord } from '../../core/models/enterprise.models';
import { EncounterService } from '../../core/services/encounter.service';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

type RegFilter =
  | 'all' | 'active-encounter' | 'needs-charting' | 'imaging-pending' | 'billing-blocker'
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
  private readonly router = inject(Router);

  protected readonly query = signal('');
  protected readonly filter = signal<RegFilter>('all');
  protected setFilter(f: RegFilter): void { this.filter.set(f); }

  protected readonly chartTab = signal<'summary' | 'clinical' | 'imaging' | 'billing' | 'history'>('summary');
  protected setChartTab(t: 'summary' | 'clinical' | 'imaging' | 'billing' | 'history'): void { this.chartTab.set(t); }

  protected readonly selectedId = signal<string | null>(null);
  protected readonly selected = computed(() =>
    this.store.patientFlow().find(p => p.id === this.selectedId()) ?? null
  );

  // ── Per-patient operational flags (derived from the single engine) ──────────
  protected imagingPending(p: PatientFlowRecord): boolean {
    const ws = this.store.imagingWork()[p.id];
    if (ws?.status && ws.status !== 'Interpreted') return true;
    return p.readinessItems.some(r => r.required && !r.done && /imag|biometr|topograph|oct|field/i.test(r.label));
  }
  private hasDx(p: PatientFlowRecord): boolean {
    return (this.enc.clinicalFor(p.id)?.diagnosis ?? []).some(d => d.icd10);
  }
  private dxText(p: PatientFlowRecord): string {
    const text = [
      ...(this.enc.clinicalFor(p.id)?.diagnosis ?? []).map(d => `${d.icd10 ?? ''} ${d.description ?? ''}`),
      ...(this.enc.clinicalFor(p.id)?.ocularHistory ?? []),
      ...(this.enc.clinicalFor(p.id)?.systemicHistory ?? []),
    ].join(' ').toLowerCase();
    return text;
  }

  // ── Registry rows (clinically-active patient set) ───────────────────────────
  protected readonly rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const f = this.filter();
    return this.store.patientFlow()
      .filter(p => {
        if (q && !(`${p.name} ${p.mrn} ${p.provider}`.toLowerCase().includes(q))) return false;
        const cr = this.enc.clinicalFor(p.id);
        switch (f) {
          case 'all': return true;
          case 'active-encounter': return this.enc.nextStage(p) !== null;
          case 'needs-charting': return !cr || this.enc.missingClinical(cr).length > 0;
          case 'imaging-pending': return this.imagingPending(p);
          case 'billing-blocker': return !this.enc.billingReady(p).ready;
          case 'elevated-iop': return !!cr && Math.max(cr.iop?.od ?? 0, cr.iop?.os ?? 0) > 21;
          case 'reduced-acuity': { const w = cr ? this.enc.worstVa(cr) : null; return !!w && Number(w.va.split('/')[1]) >= 50; }
          case 'glaucoma': return /glaucoma|h40/.test(this.dxText(p));
          case 'diabetic': return /diabet|e11|retinopathy/.test(this.dxText(p));
          case 'no-diagnosis': return !this.hasDx(p);
        }
      })
      .map(p => ({
        p,
        clinical: this.enc.clinicalFor(p.id),
        badges: this.enc.clinicalBadges(p.id),
        risk: this.enc.riskFlags(p).slice(0, 3),
        next: this.enc.nextStage(p),
        progress: this.enc.encounterProgressPct(p),
        billing: this.enc.billingReady(p),
        imaging: this.imagingPending(p),
      }));
  });

  protected readonly filterDefs: { id: RegFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active-encounter', label: 'Active encounter' },
    { id: 'needs-charting', label: 'Needs charting' },
    { id: 'imaging-pending', label: 'Imaging pending' },
    { id: 'billing-blocker', label: 'Billing blocker' },
    { id: 'elevated-iop', label: 'Elevated IOP' },
    { id: 'reduced-acuity', label: 'Reduced acuity' },
    { id: 'glaucoma', label: 'Glaucoma' },
    { id: 'diabetic', label: 'Diabetic' },
    { id: 'no-diagnosis', label: 'No diagnosis' },
  ];

  // ── Registry KPIs ───────────────────────────────────────────────────────────
  protected readonly activeCount = computed(() => this.store.patientFlow().filter(p => this.enc.nextStage(p)).length);
  protected readonly needsChartingCount = computed(() =>
    this.store.patientFlow().filter(p => { const c = this.enc.clinicalFor(p.id); return !c || this.enc.missingClinical(c).length > 0; }).length
  );
  protected readonly imagingPendingCount = computed(() => this.store.patientFlow().filter(p => this.imagingPending(p)).length);
  protected readonly billingBlockedCount = computed(() => this.store.patientFlow().filter(p => !this.enc.billingReady(p).ready).length);

  protected openChart(p: PatientFlowRecord): void { this.selectedId.set(p.id); this.chartTab.set('summary'); }
  protected closeChart(): void { this.selectedId.set(null); }

  /** Reuse the single Command Center cockpit for editing — no duplicate workflow. */
  protected openInCockpit(p: PatientFlowRecord): void {
    void this.router.navigate(['/command-center'], { queryParams: { patient: p.id } });
  }

  protected encounterOrders(p: PatientFlowRecord) { return this.enc.encounterFor(p.id)?.orders ?? []; }
}
