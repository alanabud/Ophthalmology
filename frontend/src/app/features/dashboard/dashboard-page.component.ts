import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ScheduleBlock, SurfaceTone } from '../../core/models/enterprise.models';
import { ActionService } from '../../core/services/action.service';
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
  protected readonly store          = inject(EnterpriseStoreService);
  private   readonly actionService  = inject(ActionService);
  private   readonly router         = inject(Router);

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

  // ── Alert dismiss state ───────────────────────────────────────────────────
  protected readonly dismissedAlerts = signal<ReadonlySet<string>>(new Set());

  protected dismissAlert(alert: ClinicalAlert): void {
    this.dismissedAlerts.update(s => new Set([...s, alert.title]));
  }

  protected reviewAlert(alert: ClinicalAlert): void {
    const t = alert.title.toLowerCase();
    if (t.includes('authorization') || t.includes('injection') || t.includes('claim')) {
      void this.router.navigate(['/billing']);
    } else if (t.includes('imaging') || t.includes('visual field') || t.includes('oct')) {
      void this.router.navigate(['/imaging']);
    } else if (t.includes('surgery') || t.includes('pre-op')) {
      void this.router.navigate(['/surgery']);
    } else if (t.includes('follow-up') || t.includes('recall')) {
      void this.router.navigate(['/patients']);
    } else {
      void this.router.navigate(['/encounters']);
    }
  }

  // ── Action rail ───────────────────────────────────────────────────────────
  protected doAction(action: string): void {
    switch (action) {
      case 'new-patient':     this.actionService.dispatch('new-patient');    break;
      case 'new-appointment': this.actionService.dispatch('new-appointment'); break;
      case 'create-claim':    this.actionService.dispatch('new-claim');       break;
      case 'start-exam':      void this.router.navigate(['/encounters']);     break;
      case 'surgery-case':    void this.router.navigate(['/surgery']);        break;
      case 'collect-payment': void this.router.navigate(['/billing']);        break;
      case 'order-imaging':   void this.router.navigate(['/imaging']);        break;
    }
  }

  protected viewAppointment(): void { void this.router.navigate(['/scheduling']); }
  protected viewPatient():     void { void this.router.navigate(['/patients']);   }

  // ── Alert groups (visible = not yet dismissed) ────────────────────────────
  protected readonly visibleAlerts = computed(() =>
    this.clinicalAlerts().filter(a => !this.dismissedAlerts().has(a.title))
  );
  protected readonly criticalAlerts = computed(() =>
    this.visibleAlerts().filter(a => a.severity === 'critical')
  );
  protected readonly warningAlerts = computed(() =>
    this.visibleAlerts().filter(a => a.severity === 'warning')
  );
  protected readonly infoAlerts = computed(() =>
    this.visibleAlerts().filter(a => a.severity === 'info')
  );

  // ── Provider capacity ─────────────────────────────────────────────────────
  protected readonly providerCapacity = computed(() =>
    this.store.scheduleLanes().slice(0, 5).map(lane => {
      const cap = 20;
      const n   = lane.blocks.length;
      const pct = Math.min(100, Math.round((n / cap) * 100));
      return {
        name: lane.provider, specialty: lane.specialty, n, cap, pct,
        tone: pct >= 90 ? 'critical' as const : pct >= 75 ? 'warning' as const : 'ok' as const,
      };
    })
  );

  // ── Revenue snapshot ──────────────────────────────────────────────────────
  protected readonly revenueSnapshot = computed(() => {
    const cl      = this.store.claims();
    const paid    = cl.filter(c => c.status === 'Paid').length;
    const denied  = cl.filter(c => c.status === 'Denied' || c.status === 'Rejected').length;
    const pending = cl.filter(c =>
      c.status !== 'Paid' && c.status !== 'Voided' &&
      c.status !== 'Denied' && c.status !== 'Rejected').length;
    const total   = Math.max(paid + pending + denied, 1);
    return { paid, pending, denied, total,
      todayRev: '$18,240', mtdRev: '$127,480', collectRate: 94, goalPct: 68 };
  });

  // Expose Math for template
  protected readonly Math = Math;

  // Computed for template (avoids arrow fn in binding)
  protected readonly opticalReadyCount = computed(() =>
    this.store.opticalOrders().filter(o => o.status === 'Ready').length
  );

  // Intel panel computed properties (template can't use arrow fns)
  protected readonly imagingOverdueCount = computed(() =>
    this.store.cockpitImagingQueue().filter(i => i.status === 'overdue').length
  );
  protected readonly imagingPendingCount = computed(() =>
    this.store.cockpitImagingQueue().filter(i => i.status === 'pending').length
  );
  protected readonly imagingCompletedCount = computed(() =>
    this.store.cockpitImagingQueue().filter(i => i.status === 'complete').length
  );
  protected readonly claimsDeniedCount = computed(() =>
    this.store.claims().filter(c => c.status === 'Denied' || c.status === 'Rejected').length
  );
  protected readonly authExpiredCount = computed(() =>
    this.store.injectionSafety().filter(i => i.authStatus === 'expired').length
  );
  protected readonly authPendingCount = computed(() =>
    this.store.injectionSafety().filter(i => i.authStatus === 'pending').length
  );

  // ── Command hero: live capacity + throughput ──────────────────────────────

  /** Time-of-day progress across an 8a–6p clinic day (live, always sensible). */
  protected readonly dayProgressPct = (() => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const start = 8 * 60, end = 18 * 60;
    return Math.max(0, Math.min(100, Math.round(((mins - start) / (end - start)) * 100)));
  })();

  /** Patients seen (checked out) vs total scheduled — true throughput. */
  protected readonly seenCount = computed(() =>
    this.store.patientFlow().filter(p => p.station === 'checkout').length
  );

  protected readonly throughputPct = computed(() => {
    const total = this.todayApptCount();
    return total ? Math.round((this.seenCount() / total) * 100) : 0;
  });

  /** Average wait across active patients, with a risk tone. */
  protected readonly avgWaitMinutes = computed(() => {
    const pf = this.store.patientFlow();
    if (!pf.length) return 0;
    return Math.round(pf.reduce((s, p) => s + p.waitMinutes, 0) / pf.length);
  });

  protected readonly waitRisk = computed((): 'ok' | 'warning' | 'critical' => {
    const w = this.avgWaitMinutes();
    return w >= 25 ? 'critical' : w >= 15 ? 'warning' : 'ok';
  });

  /** Stroke offset for the SVG capacity ring (r = 54 → circumference ≈ 339.3). */
  protected readonly ringCircumference = 2 * Math.PI * 54;
  protected readonly ringOffset = computed(() =>
    this.ringCircumference * (1 - this.dayProgressPct / 100)
  );

  /** Compact hero signal rows (no boxes — inline ticker). */
  protected readonly heroSignals = computed(() => [
    {
      key: 'arrived', label: 'Arrived', value: `${this.checkedInCount()}`,
      sub: `of ${this.todayApptCount()} scheduled`, tone: 'teal' as const, icon: 'user',
    },
    {
      key: 'wait', label: 'Avg Wait', value: `${this.avgWaitMinutes()}m`,
      sub: this.waitRisk() === 'ok' ? 'within target' : 'above target', tone: this.waitRisk(), icon: 'clock',
    },
    {
      key: 'exam', label: 'In Exam', value: `${this.inExamCount()}`,
      sub: 'with provider now', tone: 'blue' as const, icon: 'eye',
    },
    {
      key: 'alerts', label: 'Open Alerts', value: `${this.visibleAlerts().length}`,
      sub: this.visibleAlerts().length ? 'need review' : 'all clear',
      tone: (this.visibleAlerts().length ? 'critical' : 'ok') as 'critical' | 'ok', icon: 'alert',
    },
    {
      key: 'revenue', label: 'Revenue Risk', value: `${this.claimsPendingCount()}`,
      sub: 'claims pending', tone: 'amber' as const, icon: 'card',
    },
  ]);

  /** Action rail definition — single source so every button is wired. */
  protected readonly quickActions = [
    { id: 'new-patient',     label: 'New Patient',  primary: true  },
    { id: 'new-appointment', label: 'Appointment',  primary: false },
    { id: 'start-exam',      label: 'Start Exam',   primary: false },
    { id: 'surgery-case',    label: 'Surgery Case', primary: false },
    { id: 'create-claim',    label: 'Create Claim', primary: false },
    { id: 'collect-payment', label: 'Collect',      primary: false },
  ];
}
