import { computed, inject, Injectable, signal } from '@angular/core';

import { TokenPairResponse } from '../models/auth.models';
import { ACTION_QUEUE, AI_BRIEF_ACTIONS, AI_BRIEF_SIGNALS, AI_INSIGHTS, COMMAND_SIGNALS, DAILY_BRIEFINGS, EXECUTIVE_METRICS, LIVE_BOARDS, OPERATIONS_MATRIX } from '../data/command-center.data';
import { CLINICS, PROVIDERS, SYSTEM_INDICATORS, ALERTS, QUICK_ACTIONS } from '../data/context.data';
import { ENCOUNTERS } from '../data/encounters.data';
import { IMAGING_STUDIES } from '../data/imaging.data';
import { INTEGRATIONS } from '../data/integrations.data';
import { INVENTORY } from '../data/inventory.data';
import { OPTICAL_ORDERS } from '../data/optical.data';
import { PATIENTS, PATIENT_BRIEFINGS } from '../data/patients.data';
import { WAITLIST } from '../data/scheduling.data';
import { SURGERY_CASES } from '../data/surgery.data';
import { CLAIMS } from '../data/billing.data';
import { COMPLIANCE_EVENTS } from '../data/compliance.data';
import { ANALYTICS_POINTS, PROVIDER_PRODUCTIVITY, ROLE_MATRIX } from '../data/analytics.data';
import { NAVIGATION_SECTIONS } from '../data/navigation.data';
import { AI_DAILY_BRIEFING, COCKPIT_IMAGING_QUEUE, INJECTION_SAFETY, PATIENT_FLOW, SURGICAL_READINESS } from '../data/clinic-today.data';
import { firebaseAuthReady } from '../config/firebase.config';
import { FirestoreService } from './firestore.service';
import {
  ActivityEvent,
  AiBriefingItem,
  AppointmentAudit,
  AppointmentRecord,
  ClaimRecord,
  CanonicalIdentityMapping,
  ClinicalAuditEntry,
  CockpitImagingItem,
  DocumentAudit,
  DocumentRecord,
  EncounterOrder,
  EncounterRecord,
  GLAccountRecord,
  GuarantorRecord,
  ReferralRecord,
  IdentityMatchDecision,
  InsuranceRecord,
  LocationRecord,
  ProviderRecord,
  FlowMove,
  FlowStation,
  PatientClinicalRecord,
  ImagingStudy,
  InjectionSafetyRecord,
  InventoryRecord,
  OpticalOrder,
  PatientFlowRecord,
  PatientRecord,
  ProviderContext,
  RoleMatrixItem,
  SurgeryCase,
  SurgicalReadinessCase,
  WaitlistRecord,
  WorkItemState,
} from '../models/enterprise.models';

function clinicMatches(clinicId: string, activeClinicId: string): boolean {
  return activeClinicId === 'network' || clinicId === activeClinicId;
}

/** Build a full AppointmentRecord from a partial (wide model — defaults the rest). */
function mkAppt(p: Partial<AppointmentRecord> & Pick<AppointmentRecord, 'id' | 'clinicId' | 'patient'>): AppointmentRecord {
  return {
    appointmentType: '', visitCategory: '', status: 'Scheduled', tone: 'neutral', priority: 'Routine',
    date: '', startTime: '', endTime: '', duration: '30 min', provider: '', secondaryProvider: '', room: '', lane: '', specialty: '',
    mrn: '', dob: '', phone: '', email: '', laterality: '', visitReason: '', chiefComplaint: '', referringProvider: '',
    recallType: '', recallInterval: '', linkedEncounterId: '', preOpNotes: '', primaryPayer: '', memberId: '',
    eligibilityStatus: '', eligibilityVerifiedDate: '', authRequired: false, authNumber: '', authValidFrom: '', authValidTo: '', referralNumber: '',
    copayCollected: false, copayAmount: '', consentSigned: false, hipaaAcknowledged: false, idVerified: false, insuranceCardCopied: false,
    medicalHistoryReviewed: false, medicationsReviewed: false, allergiesReviewed: false, specialPrep: '', patientArrivalTime: '',
    createdBy: '', createdOn: '', confirmedBy: '', confirmedOn: '', cancelReason: '', noShowReason: '', internalNotes: '',
    ...p,
  };
}

