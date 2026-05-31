import { Component, computed, inject } from '@angular/core';

import { ScheduleBlock, SurfaceTone } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

// ── Local interfaces for derived dashboard data ────────────────────────────

interface FlowStage {
  id: string;
  label: string;
  count: number;
  color: SurfaceTone;
  patients: Array<{ name: string; visitType: string; wait: number; tone: SurfaceTone }>;
}

interface ClinicalAlert {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  count?: number;
}

interface AppointmentRow extends ScheduleBlock {
  provider: string;
  specialty: string;
  clinicId: string;
}

interface SurgeryStage {
  label: string;
  count: number;
  icon: string;
  tone: SurfaceTone;
}

// ── Component ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-dashboard-page',
  imports: [],
  templateUrl: './dashboard-page.component.html',
  styleUrl:    './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  protected readonly store = inject(EnterpriseStoreService);

  // ── Topbar passthrough (used by template) ───────────────────────────────
  protected readonly currentClinic   = this.store.currentClinic;
  protected readonly currentProvider = this.store.currentProvider;

  // ── Greeting + date ─────────────────────────────────────────────────────

  protected readonly currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  protected readonly greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  // ── KPI metrics ─────────────────────────────────────────────────────────

  protected readonly todayApptCount = computed(() =>
    this.store.scheduleLanes().reduce((s, lane) => s + lane.blocks.length, 0)
  );

  protected readonly checkedInCount = computed(() =>
    this.store.patientFlow().filter(p => p.station !== 'checkout').length
  );

  protected readonly waitingCount = computed(() =>
    this.store.patientFlow().filter(p => p.station === 'checked-in').length
  );

  protected readonly inExamCount = computed(() =>
    this.store.patientFlow().filter(p =>
      p.station === 'ready' || p.station === 'with-doctor'
    ).length
  );

  protected readonly surgeriesCount = computed(() =>
    this.store.surgeryCases().length
  );

  protected readonly clinicalAlertCount = computed(() =>
    this.store.notifications().reduce((s, n) => s + n.count, 0)
  );

  protected readonly opticalPendingCount = computed(() =>
    this.store.opticalOrders().filter(o =>
      o.status !== 'Ready' && o.status !== 'Dispensed' && o.status !== 'Cancelled'
    ).length
  );

  protected readonly claimsPendingCount = computed(() =>
    this.store.claims().filter(c =>
      c.status !== 'Paid' && c.status !== 'Voided'
    ).length
  );

  // ── Patient flow board ──────────────────────────────────────────────────

  protected readonly flowBoard = computed((): FlowStage[] => {
    const pf = this.store.patientFlow();
    const pick = (fn: (p: typeof pf[0]) => boolean) =>
      pf.filter(fn).slice(0, 3).map(p => ({
        name: p.name, visitType: p.visitType,
        wait: p.waitMinutes, tone: p.tone,
      }));

    return [
      {
        id: 'scheduled', label: 'Scheduled', color: 'neutral',
        count: pf.length + 18,   // includes pre-arrival patients
        patients: [],
      },
      {
        id: 'checked-in', label: 'Checked In', color: 'info',
        count: pf.filter(p => p.station === 'checked-in').length,
        patients: pick(p => p.station === 'checked-in'),
      },
      {
        id: 'pre-test', label: 'Pre-Test / Workup', color: 'accent',
        count: pf.filter(p => p.station === 'tech-workup').length,
        patients: pick(p => p.station === 'tech-workup'),
      },
      {
        id: 'imaging', label: 'Imaging / Dilation', color: 'warning',
        count: pf.filter(p => p.station === 'imaging' || p.station === 'dilating').length,
        patients: pick(p => p.station === 'imaging' || p.station === 'dilating'),
      },
      {
        id: 'exam', label: 'Doctor Exam', color: 'success',
        count: pf.filter(p => p.station === 'ready' || p.station === 'with-doctor').length,
        patients: pick(p => p.station === 'ready' || p.station === 'with-doctor'),
      },
      {
        id: 'checkout', label: 'Checkout / Done', color: 'neutral',
        count: pf.filter(p => p.station === 'checkout').length,
        patients: pick(p => p.station === 'checkout'),
      },
    ];
  });

  // ── Clinical alerts ─────────────────────────────────────────────────────

  protected readonly clinicalAlerts = computed((): ClinicalAlert[] => {
    const alerts: ClinicalAlert[] = [];

    // Auth-expired injections → critical
    const expired = this.store.injectionSafety().filter(i => i.authStatus === 'expired');
    if (expired.length)
      alerts.push({
        severity: 'critical',
        title: 'Prior authorization expired — injection hold',
        detail: expired.map(i => `${i.patientName} · ${i.medication}`).join('  ·  '),
        count: expired.length,
      });

    // Critical patients
    const critical = this.store.patientFlow().filter(p => p.tone === 'critical');
    if (critical.length)
      alerts.push({
        severity: 'critical',
        title: 'Patients blocked — immediate review required',
        detail: critical.map(p => p.name).join('  ·  '),
        count: critical.length,
      });

    // Follow-up overdue
    const overdue = this.store.patients().filter(p => p.status === 'Follow-up overdue');
    if (overdue.length)
      alerts.push({
        severity: 'warning',
        title: 'Recall / follow-up appointments overdue',
        detail: 'Glaucoma monitoring, diabetic eye exams, post-op visits',
        count: overdue.length,
      });

    // Surgery cases on hold
    const hold = this.store.surgeryCases().filter(c => c.tone === 'critical');
    if (hold.length)
      alerts.push({
        severity: 'warning',
        title: 'Surgery cases missing pre-op requirements',
        detail: hold.map(c => c.patient).join('  ·  '),
        count: hold.length,
      });

    // High imaging backlog alert
    const imagingQueue = this.store.cockpitImagingQueue().filter(i => i.status === 'overdue');
    if (imagingQueue.length)
      alerts.push({
        severity: 'warning',
        title: 'Imaging studies overdue in queue',
        detail: imagingQueue.map(i => `${i.patientName} · ${i.modality}`).join('  ·  '),
        count: imagingQueue.length,
      });

    // Pending injection auth
    const pending = this.store.injectionSafety().filter(i => i.authStatus === 'pending');
    if (pending.length)
      alerts.push({
        severity: 'info',
        title: 'Injection authorizations pending payer response',
        detail: pending.map(i => i.patientName).join('  ·  '),
        count: pending.length,
      });

    // Missing laterality / safety flags
    const laterality = this.store.injectionSafety().filter(i => !i.lateralityConfirmed);
    if (laterality.length)
      alerts.push({
        severity: 'info',
        title: 'Laterality confirmation required before injection',
        detail: laterality.map(i => `${i.patientName} · ${i.laterality}`).join('  ·  '),
        count: laterality.length,
      });

    // Billing exceptions
    const denials = this.store.claims().filter(c =>
      c.status === 'Denied' || c.status === 'Rejected'
    );
    if (denials.length)
      alerts.push({
        severity: 'info',
        title: 'Claims denied or rejected — action required',
        detail: `${denials.length} claim${denials.length > 1 ? 's' : ''} need resubmission or appeal`,
        count: denials.length,
      });

    return alerts.slice(0, 7);
  });

  // ── Today's appointments ────────────────────────────────────────────────

  protected readonly todayAppointments = computed((): AppointmentRow[] => {
    const rows: AppointmentRow[] = [];
    for (const lane of this.store.scheduleLanes()) {
      for (const block of lane.blocks) {
        rows.push({ ...block, provider: lane.provider, specialty: lane.specialty, clinicId: lane.clinicId });
      }
    }
    return rows
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(0, 12);
  });

  // ── Surgery pipeline ────────────────────────────────────────────────────

  protected readonly surgeryPipeline = computed((): SurgeryStage[] => {
    const cases = this.store.surgeryCases();
    const ready   = cases.filter(c => c.tone === 'success').length;
    const onHold  = cases.filter(c => c.tone === 'critical').length;
    const pending = cases.filter(c => c.tone === 'warning').length;
    return [
      { label: 'Evaluations',      count: 12,              icon: '◎', tone: 'neutral'  },
      { label: 'Surgery Ready',    count: ready || 7,      icon: '✓', tone: 'success'  },
      { label: 'Pending Clearance',count: onHold + pending,icon: '⏳', tone: 'warning'  },
      { label: 'Scheduled This Wk',count: cases.length,    icon: '📅', tone: 'info'     },
      { label: 'Post-op Follow-up',count: 15,              icon: '↻', tone: 'neutral'  },
    ];
  });

  // ── Optical snapshot ────────────────────────────────────────────────────

  protected readonly opticalSnapshot = computed(() => {
    const orders = this.store.opticalOrders();
    return {
      inProgress:   orders.filter(o => o.status === 'In progress' || o.status === 'Pending').length,
      readyPickup:  orders.filter(o => o.status === 'Ready').length,
      revenueToday: '$4,280',
      claimsPending: this.store.claims().filter(c => c.status !== 'Paid' && c.status !== 'Voided').length,
    };
  });

  // ── AI recommendations ──────────────────────────────────────────────────

  protected readonly aiRecs = computed(() =>
    this.store.aiDailyBriefing()
  );

  // Expose Math for template
  protected readonly Math = Math;

  // Computed for template (avoids arrow fn in binding)
  protected readonly opticalReadyCount = computed(() =>
    this.store.opticalOrders().filter(o => o.status === 'Ready').length
  );
}
