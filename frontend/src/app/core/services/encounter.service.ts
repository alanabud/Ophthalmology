import { inject, Injectable } from '@angular/core';

import {
  EncounterRecord, EncounterStageId, FlowStation,
  PatientClinicalRecord, PatientFlowRecord, StageStatus,
} from '../models/enterprise.models';
import { EnterpriseStoreService } from './enterprise-store.service';

export type RiskTone = 'critical' | 'warning' | 'info';
export interface RiskFlag { label: string; tone: RiskTone; }
export interface ClinicalBadge { label: string; tone: 'ok' | 'warning' | 'critical' | 'info'; }
export interface HistoryEntry { kind: 'clinical' | 'flow' | 'imaging' | 'billing' | 'encounter'; at: string; iso?: string; label: string; detail?: string; }

/**
 * The single encounter / clinical derivation engine.
 *
 * One patient · one encounter engine · one clinical record · one audit
 * history — accessed from the Command Center cockpit and the Patient
 * Registry alike. Pure read-only derivations over the store; no UI, no
 * editing state (those live in the cockpit component).
 */
@Injectable({ providedIn: 'root' })
export class EncounterService {
  private readonly store = inject(EnterpriseStoreService);

  // ── Record lookups (by flow patient id) ────────────────────────────────────
  clinicalFor(id: string): PatientClinicalRecord | null { return this.store.clinicalRecords()[id] ?? null; }
  encounterFor(id: string): EncounterRecord | null { return this.store.encounters()[id] ?? null; }

  /** Resolve a flow record by MRN — the bridge between Registry and encounter. */
  flowByMrn(mrn: string): PatientFlowRecord | null {
    return this.store.patientFlow().find(p => p.mrn === mrn) ?? null;
  }

  // ── Stations / SLA ──────────────────────────────────────────────────────────
  private readonly stationLabels: Record<FlowStation, string> = {
    'checked-in': 'Waiting room', 'tech-workup': 'Tech workup', 'imaging': 'Imaging',
    'dilating': 'Dilating', 'ready': 'Ready for doctor', 'with-doctor': 'In exam', 'checkout': 'Checkout',
  };
  stationLabel(s: FlowStation): string { return this.stationLabels[s] ?? s; }

  private readonly stageThresholds: Record<FlowStation, number> = {
    'checked-in': 15, 'tech-workup': 20, 'dilating': 30, 'imaging': 25, 'ready': 10, 'with-doctor': 30, 'checkout': 15,
  };
  slaForStage(p: PatientFlowRecord): { label: string; tone: 'ok' | 'warning' | 'critical' } {
    const t = this.stageThresholds[p.station] ?? 15;
    if (p.waitMinutes > t * 1.5) return { label: 'Overdue', tone: 'critical' };
    if (p.waitMinutes > t) return { label: 'At risk', tone: 'warning' };
    return { label: 'On time', tone: 'ok' };
  }

  // ── Clinical display helpers ────────────────────────────────────────────────
  allergyText(cr: PatientClinicalRecord | null): string { return (cr?.allergies ?? []).map(a => a.substance).join(', '); }
  medsText(cr: PatientClinicalRecord | null): string { return (cr?.medications ?? []).map(m => m.name).join(', '); }
  primaryDx(cr: PatientClinicalRecord | null): string {
    const d = (cr?.diagnosis ?? []).find(x => x.icd10 || x.description);
    return d ? `${d.icd10 ?? ''}${d.icd10 && d.description ? ' — ' : ''}${d.description ?? ''}` : '';
  }
  worstVa(cr: PatientClinicalRecord): { va: string; eye: string } | null {
    const od = cr.visualAcuity?.od, os = cr.visualAcuity?.os;
    const denom = (v?: string) => (v && v.includes('/') ? Number(v.split('/')[1]) : -1);
    if (!od && !os) return null;
    return denom(od) >= denom(os) ? { va: od!, eye: 'OD' } : { va: os!, eye: 'OS' };
  }
  missingClinical(cr: PatientClinicalRecord): string[] {
    const m: string[] = [];
    if (!cr.chiefComplaint) m.push('complaint');
    if (!cr.visualAcuity?.od && !cr.visualAcuity?.os) m.push('VA');
    if (cr.iop?.od == null && cr.iop?.os == null) m.push('IOP');
    if (!(cr.diagnosis ?? []).some(d => d.icd10)) m.push('diagnosis');
    if (!cr.assessmentPlan) m.push('plan');
    return m;
  }

