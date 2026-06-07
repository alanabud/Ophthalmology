import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { FlowStation, PatientClinicalRecord, PatientFlowRecord, ScheduleBlock, SurfaceTone } from '../../core/models/enterprise.models';
import { ActionService } from '../../core/services/action.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

// ── Local interfaces for derived dashboard data ────────────────────────────

interface FlowStage {
  id: string;
  label: string;
  count: number;
  color: SurfaceTone;
  patients: PatientFlowRecord[];
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
  private   readonly authState      = inject(AuthStateService);
  private   readonly router         = inject(Router);

  /** First name for the command briefing greeting. */
  protected readonly firstName = (this.authState.displayName().split(/\s+/)[0]) || 'Doctor';
  /** Timestamp as of dashboard load. */
  protected readonly nowTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

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
    const pick = (fn: (p: PatientFlowRecord) => boolean) => pf.filter(fn).slice(0, 3);

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

  // ── Generic navigation (module cards, cockpit cards) ──────────────────────
  protected navigate(route: string): void { void this.router.navigate([route]); }
  /** Navigate into a module drilldown with a preset filter / patient. */
  protected navigateQ(route: string, queryParams: Record<string, string>): void {
    void this.router.navigate([route], { queryParams });
  }

  // ── Cockpit: 4 operational command cards ──────────────────────────────────

  /** Average provider utilization across active lanes. */
  protected readonly avgUtilization = computed(() => {
    const c = this.providerCapacity();
    if (!c.length) return 0;
    return Math.round(c.reduce((s, p) => s + p.pct, 0) / c.length);
  });

  protected readonly busiestProvider = computed(() => {
    const c = [...this.providerCapacity()].sort((a, b) => b.pct - a.pct);
    return c[0] ?? null;
  });

  /** Patient-flow stage distribution → normalized mini bars. */
  protected readonly stageBars = computed(() => {
    const stages = this.flowBoard();
    const max = Math.max(...stages.map(s => s.count), 1);
    return stages.map(s => ({
      label: s.label, color: s.color,
      pct: Math.max(8, Math.round((s.count / max) * 100)),
      count: s.count,
    }));
  });

  /** Revenue mix → stacked bar segments. */
  protected readonly revenueParts = computed(() => {
    const r = this.revenueSnapshot();
    const total = Math.max(r.total, 1);
    return {
      paidPct:    Math.round((r.paid / total) * 100),
      pendingPct: Math.round((r.pending / total) * 100),
      deniedPct:  Math.round((r.denied / total) * 100),
      paid: r.paid, pending: r.pending, denied: r.denied,
    };
  });

  /** Demo trend series (clearly synthetic — labeled in template). */
  protected readonly riskTrend    = [4, 5, 3, 6, 5, 7, 6];
  protected readonly revenueTrend = [12, 14, 11, 15, 13, 16, 18];

  /** Convert a series to an SVG polyline points string (viewBox 100x32). */
  protected sparkPoints(data: number[]): string {
    if (!data.length) return '';
    const max = Math.max(...data), min = Math.min(...data);
    const span = max - min || 1;
    const step = 100 / (data.length - 1 || 1);
    return data
      .map((v, i) => `${(i * step).toFixed(1)},${(30 - ((v - min) / span) * 28).toFixed(1)}`)
      .join(' ');
  }

  // ── Operational module cards (built from real navigation data) ────────────
  protected readonly moduleCards = computed(() =>
    this.store.navigationSections()
      .flatMap(sec => sec.items.map(it => ({ ...it, section: sec.label })))
      .filter(it => it.route !== '/command-center')   // not "current page"
      .map(it => ({
        label: it.label,
        route: it.route,
        icon: it.icon,
        note: this.shortNote(it.summary),
        count: it.counter ?? '',
        tone: it.tone ?? 'neutral',
        section: it.section,
      }))
  );

  /** Operational note for a module card — prefer the clause carrying a live count. */
  private shortNote(summary: string): string {
    const clauses = summary.split(/[—,·]/).map(c => c.trim()).filter(Boolean);
    const withNum = clauses.find(c => /\d/.test(c));
    const s = withNum ?? clauses[0] ?? '';
    return s.length > 40 ? s.slice(0, 38) + '…' : s;
  }

