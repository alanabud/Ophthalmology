import { AfterViewInit, Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { ClaimRecord, PatientFlowRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { NewClaimModalComponent } from '../../shared/ui/new-claim-modal.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';
import { WorkFilter, WorkItem, WorkQueueComponent, WorkTone } from '../../shared/ui/work-queue.component';

type WorkQueue = 'all' | 'denial' | 'follow-up' | 'ready' | 'drafts';

@Component({
  selector: 'app-billing-page',
  imports: [FormsModule, NewClaimModalComponent, StatusChipComponent, WorkQueueComponent],
  templateUrl: './billing-page.component.html',
  styleUrl: './billing-page.component.scss'
})
export class BillingPageComponent implements AfterViewInit {
  protected readonly store = inject(EnterpriseStoreService);
  private readonly route = inject(ActivatedRoute);
  protected readonly claims = this.store.claims;
  protected readonly aiInsights = this.store.aiInsights;

  // ── Patient claim work queue (derived from encounter readiness) ────────────
  private readonly workQueueRef = viewChild(WorkQueueComponent);
  protected readonly clmFilter = signal<string>('all');
  protected setClmFilter(f: string): void { this.clmFilter.set(f); }

  private readonly diagnoses: Record<string, string> = {
    cataract: 'H25.13 — Nuclear cataract, bilateral',
    glaucoma: 'H40.11 — Primary open-angle glaucoma',
    retina: 'H35.32 — Wet AMD',
    injection: 'H35.32 — Wet AMD (anti-VEGF)',
    'post-op': 'Z98.4 — Pseudophakia, post-op',
    lasik: 'H52.13 — Myopia',
    comprehensive: 'Pending coding',
    optical: 'Pending coding',
  };

  private clmStatus(p: PatientFlowRecord): string {
    return this.store.claimWork()[p.id]?.status ?? 'Draft';
  }
  private clmTone(status: string, blockers: number): WorkTone {
    if (status === 'Submitted') return 'ok';
    if (status === 'On hold') return 'critical';
    if (status === 'Ready' || status === 'Auth received') return 'info';
    return blockers > 0 ? 'warning' : 'neutral';
  }

  protected readonly claimItemsAll = computed<WorkItem[]>(() =>
    this.store.patientFlow().map(p => {
      const ws = this.store.claimWork()[p.id];
      const status = this.clmStatus(p);
      // Diagnosis now sourced from the EMR clinical record where charted.
      const cr = this.store.clinicalRecords()[p.id];
      const charted = (cr?.diagnosis ?? []).find(d => d.icd10);
      const dx = charted
        ? `${charted.icd10}${charted.description ? ' — ' + charted.description : ''}`
        : 'Pending coding';
      const missingReadiness = p.readinessItems.filter(r => r.required && !r.done).map(r => r.label);
      // Work status resolves blockers as the biller advances the claim.
      const authResolved  = status === 'Auth received' || status === 'Ready' || status === 'Submitted';
      const billerCleared = status === 'Ready' || status === 'Submitted';
      const blockers: string[] = [];
      if (!billerCleared) {
        if (!authResolved && p.authStatus === 'expired') blockers.push('Prior auth expired');
        else if (!authResolved && p.authStatus === 'pending') blockers.push('Prior auth pending');
        if (dx.includes('Pending')) blockers.push('Diagnosis not coded');
        if (missingReadiness.length) blockers.push(`Readiness incomplete (${missingReadiness.length})`);
        if (p.station !== 'checkout') blockers.push('Encounter not checked out');
      }
      const tone = this.clmTone(status, blockers.length);
      return {
        id: p.id, name: p.name, mrn: p.mrn,
        line1: `${dx} · ${p.insurance ?? 'Self-pay'}`,
        status, statusTone: tone,
        fields: [
          { k: 'Provider', v: p.provider },
          { k: 'Insurance', v: p.insurance ?? 'Self-pay' },
          { k: 'Diagnosis', v: dx, tone: dx.includes('Pending') ? 'warning' : undefined },
          { k: 'Prior auth', v: p.authStatus ?? 'n/a', tone: p.authStatus === 'expired' ? 'critical' : p.authStatus === 'pending' ? 'warning' : 'ok' },
          { k: 'Checkout', v: p.station === 'checkout' ? 'Checked out' : 'Open', tone: p.station === 'checkout' ? 'ok' : 'warning' },
          { k: 'Procedure', v: p.visitType },
        ],
        blockers,
        checklist: p.readinessItems.map(r => ({ label: r.label, done: r.done, required: r.required })),
        notes: ws?.notes ?? [],
        audit: ws?.audit ?? [],
        actions: [
          { id: 'submitted', label: 'Mark submitted', tone: 'primary', disabled: status !== 'Ready' },
          { id: 'auth', label: 'Prior auth received', disabled: authResolved || p.authStatus === 'valid' },
          { id: 'ready', label: 'Mark claim ready', disabled: status === 'Ready' || status === 'Submitted' },
          { id: 'hold', label: 'Hold claim', tone: 'danger', disabled: status === 'On hold' },
        ],
      } as WorkItem;
    })
  );

  protected readonly claimFilters = computed<WorkFilter[]>(() => {
    const all = this.claimItemsAll();
    const count = (pred: (i: WorkItem) => boolean) => all.filter(pred).length;
    return [
      { id: 'all',            label: 'All',              count: all.length },
      { id: 'ready-to-bill',  label: 'Ready to bill',    count: count(i => i.blockers.length === 0 && i.status !== 'Submitted') },
      { id: 'prior-auth',     label: 'Prior-auth blocker', count: count(i => i.blockers.some(b => b.includes('auth'))) },
      { id: 'missing-dx',     label: 'Missing diagnosis', count: count(i => i.blockers.some(b => b.includes('Diagnosis'))) },
      { id: 'missing-readiness', label: 'Missing readiness', count: count(i => i.blockers.some(b => b.includes('Readiness'))) },
      { id: 'pending-checkout', label: 'Pending checkout', count: count(i => i.blockers.some(b => b.includes('checked out'))) },
      { id: 'denial-risk',    label: 'Denial risk',      count: count(i => i.statusTone === 'critical' || i.blockers.some(b => b.includes('expired'))) },
      { id: 'completed',      label: 'Completed',        count: count(i => i.status === 'Submitted') },
    ];
  });

  protected readonly claimItems = computed<WorkItem[]>(() => {
    const f = this.clmFilter();
    const all = this.claimItemsAll();
    switch (f) {
      case 'ready-to-bill':     return all.filter(i => i.blockers.length === 0 && i.status !== 'Submitted');
      case 'prior-auth':        return all.filter(i => i.blockers.some(b => b.includes('auth')));
      case 'missing-dx':        return all.filter(i => i.blockers.some(b => b.includes('Diagnosis')));
      case 'missing-readiness': return all.filter(i => i.blockers.some(b => b.includes('Readiness')));
      case 'pending-checkout':  return all.filter(i => i.blockers.some(b => b.includes('checked out')));
      case 'denial-risk':       return all.filter(i => i.statusTone === 'critical' || i.blockers.some(b => b.includes('expired')));
      case 'completed':         return all.filter(i => i.status === 'Submitted');
      default:                  return all;
    }
  });

  protected onClaimAction(e: { itemId: string; actionId: string }): void {
    if (e.actionId === 'hold') {
      const last = this.store.claimWork()[e.itemId]?.notes?.slice(-1)[0]?.text;
      this.store.setClaimStatus(e.itemId, 'On hold', 'Claim placed on hold', last ?? 'Awaiting documentation');
      return;
    }
    const status: Record<string, string> = { auth: 'Auth received', ready: 'Ready', submitted: 'Submitted' };
    const action: Record<string, string> = {
      auth: 'Prior authorization received', ready: 'Claim marked ready to bill', submitted: 'Claim submitted to payer',
    };
    this.store.setClaimStatus(e.itemId, status[e.actionId], action[e.actionId]);
  }
  protected onClaimNote(e: { itemId: string; text: string }): void {
    this.store.addClaimNote(e.itemId, e.text);
  }

  ngAfterViewInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const filter = qp.get('filter');
    if (filter) this.clmFilter.set(filter);
    const mrn = qp.get('patient');
    if (mrn) {
      const item = this.claimItemsAll().find(i => i.mrn === mrn);
      if (item) setTimeout(() => this.workQueueRef()?.openId(item.id), 0);
    }
  }

  /* ── Search / filter state ───────────────────────── */
  protected searchQuery  = '';
  protected filterPayer  = '';
  protected filterStatus = '';
  protected activeQueue  = signal<WorkQueue>('all');

  protected readonly filteredClaims = computed(() => {
    let list = this.claims();
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter((c) =>
        c.claim.toLowerCase().includes(q) ||
        c.patient.toLowerCase().includes(q) ||
        c.payer.toLowerCase().includes(q)
      );
    }
    if (this.filterPayer) {
      list = list.filter((c) => c.payer.toLowerCase().includes(this.filterPayer.toLowerCase()));
    }
    if (this.filterStatus) {
      list = list.filter((c) => c.status === this.filterStatus);
    }
    const q2 = this.activeQueue();
    if (q2 === 'denial')   list = list.filter((c) => c.status === 'Denied' || c.status === 'Rejected');
    if (q2 === 'follow-up') list = list.filter((c) => c.denialRisk === 'High' || c.denialRisk === 'Medium');
    if (q2 === 'ready')    list = list.filter((c) => c.status === 'Ready to submit' || c.status === 'Draft');
    if (q2 === 'drafts')   list = list.filter((c) => c.status === 'Draft');
    return list;
  });

  /* ── KPI helpers ──────────────────────────────────── */
  protected readonly totalOutstanding = computed(() => {
    const total = this.claims()
      .filter((c) => c.status !== 'Paid' && c.status !== 'Voided')
      .reduce((sum, c) => {
        const amt = parseFloat((c.balanceDue ?? c.amount ?? '0').replace(/[$,]/g, ''));
        return sum + (isNaN(amt) ? 0 : amt);
      }, 0);
    return total >= 1000
      ? `$${(total / 1000).toFixed(1)}K`
      : `$${total.toFixed(2)}`;
  });

  protected readonly denialRatePct = computed(() => {
    const total = this.claims().length;
    if (!total) return '0.0%';
    const denied = this.claims().filter((c) => c.status === 'Denied' || c.status === 'Rejected').length;
    return `${((denied / total) * 100).toFixed(1)}%`;
  });

  protected readonly readyToSubmit = computed(() =>
    this.claims().filter((c) => c.status === 'Ready to submit' || c.status === 'Draft').length
  );
  protected readonly deniedCount = computed(() =>
    this.claims().filter((c) => c.status === 'Denied' || c.status === 'Rejected').length
  );
  protected readonly followUpDue = computed(() =>
    this.claims().filter((c) => c.denialRisk === 'High').length
  );

  /* ── Aging buckets computed from claims ───────────── */
  protected readonly agingBuckets = computed(() => {
    const buckets = [
      { label: '0–30 days', maxDays: 30, min: 0 },
      { label: '31–60 days', maxDays: 60, min: 31 },
      { label: '61–90 days', maxDays: 90, min: 61 },
      { label: '90+ days', maxDays: Infinity, min: 91 },
    ];
    const unpaid = this.claims().filter((c) => c.status !== 'Paid' && c.status !== 'Voided');
    const today = new Date();
    const rows = buckets.map((b) => {
      const inBucket = unpaid.filter((c) => {
        if (!c.dateOfService) return b.min === 0;
        const dos = new Date(c.dateOfService);
        const days = Math.floor((today.getTime() - dos.getTime()) / 86400000);
        return days >= b.min && days <= b.maxDays;
      });
      const total = inBucket.reduce((sum, c) => {
        const amt = parseFloat((c.balanceDue ?? c.amount ?? '0').replace(/[$,]/g, ''));
        return sum + (isNaN(amt) ? 0 : amt);
      }, 0);
      return { label: b.label, amount: total, count: inBucket.length };
    });
    const grandTotal = rows.reduce((s, r) => s + r.amount, 0) || 1;
    return rows.map((r) => ({
      ...r,
      pct: Math.round((r.amount / grandTotal) * 100),
      display: r.amount >= 1000 ? `$${(r.amount / 1000).toFixed(1)}K` : `$${r.amount.toFixed(0)}`,
    }));
  });

  /* ── Modal state ──────────────────────────────────── */
  protected readonly claimModalOpen   = signal(false);
  protected readonly claimToEdit      = signal<ClaimRecord | null>(null);
  protected readonly viewOpen         = signal(false);
  protected readonly selectedClaim    = signal<ClaimRecord | null>(null);

  protected openCreate(): void {
    this.claimToEdit.set(null);
    this.claimModalOpen.set(true);
  }

  protected openEdit(claim: ClaimRecord): void {
    this.claimToEdit.set(claim);
    this.claimModalOpen.set(true);
  }

  protected viewClaim(claim: ClaimRecord): void {
    this.selectedClaim.set(claim);
    this.viewOpen.set(true);
  }

  protected closeView(): void {
    this.viewOpen.set(false);
    this.selectedClaim.set(null);
  }

  protected submitClaim(claim: ClaimRecord): void {
    this.store.submitClaim(claim.claim);
  }

  protected setQueue(q: WorkQueue): void {
    this.activeQueue.set(q);
  }
}
