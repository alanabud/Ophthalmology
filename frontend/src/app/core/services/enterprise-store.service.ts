import { computed, Injectable, signal } from '@angular/core';

import { TokenPairResponse } from '../models/auth.models';
import { ACTION_QUEUE, AI_INSIGHTS, DAILY_BRIEFINGS, EXECUTIVE_METRICS, LIVE_BOARDS } from '../data/command-center.data';
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
import { ProviderContext } from '../models/enterprise.models';

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
  readonly roleMatrix = signal(ROLE_MATRIX);
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
  readonly actionQueue = computed(() => ACTION_QUEUE[this.activeClinicId()] ?? ACTION_QUEUE['network']);
  readonly patients = computed(() => PATIENTS.filter((record) => clinicMatches(record.clinicId, this.activeClinicId())));
  readonly scheduleLanes = computed(() =>
    SCHEDULE_LANES.filter((record) => clinicMatches(record.clinicId, this.activeClinicId())).filter(
      (record) => this.activeProviderId() === 'all' || record.provider === this.currentProvider().name
    )
  );
  readonly waitlist = computed(() => WAITLIST.filter((record) => clinicMatches(record.clinicId, this.activeClinicId())));
  readonly encounterWorkspace = computed(
    () => ENCOUNTERS.find((record) => clinicMatches(record.clinicId, this.activeClinicId())) ?? ENCOUNTERS[0]
  );
  readonly imagingStudies = computed(() => IMAGING_STUDIES.filter((record) => clinicMatches(record.clinicId, this.activeClinicId())));
  readonly surgeryCases = computed(() => SURGERY_CASES.filter((record) => clinicMatches(record.clinicId, this.activeClinicId())));
  readonly opticalOrders = computed(() => OPTICAL_ORDERS.filter((record) => clinicMatches(record.clinicId, this.activeClinicId())));
  readonly claims = computed(() => CLAIMS.filter((record) => clinicMatches(record.clinicId, this.activeClinicId())));
  readonly complianceEvents = computed(() => COMPLIANCE_EVENTS.filter((record) => clinicMatches(record.clinicId, this.activeClinicId())));
  readonly inventory = computed(() => INVENTORY.filter((record) => clinicMatches(record.clinicId, this.activeClinicId())));
  readonly integrations = computed(() => INTEGRATIONS);
  readonly providerProductivity = computed(() => PROVIDER_PRODUCTIVITY.filter((record) => clinicMatches(record.clinicId, this.activeClinicId())));
  readonly clinicComparison = computed(() => this.clinics().filter((clinic) => clinic.id !== 'network'));

  setActiveClinic(clinicId: string): void {
    this.activeClinicId.set(clinicId);
    const providerStillValid = this.providerOptions().some((provider) => provider.id === this.activeProviderId());
    if (!providerStillValid) {
      this.activeProviderId.set('all');
    }
  }

  setActiveProvider(providerId: string): void {
    this.activeProviderId.set(providerId);
  }

  setSelectedDate(dateValue: string): void {
    if (dateValue) {
      this.selectedDate.set(dateValue);
    }
  }

  toggleAiWorkspace(): void {
    this.aiWorkspaceOpen.update((current) => !current);
  }

  previewSession(): TokenPairResponse {
    const clinicId = this.activeClinicId() === 'network' ? 'winter-park' : this.activeClinicId();

    return {
      access_token: 'preview-access-token',
      refresh_token: 'preview-refresh-token',
      token_type: 'bearer',
      access_token_expires_at: '2026-03-07T00:00:00Z',
      refresh_token_expires_at: '2026-03-14T00:00:00Z',
      context: {
        user: {
          id: 'preview-user',
          email: 'preview.operator@acuityeye.local',
          first_name: 'Preview',
          last_name: 'Operator',
          display_name: 'Regional Preview Operator',
          is_active: true,
          is_superuser: true,
          home_tenant_id: 'acuity-eye-network'
        },
        session_id: 'preview-session',
        active_tenant_id: 'acuity-eye-network',
        active_clinic_id: clinicId,
        accessible_tenant_ids: ['acuity-eye-network'],
        accessible_clinic_ids: this.clinics().filter((clinic) => clinic.id !== 'network').map((clinic) => clinic.id),
        permissions: ['platform.*'],
        role_codes: ['platform_admin']
      }
    };
  }
}