  clinicalBadges(id: string): ClinicalBadge[] {
    const cr = this.clinicalFor(id);
    if (!cr) return [{ label: 'Needs charting', tone: 'info' }];
    const b: ClinicalBadge[] = [];
    const iopMax = Math.max(cr.iop?.od ?? 0, cr.iop?.os ?? 0);
    if (iopMax > 21) b.push({ label: 'IOP elevated', tone: 'critical' });
    if ((cr.allergies ?? []).some(a => a.substance && a.substance.toUpperCase() !== 'NKDA')) b.push({ label: 'Allergy alert', tone: 'warning' });
    if (!(cr.diagnosis ?? []).some(d => d.icd10)) b.push({ label: 'Needs diagnosis', tone: 'warning' });
    if (this.missingClinical(cr).length === 0) b.push({ label: 'Chart complete', tone: 'ok' });
    return b.length ? b : [{ label: 'Charted', tone: 'ok' }];
  }

  // ── Risk flags (EMR-driven, with imaging/billing reflection) ────────────────
  riskFlags(p: PatientFlowRecord): RiskFlag[] {
    const flags: RiskFlag[] = [];
    if (p.urgent) flags.push({ label: 'Flagged urgent', tone: 'critical' });

    const cr = this.clinicalFor(p.id);
    if (cr) {
      const iopMax = Math.max(cr.iop?.od ?? 0, cr.iop?.os ?? 0);
      if (iopMax > 21) flags.push({ label: `Elevated IOP ${iopMax} mmHg`, tone: 'critical' });
      const worst = this.worstVa(cr);
      if (worst && Number(worst.va.split('/')[1]) >= 50) flags.push({ label: `Reduced acuity ${worst.va} ${worst.eye}`, tone: 'warning' });
      if ((cr.allergies ?? []).some(a => a.substance && a.substance.toUpperCase() !== 'NKDA')) flags.push({ label: `Allergy: ${cr.allergies[0].substance}`, tone: 'warning' });
      const text = [
        ...(cr.diagnosis ?? []).map(d => `${d.icd10 ?? ''} ${d.description ?? ''}`),
        ...(cr.ocularHistory ?? []), ...(cr.systemicHistory ?? []),
      ].join(' ').toLowerCase();
      if (/glaucoma|h40/.test(text)) flags.push({ label: 'Glaucoma monitoring', tone: 'warning' });
      if (/diabet|e11|retinopathy/.test(text)) flags.push({ label: 'Diabetic eye risk', tone: 'warning' });
      const missing = this.missingClinical(cr);
      if (missing.length) flags.push({ label: `Incomplete chart — ${missing.join(', ')}`, tone: 'info' });
    } else {
      flags.push({ label: 'Not charted — clinical data missing', tone: 'info' });
    }

    const imgStatus = this.store.imagingWork()[p.id]?.status;
    const imgResolved = imgStatus === 'Interpreted' || imgStatus === 'Ready for review';
    if (!imgResolved && p.readinessItems.some(r => r.required && !r.done && /imag|biometr|topograph|oct|field/i.test(r.label)))
      flags.push({ label: 'Imaging / testing incomplete', tone: 'warning' });
    else if (imgStatus === 'Repeat requested') flags.push({ label: 'Imaging repeat requested', tone: 'warning' });

    const clmStatus = this.store.claimWork()[p.id]?.status;
    const clmResolved = clmStatus === 'Submitted' || clmStatus === 'Auth received' || clmStatus === 'Ready';
    if (!clmResolved) {
      if (p.authStatus === 'expired') flags.push({ label: 'Prior auth expired — blocker', tone: 'critical' });
      else if (p.authStatus === 'pending') flags.push({ label: 'Prior auth pending', tone: 'warning' });
    }
    return flags;
  }