  // ── Clinic load (replaces the meaningless 0% ring) ────────────────────────
  protected readonly clinicCapacity = 28;
  protected readonly clinicLoadPct = computed(() =>
    Math.min(100, Math.round((this.checkedInCount() / this.clinicCapacity) * 100))
  );
  protected readonly clinicLoadBand = computed(() => {
    const p = this.clinicLoadPct();
    return p >= 85 ? 'High volume' : p >= 55 ? 'Normal volume' : 'Light volume';
  });
  protected readonly clinicLoadOffset = computed(() =>
    (2 * Math.PI * 26) * (1 - this.clinicLoadPct() / 100)
  );

  // ── Command briefing ──────────────────────────────────────────────────────
  protected readonly minutesBehind = computed(() => Math.max(0, this.avgWaitMinutes() - 15));
  protected readonly delayedCount  = computed(() =>
    this.store.patientFlow().filter(p => p.waitMinutes > 20).length
  );
  protected readonly bottleneckCount = computed(() =>
    this.flowBoard().filter(s => s.id !== 'scheduled' && s.count >= 5).length
  );

  protected readonly nextRecommended = computed((): { text: string; action: string } => {
    if (this.criticalAlerts().length) {
      const n = this.criticalAlerts().length;
      return { text: `Review ${n} critical alert${n > 1 ? 's' : ''}`, action: 'review-critical' };
    }
    if (this.delayedCount()) {
      return { text: `Clear ${this.delayedCount()} delayed patients`, action: 'view-flow' };
    }
    if (this.claimsPendingCount()) {
      return { text: `Work ${this.claimsPendingCount()} pending claims`, action: 'collect-payment' };
    }
    return { text: 'All systems nominal', action: 'none' };
  });

  protected runRecommended(): void {
    switch (this.nextRecommended().action) {
      case 'review-critical': void this.router.navigate(['/encounters']); break;
      case 'collect-payment': void this.router.navigate(['/billing']);    break;
      case 'view-flow':       this.setBoardFilter('delayed');             break;
    }
  }

  // ── KPI card intelligence ─────────────────────────────────────────────────
  protected readonly longestWait = computed(() =>
    [...this.store.patientFlow()].sort((a, b) => b.waitMinutes - a.waitMinutes)[0] ?? null
  );
  protected readonly criticalLine = computed(() => {
    const c = this.criticalAlerts();
    if (!c.length) return 'No critical alerts';
    return c.map(a => a.title.split(' — ')[0].split(',')[0]).slice(0, 2).join(' · ');
  });
  protected readonly topClaimIssue = computed(() => {
    if (this.claimsDeniedCount()) return `${this.claimsDeniedCount()} denied — needs resubmission`;
    if (this.authExpiredCount())  return `${this.authExpiredCount()} auth expired — reauthorize`;
    return 'Claims on track';
  });
  protected readonly availableProvider = computed(() =>
    [...this.providerCapacity()].sort((a, b) => a.pct - b.pct)[0] ?? null
  );

  // ── Visit category + SLA helpers ──────────────────────────────────────────
  protected categoryTag(cat: string): string {
    return ({
      cataract: 'CAT', retina: 'RET', glaucoma: 'GLA', comprehensive: 'CMP',
      'post-op': 'POP', lasik: 'LAS', optical: 'OPT', injection: 'INJ',
    } as Record<string, string>)[cat] ?? 'GEN';
  }

  protected sla(wait: number): { label: string; tone: 'ok' | 'warning' | 'critical' } {
    if (wait > 30) return { label: 'Overdue',  tone: 'critical' };
    if (wait > 15) return { label: 'At risk',  tone: 'warning' };
    return { label: 'On time', tone: 'ok' };
  }

  private readonly stationLabels: Record<FlowStation, string> = {
    'checked-in': 'Waiting room', 'tech-workup': 'Tech workup', 'imaging': 'Imaging',
    'dilating': 'Dilating', 'ready': 'Ready for doctor', 'with-doctor': 'In exam', 'checkout': 'Checkout',
  };
  protected stationLabel(s: FlowStation): string { return this.stationLabels[s] ?? s; }

  // ── Patient drawer (slide-over) ───────────────────────────────────────────
  protected readonly selectedPatient = signal<PatientFlowRecord | null>(null);
  protected openPatient(p: PatientFlowRecord): void { this.selectedPatient.set(p); this.clinicalEditing.set(false); this.clinicalDraft.set(null); }
  protected closePatient(): void { this.selectedPatient.set(null); this.clinicalEditing.set(false); this.clinicalDraft.set(null); }

