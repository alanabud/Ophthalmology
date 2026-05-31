import { computed, Injectable, signal } from '@angular/core';

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
import {
  AiBriefingItem,
  ClaimRecord,
  CockpitImagingItem,
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
} from '../models/enterprise.models';

function clinicMatches(clinicId: string, activeClinicId: string): boolean {
  return activeClinicId === 'network' || clinicId === activeClinicId;
}

@Injectable({ providedIn: 'root' })
export class EnterpriseStoreService {
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

  updatePatientFlowStation(id: string, station: PatientFlowRecord['station']): void {
    this.patientFlowBase.update((list) =>
      list.map((p) => (p.id === id ? { ...p, station } : p))
    );
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
  }

  // ── Billing CRUD ───────────────────────────────────────────────────────────
  createClaim(claim: ClaimRecord): void {
    this.claimsBase.update((list) => [...list, claim]);
  }
  updateClaim(updated: ClaimRecord): void {
    this.claimsBase.update((list) => list.map((c) => (c.claim === updated.claim ? updated : c)));
  }
  submitClaim(claimId: string): void {
    this.claimsBase.update((list) =>
      list.map((c) => (c.claim === claimId ? { ...c, status: 'Submitted', tone: 'info' as const } : c))
    );
  }

  // ── Imaging CRUD ───────────────────────────────────────────────────────────
  createImagingStudy(study: ImagingStudy): void {
    this.imagingStudiesBase.update((list) => [...list, study]);
  }
  updateImagingStudy(updated: ImagingStudy): void {
    this.imagingStudiesBase.update((list) =>
      list.map((s) => (s.studyId === updated.studyId ? updated : s))
    );
  }

  // ── Surgery CRUD ───────────────────────────────────────────────────────────
  createSurgeryCase(surgeryCase: SurgeryCase): void {
    this.surgeryCasesBase.update((list) => [...list, surgeryCase]);
  }

  // ── Optical CRUD ───────────────────────────────────────────────────────────
  createOpticalOrder(order: OpticalOrder): void {
    this.opticalOrdersBase.update((list) => [...list, order]);
  }
  updateOpticalOrder(updated: OpticalOrder): void {
    this.opticalOrdersBase.update((list) => list.map((o) => (o.order === updated.order ? updated : o)));
  }

  // ── Inventory CRUD ─────────────────────────────────────────────────────────
  createInventoryItem(item: InventoryRecord): void {
    this.inventoryBase.update((list) => [...list, item]);
  }
  updateInventoryItem(updated: InventoryRecord): void {
    this.inventoryBase.update((list) => list.map((i) => (i.item === updated.item ? updated : i)));
  }

  // ── Role / Access CRUD ─────────────────────────────────────────────────────
  createRole(role: RoleMatrixItem): void {
    this.roleMatrix.update((list) => [...list, role]);
  }
  updateRole(updated: RoleMatrixItem): void {
    this.roleMatrix.update((list) => list.map((r) => (r.role === updated.role ? updated : r)));
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
