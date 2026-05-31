import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PatientFlowRecord, FlowStation } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

const STATIONS: { id: FlowStation; label: string; icon: string }[] = [
  { id: 'checked-in',   label: 'Checked In',       icon: '●' },
  { id: 'tech-workup',  label: 'Tech Workup',       icon: '⊞' },
  { id: 'imaging',      label: 'Imaging',           icon: '◎' },
  { id: 'dilating',     label: 'Dilating',          icon: '◑' },
  { id: 'ready',        label: 'Ready for Doctor',  icon: '✦' },
  { id: 'with-doctor',  label: 'With Doctor',       icon: '⬤' },
  { id: 'checkout',     label: 'Checkout',          icon: '✓' },
];

const STATION_ORDER = STATIONS.map(s => s.id);

const TAB_LABELS: Record<string, string> = {
  overview:  'Overview',
  workup:    'Workup',
  imaging:   'Imaging',
  plan:      'Plan',
  surgery:   'Surgery / Procedure',
  billing:   'Billing Readiness',
  notes:     'Notes',
};

@Component({
  selector: 'app-clinic-today-page',
  imports: [FormsModule, TitleCasePipe],
  templateUrl: './clinic-today-page.component.html',
  styleUrl: './clinic-today-page.component.scss',
})
export class ClinicTodayPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly stations = STATIONS;
  protected readonly stationOrder = STATION_ORDER;
  protected readonly tabKeys = Object.keys(TAB_LABELS);
  protected readonly tabLabels = TAB_LABELS;

  protected readonly clinicFilter = signal('');
  protected readonly selectedPatient = signal<PatientFlowRecord | null>(null);
  protected readonly patientModalOpen = signal(false);
  protected readonly activeTab = signal<string>('overview');
  protected readonly briefingCollapsed = signal(false);
  protected toggleBriefing(): void { this.briefingCollapsed.update(v => !v); }

  protected readonly clinics = this.store.clinics;
  protected readonly aiBriefing = this.store.aiDailyBriefing;

  protected readonly filteredPatients = computed(() => {
    const clinic = this.clinicFilter();
    const all = this.store.patientFlow();
    return clinic ? all.filter(p => p.clinicId === clinic) : all;
  });

  protected readonly patientsByStation = computed(() => {
    const map: Record<string, PatientFlowRecord[]> = {};
    for (const s of STATIONS) map[s.id] = [];
    for (const p of this.filteredPatients()) {
      if (!map[p.station]) map[p.station] = [];
      map[p.station].push(p);
    }
    return map;
  });

  protected readonly filteredImagingQueue = computed(() => {
    const clinic = this.clinicFilter();
    const all = this.store.cockpitImagingQueue();
    return clinic ? all.filter(i => i.clinicId === clinic) : all;
  });

  protected readonly filteredSurgicalCases = computed(() => {
    const clinic = this.clinicFilter();
    const all = this.store.surgicalReadiness();
    return clinic ? all.filter(s => s.clinicId === clinic) : all;
  });

  protected readonly filteredInjectionSafety = computed(() => {
    const clinic = this.clinicFilter();
    const all = this.store.injectionSafety();
    return clinic ? all.filter(i => i.clinicId === clinic) : all;
  });

  // ── Summary stats ──────────────────────────────────────────────────────────
  protected readonly totalScheduled = computed(() => this.filteredPatients().length);

  protected readonly inClinicCount = computed(() =>
    this.filteredPatients().filter(p => p.station !== 'checkout').length
  );

  protected readonly readyCount = computed(() =>
    this.filteredPatients().filter(p => p.station === 'ready').length
  );

  protected readonly avgWait = computed(() => {
    const active = this.filteredPatients().filter(p => p.station !== 'checkout');
    if (!active.length) return 0;
    return Math.round(active.reduce((s, p) => s + p.waitMinutes, 0) / active.length);
  });

  protected readonly imagingPendingCount = computed(() =>
    this.filteredImagingQueue().filter(i => i.status === 'pending' || i.status === 'overdue').length
  );

  protected readonly criticalCount = computed(() =>
    this.filteredPatients().filter(p => p.tone === 'critical').length
  );

  protected readonly injectionFlagCount = computed(() =>
    this.filteredInjectionSafety().filter(i => i.tone === 'critical' || i.tone === 'warning').length
  );

  protected readonly surgeryBlockerCount = computed(() =>
    this.filteredSurgicalCases().filter(s => s.blockers.length > 0).length
  );

  protected readonly todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  protected isStationPast(current: FlowStation, check: FlowStation): boolean {
    return STATION_ORDER.indexOf(check) < STATION_ORDER.indexOf(current);
  }

  protected readinessScore(patient: PatientFlowRecord): number {
    const required = patient.readinessItems.filter(r => r.required);
    if (!required.length) return 100;
    const done = required.filter(r => r.done).length;
    return Math.round((done / required.length) * 100);
  }

  protected readinessMissingCount(patient: PatientFlowRecord): number {
    return patient.readinessItems.filter(r => r.required && !r.done).length;
  }

  protected surgicalReadinessScore(sc: import('../../core/models/enterprise.models').SurgicalReadinessCase): number {
    const checks = [
      sc.biometryComplete, sc.lensSelected, sc.consentSigned,
      sc.clearanceReceived, sc.iolOrdered, sc.ascPacketComplete,
      sc.insuranceAuth, sc.postOpScheduled,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  protected openPatient(patient: PatientFlowRecord): void {
    this.selectedPatient.set(patient);
    this.activeTab.set('overview');
    this.patientModalOpen.set(true);
  }

  protected closeModal(): void {
    this.patientModalOpen.set(false);
    this.selectedPatient.set(null);
  }

  protected advanceStation(patient: PatientFlowRecord): void {
    const idx = STATION_ORDER.indexOf(patient.station);
    if (idx < STATION_ORDER.length - 1) {
      this.store.updatePatientFlowStation(patient.id, STATION_ORDER[idx + 1]);
      this.selectedPatient.update(p => p ? { ...p, station: STATION_ORDER[idx + 1] } : p);
    }
  }
}