  // Clinical board order — matches boardStations so skip/advance logic and the
  // visual columns agree.
  private readonly stationOrder: FlowStation[] =
    ['checked-in', 'tech-workup', 'dilating', 'imaging', 'ready', 'with-doctor', 'checkout'];

  /** Advance a patient to the next stage — a real, live board mutation. */
  protected advancePatient(p: PatientFlowRecord): void {
    const idx = this.stationOrder.indexOf(p.station);
    const next = this.stationOrder[Math.min(this.stationOrder.length - 1, idx + 1)];
    this.store.updatePatientFlowStation(p.id, next);
    this.selectedPatient.set(this.store.patientFlow().find(r => r.id === p.id) ?? null);
  }

  protected openPatientChart(): void {
    this.closePatient();
    void this.router.navigate(['/patients']);
  }
  protected openEncounter(): void {
    this.closePatient();
    void this.router.navigate(['/encounters']);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LIVE PATIENT FLOW BOARD — drag-and-drop operational workflow
  // ══════════════════════════════════════════════════════════════════════════

  /** Board columns map 1:1 to real, persistable flow stations. */
  protected readonly boardStations: { id: FlowStation; label: string }[] = [
    { id: 'checked-in',  label: 'Checked In' },
    { id: 'tech-workup', label: 'Pre-Test / Workup' },
    { id: 'dilating',    label: 'Dilation' },
    { id: 'imaging',     label: 'Imaging' },
    { id: 'ready',       label: 'Ready for Doctor' },
    { id: 'with-doctor', label: 'Provider Exam' },
    { id: 'checkout',    label: 'Checkout / Done' },
  ];

  /** Per-stage SLA thresholds (minutes) — clinical, not uniform. */
  private readonly stageThresholds: Record<FlowStation, number> = {
    'checked-in': 15, 'tech-workup': 20, 'dilating': 30, 'imaging': 25,
    'ready': 10, 'with-doctor': 30, 'checkout': 15,
  };

  /** SLA evaluated against the patient's *current* stage threshold. */
  protected slaForStage(p: PatientFlowRecord): { label: string; tone: 'ok' | 'warning' | 'critical' } {
    const t = this.stageThresholds[p.station] ?? 15;
    if (p.waitMinutes > t * 1.5) return { label: 'Overdue', tone: 'critical' };
    if (p.waitMinutes > t)       return { label: 'At risk', tone: 'warning' };
    return { label: 'On time', tone: 'ok' };
  }

  /** Board-level filter (chips). */
  protected readonly boardFilter = signal<'all' | 'delayed' | 'critical'>('all');
  protected setBoardFilter(f: 'all' | 'delayed' | 'critical'): void { this.boardFilter.set(f); }
  protected readonly boardFilters: { id: 'all' | 'delayed' | 'critical'; label: string }[] = [
    { id: 'all',      label: 'All patients' },
    { id: 'delayed',  label: 'Delayed' },
    { id: 'critical', label: 'At risk' },
  ];

  protected readonly boardColumns = computed(() => {
    const f = this.boardFilter();
    const pf = this.store.patientFlow().filter(p => {
      if (f === 'all') return true;
      if (f === 'delayed') return p.waitMinutes > 20;
      return this.slaForStage(p).tone === 'critical';
    });
    return this.boardStations.map(s => {
      const patients = pf.filter(p => p.station === s.id)
        .sort((a, b) => b.waitMinutes - a.waitMinutes);
      const threshold = this.stageThresholds[s.id];
      return {
        id: s.id, label: s.label, patients,
        count: patients.length,
        alertCount: patients.filter(p => p.waitMinutes > threshold).length,
      };
    });
  });

  /** Movement audit trail for the open patient. */
  protected readonly selectedHistory = computed(() => {
    const p = this.selectedPatient();
    return p ? (this.store.flowHistory()[p.id] ?? []) : [];
  });

  // ── Drag-and-drop state ────────────────────────────────────────────────────
  protected readonly draggedId       = signal<string | null>(null);
  protected readonly dragOverStation = signal<FlowStation | null>(null);
  protected readonly moveMenuFor     = signal<string | null>(null);

  protected onDragStart(p: PatientFlowRecord, ev: DragEvent): void {
    this.draggedId.set(p.id);
    this.moveMenuFor.set(null);
    ev.dataTransfer?.setData('text/plain', p.id);
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
  }
  protected onDragOver(station: FlowStation, ev: DragEvent): void {
    ev.preventDefault();
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
    if (this.dragOverStation() !== station) this.dragOverStation.set(station);
  }
  protected onDragLeaveCol(station: FlowStation): void {
    if (this.dragOverStation() === station) this.dragOverStation.set(null);
  }
  protected onDrop(station: FlowStation, ev: DragEvent): void {
    ev.preventDefault();
    const id = this.draggedId() ?? ev.dataTransfer?.getData('text/plain') ?? null;
    this.dragOverStation.set(null);
    this.draggedId.set(null);
    if (!id) return;
    const p = this.store.patientFlow().find(r => r.id === id);
    if (p) this.attemptMove(p, station);
  }
  protected onDragEnd(): void {
    this.draggedId.set(null);
    this.dragOverStation.set(null);
  }

  /** True while this card is the one being dragged (for ghost styling). */
  protected isDragging(id: string): boolean { return this.draggedId() === id; }

  // ── Move validation + confirmation ──────────────────────────────────────────
  protected readonly pendingMove = signal<{ patient: PatientFlowRecord; to: FlowStation; toLabel: string; skipped: string[] } | null>(null);
  protected readonly moveReason  = signal('');
  protected readonly moveReasons = [
    'Clinically appropriate', 'Stage already completed elsewhere',
    'Urgent — expedited by provider', 'Patient declined intermediate step',
  ];

  protected stationLabelFor(id: FlowStation): string {
    return this.boardStations.find(s => s.id === id)?.label ?? this.stationLabel(id);
  }

  protected attemptMove(p: PatientFlowRecord, to: FlowStation): void {
    if (p.station === to) return;
    const fromIdx = this.stationOrder.indexOf(p.station);
    const toIdx   = this.stationOrder.indexOf(to);

    // Forward jump past intermediate stages → confirmation with reason.
    if (toIdx - fromIdx > 1) {
      const skipped = this.stationOrder.slice(fromIdx + 1, toIdx).map(s => this.stationLabelFor(s));
      this.pendingMove.set({ patient: p, to, toLabel: this.stationLabelFor(to), skipped });
      this.moveReason.set('');
      return;
    }
    this.store.movePatientStation(p.id, to);
    this.syncDrawer(p.id);
  }

  protected confirmPendingMove(): void {
    const m = this.pendingMove();
    if (!m) return;
    this.store.movePatientStation(m.patient.id, m.to, {
      skipped: true,
      reason: this.moveReason() || 'Clinically appropriate',
    });
    this.syncDrawer(m.patient.id);
    this.pendingMove.set(null);
  }
  protected cancelPendingMove(): void { this.pendingMove.set(null); }

  private syncDrawer(id: string): void {
    if (this.selectedPatient()?.id === id) {
      this.selectedPatient.set(this.store.patientFlow().find(r => r.id === id) ?? null);
    }
  }

  // ── Tap fallback: "Move to stage" menu ──────────────────────────────────────
  protected toggleMoveMenu(id: string, ev: Event): void {
    ev.stopPropagation();
    this.moveMenuFor.update(c => (c === id ? null : id));
  }
  protected moveViaMenu(p: PatientFlowRecord, to: FlowStation, ev: Event): void {
    ev.stopPropagation();
    this.moveMenuFor.set(null);
    this.attemptMove(p, to);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EMR ENCOUNTER PANEL — derived clinical depth + real actions
  // ══════════════════════════════════════════════════════════════════════════

  /** Stable pseudo-random in [0,1) seeded by MRN — deterministic per patient. */
  private hash(mrn: string, salt = 0): number {
    let h = 2166136261 ^ salt;
    for (let i = 0; i < mrn.length; i++) { h ^= mrn.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ((h >>> 0) % 1000) / 1000;
  }
  private pick<T>(arr: T[], mrn: string, salt: number): T {
    return arr[Math.floor(this.hash(mrn, salt) * arr.length)];
  }

  private readonly complaints: Record<string, string> = {
    cataract: 'Gradual blurred vision, glare with night driving',
    glaucoma: 'Routine pressure check; intermittent peripheral haze',
    retina: 'Distorted central vision, new floaters',
    injection: 'Distorted central vision — anti-VEGF maintenance',
    'post-op': 'Post-operative follow-up, mild irritation',
    comprehensive: 'Annual comprehensive eye exam',
    lasik: 'Refractive surgery evaluation',
    optical: 'Vision correction update',
  };
  private readonly diagnoses: Record<string, string> = {
    cataract: 'H25.13 — Age-related nuclear cataract, bilateral',
    glaucoma: 'H40.11 — Primary open-angle glaucoma',
    retina: 'H35.32 — Exudative age-related macular degeneration',
    injection: 'H35.32 — Wet AMD, on anti-VEGF therapy',
    'post-op': 'Z98.4 — Pseudophakia, post-operative status',
    comprehensive: 'Z01.00 — Encounter for exam of eyes',
    lasik: 'H52.13 — Myopia, evaluating for refractive surgery',
    optical: 'H52.4 — Presbyopia',
  };
  private readonly histories: Record<string, string[]> = {
    cataract: ['Nuclear sclerosis OU', 'Hypertension', 'No prior ocular surgery'],
    glaucoma: ['POAG x6 yrs', 'Ocular hypertension', 'Family history of glaucoma'],
    retina: ['Wet AMD OD', 'Prior anti-VEGF injections', 'Dry AMD OS'],
    injection: ['Wet AMD OU', '14 prior intravitreal injections', 'Pseudophakia OU'],
    'post-op': ['Phacoemulsification + IOL (recent)', 'Posterior capsule intact'],
    comprehensive: ['Refractive error', 'No significant ocular history'],
    lasik: ['Stable myopia x2 yrs', 'Contact lens intolerance'],
    optical: ['Presbyopia', 'Progressive lens wearer'],
  };

  /** Derived clinical encounter profile (deterministic demo data per MRN). */
  protected clinicalProfile(p: PatientFlowRecord) {
    const vaScale = ['20/20', '20/25', '20/30', '20/40', '20/50', '20/60', '20/70', '20/80'];
    const worseIdx = Math.min(vaScale.length - 1, 2 + Math.floor(this.hash(p.mrn, 1) * 5));
    const betterIdx = Math.max(0, worseIdx - 2 - Math.floor(this.hash(p.mrn, 2) * 2));
    const worseEye = p.laterality === 'OS' ? 'OS' : 'OD';
    const vaOD = worseEye === 'OD' ? vaScale[worseIdx] : vaScale[betterIdx];
    const vaOS = worseEye === 'OS' ? vaScale[worseIdx] : vaScale[betterIdx];

    const glaucoma = p.visitCategory === 'glaucoma';
    const iopBase = glaucoma ? 22 : 13;
    const iopOD = iopBase + Math.floor(this.hash(p.mrn, 3) * (glaucoma ? 9 : 6));
    const iopOS = iopBase + Math.floor(this.hash(p.mrn, 4) * (glaucoma ? 9 : 6));

    const allergies = this.hash(p.mrn, 5) > 0.6
      ? [this.pick(['Sulfa', 'Penicillin', 'Latex', 'Codeine'], p.mrn, 6)]
      : ['NKDA'];

    const meds: string[] = [];
    if (glaucoma) meds.push('Latanoprost 0.005% OU qHS');
    if (p.visitCategory === 'injection' || p.visitCategory === 'retina') meds.push('Eylea (aflibercept) — intravitreal');
    if (p.age >= 65) meds.push('Lisinopril 10mg', this.hash(p.mrn, 7) > 0.5 ? 'Metformin 500mg' : 'Atorvastatin 20mg');
    if (!meds.length) meds.push('Artificial tears PRN');

    const pendingTests = p.readinessItems.filter(i => i.required && !i.done).map(i => i.label);

    return {
      chiefComplaint: this.complaints[p.visitCategory] ?? 'Eye evaluation',
      vaOD, vaOS, iopOD, iopOS, worseEye,
      allergies, medications: meds,
      ocularHistory: this.histories[p.visitCategory] ?? ['No significant ocular history'],
      pendingTests,
      diagnosis: this.diagnoses[p.visitCategory] ?? 'Pending evaluation',
    };
  }

  /** Clinical risk flags — now driven by persisted EMR data where present. */
  protected riskFlags(p: PatientFlowRecord): { label: string; tone: 'critical' | 'warning' | 'info' }[] {
    const flags: { label: string; tone: 'critical' | 'warning' | 'info' }[] = [];
    if (p.urgent) flags.push({ label: 'Flagged urgent', tone: 'critical' });

    const cr = this.store.clinicalRecords()[p.id];
    if (cr) {
      const iopMax = Math.max(cr.iop?.od ?? 0, cr.iop?.os ?? 0);
      if (iopMax > 21) flags.push({ label: `Elevated IOP ${iopMax} mmHg`, tone: 'critical' });

      const worst = this.worstVa(cr);
      if (worst && Number(worst.va.split('/')[1]) >= 50)
        flags.push({ label: `Reduced acuity ${worst.va} ${worst.eye}`, tone: 'warning' });

      if ((cr.allergies ?? []).some(a => a.substance && a.substance.toUpperCase() !== 'NKDA'))
        flags.push({ label: `Allergy: ${cr.allergies[0].substance}`, tone: 'warning' });

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

    // Reflect imaging module status.
    const imgStatus = this.store.imagingWork()[p.id]?.status;
    const imgResolved = imgStatus === 'Interpreted' || imgStatus === 'Ready for review';
    if (!imgResolved && p.readinessItems.some(r => r.required && !r.done && /imag|biometr|topograph|oct|field/i.test(r.label)))
      flags.push({ label: 'Imaging / testing incomplete', tone: 'warning' });
    else if (imgStatus === 'Repeat requested')
      flags.push({ label: 'Imaging repeat requested', tone: 'warning' });

    // Reflect billing module status.
    const clmStatus = this.store.claimWork()[p.id]?.status;
    const clmResolved = clmStatus === 'Submitted' || clmStatus === 'Auth received' || clmStatus === 'Ready';
    if (!clmResolved) {
      if (p.authStatus === 'expired') flags.push({ label: 'Prior auth expired — blocker', tone: 'critical' });
      else if (p.authStatus === 'pending') flags.push({ label: 'Prior auth pending', tone: 'warning' });
    }
    return flags;
  }

  // ── EMR clinical record: read + edit ────────────────────────────────────────
  protected clinicalFor(p: PatientFlowRecord): PatientClinicalRecord | null {
    return this.store.clinicalRecords()[p.id] ?? null;
  }

  private worstVa(cr: PatientClinicalRecord): { va: string; eye: string } | null {
    const od = cr.visualAcuity?.od, os = cr.visualAcuity?.os;
    const denom = (v?: string) => (v && v.includes('/') ? Number(v.split('/')[1]) : -1);
    if (!od && !os) return null;
    return denom(od) >= denom(os) ? { va: od!, eye: 'OD' } : { va: os!, eye: 'OS' };
  }

  protected missingClinical(cr: PatientClinicalRecord): string[] {
    const m: string[] = [];
    if (!cr.chiefComplaint) m.push('complaint');
    if (!cr.visualAcuity?.od && !cr.visualAcuity?.os) m.push('VA');
    if (cr.iop?.od == null && cr.iop?.os == null) m.push('IOP');
    if (!(cr.diagnosis ?? []).some(d => d.icd10)) m.push('diagnosis');
    if (!cr.assessmentPlan) m.push('plan');
    return m;
  }

  /** Compact status chips shown on the EMR summary header. */
  protected clinicalBadges(p: PatientFlowRecord): { label: string; tone: 'ok' | 'warning' | 'critical' | 'info' }[] {
    const cr = this.clinicalFor(p);
    if (!cr) return [{ label: 'Needs charting', tone: 'info' }];
    const b: { label: string; tone: 'ok' | 'warning' | 'critical' | 'info' }[] = [];
    const iopMax = Math.max(cr.iop?.od ?? 0, cr.iop?.os ?? 0);
    if (iopMax > 21) b.push({ label: 'IOP elevated', tone: 'critical' });
    if ((cr.allergies ?? []).some(a => a.substance && a.substance.toUpperCase() !== 'NKDA')) b.push({ label: 'Allergy alert', tone: 'warning' });
    if (!(cr.diagnosis ?? []).some(d => d.icd10)) b.push({ label: 'Needs diagnosis', tone: 'warning' });
    if (this.missingClinical(cr).length === 0) b.push({ label: 'Chart complete', tone: 'ok' });
    return b.length ? b : [{ label: 'Charted', tone: 'ok' }];
  }

  protected readonly examFields: { key: keyof PatientClinicalRecord['examFindings']; label: string }[] = [
    { key: 'lidsLashes', label: 'Lids / lashes' }, { key: 'conjunctiva', label: 'Conjunctiva' },
    { key: 'cornea', label: 'Cornea' }, { key: 'anteriorChamber', label: 'Ant. chamber' },
    { key: 'iris', label: 'Iris' }, { key: 'lens', label: 'Lens' },
    { key: 'vitreous', label: 'Vitreous' }, { key: 'opticNerve', label: 'Optic nerve' },
    { key: 'macula', label: 'Macula' }, { key: 'retina', label: 'Retina' },
    { key: 'vessels', label: 'Vessels' }, { key: 'periphery', label: 'Periphery' },
  ];

  // Edit state
  protected readonly clinicalEditing = signal(false);
  protected readonly clinicalDraft = signal<PatientClinicalRecord | null>(null);

  private blankClinical(p: PatientFlowRecord): PatientClinicalRecord {
    return {
      patientId: p.id, mrn: p.mrn, encounterId: `${p.id}-enc`,
      visitDate: new Date().toLocaleDateString('en-US'),
      chiefComplaint: '', visualAcuity: {}, iop: {}, allergies: [], medications: [],
      ocularHistory: [], systemicHistory: [], examFindings: {}, diagnosis: [{}], assessmentPlan: '',
    };
  }

  protected startEditClinical(p: PatientFlowRecord): void {
    const existing = this.clinicalFor(p);
    const base = existing ? structuredClone(existing) : this.blankClinical(p);
    if (!base.diagnosis?.length) base.diagnosis = [{}];
    this.clinicalDraft.set(base);
    this.clinicalEditing.set(true);
  }
  protected cancelEditClinical(): void {
    this.clinicalEditing.set(false);
    this.clinicalDraft.set(null);
  }
  protected saveClinical(p: PatientFlowRecord): void {
    const d = this.clinicalDraft();
    if (!d) return;
    const prev = this.clinicalFor(p);
    const changed = this.changedSections(prev, d);
    // strip an empty diagnosis row
    d.diagnosis = (d.diagnosis ?? []).filter(x => x.icd10 || x.description);
    this.store.saveClinicalRecord(d, changed.length ? changed : ['clinical']);
    this.clinicalEditing.set(false);
    this.clinicalDraft.set(null);
  }

  private changedSections(prev: PatientClinicalRecord | null, next: PatientClinicalRecord): string[] {
    const s: string[] = [];
    const j = (v: unknown) => JSON.stringify(v ?? null);
    if (j(prev?.chiefComplaint) !== j(next.chiefComplaint)) s.push('chief complaint');
    if (j(prev?.visualAcuity) !== j(next.visualAcuity)) s.push('visual acuity');
    if (j(prev?.iop) !== j(next.iop)) s.push('IOP');
    if (j(prev?.allergies) !== j(next.allergies)) s.push('allergies');
    if (j(prev?.medications) !== j(next.medications)) s.push('medications');
    if (j(prev?.ocularHistory) !== j(next.ocularHistory)) s.push('ocular history');
    if (j(prev?.systemicHistory) !== j(next.systemicHistory)) s.push('systemic history');
    if (j(prev?.examFindings) !== j(next.examFindings)) s.push('exam');
    if (j(prev?.diagnosis) !== j(next.diagnosis)) s.push('diagnosis');
    if (j(prev?.assessmentPlan) !== j(next.assessmentPlan)) s.push('assessment/plan');
    return s;
  }

  protected readonly clinicalDirty = computed(() => {
    const d = this.clinicalDraft();
    if (!d) return false;
    const prev = this.store.clinicalRecords()[d.patientId] ?? null;
    return this.changedSections(prev, d).length > 0;
  });

  // ── Draft patch helpers ─────────────────────────────────────────────────────
  private patch(mut: (d: PatientClinicalRecord) => void): void {
    const d = this.clinicalDraft();
    if (!d) return;
    const copy = structuredClone(d);
    mut(copy);
    this.clinicalDraft.set(copy);
  }
  protected patchField(key: 'chiefComplaint' | 'assessmentPlan', v: string): void { this.patch(d => { d[key] = v; }); }
  protected patchVa(key: keyof PatientClinicalRecord['visualAcuity'], v: string): void { this.patch(d => { d.visualAcuity = { ...d.visualAcuity, [key]: v }; }); }
  protected patchIop(eye: 'od' | 'os', v: string): void { this.patch(d => { d.iop = { ...d.iop, [eye]: v === '' ? undefined : Number(v) }; }); }
  protected patchIopMethod(v: string): void { this.patch(d => { d.iop = { ...d.iop, method: (v || undefined) as never }; }); }
  protected patchExam(key: keyof PatientClinicalRecord['examFindings'], v: string): void { this.patch(d => { d.examFindings = { ...d.examFindings, [key]: v }; }); }
  protected patchDx(key: 'icd10' | 'description' | 'eye', v: string): void {
    this.patch(d => { const arr = d.diagnosis?.length ? [...d.diagnosis] : [{}]; arr[0] = { ...arr[0], [key]: v }; d.diagnosis = arr; });
  }
  protected patchAllergies(v: string): void { this.patch(d => { d.allergies = this.splitList(v).map(substance => ({ substance })); }); }
  protected patchMeds(v: string): void { this.patch(d => { d.medications = this.splitList(v).map(name => ({ name })); }); }
  protected patchOcular(v: string): void { this.patch(d => { d.ocularHistory = this.splitList(v); }); }
  protected patchSystemic(v: string): void { this.patch(d => { d.systemicHistory = this.splitList(v); }); }
  private splitList(v: string): string[] { return v.split(',').map(s => s.trim()).filter(Boolean); }

  // Display joiners
  protected allergyText(cr: PatientClinicalRecord | null): string { return (cr?.allergies ?? []).map(a => a.substance).join(', '); }
  protected medsText(cr: PatientClinicalRecord | null): string { return (cr?.medications ?? []).map(m => m.name).join(', '); }
  protected primaryDx(cr: PatientClinicalRecord | null): string {
    const d = (cr?.diagnosis ?? []).find(x => x.icd10 || x.description);
    return d ? `${d.icd10 ?? ''}${d.icd10 && d.description ? ' — ' : ''}${d.description ?? ''}` : '';
  }

  // ── Unified patient history (clinical + flow + imaging + billing) ───────────
  protected unifiedHistory(p: PatientFlowRecord): { kind: 'clinical' | 'flow' | 'imaging' | 'billing'; at: string; label: string; detail?: string }[] {
    const out: { kind: 'clinical' | 'flow' | 'imaging' | 'billing'; at: string; label: string; detail?: string }[] = [];
    for (const m of this.store.flowHistory()[p.id] ?? [])
      out.push({ kind: 'flow', at: m.at, label: `${this.stationLabelFor(m.from)} → ${this.stationLabelFor(m.to)}`, detail: m.skipped ? `skipped · ${m.reason ?? ''}` : undefined });
    for (const a of this.store.imagingWork()[p.id]?.audit ?? [])
      out.push({ kind: 'imaging', at: a.at, label: a.action, detail: a.detail });
    for (const a of this.store.claimWork()[p.id]?.audit ?? [])
      out.push({ kind: 'billing', at: a.at, label: a.action, detail: a.detail });
    for (const a of this.store.clinicalAudit()[p.id] ?? [])
      out.push({ kind: 'clinical', at: a.createdAt, label: 'Clinical update', detail: a.changedSections.join(', ') });
    return out;
  }

  // ── Note composer ──────────────────────────────────────────────────────────
  protected readonly noteDraft = signal('');
  protected addNote(p: PatientFlowRecord): void {
    const text = this.noteDraft().trim();
    if (!text) return;
    this.store.addClinicalNote(p.id, text);
    this.noteDraft.set('');
    this.syncDrawer(p.id);
  }

  // ── Real drawer actions ─────────────────────────────────────────────────────
  protected sendToImaging(p: PatientFlowRecord): void {
    if (p.station === 'imaging') return;
    this.attemptMove(p, 'imaging');
    this.syncDrawer(p.id);
  }
  protected markReady(p: PatientFlowRecord): void {
    if (p.station === 'ready') return;
    this.attemptMove(p, 'ready');
    this.syncDrawer(p.id);
  }
  protected closeToCheckout(p: PatientFlowRecord): void {
    if (p.station === 'checkout') return;
    this.attemptMove(p, 'checkout');
    this.syncDrawer(p.id);
  }
  protected toggleUrgent(p: PatientFlowRecord): void {
    this.store.setPatientUrgent(p.id, !p.urgent);
    this.syncDrawer(p.id);
  }
}