  // ── Encounter stages ────────────────────────────────────────────────────────
  readonly encounterStages: { id: EncounterStageId; label: string }[] = [
    { id: 'checked-in', label: 'Checked In' }, { id: 'intake', label: 'Intake' },
    { id: 'pre-test', label: 'Pre-Test' }, { id: 'provider-exam', label: 'Provider Exam' },
    { id: 'assessment', label: 'Assessment / Plan' }, { id: 'orders', label: 'Orders' },
    { id: 'checkout', label: 'Checkout' }, { id: 'billing-ready', label: 'Billing Ready' },
  ];

  stageStatus(p: PatientFlowRecord, id: EncounterStageId): StageStatus {
    const e = this.encounterFor(p.id);
    const cr = this.clinicalFor(p.id);
    const hasVa = !!(cr?.visualAcuity?.od || cr?.visualAcuity?.os);
    const hasIop = cr?.iop?.od != null || cr?.iop?.os != null;
    const hasExam = !!cr && Object.values(cr.examFindings ?? {}).some(Boolean);
    const hasDx = !!(cr?.diagnosis ?? []).some(d => d.icd10);
    const hasPlan = !!cr?.assessmentPlan;
    switch (id) {
      case 'checked-in': return 'complete';
      case 'intake':
        if (e?.intake?.completedAt) return 'complete';
        return e?.intake && Object.keys(e.intake).length ? 'in-progress' : 'not-started';
      case 'pre-test':
        if (e?.workup?.completedAt && hasVa && hasIop) return 'complete';
        return hasVa || hasIop || e?.workup?.pupils ? 'in-progress' : 'not-started';
      case 'provider-exam':
        if (e?.examCompletedAt && hasExam) return 'complete';
        return hasExam ? 'in-progress' : 'not-started';
      case 'assessment':
        if (hasDx && hasPlan) return 'complete';
        return hasDx || hasPlan ? 'in-progress' : 'not-started';
      case 'orders':
        return (e?.orders?.length ?? 0) > 0 ? 'complete' : (hasDx && hasPlan ? 'in-progress' : 'not-started');
      case 'checkout':
        if (e?.checkout?.completedAt) return 'complete';
        return (hasDx && hasPlan && hasExam) ? 'in-progress' : 'blocked';
      case 'billing-ready':
        return this.billingReady(p).ready ? 'complete' : 'blocked';
    }
  }

  nextStage(p: PatientFlowRecord): { id: EncounterStageId; label: string } | null {
    return this.encounterStages.find(s => this.stageStatus(p, s.id) !== 'complete') ?? null;
  }
  encounterNextAction(p: PatientFlowRecord): string {
    const n = this.nextStage(p);
    if (!n) return 'Encounter complete — ready to bill';
    const map: Record<EncounterStageId, string> = {
      'checked-in': 'Check in patient', 'intake': 'Complete intake', 'pre-test': 'Capture VA & IOP',
      'provider-exam': 'Document provider exam', 'assessment': 'Add diagnosis & plan',
      'orders': 'Review / place orders', 'checkout': 'Complete checkout', 'billing-ready': 'Resolve billing blockers',
    };
    return map[n.id];
  }
  stageTone(s: StageStatus): 'ok' | 'info' | 'warning' | 'critical' | 'neutral' {
    return s === 'complete' ? 'ok' : s === 'in-progress' ? 'info' : s === 'blocked' ? 'critical' : 'neutral';
  }
  encounterProgressPct(p: PatientFlowRecord): number {
    const done = this.encounterStages.filter(s => this.stageStatus(p, s.id) === 'complete').length;
    return Math.round((done / this.encounterStages.length) * 100);
  }

