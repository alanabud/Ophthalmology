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
import { SCHEDULE_LANES, WAITLIST } from '../data/scheduling.data';
import { SURGERY_CASES } from '../data/surgery.data';
import { CLAIMS } from '../data/billing.data';
import { COMPLIANCE_EVENTS } from '../data/compliance.data';
import { ANALYTICS_POINTS, PROVIDER_PRODUCTIVITY, ROLE_MATRIX } from '../data/analytics.data';
import { NAVIGATION_SECTIONS } from '../data/navigation.data';
import { AI_DAILY_BRIEFING, COCKPIT_IMAGING_QUEUE, INJECTION_SAFETY, PATIENT_FLOW, SURGICAL_READINESS } from '../data/clinic-today.data';
import { FirestoreService } from './firestore.service';
import {
  AiBriefingItem,
  ClaimRecord,
  CockpitImagingItem,
  FlowMove,
  FlowStation,
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
  readonly scheduleLanes = computed(() =>
    SCHEDULE_LANES.filter((r) => clinicMatches(r.clinicId, this.activeClinicId())).filter(
      (r) => this.activeProviderId() === 'all' || r.provider === this.currentProvider().name
    )
  );
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
          at, from: p.station, to, skipped: opts?.skipped ?? false, reason: opts?.reason,
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
      ...s, status, audit: [...(s.audit ?? []), { at: this.nowStamp(), action }],
    }));
  }
  addImagingNote(id: string, text: string, author = 'Sandbox User'): void {
    this.mutateWork(this.imagingWorkBase, 'imagingWork', id, (s) => ({
      ...s,
      notes: [...(s.notes ?? []), { at: this.nowStamp(), author, text }],
      audit: [...(s.audit ?? []), { at: this.nowStamp(), action: 'Note added' }],
    }));
  }

  setClaimStatus(id: string, status: string, action: string, holdReason?: string): void {
    this.mutateWork(this.claimWorkBase, 'claimWork', id, (s) => ({
      ...s, status, holdReason: holdReason ?? s.holdReason,
      audit: [...(s.audit ?? []), { at: this.nowStamp(), action, detail: holdReason }],
    }));
  }
  addClaimNote(id: string, text: string, author = 'Sandbox User'): void {
    this.mutateWork(this.claimWorkBase, 'claimWork', id, (s) => ({
      ...s,
      notes: [...(s.notes ?? []), { at: this.nowStamp(), author, text }],
      audit: [...(s.audit ?? []), { at: this.nowStamp(), action: 'Billing note added' }],
    }));
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
  }
  updateClaim(updated: ClaimRecord): void {
    this.claimsBase.update((list) => list.map((c) => (c.claim === updated.claim ? updated : c)));
    this.fs.upsert('claims', toDocId(updated.claim), updated).catch(console.warn);
  }
  submitClaim(claimId: string): void {
    this.claimsBase.update((list) =>
      list.map((c) => (c.claim === claimId ? { ...c, status: 'Submitted', tone: 'info' as const } : c))
    );
    const submitted = this.claimsBase().find(c => c.claim === claimId);
    if (submitted) this.fs.upsert('claims', toDocId(claimId), submitted).catch(console.warn);
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
  }

  // ── Optical CRUD ───────────────────────────────────────────────────────────
  createOpticalOrder(order: OpticalOrder): void {
    this.opticalOrdersBase.update((list) => [...list, order]);
    this.fs.upsert('opticalOrders', toDocId(order.order), order).catch(console.warn);
  }
  updateOpticalOrder(updated: OpticalOrder): void {
    this.opticalOrdersBase.update((list) => list.map((o) => (o.order === updated.order ? updated : o)));
    this.fs.upsert('opticalOrders', toDocId(updated.order), updated).catch(console.warn);
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