/** Derive a safe Firestore document ID from any string (strip illegal chars). */
function toDocId(raw: string): string {
  return raw.replace(/[\/\.#$\[\]]/g, '-').slice(0, 60);
}

@Injectable({ providedIn: 'root' })
export class EnterpriseStoreService {
  private readonly fs = inject(FirestoreService);

  // ── Firestore status ───────────────────────────────────────────────────────
  /** true once the initial Firestore seed+load cycle completes */
  readonly firestoreReady   = signal(false);
  /** non-null when Firestore is unavailable; app continues with local data */
  readonly firestoreError   = signal<string | null>(null);

  readonly organizationName = 'Acuity Eye Network';
  readonly environmentLabel = 'Sandbox';
  readonly navigationSections = signal(NAVIGATION_SECTIONS);
  readonly clinics = signal(CLINICS);
  readonly providers = signal(PROVIDERS);
  readonly systemIndicators = signal(SYSTEM_INDICATORS);
  readonly notifications = signal(ALERTS);
  readonly quickActions = signal(QUICK_ACTIONS);
  readonly patientBriefings = signal(PATIENT_BRIEFINGS);
  readonly analyticsPoints = signal(ANALYTICS_POINTS);
  readonly roleMatrix = signal<RoleMatrixItem[]>([...ROLE_MATRIX]);
  readonly activeClinicId = signal('network');
  readonly activeProviderId = signal('all');
  readonly selectedDate = signal('2026-03-06');
  readonly aiWorkspaceOpen = signal(true);

  readonly clinicOptions = computed(() => this.clinics());
  readonly providerOptions = computed(() => {
    const clinicId = this.activeClinicId();
    const filtered = clinicId === 'network'
      ? this.providers()
      : this.providers().filter((provider) => provider.clinicId === clinicId);

    const allProviders: ProviderContext = {
      id: 'all',
      clinicId,
      shortLabel: 'ALL',
      name: 'All providers',
      specialty: 'Network view',
      status: 'Mixed',
      utilization: 0,
      room: '-',
      nextSlot: '-'
    };

    return [allProviders, ...filtered];
  });

  readonly currentClinic = computed(
    () => this.clinics().find((clinic) => clinic.id === this.activeClinicId()) ?? this.clinics()[0]
  );
  readonly currentProvider = computed(
    () => this.providerOptions().find((provider) => provider.id === this.activeProviderId()) ?? this.providerOptions()[0]
  );
  readonly executiveMetrics = computed(() => EXECUTIVE_METRICS[this.activeClinicId()] ?? EXECUTIVE_METRICS['network']);
  readonly liveBoards = computed(() => LIVE_BOARDS[this.activeClinicId()] ?? LIVE_BOARDS['network']);
  readonly dailyBriefing = computed(() => DAILY_BRIEFINGS[this.activeClinicId()] ?? DAILY_BRIEFINGS['network']);
  readonly aiInsights = computed(() => AI_INSIGHTS[this.activeClinicId()] ?? AI_INSIGHTS['network']);
  readonly aiBriefSignals = computed(() => AI_BRIEF_SIGNALS[this.activeClinicId()] ?? AI_BRIEF_SIGNALS['network']);
  readonly aiBriefActions = computed(() => AI_BRIEF_ACTIONS[this.activeClinicId()] ?? AI_BRIEF_ACTIONS['network']);
  readonly commandSignals = computed(() => COMMAND_SIGNALS[this.activeClinicId()] ?? COMMAND_SIGNALS['network']);
  readonly operationsMatrix = computed(() => {
    const activeClinicId = this.activeClinicId();
    return activeClinicId === 'network'
      ? OPERATIONS_MATRIX
      : [
          ...OPERATIONS_MATRIX.filter((row) => row.clinicId === activeClinicId),
          ...OPERATIONS_MATRIX.filter((row) => row.clinicId !== activeClinicId)
        ];
  });
  readonly actionQueue = computed(() => ACTION_QUEUE[this.activeClinicId()] ?? ACTION_QUEUE['network']);

  // ── Patients ───────────────────────────────────────────────────────────────
  private readonly patientsBase = signal<PatientRecord[]>([...PATIENTS]);
  readonly patients = computed(() => this.patientsBase().filter((r) => clinicMatches(r.clinicId, this.activeClinicId())));

  // ── Scheduling ─────────────────────────────────────────────────────────────
  // The static SCHEDULE_LANES demo board was retired in Sprint 11 — every
  // schedule surface now derives from the persisted `appointments` collection.
  private readonly waitlistBase = signal<WaitlistRecord[]>([...WAITLIST]);
  readonly waitlist = computed(() => this.waitlistBase().filter((r) => clinicMatches(r.clinicId, this.activeClinicId())));

  // ── Encounters ─────────────────────────────────────────────────────────────
  readonly encounterWorkspace = computed(
    () => ENCOUNTERS.find((r) => clinicMatches(r.clinicId, this.activeClinicId())) ?? ENCOUNTERS[0]
  );

  // ── Imaging ────────────────────────────────────────────────────────────────
  private readonly imagingStudiesBase = signal<ImagingStudy[]>([...IMAGING_STUDIES]);
  readonly imagingStudies = computed(() => this.imagingStudiesBase().filter((r) => clinicMatches(r.clinicId, this.activeClinicId())));

  // ── Surgery ────────────────────────────────────────────────────────────────
  private readonly surgeryCasesBase = signal<SurgeryCase[]>([...SURGERY_CASES]);
  readonly surgeryCases = computed(() => this.surgeryCasesBase().filter((r) => clinicMatches(r.clinicId, this.activeClinicId())));

  // ── Optical ────────────────────────────────────────────────────────────────
  private readonly opticalOrdersBase = signal<OpticalOrder[]>([...OPTICAL_ORDERS]);
  readonly opticalOrders = computed(() => this.opticalOrdersBase().filter((r) => clinicMatches(r.clinicId, this.activeClinicId())));

  // ── Billing ────────────────────────────────────────────────────────────────
  private readonly claimsBase = signal<ClaimRecord[]>([...CLAIMS]);
  readonly claims = computed(() => this.claimsBase().filter((r) => clinicMatches(r.clinicId, this.activeClinicId())));

  // ── Doctor Cockpit ─────────────────────────────────────────────────────────
  private readonly patientFlowBase = signal<PatientFlowRecord[]>([...PATIENT_FLOW]);
  readonly patientFlow = computed(() => this.patientFlowBase().filter((r) => clinicMatches(r.clinicId, this.activeClinicId())));
  readonly cockpitImagingQueue = signal<CockpitImagingItem[]>([...COCKPIT_IMAGING_QUEUE]);
  readonly surgicalReadiness = signal<SurgicalReadinessCase[]>([...SURGICAL_READINESS]);
  readonly injectionSafety = signal<InjectionSafetyRecord[]>([...INJECTION_SAFETY]);
  readonly aiDailyBriefing = signal<AiBriefingItem[]>([...AI_DAILY_BRIEFING]);

  // ── Live Patient Flow: stage movement + audit trail ────────────────────────
  private readonly flowHistoryBase = signal<Record<string, FlowMove[]>>({});
  readonly flowHistory = this.flowHistoryBase.asReadonly();
  private moveSeq = 0;

  /** Drop undefined keys so Firestore (which rejects undefined) accepts the doc. */
  private sanitize<T extends object>(obj: T): T {
    return JSON.parse(JSON.stringify(obj)) as T;
  }

  /** Best-effort Firestore persistence — never blocks or throws into the UI. */
  private persistFlowRecord(rec: PatientFlowRecord): void {
    void this.fs.upsert('patientFlow', rec.id, this.sanitize(rec))
      .catch((e) => console.warn('[Store] flow persist failed', e?.message ?? e));
  }
  private persistFlowMove(move: FlowMove): void {
    void this.fs.upsert('flowMoves', move.id!, this.sanitize(move))
      .catch((e) => console.warn('[Store] move persist failed', e?.message ?? e));
  }

  /**
   * Move a patient to a new stage. Resets their elapsed time in stage,
   * stamps an arrival time, records an immutable audit entry, and persists
   * both the record and the move to Firestore. KPIs recompute reactively.
   */
  movePatientStation(id: string, to: FlowStation, opts?: { skipped?: boolean; reason?: string }): void {
    const at = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    let move: FlowMove | null = null;
    let moved: PatientFlowRecord | null = null;

    this.patientFlowBase.update((list) =>
      list.map((p) => {
        if (p.id !== id || p.station === to) return p;
        move = {
          id: `${id}-${Date.now()}-${++this.moveSeq}`, patientId: id,
          at, iso: this.nowIso(), from: p.station, to, skipped: opts?.skipped ?? false, reason: opts?.reason,
        };
        moved = { ...p, station: to, waitMinutes: 0, arrivedAt: at };
        return moved;
      })
    );

    if (move && moved) {
      this.flowHistoryBase.update((h) => ({ ...h, [id]: [...(h[id] ?? []), move!] }));
      this.persistFlowRecord(moved);
      this.persistFlowMove(move);
    }
  }

  /** Backwards-compatible single-step update — now also logs to the audit trail. */
  updatePatientFlowStation(id: string, station: FlowStation): void {
    this.movePatientStation(id, station);
  }

  /** Toggle a patient's urgent flag (persisted). */
  setPatientUrgent(id: string, urgent: boolean): void {
    let updated: PatientFlowRecord | null = null;
    this.patientFlowBase.update((list) =>
      list.map((p) => (p.id === id ? (updated = { ...p, urgent }) : p))
    );
    if (updated) this.persistFlowRecord(updated);
  }

  /** Append a clinical note to a patient's encounter (persisted). */
  addClinicalNote(id: string, text: string, author = 'Sandbox User'): void {
    const at = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    let updated: PatientFlowRecord | null = null;
    this.patientFlowBase.update((list) =>
      list.map((p) => {
        if (p.id !== id) return p;
        updated = { ...p, notes: [...(p.notes ?? []), { at, author, text }] };
        return updated;
      })
    );
    if (updated) this.persistFlowRecord(updated);
  }

  // ── Imaging & claim work state (module drilldowns, persisted) ──────────────
  private readonly imagingWorkBase = signal<Record<string, WorkItemState>>({});
  readonly imagingWork = this.imagingWorkBase.asReadonly();
  private readonly claimWorkBase = signal<Record<string, WorkItemState>>({});
  readonly claimWork = this.claimWorkBase.asReadonly();

  private nowStamp(): string {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  private nowIso(): string { return new Date().toISOString(); }

  private mutateWork(
    base: typeof this.imagingWorkBase,
    collection: 'imagingWork' | 'claimWork',
    id: string,
    fn: (s: WorkItemState) => WorkItemState,
  ): void {
    let next: WorkItemState | null = null;
    base.update((map) => {
      const cur: WorkItemState = map[id] ?? { id, notes: [], audit: [] };
      next = fn({ ...cur, notes: cur.notes ?? [], audit: cur.audit ?? [] });
      return { ...map, [id]: next };
    });
    if (next) {
      void this.fs.upsert(collection, id, this.sanitize(next))
        .catch((e) => console.warn(`[Store] ${collection} persist failed`, e?.message ?? e));
    }
  }

  setImagingStatus(id: string, status: string, action: string): void {
    this.mutateWork(this.imagingWorkBase, 'imagingWork', id, (s) => ({
      ...s, status, audit: [...(s.audit ?? []), { at: this.nowStamp(), iso: this.nowIso(), action }],
    }));
  }
  addImagingNote(id: string, text: string, author = 'Sandbox User'): void {
    this.mutateWork(this.imagingWorkBase, 'imagingWork', id, (s) => ({
      ...s,
      notes: [...(s.notes ?? []), { at: this.nowStamp(), author, text }],
      audit: [...(s.audit ?? []), { at: this.nowStamp(), iso: this.nowIso(), action: 'Note added' }],
    }));
  }

  setClaimStatus(id: string, status: string, action: string, holdReason?: string): void {
    this.mutateWork(this.claimWorkBase, 'claimWork', id, (s) => ({
      ...s, status, holdReason: holdReason ?? s.holdReason,
      audit: [...(s.audit ?? []), { at: this.nowStamp(), iso: this.nowIso(), action, detail: holdReason }],
    }));
  }
  addClaimNote(id: string, text: string, author = 'Sandbox User'): void {
    this.mutateWork(this.claimWorkBase, 'claimWork', id, (s) => ({
      ...s,
      notes: [...(s.notes ?? []), { at: this.nowStamp(), author, text }],
      audit: [...(s.audit ?? []), { at: this.nowStamp(), iso: this.nowIso(), action: 'Billing note added' }],
    }));
  }

  // ── EMR clinical records (persisted, editable) ─────────────────────────────
  private readonly clinicalBase = signal<Record<string, PatientClinicalRecord>>({});
  readonly clinicalRecords = this.clinicalBase.asReadonly();
  private readonly clinicalAuditBase = signal<Record<string, ClinicalAuditEntry[]>>({});
  readonly clinicalAudit = this.clinicalAuditBase.asReadonly();

  /** Save a clinical record + emit a clinical audit entry (both persisted). */
  saveClinicalRecord(rec: PatientClinicalRecord, changedSections: string[], author = 'Sandbox User'): void {
    const next: PatientClinicalRecord = {
      ...rec,
      updatedAt: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      updatedBy: author,
    };
    this.clinicalBase.update((m) => ({ ...m, [rec.patientId]: next }));
    void this.fs.upsert('clinicalRecords', rec.patientId, this.sanitize(next))
      .catch((e) => console.warn('[Store] clinical persist failed', e?.message ?? e));

    const entry: ClinicalAuditEntry = {
      id: `${rec.patientId}-${Date.now()}`, patientId: rec.patientId, encounterId: rec.encounterId,
      action: 'clinical-update', changedSections, createdAt: this.nowStamp(), iso: this.nowIso(), createdBy: author,
    };
    this.clinicalAuditBase.update((m) => ({ ...m, [rec.patientId]: [...(m[rec.patientId] ?? []), entry] }));
    void this.fs.upsert('clinicalAudit', entry.id!, this.sanitize(entry))
      .catch((e) => console.warn('[Store] clinical audit persist failed', e?.message ?? e));
  }

  // ── Encounter workflow (Sprint 6) ──────────────────────────────────────────
  private readonly encounterBase = signal<Record<string, EncounterRecord>>({});
  readonly encounters = this.encounterBase.asReadonly();

  private blankEncounter(patientId: string, mrn: string): EncounterRecord {
    return { patientId, mrn, encounterId: `${patientId}-enc`, orders: [], audit: [] };
  }

  getEncounter(patientId: string, mrn = ''): EncounterRecord {
    return this.encounterBase()[patientId] ?? this.blankEncounter(patientId, mrn);
  }

  private persistEncounter(rec: EncounterRecord): void {
    void this.fs.upsert('encounters', rec.patientId, this.sanitize(rec))
      .catch((e) => console.warn('[Store] encounter persist failed', e?.message ?? e));
  }

  /** Merge an encounter patch, emit an audit entry, and persist. */
  updateEncounter(patientId: string, mrn: string, patch: Partial<EncounterRecord>, auditAction: string, detail?: string): void {
    const cur = this.getEncounter(patientId, mrn);
    const audit = [...(cur.audit ?? []), { at: this.nowStamp(), iso: this.nowIso(), action: auditAction, detail }];
    const next: EncounterRecord = { ...cur, ...patch, mrn: mrn || cur.mrn, audit, updatedAt: this.nowStamp() };
    this.encounterBase.update((m) => ({ ...m, [patientId]: next }));
    this.persistEncounter(next);
  }

  addEncounterOrder(patientId: string, mrn: string, order: Omit<EncounterOrder, 'id' | 'createdAt'>): void {
    const cur = this.getEncounter(patientId, mrn);
    const full: EncounterOrder = { ...order, id: `ord-${Date.now()}`, createdAt: this.nowIso() };
    this.updateEncounter(patientId, mrn, { orders: [...(cur.orders ?? []), full] }, `Order placed · ${order.type}`, order.detail);
  }

  // ── Identity governance (Sprint 9): non-destructive links + decisions ──────
  private readonly identityMappingsBase = signal<CanonicalIdentityMapping[]>([]);
  readonly identityMappings = this.identityMappingsBase.asReadonly();
  private readonly identityDecisionsBase = signal<IdentityMatchDecision[]>([]);
  readonly identityDecisions = this.identityDecisionsBase.asReadonly();

  /** Confirm a canonical identity link — writes a mapping + an audited decision. */
  confirmIdentityLink(m: CanonicalIdentityMapping, decision: IdentityMatchDecision): void {
    this.identityMappingsBase.update((l) => [...l.filter((x) => x.id !== m.id), m]);
    this.identityDecisionsBase.update((l) => [...l.filter((x) => x.id !== decision.id), decision]);
    void this.fs.upsert('canonicalIdentityMappings', m.id, this.sanitize(m))
      .catch((e) => console.warn('[Store] identity mapping persist failed', e?.message ?? e));
    void this.fs.upsert('identityMatchDecisions', decision.id, this.sanitize(decision))
      .catch((e) => console.warn('[Store] identity decision persist failed', e?.message ?? e));
  }

  /** Reject a possible match — remembered so it never resurfaces. */
  rejectIdentityMatch(decision: IdentityMatchDecision): void {
    this.identityDecisionsBase.update((l) => [...l.filter((x) => x.id !== decision.id), decision]);
    void this.fs.upsert('identityMatchDecisions', decision.id, this.sanitize(decision))
      .catch((e) => console.warn('[Store] identity decision persist failed', e?.message ?? e));
  }

  // ── Compliance ─────────────────────────────────────────────────────────────
  readonly complianceEvents = computed(() => COMPLIANCE_EVENTS.filter((r) => clinicMatches(r.clinicId, this.activeClinicId())));

  // ── Inventory ──────────────────────────────────────────────────────────────
  private readonly inventoryBase = signal<InventoryRecord[]>([...INVENTORY]);
  readonly inventory = computed(() => this.inventoryBase().filter((r) => clinicMatches(r.clinicId, this.activeClinicId())));

  // ── Integrations ───────────────────────────────────────────────────────────
  readonly integrations = computed(() => INTEGRATIONS);

  // ── Analytics ──────────────────────────────────────────────────────────────
  readonly providerProductivity = computed(() => PROVIDER_PRODUCTIVITY.filter((r) => clinicMatches(r.clinicId, this.activeClinicId())));
  readonly clinicComparison = computed(() => this.clinics().filter((clinic) => clinic.id !== 'network'));

  // ── Context setters ────────────────────────────────────────────────────────
  setActiveClinic(clinicId: string): void {
    this.activeClinicId.set(clinicId);
    const providerStillValid = this.providerOptions().some((p) => p.id === this.activeProviderId());
    if (!providerStillValid) this.activeProviderId.set('all');
  }

  setActiveProvider(providerId: string): void { this.activeProviderId.set(providerId); }

  setSelectedDate(dateValue: string): void { if (dateValue) this.selectedDate.set(dateValue); }

  toggleAiWorkspace(): void { this.aiWorkspaceOpen.update((v) => !v); }

  // ── Patient CRUD ───────────────────────────────────────────────────────────
  createPatient(patient: PatientRecord): void {
    this.patientsBase.update((list) => [...list, patient]);
  }
  updatePatient(updated: PatientRecord): void {
    this.patientsBase.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
  }

  // ── Scheduling CRUD ────────────────────────────────────────────────────────
  createWaitlistEntry(entry: WaitlistRecord): void {
    this.waitlistBase.update((list) => [...list, entry]);
    this.fs.upsert('waitlist', toDocId(`${entry.clinicId}-${entry.patient}`), entry).catch(console.warn);
  }

  // ── Billing CRUD ───────────────────────────────────────────────────────────
  createClaim(claim: ClaimRecord): void {
    this.claimsBase.update((list) => [...list, claim]);
    this.fs.upsert('claims', toDocId(claim.claim), claim).catch(console.warn);
    this.logActivity('billing', claim.claim, 'created', `${claim.patient} · ${claim.amount}`);
  }
  updateClaim(updated: ClaimRecord): void {
    this.claimsBase.update((list) => list.map((c) => (c.claim === updated.claim ? updated : c)));
    this.fs.upsert('claims', toDocId(updated.claim), updated).catch(console.warn);
    this.logActivity('billing', updated.claim, 'updated', updated.status);
  }
  submitClaim(claimId: string): void {
    this.claimsBase.update((list) =>
      list.map((c) => (c.claim === claimId ? { ...c, status: 'Submitted', tone: 'info' as const } : c))
    );
    const submitted = this.claimsBase().find(c => c.claim === claimId);
    if (submitted) this.fs.upsert('claims', toDocId(claimId), submitted).catch(console.warn);
    this.logActivity('billing', claimId, 'submitted');
  }

  // ── Insurance payers (Sprint 9A) ────────────────────────────────────────────
  private readonly insuranceBase = signal<InsuranceRecord[]>([
    { id: 'ins-001', clinicId: 'winter-park', payerName: 'Medicare Part B', payerId: 'MCR-FL-01', payerType: 'Government', planType: 'Medicare', ediPayerId: '00590', eligibilityPhone: '1-800-555-0100', eligibilityStatus: 'Active', authRequired: false, timelyFilingDays: '365', claimsAddress: 'PO Box 100, Jacksonville FL', feeSchedule: 'Medicare FL 2026', defaultPlaceOfService: '11 — Office', acceptsElectronic: true, active: true },
    { id: 'ins-002', clinicId: 'winter-park', payerName: 'BCBS Florida', payerId: 'BCBS-FL-22', payerType: 'Commercial', planType: 'PPO', ediPayerId: '00590', eligibilityPhone: '1-800-555-0222', eligibilityStatus: 'Active', authRequired: true, authPhone: '1-800-555-0234', timelyFilingDays: '180', referralRequired: false, claimsAddress: 'PO Box 1798, Jacksonville FL', feeSchedule: 'BCBS PPO 2026', defaultPlaceOfService: '11 — Office', acceptsElectronic: true, active: true },
    { id: 'ins-003', clinicId: 'clermont', payerName: 'Aetna', payerId: 'AET-90', payerType: 'Commercial', planType: 'HMO', ediPayerId: '60054', eligibilityStatus: 'Active', authRequired: true, timelyFilingDays: '120', referralRequired: true, feeSchedule: 'Aetna HMO 2026', acceptsElectronic: true, active: true },
    { id: 'ins-004', clinicId: 'winter-park', payerName: 'VSP Vision', payerId: 'VSP-12', payerType: 'Vision', planType: 'PPO', eligibilityStatus: 'Active', authRequired: false, timelyFilingDays: '90', feeSchedule: 'VSP 2026', acceptsElectronic: true, active: true },
  ]);
  readonly insurancePayers = computed(() => this.insuranceBase().filter((r) => clinicMatches(r.clinicId, this.activeClinicId())));
  createInsurance(rec: InsuranceRecord): void {
    this.insuranceBase.update((l) => [...l, rec]);
    void this.fs.upsert('insurancePayers', rec.id, this.sanitize(rec)).catch((e) => console.warn('[Store] insurance persist failed', e?.message ?? e));
  }
  updateInsurance(rec: InsuranceRecord): void {
    this.insuranceBase.update((l) => l.map((r) => (r.id === rec.id ? rec : r)));
    void this.fs.upsert('insurancePayers', rec.id, this.sanitize(rec)).catch((e) => console.warn('[Store] insurance persist failed', e?.message ?? e));
  }

  // ── Guarantors (Sprint 9A) ──────────────────────────────────────────────────
  private readonly guarantorBase = signal<GuarantorRecord[]>([
    { id: 'gar-001', clinicId: 'winter-park', firstName: 'Robert', lastName: 'Hart', relationship: 'Spouse', linkedPatient: 'Mila Hart', linkedPatientMrn: 'WP-100234', dob: '1950-06-02', phone: '(407) 555-0101', email: 'r.hart@example.com', address: '12 Oak St', city: 'Winter Park', state: 'FL', zip: '32789', responsibilityPct: '100', billingPreference: 'Statement', statementDelivery: 'Mail', active: true },
    { id: 'gar-002', clinicId: 'clermont', firstName: 'Dana', lastName: 'Morales', relationship: 'Self', linkedPatient: 'Dana Morales', dob: '1972-09-14', phone: '(352) 555-0144', email: 'd.morales@example.com', responsibilityPct: '100', billingPreference: 'E-statement', statementDelivery: 'Email', active: true },
    { id: 'gar-003', clinicId: 'winter-park', firstName: 'Walter', lastName: 'Briggs', relationship: 'Self', linkedPatient: 'Walter Briggs', responsibilityPct: '100', billingPreference: 'Statement', statementDelivery: 'Mail', active: true },
  ]);
  readonly guarantors = computed(() => this.guarantorBase().filter((r) => clinicMatches(r.clinicId, this.activeClinicId())));
  createGuarantor(rec: GuarantorRecord): void {
    this.guarantorBase.update((l) => [...l, rec]);
    void this.fs.upsert('guarantors', rec.id, this.sanitize(rec)).catch((e) => console.warn('[Store] guarantor persist failed', e?.message ?? e));
  }
  updateGuarantor(rec: GuarantorRecord): void {
    this.guarantorBase.update((l) => l.map((r) => (r.id === rec.id ? rec : r)));
    void this.fs.upsert('guarantors', rec.id, this.sanitize(rec)).catch((e) => console.warn('[Store] guarantor persist failed', e?.message ?? e));
  }

  // ── Appointments (Sprint 9A) ────────────────────────────────────────────────
  private readonly appointmentsBase = signal<AppointmentRecord[]>([
    mkAppt({ id: 'APT-100201', clinicId: 'winter-park', patient: 'Mila Hart', mrn: 'WP-100234', appointmentType: 'Office visit', visitCategory: 'Glaucoma', status: 'Confirmed', tone: 'accent', date: '2026-06-09', startTime: '09:00', endTime: '09:30', duration: '30 min', provider: 'Dr. Alina Cho', specialty: 'Glaucoma', visitReason: 'IOP check', primaryPayer: 'Medicare Part B' }),
    mkAppt({ id: 'APT-100202', clinicId: 'winter-park', patient: 'Walter Briggs', mrn: 'WP-882301', appointmentType: 'Pre-op', visitCategory: 'Cataract', status: 'Scheduled', tone: 'neutral', date: '2026-06-09', startTime: '10:00', endTime: '10:45', duration: '45 min', provider: 'Dr. Marcus Vale', specialty: 'Cataract', visitReason: 'Cataract eval', primaryPayer: 'BCBS Florida' }),
    mkAppt({ id: 'APT-100203', clinicId: 'clermont', patient: 'Dana Morales', mrn: 'CL-202188', appointmentType: 'Injection', visitCategory: 'Retina', status: 'Checked-in', tone: 'accent', date: '2026-06-09', startTime: '11:15', endTime: '11:45', duration: '30 min', provider: 'Dr. Evelyn Sato', specialty: 'Retina', visitReason: 'Anti-VEGF', primaryPayer: 'Aetna' }),
    mkAppt({ id: 'APT-100204', clinicId: 'winter-park', patient: 'Anita Cole', mrn: 'CL-741552', appointmentType: 'Follow-up', visitCategory: 'Comprehensive', status: 'Scheduled', tone: 'neutral', date: '2026-06-10', startTime: '14:00', endTime: '14:30', duration: '30 min', provider: 'Dr. Alina Cho', specialty: 'Comprehensive', visitReason: 'Annual exam', primaryPayer: 'VSP Vision' }),
  ]);
  readonly appointments = computed(() => this.appointmentsBase().filter((r) => clinicMatches(r.clinicId, this.activeClinicId())));
  private readonly appointmentAuditBase = signal<Record<string, AppointmentAudit[]>>({});
  readonly appointmentAudit = this.appointmentAuditBase.asReadonly();

  // ── Cross-module activity feed (Sprint 12) ──────────────────────────────────
  private readonly activityBase = signal<ActivityEvent[]>([]);
  readonly activityFeed = this.activityBase.asReadonly();

  /** Log a cross-module event for the command-center activity rail. */
  logActivity(module: ActivityEvent['module'], refId: string, action: string, detail?: string, by?: string): void {
    const entry: ActivityEvent = { id: `${module}-${refId}-${Date.now()}`, module, refId, action, at: this.nowStamp(), iso: this.nowIso(), by, detail };
    this.activityBase.update((l) => [...l, entry]);
    void this.fs.upsert('activityFeed', entry.id!, this.sanitize(entry)).catch((e) => console.warn('[Store] activity persist failed', e?.message ?? e));
  }

  private logApptAudit(appointmentId: string, action: AppointmentAudit['action'], by?: string, detail?: string): void {
    const entry: AppointmentAudit = { id: `${appointmentId}-${Date.now()}`, appointmentId, action, at: this.nowStamp(), iso: this.nowIso(), by, detail };
    this.appointmentAuditBase.update((m) => ({ ...m, [appointmentId]: [...(m[appointmentId] ?? []), entry] }));
    void this.fs.upsert('appointmentAudit', entry.id!, this.sanitize(entry)).catch((e) => console.warn('[Store] appt audit failed', e?.message ?? e));
  }

  createAppointment(rec: AppointmentRecord): void {
    this.appointmentsBase.update((l) => [...l, rec]);
    void this.fs.upsert('appointments', rec.id, this.sanitize(rec)).catch((e) => console.warn('[Store] appointment persist failed', e?.message ?? e));
    this.logApptAudit(rec.id, 'created', rec.createdBy, `${rec.date} ${rec.startTime} · ${rec.provider}`);
  }
  updateAppointment(rec: AppointmentRecord): void {
    this.appointmentsBase.update((l) => l.map((r) => (r.id === rec.id ? rec : r)));
    void this.fs.upsert('appointments', rec.id, this.sanitize(rec)).catch((e) => console.warn('[Store] appointment persist failed', e?.message ?? e));
    this.logApptAudit(rec.id, 'updated', rec.createdBy);
  }

  /** Board drag/drop — retime and/or reassign provider by id, with audit. */
  moveAppointment(id: string, change: Partial<Pick<AppointmentRecord, 'date' | 'startTime' | 'endTime' | 'provider'>>, by?: string): void {
    let next: AppointmentRecord | null = null;
    this.appointmentsBase.update((l) => l.map((r) => (r.id === id ? (next = { ...r, ...change }) : r)));
    if (!next) return;
    const moved = next as AppointmentRecord;
    void this.fs.upsert('appointments', id, this.sanitize(moved)).catch((e) => console.warn('[Store] appointment persist failed', e?.message ?? e));
    this.logApptAudit(id, 'moved', by, `→ ${moved.date} ${moved.startTime} · ${moved.provider}`);
  }

  /** Board status change by id, with tone refresh + audit. */
  setAppointmentStatus(id: string, status: string, by?: string): void {
    const tone = (status === 'Cancelled' || status === 'No-show') ? 'critical'
      : (status === 'Confirmed' || status === 'Checked-in' || status === 'Completed') ? 'accent'
      : (status === 'In progress') ? 'warning' : 'neutral';
    let next: AppointmentRecord | null = null;
    this.appointmentsBase.update((l) => l.map((r) => (r.id === id ? (next = { ...r, status, tone }) : r)));
    if (!next) return;
    void this.fs.upsert('appointments', id, this.sanitize(next)).catch((e) => console.warn('[Store] appointment persist failed', e?.message ?? e));
    this.logApptAudit(id, 'status-changed', by, `→ ${status}`);
  }

  /** Returns a conflicting appointment (same provider, same date, overlapping time), if any. */
  appointmentConflict(candidate: { id: string; date: string; startTime: string; endTime: string; provider: string }): AppointmentRecord | null {
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return (h || 0) * 60 + (m || 0); };
    const s = toMin(candidate.startTime), e = Math.max(toMin(candidate.endTime), s + 1);
    return this.appointmentsBase().find((r) =>
      r.id !== candidate.id && r.provider === candidate.provider && r.date === candidate.date &&
      r.status !== 'Cancelled' && r.status !== 'No-show' &&
      toMin(r.startTime) < e && Math.max(toMin(r.endTime), toMin(r.startTime) + 1) > s
    ) ?? null;
  }

  // ── Providers (Sprint 9B) ───────────────────────────────────────────────────
  private readonly providerBase = signal<ProviderRecord[]>([
    { id: 'prov-001', clinicId: 'winter-park', displayName: 'Dr. Alina Cho', firstName: 'Alina', lastName: 'Cho', credentials: 'MD', npi: '1234567890', specialty: 'Glaucoma', role: 'Physician', defaultLocation: 'Winter Park Main', licenseNumber: 'ME-118203', taxonomy: '207WX0009X', defaultStartTime: '08:00', defaultEndTime: '17:00', slotMinutes: '20', workingDays: 'Mon–Fri', billingProvider: true, renderingProvider: true, referringProvider: false, phone: '(407) 555-0190', email: 'a.cho@acuityeye.local', active: true },
    { id: 'prov-002', clinicId: 'winter-park', displayName: 'Dr. Marcus Vale', firstName: 'Marcus', lastName: 'Vale', credentials: 'MD', npi: '2345678901', specialty: 'Cataract', role: 'Physician', defaultLocation: 'Winter Park Main', licenseNumber: 'ME-99421', defaultStartTime: '07:30', defaultEndTime: '16:00', slotMinutes: '30', workingDays: 'Mon–Thu', billingProvider: true, renderingProvider: true, active: true },
    { id: 'prov-003', clinicId: 'clermont', displayName: 'Dr. Evelyn Sato', firstName: 'Evelyn', lastName: 'Sato', credentials: 'MD', npi: '3456789012', specialty: 'Retina', role: 'Physician', defaultLocation: 'Clermont ASC', billingProvider: true, renderingProvider: true, active: true },
    { id: 'prov-004', clinicId: 'winter-park', displayName: 'Jordan Pike', firstName: 'Jordan', lastName: 'Pike', credentials: 'COA', specialty: 'Comprehensive', role: 'Technician', defaultLocation: 'Winter Park Main', defaultStartTime: '08:00', defaultEndTime: '17:00', billingProvider: false, active: true },
  ]);
  readonly providersList = computed(() => this.providerBase().filter((r) => clinicMatches(r.clinicId, this.activeClinicId())));
  createProvider(rec: ProviderRecord): void {
    this.providerBase.update((l) => [...l, rec]);
    void this.fs.upsert('providers', rec.id, this.sanitize(rec)).catch((e) => console.warn('[Store] provider persist failed', e?.message ?? e));
  }
  updateProvider(rec: ProviderRecord): void {
    this.providerBase.update((l) => l.map((r) => (r.id === rec.id ? rec : r)));
    void this.fs.upsert('providers', rec.id, this.sanitize(rec)).catch((e) => console.warn('[Store] provider persist failed', e?.message ?? e));
  }

  // ── Locations (Sprint 9B) ───────────────────────────────────────────────────
  private readonly locationBase = signal<LocationRecord[]>([
    { id: 'loc-001', clinicId: 'winter-park', name: 'Winter Park Main', type: 'Clinic', address: '1200 Orange Ave', city: 'Winter Park', state: 'FL', zip: '32789', phone: '(407) 555-0100', timeZone: 'America/New_York', hours: 'Mon–Fri 8:00–17:00', defaultCapacity: '60', rooms: 'Exam 1, Exam 2, Exam 3, Imaging A, Prep 1', facilityNpi: '1980808080', taxId: '59-1234567', placeOfService: '11 — Office', active: true },
    { id: 'loc-002', clinicId: 'clermont', name: 'Clermont ASC', type: 'Surgery Center', address: '450 Citrus Tower Blvd', city: 'Clermont', state: 'FL', zip: '34711', phone: '(352) 555-0140', timeZone: 'America/New_York', hours: 'Mon–Thu 6:30–15:00', defaultCapacity: '24', rooms: 'OR 1, OR 2, PACU, Pre-op', facilityNpi: '1980901090', taxId: '59-7654321', placeOfService: '24 — ASC', active: true },
    { id: 'loc-003', clinicId: 'winter-park', name: 'Winter Park Optical', type: 'Optical', address: '1200 Orange Ave Ste B', city: 'Winter Park', state: 'FL', zip: '32789', phone: '(407) 555-0177', timeZone: 'America/New_York', hours: 'Mon–Sat 9:00–18:00', defaultCapacity: '20', rooms: 'Dispensing 1, Dispensing 2', placeOfService: '11 — Office', active: true },
  ]);
  readonly locationsList = computed(() => this.locationBase().filter((r) => clinicMatches(r.clinicId, this.activeClinicId())));
  createLocation(rec: LocationRecord): void {
    this.locationBase.update((l) => [...l, rec]);
    void this.fs.upsert('locations', rec.id, this.sanitize(rec)).catch((e) => console.warn('[Store] location persist failed', e?.message ?? e));
  }
  updateLocation(rec: LocationRecord): void {
    this.locationBase.update((l) => l.map((r) => (r.id === rec.id ? rec : r)));
    void this.fs.upsert('locations', rec.id, this.sanitize(rec)).catch((e) => console.warn('[Store] location persist failed', e?.message ?? e));
  }

  // ── Referrals (Sprint 9C) ───────────────────────────────────────────────────
  private readonly referralBase = signal<ReferralRecord[]>([
    { id: 'ref-001', clinicId: 'winter-park', referralNumber: 'REF-100455', patient: 'Mila Hart', patientMrn: 'WP-100234', referralSource: 'Dr. Helen Park — Family Medicine', referringProvider: 'Dr. Helen Park', referringPractice: 'Orlando Primary Care', toProvider: 'Dr. Alina Cho', toLocation: 'Winter Park Main', specialty: 'Glaucoma', authRequired: true, authNumber: 'AUTH-88231', insurance: 'Medicare Part B', validFrom: '2026-05-01', validTo: '2026-08-01', visitsAuthorized: '3', reason: 'Elevated IOP, suspected glaucoma', diagnosis: 'H40.11', status: 'Scheduled', priority: 'Routine', active: true },
    { id: 'ref-002', clinicId: 'clermont', referralNumber: 'REF-100456', patient: 'Dana Morales', patientMrn: 'CL-202188', referralSource: 'Dr. Omar Reyes — Endocrinology', referringProvider: 'Dr. Omar Reyes', referringPractice: 'Clermont Diabetes Center', toProvider: 'Dr. Evelyn Sato', toLocation: 'Clermont ASC', specialty: 'Retina', authRequired: false, insurance: 'Aetna', reason: 'Diabetic retinopathy screening', diagnosis: 'E11.319', status: 'Pending', priority: 'Today', active: true },
    { id: 'ref-003', clinicId: 'winter-park', referralNumber: 'REF-100457', patient: 'Walter Briggs', patientMrn: 'WP-882301', referralSource: 'Self-referral', toProvider: 'Dr. Marcus Vale', toLocation: 'Winter Park Main', specialty: 'Cataract', authRequired: false, reason: 'Cataract evaluation', status: 'New', priority: 'Routine', active: true },
  ]);
  readonly referralsList = computed(() => this.referralBase().filter((r) => clinicMatches(r.clinicId, this.activeClinicId())));
  createReferral(rec: ReferralRecord): void {
    this.referralBase.update((l) => [...l, rec]);
    void this.fs.upsert('referrals', rec.id, this.sanitize(rec)).catch((e) => console.warn('[Store] referral persist failed', e?.message ?? e));
    this.logActivity('referrals', rec.referralNumber, 'created', `${rec.patient} → ${rec.toProvider || rec.specialty || ''}`.trim());
  }
  updateReferral(rec: ReferralRecord): void {
    this.referralBase.update((l) => l.map((r) => (r.id === rec.id ? rec : r)));
    void this.fs.upsert('referrals', rec.id, this.sanitize(rec)).catch((e) => console.warn('[Store] referral persist failed', e?.message ?? e));
    this.logActivity('referrals', rec.referralNumber, 'updated', rec.status);
  }

  // ── GL Accounts (Sprint 9C) ─────────────────────────────────────────────────
  private readonly glAccountBase = signal<GLAccountRecord[]>([
    { id: 'gl-1000', clinicId: 'winter-park', accountCode: '1000', accountName: 'Cash — Operating', accountType: 'Asset', normalBalance: 'Debit', subType: 'Current asset', category: 'Cash & equivalents', allowManualPosting: false, systemAccount: true, active: true, description: 'Primary operating cash account' },
    { id: 'gl-1200', clinicId: 'winter-park', accountCode: '1200', accountName: 'Accounts Receivable — Patient', accountType: 'Asset', normalBalance: 'Debit', subType: 'Current asset', category: 'Receivables', allowManualPosting: false, systemAccount: true, active: true, description: 'Patient AR control account' },
    { id: 'gl-4000', clinicId: 'winter-park', accountCode: '4000', accountName: 'Service Revenue — Professional', accountType: 'Revenue', normalBalance: 'Credit', subType: 'Operating revenue', category: 'Patient services', allowManualPosting: false, requireDepartment: true, systemAccount: true, reportingCategory: 'Net patient revenue', active: true, description: 'Professional service fee revenue' },
    { id: 'gl-4100', clinicId: 'winter-park', accountCode: '4100', accountName: 'Optical Sales', accountType: 'Revenue', normalBalance: 'Credit', subType: 'Operating revenue', category: 'Optical', allowManualPosting: true, systemAccount: false, active: true },
    { id: 'gl-6000', clinicId: 'winter-park', accountCode: '6000', accountName: 'Salaries & Wages', accountType: 'Expense', normalBalance: 'Debit', subType: 'Operating expense', category: 'Payroll', allowManualPosting: true, requireDepartment: true, systemAccount: false, active: true },
  ]);
  readonly glAccounts = computed(() => this.glAccountBase().filter((r) => clinicMatches(r.clinicId, this.activeClinicId())));
  createGLAccount(rec: GLAccountRecord): void {
    this.glAccountBase.update((l) => [...l, rec]);
    void this.fs.upsert('glAccounts', rec.id, this.sanitize(rec)).catch((e) => console.warn('[Store] GL persist failed', e?.message ?? e));
  }
  updateGLAccount(rec: GLAccountRecord): void {
    this.glAccountBase.update((l) => l.map((r) => (r.id === rec.id ? rec : r)));
    void this.fs.upsert('glAccounts', rec.id, this.sanitize(rec)).catch((e) => console.warn('[Store] GL persist failed', e?.message ?? e));
  }

  // ── Documents (Sprint 9D) — metadata in Firestore, file in Storage ──────────
  private readonly documentBase = signal<DocumentRecord[]>([
    { id: 'DOC-100010', clinicId: 'winter-park', title: 'Glaucoma referral letter', category: 'Referral', status: 'Active', linkedEntityType: 'referral', linkedEntityId: 'REF-100455', patientId: 'WP-100234', fileName: 'referral-letter.pdf', fileType: 'application/pdf', fileSize: 184320, storagePath: 'documents/referral/REF-100455/DOC-100010/referral-letter.pdf', uploadStatus: 'uploaded', uploadedBy: 'Front desk', uploadedAt: '2026-05-02', updatedAt: '2026-05-02', privacyLevel: 'Restricted', description: 'PCP referral for elevated IOP' },
    { id: 'DOC-100011', clinicId: 'winter-park', title: 'Signed surgical consent', category: 'Consent', status: 'Active', linkedEntityType: 'patient', linkedEntityId: 'WP-882301', patientId: 'WP-882301', fileName: 'consent-cataract.pdf', fileType: 'application/pdf', fileSize: 96000, storagePath: 'documents/patient/WP-882301/DOC-100011/consent-cataract.pdf', uploadStatus: 'uploaded', uploadedBy: 'Dr. Marcus Vale', uploadedAt: '2026-05-20', updatedAt: '2026-05-20', privacyLevel: 'Confidential', description: 'Phaco + IOL OD consent' },
    { id: 'DOC-100012', clinicId: 'winter-park', title: 'Insurance card — front', category: 'Insurance', status: 'Active', linkedEntityType: 'patient', linkedEntityId: 'WP-100234', patientId: 'WP-100234', fileName: 'insurance-front.jpg', fileType: 'image/jpeg', fileSize: 240000, storagePath: 'documents/patient/WP-100234/DOC-100012/insurance-front.jpg', uploadStatus: 'uploaded', uploadedBy: 'Front desk', uploadedAt: '2026-04-18', updatedAt: '2026-04-18', privacyLevel: 'Restricted' },
  ]);
  readonly documents = computed(() => this.documentBase().filter((r) => clinicMatches(r.clinicId, this.activeClinicId())));
  private readonly documentAuditBase = signal<Record<string, DocumentAudit[]>>({});
  readonly documentAudit = this.documentAuditBase.asReadonly();

  private safeFileName(name: string): string { return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80); }

  private logDocAudit(documentId: string, action: DocumentAudit['action'], by?: string, detail?: string): void {
    const entry: DocumentAudit = { id: `${documentId}-${Date.now()}`, documentId, action, at: this.nowStamp(), iso: this.nowIso(), by, detail };
    this.documentAuditBase.update((m) => ({ ...m, [documentId]: [...(m[documentId] ?? []), entry] }));
    void this.fs.upsert('documentAudit', entry.id!, this.sanitize(entry)).catch((e) => console.warn('[Store] doc audit failed', e?.message ?? e));
  }

  /** Create a document: upload the file to a structured path, then persist metadata + audit. */
  async createDocument(meta: Omit<DocumentRecord, 'storagePath' | 'fileName' | 'fileType' | 'fileSize' | 'uploadStatus' | 'uploadedAt' | 'updatedAt'>, file: File): Promise<DocumentRecord> {
    const safe = this.safeFileName(file.name);
    const storagePath = `documents/${meta.linkedEntityType}/${meta.linkedEntityId || 'general'}/${meta.id}/${safe}`;
    let uploadStatus: DocumentRecord['uploadStatus'] = 'uploaded';
    try { await this.fs.uploadFile(storagePath, file); }
    catch (e: any) { uploadStatus = 'failed'; console.warn('[Store] file upload failed', e?.message ?? e); }
    const now = new Date().toISOString().slice(0, 10);
    const rec: DocumentRecord = {
      ...meta, fileName: safe, fileType: file.type || 'application/octet-stream', fileSize: file.size,
      storagePath, uploadStatus, uploadedAt: now, updatedAt: now,
    };
    this.documentBase.update((l) => [...l, rec]);
    void this.fs.upsert('documents', rec.id, this.sanitize(rec)).catch((e) => console.warn('[Store] document persist failed', e?.message ?? e));
    this.logDocAudit(rec.id, uploadStatus === 'uploaded' ? 'uploaded' : 'updated', meta.uploadedBy, uploadStatus === 'failed' ? 'Upload failed — metadata saved' : safe);
    return rec;
  }

  /** Update document metadata by id; optionally replace the file. */
  async updateDocument(rec: DocumentRecord, newFile?: File | null): Promise<void> {
    let next = { ...rec, updatedAt: new Date().toISOString().slice(0, 10) };
    if (newFile) {
      const safe = this.safeFileName(newFile.name);
      const storagePath = `documents/${rec.linkedEntityType}/${rec.linkedEntityId || 'general'}/${rec.id}/${safe}`;
      try { await this.fs.uploadFile(storagePath, newFile); next = { ...next, fileName: safe, fileType: newFile.type || next.fileType, fileSize: newFile.size, storagePath, uploadStatus: 'uploaded' }; }
      catch (e: any) { next = { ...next, uploadStatus: 'failed' }; console.warn('[Store] file replace failed', e?.message ?? e); }
    }
    this.documentBase.update((l) => l.map((d) => (d.id === next.id ? next : d)));
    void this.fs.upsert('documents', next.id, this.sanitize(next)).catch((e) => console.warn('[Store] document persist failed', e?.message ?? e));
    this.logDocAudit(next.id, 'updated', rec.uploadedBy, newFile ? 'File replaced' : 'Metadata updated');
  }

  /** Archive (soft) — never hard-delete clinical/financial documents. */
  archiveDocument(id: string, by?: string): void {
    let next: DocumentRecord | null = null;
    this.documentBase.update((l) => l.map((d) => (d.id === id ? (next = { ...d, status: 'Archived', updatedAt: new Date().toISOString().slice(0, 10) }) : d)));
    if (next) { void this.fs.upsert('documents', id, this.sanitize(next)).catch(() => {}); this.logDocAudit(id, 'archived', by); }
  }

  /** Resolve a token-scoped download URL on demand (never stored). */
  async resolveDocumentUrl(doc: DocumentRecord, by?: string): Promise<string> {
    const url = await this.fs.getFileUrl(doc.storagePath);
    this.logDocAudit(doc.id, 'downloaded', by);
    return url;
  }

  // ── Imaging CRUD ───────────────────────────────────────────────────────────
  createImagingStudy(study: ImagingStudy): void {
    this.imagingStudiesBase.update((list) => [...list, study]);
    this.fs.upsert('imagingStudies', toDocId(study.studyId), study).catch(console.warn);
  }
  updateImagingStudy(updated: ImagingStudy): void {
    this.imagingStudiesBase.update((list) =>
      list.map((s) => (s.studyId === updated.studyId ? updated : s))
    );
    this.fs.upsert('imagingStudies', toDocId(updated.studyId), updated).catch(console.warn);
  }

  // ── Surgery CRUD ───────────────────────────────────────────────────────────
  createSurgeryCase(surgeryCase: SurgeryCase): void {
    this.surgeryCasesBase.update((list) => [...list, surgeryCase]);
    const key = toDocId(surgeryCase.caseId ?? `${surgeryCase.clinicId}-${surgeryCase.patient}`);
    this.fs.upsert('surgeryCases', key, surgeryCase).catch(console.warn);
    this.logActivity('surgery', surgeryCase.caseId ?? key, 'created', `${surgeryCase.patient} · ${surgeryCase.procedure}`);
  }

  // ── Optical CRUD ───────────────────────────────────────────────────────────
  createOpticalOrder(order: OpticalOrder): void {
    this.opticalOrdersBase.update((list) => [...list, order]);
    this.fs.upsert('opticalOrders', toDocId(order.order), order).catch(console.warn);
    this.logActivity('optical', order.order, 'created', order.patient);
  }
  updateOpticalOrder(updated: OpticalOrder): void {
    this.opticalOrdersBase.update((list) => list.map((o) => (o.order === updated.order ? updated : o)));
    this.fs.upsert('opticalOrders', toDocId(updated.order), updated).catch(console.warn);
    this.logActivity('optical', updated.order, 'updated', updated.status);
  }

  // ── Inventory CRUD ─────────────────────────────────────────────────────────
  createInventoryItem(item: InventoryRecord): void {
    this.inventoryBase.update((list) => [...list, item]);
    const key = toDocId(item.sku ?? item.item);
    this.fs.upsert('inventory', key, item).catch(console.warn);
  }
  updateInventoryItem(updated: InventoryRecord): void {
    this.inventoryBase.update((list) => list.map((i) => (i.item === updated.item ? updated : i)));
    const key = toDocId(updated.sku ?? updated.item);
    this.fs.upsert('inventory', key, updated).catch(console.warn);
  }

  // ── Role / Access CRUD ─────────────────────────────────────────────────────
  createRole(role: RoleMatrixItem): void {
    this.roleMatrix.update((list) => [...list, role]);
  }
  updateRole(updated: RoleMatrixItem): void {
    this.roleMatrix.update((list) => list.map((r) => (r.role === updated.role ? updated : r)));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── Firestore sync ────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Called once at service creation.  Runs asynchronously so the app renders
   * immediately with local (hardcoded) data while Firestore initialises.
   *
   * Flow:
   *  1. Seed all collections if they are empty (first run).
   *  2. Load Firestore data into every signal (replaces hardcoded fallback).
   *  3. Attach a real-time listener to `patientFlow` and `patients` so that
   *     changes made in one browser tab (or by another user) propagate live.
   */
  async initFirestore(): Promise<void> {
    try {
      // Security rules require an authenticated session — wait for the
      // anonymous Firebase Auth sign-in before the first read/write.
      await firebaseAuthReady;
      await this.seedAllCollections();
      await this.loadAllCollections();
      this.attachRealtimeListeners();
      this.firestoreReady.set(true);
      console.info('[Store] Firestore sync complete ✓');
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      this.firestoreError.set(msg);
      console.warn('[Store] Firestore unavailable — using local data.', msg);
    }
  }

  private async seedAllCollections(): Promise<void> {
    await Promise.all([
      this.fs.seedIfEmpty('patients',          [...PATIENTS],          p  => p.id),
      this.fs.seedIfEmpty('claims',            [...CLAIMS],            c  => toDocId(c.claim)),
      this.fs.seedIfEmpty('inventory',         [...INVENTORY],         i  => toDocId(i.sku ?? i.item)),
      this.fs.seedIfEmpty('imagingStudies',    [...IMAGING_STUDIES],   s  => toDocId(s.studyId)),
      this.fs.seedIfEmpty('surgeryCases',      [...SURGERY_CASES],     sc => toDocId(sc.caseId ?? `${sc.clinicId}-${sc.patient}`)),
      this.fs.seedIfEmpty('opticalOrders',     [...OPTICAL_ORDERS],    o  => toDocId(o.order)),
      this.fs.seedIfEmpty('patientFlow',       [...PATIENT_FLOW],      p  => p.id),
      this.fs.seedIfEmpty('surgicalReadiness', [...SURGICAL_READINESS],sr => sr.id),
      this.fs.seedIfEmpty('injectionSafety',   [...INJECTION_SAFETY],  inj => inj.id),
    ]);
  }

  private async loadAllCollections(): Promise<void> {
    const [
      patients, claims, inventory, imagingStudies,
      surgeryCases, opticalOrders,
      patientFlow, surgicalReadiness, injectionSafety,
    ] = await Promise.all([
      this.fs.getAll<PatientRecord>('patients'),
      this.fs.getAll<ClaimRecord>('claims'),
      this.fs.getAll<InventoryRecord>('inventory'),
      this.fs.getAll<ImagingStudy>('imagingStudies'),
      this.fs.getAll<SurgeryCase>('surgeryCases'),
      this.fs.getAll<OpticalOrder>('opticalOrders'),
      this.fs.getAll<PatientFlowRecord>('patientFlow'),
      this.fs.getAll<SurgicalReadinessCase>('surgicalReadiness'),
      this.fs.getAll<InjectionSafetyRecord>('injectionSafety'),
    ]);

    if (patients.length)         this.patientsBase.set(patients);
    if (claims.length)           this.claimsBase.set(claims);
    if (inventory.length)        this.inventoryBase.set(inventory);
    if (imagingStudies.length)   this.imagingStudiesBase.set(imagingStudies);
    if (surgeryCases.length)     this.surgeryCasesBase.set(surgeryCases);
    if (opticalOrders.length)    this.opticalOrdersBase.set(opticalOrders);
    if (patientFlow.length)      this.patientFlowBase.set(patientFlow);
    if (surgicalReadiness.length) this.surgicalReadiness.set(surgicalReadiness);
    if (injectionSafety.length)   this.injectionSafety.set(injectionSafety);

    // Rebuild the movement audit trail, grouped by patient.
    const moves = await this.fs.getAll<FlowMove>('flowMoves');
    if (moves.length) {
      const grouped: Record<string, FlowMove[]> = {};
      for (const m of moves) {
        if (!m.patientId) continue;
        (grouped[m.patientId] ??= []).push(m);
      }
      this.flowHistoryBase.set(grouped);
    }

    // Imaging & claim work state (module drilldowns).
    const [imagingWork, claimWork] = await Promise.all([
      this.fs.getAll<WorkItemState>('imagingWork'),
      this.fs.getAll<WorkItemState>('claimWork'),
    ]);
    if (imagingWork.length) {
      this.imagingWorkBase.set(Object.fromEntries(imagingWork.map((w) => [w.id, w])));
    }
    if (claimWork.length) {
      this.claimWorkBase.set(Object.fromEntries(claimWork.map((w) => [w.id, w])));
    }

    // EMR clinical records + clinical audit.
    const [clinical, clinicalAudit] = await Promise.all([
      this.fs.getAll<PatientClinicalRecord>('clinicalRecords'),
      this.fs.getAll<ClinicalAuditEntry>('clinicalAudit'),
    ]);
    if (clinical.length) {
      this.clinicalBase.set(Object.fromEntries(clinical.map((c) => [c.patientId, c])));
    }
    if (clinicalAudit.length) {
      const grouped: Record<string, ClinicalAuditEntry[]> = {};
      for (const a of clinicalAudit) (grouped[a.patientId] ??= []).push(a);
      this.clinicalAuditBase.set(grouped);
    }

    // Encounter workflow records.
    const encounters = await this.fs.getAll<EncounterRecord>('encounters');
    if (encounters.length) {
      this.encounterBase.set(Object.fromEntries(encounters.map((e) => [e.patientId, e])));
    }

    // Identity governance: confirmed links + match decisions.
    const [mappings, decisions] = await Promise.all([
      this.fs.getAll<CanonicalIdentityMapping>('canonicalIdentityMappings'),
      this.fs.getAll<IdentityMatchDecision>('identityMatchDecisions'),
    ]);
    if (mappings.length) this.identityMappingsBase.set(mappings);
    if (decisions.length) this.identityDecisionsBase.set(decisions);

    // Insurance payers + guarantors (Sprint 9A).
    const [insurance, guarantors] = await Promise.all([
      this.fs.getAll<InsuranceRecord>('insurancePayers'),
      this.fs.getAll<GuarantorRecord>('guarantors'),
    ]);
    if (insurance.length) this.insuranceBase.set(insurance);
    if (guarantors.length) this.guarantorBase.set(guarantors);

    const [appointments, providers, locations] = await Promise.all([
      this.fs.getAll<AppointmentRecord>('appointments'),
      this.fs.getAll<ProviderRecord>('providers'),
      this.fs.getAll<LocationRecord>('locations'),
    ]);
    // Merge with inline seeds by id: Firestore is the source of truth for any
    // record it has; seed records missing from Firestore are backfilled once so
    // partial early-QA collections don't silently hide the rest of the roster.
    if (appointments.length) this.appointmentsBase.set(this.mergeWithSeeds('appointments', appointments, this.appointmentsBase()));
    if (providers.length) this.providerBase.set(this.mergeWithSeeds('providers', providers, this.providerBase()));
    if (locations.length) this.locationBase.set(this.mergeWithSeeds('locations', locations, this.locationBase()));

    const [referrals, glAccounts, documents, docAudit, apptAudit, activity] = await Promise.all([
      this.fs.getAll<ReferralRecord>('referrals'),
      this.fs.getAll<GLAccountRecord>('glAccounts'),
      this.fs.getAll<DocumentRecord>('documents'),
      this.fs.getAll<DocumentAudit>('documentAudit'),
      this.fs.getAll<AppointmentAudit>('appointmentAudit'),
      this.fs.getAll<ActivityEvent>('activityFeed'),
    ]);
    if (activity.length) this.activityBase.set(activity);
    if (referrals.length) this.referralBase.set(referrals);
    if (glAccounts.length) this.glAccountBase.set(glAccounts);
    if (documents.length) this.documentBase.set(documents);
    if (docAudit.length) {
      const grouped: Record<string, DocumentAudit[]> = {};
      for (const a of docAudit) (grouped[a.documentId] ??= []).push(a);
      this.documentAuditBase.set(grouped);
    }
    if (apptAudit.length) {
      const grouped: Record<string, AppointmentAudit[]> = {};
      for (const a of apptAudit) (grouped[a.appointmentId] ??= []).push(a);
      this.appointmentAuditBase.set(grouped);
    }
  }

  /** Firestore records win by id; seeds not yet in Firestore are kept and backfilled. */
  private mergeWithSeeds<T extends { id: string }>(collection: string, fromFs: T[], seeds: T[]): T[] {
    const missing = seeds.filter((s) => !fromFs.some((f) => f.id === s.id));
    for (const m of missing) {
      void this.fs.upsert(collection, m.id, this.sanitize(m)).catch(() => {});
    }
    return [...fromFs, ...missing];
  }

  private attachRealtimeListeners(): void {
    // Real-time patient flow: changes appear instantly across all browser tabs
    this.fs.subscribe<PatientFlowRecord>('patientFlow', docs => {
      if (docs.length) this.patientFlowBase.set(docs);
    });

    // Real-time patient list: new/updated patients sync across sessions
    this.fs.subscribe<PatientRecord>('patients', docs => {
      if (docs.length) this.patientsBase.set(docs);
    });

    // Real-time claims: submissions visible immediately
    this.fs.subscribe<ClaimRecord>('claims', docs => {
      if (docs.length) this.claimsBase.set(docs);
    });

    // Real-time inventory: reorder confirmations propagate instantly
    this.fs.subscribe<InventoryRecord>('inventory', docs => {
      if (docs.length) this.inventoryBase.set(docs);
    });
  }

  // ── Auth preview ───────────────────────────────────────────────────────────
  previewSession(): TokenPairResponse {
    const clinicId = this.activeClinicId() === 'network' ? 'winter-park' : this.activeClinicId();
    return {
      access_token: 'sandbox-access-token',
      refresh_token: 'sandbox-refresh-token',
      token_type: 'bearer',
      access_token_expires_at: '2026-03-07T00:00:00Z',
      refresh_token_expires_at: '2026-03-14T00:00:00Z',
      context: {
        user: {
          id: 'preview-user',
          email: 'preview.operator@acuityeye.local',
          first_name: 'Sandbox',
          last_name: 'User',
          display_name: 'Sandbox User',
          is_active: true,
          is_superuser: true,
          home_tenant_id: 'acuity-eye-network'
        },
        session_id: 'preview-session',
        active_tenant_id: 'acuity-eye-network',
        active_clinic_id: clinicId,
        accessible_tenant_ids: ['acuity-eye-network'],
        accessible_clinic_ids: this.clinics().filter((c) => c.id !== 'network').map((c) => c.id),
        permissions: ['platform.*'],
        role_codes: ['platform_admin']
      }
    };
  }
}