  // ── Checkout / billing readiness ────────────────────────────────────────────
  checkoutItems(p: PatientFlowRecord): { label: string; ok: boolean }[] {
    const cr = this.clinicalFor(p.id);
    const e = this.encounterFor(p.id);
    const hasExam = !!cr && Object.values(cr.examFindings ?? {}).some(Boolean);
    const hasDx = !!(cr?.diagnosis ?? []).some(d => d.icd10);
    const hasPlan = !!cr?.assessmentPlan;
    const imagingOrders = (e?.orders ?? []).filter(o => o.type === 'imaging');
    return [
      { label: 'Provider exam documented', ok: hasExam },
      { label: 'Diagnosis coded', ok: hasDx },
      { label: 'Plan complete', ok: hasPlan },
      { label: imagingOrders.length ? `Imaging ordered (${imagingOrders.length})` : 'No imaging required', ok: true },
      { label: 'Prior auth not blocking', ok: p.authStatus !== 'expired' },
      { label: 'Billing ready', ok: this.billingReady(p).ready },
    ];
  }
  billingReady(p: PatientFlowRecord): { ready: boolean; blockers: string[] } {
    const cr = this.clinicalFor(p.id);
    const e = this.encounterFor(p.id);
    const blockers: string[] = [];
    if (!(cr?.diagnosis ?? []).some(d => d.icd10)) blockers.push('Diagnosis not coded');
    if (!cr?.assessmentPlan) blockers.push('Plan incomplete');
    if (!e?.checkout?.completedAt && p.station !== 'checkout') blockers.push('Checkout not completed');
    if (p.authStatus === 'expired') blockers.push('Prior auth expired');
    return { ready: blockers.length === 0, blockers };
  }

  // ── Unified, chronological patient history ──────────────────────────────────
  unifiedHistory(id: string): HistoryEntry[] {
    const out: HistoryEntry[] = [];
    for (const m of this.store.flowHistory()[id] ?? [])
      out.push({ kind: 'flow', at: m.at, iso: m.iso, label: `${this.stationLabel(m.from)} → ${this.stationLabel(m.to)}`, detail: m.skipped ? `skipped · ${m.reason ?? ''}` : undefined });
    for (const a of this.store.imagingWork()[id]?.audit ?? [])
      out.push({ kind: 'imaging', at: a.at, iso: a.iso, label: a.action, detail: a.detail });
    for (const a of this.store.claimWork()[id]?.audit ?? [])
      out.push({ kind: 'billing', at: a.at, iso: a.iso, label: a.action, detail: a.detail });
    for (const a of this.store.clinicalAudit()[id] ?? [])
      out.push({ kind: 'clinical', at: a.createdAt, iso: a.iso, label: 'Clinical update', detail: a.changedSections.join(', ') });
    for (const a of this.store.encounters()[id]?.audit ?? [])
      out.push({ kind: 'encounter', at: a.at, iso: a.iso, label: a.action, detail: a.detail });
    return out.sort((x, y) => (y.iso ?? '').localeCompare(x.iso ?? ''));
  }

  readonly examFields: { key: keyof PatientClinicalRecord['examFindings']; label: string }[] = [
    { key: 'lidsLashes', label: 'Lids / lashes' }, { key: 'conjunctiva', label: 'Conjunctiva' },
    { key: 'cornea', label: 'Cornea' }, { key: 'anteriorChamber', label: 'Ant. chamber' },
    { key: 'iris', label: 'Iris' }, { key: 'lens', label: 'Lens' },
    { key: 'vitreous', label: 'Vitreous' }, { key: 'opticNerve', label: 'Optic nerve' },
    { key: 'macula', label: 'Macula' }, { key: 'retina', label: 'Retina' },
    { key: 'vessels', label: 'Vessels' }, { key: 'periphery', label: 'Periphery' },
  ];
}
