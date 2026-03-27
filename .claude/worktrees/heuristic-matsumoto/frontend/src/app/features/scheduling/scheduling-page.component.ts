import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { AppointmentCategory, ScheduleBlock, ScheduleLane } from '../../core/models/enterprise.models';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

export type ScheduleView = 'lane' | 'day' | 'week';
export type ApptModalSection =
  'patient' | 'provider' | 'datetime' | 'insurance' | 'arrival' | 'reminders';

export interface AppointmentFormState {
  patientSearch: string; patientMrn: string; isNewPatient: string;
  visitType: string; visitReason: string; newEstablished: string; priority: string;
  provider: string; clinic: string; room: string; specialty: string;
  apptDate: string; startTime: string; endTime: string; duration: string;
  overbook: string; conflictOverride: string; waitlistCandidate: string;
  insurance: string; priorAuthRequired: string; priorAuthNumber: string;
  referralRequired: string; copayExpected: string;
  interpreterNeeded: string; transportationIssue: string;
  arrivalNotes: string; clinicalPrepNotes: string;
  reminderPreference: string; reminderSms: string;
  reminderEmail: string; reminderCall: string;
  status: string; source: string; confirmationState: string; schedulerNotes: string;
}

const TODAY = new Date().toISOString().split('T')[0];

const EMPTY_APPT: AppointmentFormState = {
  patientSearch: '', patientMrn: '', isNewPatient: 'Existing',
  visitType: '', visitReason: '', newEstablished: 'Established', priority: 'Normal',
  provider: '', clinic: '', room: '', specialty: '',
  apptDate: TODAY, startTime: '', endTime: '', duration: '30',
  overbook: 'No', conflictOverride: 'No', waitlistCandidate: 'No',
  insurance: '', priorAuthRequired: 'No', priorAuthNumber: '',
  referralRequired: 'No', copayExpected: '',
  interpreterNeeded: 'No', transportationIssue: 'No',
  arrivalNotes: '', clinicalPrepNotes: '',
  reminderPreference: 'SMS', reminderSms: 'Yes', reminderEmail: 'Yes', reminderCall: 'No',
  status: 'Scheduled', source: 'Front desk',
  confirmationState: 'Unconfirmed', schedulerNotes: '',
};

export const APPT_SECTIONS: Array<{ id: ApptModalSection; label: string; badge: string }> = [
  { id: 'patient',   label: 'Patient & visit',      badge: '01' },
  { id: 'provider',  label: 'Provider & resource',  badge: '02' },
  { id: 'datetime',  label: 'Date, time & rules',   badge: '03' },
  { id: 'insurance', label: 'Insurance & auth',     badge: '04' },
  { id: 'arrival',   label: 'Arrival & clinical',   badge: '05' },
  { id: 'reminders', label: 'Reminders & admin',    badge: '06' },
];

// ─── Time grid constants ──────────────────────────────────────────────────────
const GRID_START  = 10;           // 10:00 AM
const GRID_END    = 14;           // 2:00 PM
const MIN_PER_PX  = 2;            // pixels per minute
const HOUR_PX     = 60 * MIN_PER_PX;  // 120 px/hr
const BLOCK_H_EST = 84;           // estimated card height for gap calc

// ─── Conflict / risk alerts ───────────────────────────────────────────────────
const SCHEDULE_CONFLICTS = [
  {
    id: 'cf1',
    label: 'Dr. Vale — 18 min behind',
    detail: '2 patients may need rescheduling if lag continues',
    tone: 'warning' as const,
    action: 'Escalate',
  },
  {
    id: 'cf2',
    label: 'Auth hold — Robert Singh',
    detail: 'Prior auth pending · Exam 5 slot held until 11:00',
    tone: 'warning' as const,
    action: 'Chase auth',
  },
  {
    id: 'cf3',
    label: 'No-show risk — Ronald Price',
    detail: '11:20 · Retina 3 · outreach not confirmed',
    tone: 'critical' as const,
    action: 'Outreach',
  },
];

@Component({
  selector: 'app-scheduling-page',
  imports: [FormsModule, StatusChipComponent],
  templateUrl: './scheduling-page.component.html',
  styleUrl: './scheduling-page.component.scss'
})
export class SchedulingPageComponent {
  private readonly store = inject(EnterpriseStoreService);

  protected readonly scheduleLanes    = this.store.scheduleLanes;
  protected readonly waitlist         = this.store.waitlist;
  protected readonly aiInsights       = this.store.aiInsights;
  protected readonly scheduleConflicts = signal(SCHEDULE_CONFLICTS);

  protected readonly apptSections = APPT_SECTIONS;

  // ── Time grid ──────────────────────────────────────────────────────────────
  protected readonly laneBodyHeight = (GRID_END - GRID_START) * HOUR_PX; // 480 px

  protected readonly halfHourTicks: Array<{label: string; isHour: boolean; top: number}> = (() => {
    const ticks: Array<{label: string; isHour: boolean; top: number}> = [];
    for (let h = GRID_START; h <= GRID_END; h++) {
      const p  = h >= 12 ? 'p' : 'a';
      const dh = h > 12 ? h - 12 : h;
      ticks.push({ label: `${dh}${p}`, isHour: true,  top: (h - GRID_START) * HOUR_PX });
      if (h < GRID_END) {
        ticks.push({ label: `${dh}:30`, isHour: false, top: (h - GRID_START) * HOUR_PX + HOUR_PX / 2 });
      }
    }
    return ticks;
  })();

  protected readonly nowLineTop = computed<number | null>(() => {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes();
    if (h < GRID_START || h > GRID_END || (h === GRID_END && m > 0)) return null;
    return ((h - GRID_START) * 60 + m) * MIN_PER_PX;
  });

  protected blockMarginTop(blocks: ScheduleBlock[], idx: number): number {
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return (h - GRID_START) * 60 + m;
    };
    if (idx === 0) return Math.max(4, toMin(blocks[0].time) * MIN_PER_PX);
    const gap = (toMin(blocks[idx].time) - toMin(blocks[idx - 1].time)) * MIN_PER_PX - BLOCK_H_EST;
    return Math.max(4, gap);
  }

  protected openSlotsMargin(lane: ScheduleLane): number {
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return (h - GRID_START) * 60 + m;
    };
    const firstSlot = lane.openSlotTimes?.[0];
    if (!lane.blocks.length || !firstSlot) return 8;
    const gap = (toMin(firstSlot) - toMin(lane.blocks[lane.blocks.length - 1].time)) * MIN_PER_PX - BLOCK_H_EST;
    return Math.max(8, gap);
  }

  /** Short display label for appointment category badge */
  protected categoryLabel(cat?: AppointmentCategory): string {
    const map: Partial<Record<AppointmentCategory, string>> = {
      urgent: 'URGENT', 'walk-in': 'WALK-IN', 'post-op': 'POST-OP',
      injection: 'INJ', surgery: 'SURGERY', block: 'BLOCK',
    };
    return cat ? (map[cat] ?? '') : '';
  }

  // ── Control strip state ────────────────────────────────────────────────────
  protected readonly activeView      = signal<ScheduleView>('lane');
  protected readonly selectedDate    = signal(TODAY);
  protected readonly filterClinic    = signal('all');
  protected readonly filterProvider  = signal('all');
  protected readonly filterConflicts = signal(false);
  protected readonly filterStatus    = signal('all');

  // ── Modal state ────────────────────────────────────────────────────────────
  protected readonly showNewApptModal = signal(false);
  protected readonly apptModalSection = signal<ApptModalSection>('patient');
  protected readonly apptModalTitle   = signal('New appointment');
  protected form: AppointmentFormState = { ...EMPTY_APPT };

  protected readonly apptSectionIndex = computed(() =>
    APPT_SECTIONS.findIndex(s => s.id === this.apptModalSection())
  );

  protected readonly kpiStats = computed(() => [
    { label: 'Provider lanes',     value: this.scheduleLanes().length.toString(), tone: 'accent'   as const },
    { label: 'Waitlist fit ready', value: this.waitlist().length.toString(),      tone: 'warning'  as const },
    { label: 'No-show risks',      value: '5',                                   tone: 'critical' as const },
    { label: 'Same-day conflicts', value: '3',                                   tone: 'critical' as const },
    { label: 'Open slots today',   value: '8',                                   tone: 'accent'   as const },
    { label: 'Unconfirmed appts',  value: '12',                                  tone: 'warning'  as const },
  ]);

  protected readonly displayDate = computed(() => {
    const d = new Date(this.selectedDate() + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  });

  protected prevDay(): void {
    const d = new Date(this.selectedDate() + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    this.selectedDate.set(d.toISOString().split('T')[0]);
  }

  protected nextDay(): void {
    const d = new Date(this.selectedDate() + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    this.selectedDate.set(d.toISOString().split('T')[0]);
  }

  protected goToday(): void { this.selectedDate.set(TODAY); }
  protected setView(v: ScheduleView): void { this.activeView.set(v); }
  protected toggleConflicts(): void { this.filterConflicts.update(v => !v); }

  protected openNewAppt(presetProvider?: string): void {
    this.form = { ...EMPTY_APPT };
    if (presetProvider) { this.form.provider = presetProvider; }
    this.apptModalTitle.set('New appointment');
    this.apptModalSection.set('patient');
    this.showNewApptModal.set(true);
  }

  protected openWalkIn(): void {
    this.form = { ...EMPTY_APPT, visitType: 'Urgent / walk-in', priority: 'Urgent', status: 'Walk-in' };
    this.apptModalTitle.set('Add walk-in');
    this.apptModalSection.set('patient');
    this.showNewApptModal.set(true);
  }

  protected openBlockTime(presetProvider?: string): void {
    this.form = { ...EMPTY_APPT, visitType: 'Block — provider unavailable', status: 'Blocked' };
    if (presetProvider) { this.form.provider = presetProvider; }
    this.apptModalTitle.set('Block provider time');
    this.apptModalSection.set('provider');
    this.showNewApptModal.set(true);
  }

  protected openWaitlistFit(): void {
    this.form = { ...EMPTY_APPT, waitlistCandidate: 'Yes', source: 'Waitlist fit' };
    this.apptModalTitle.set('Fit waitlist patient');
    this.apptModalSection.set('patient');
    this.showNewApptModal.set(true);
  }

  protected closeModal(): void { this.showNewApptModal.set(false); }
  protected setApptSection(s: ApptModalSection): void { this.apptModalSection.set(s); }

  protected nextSection(): void {
    const idx = this.apptSectionIndex();
    if (idx < APPT_SECTIONS.length - 1) {
      this.apptModalSection.set(APPT_SECTIONS[idx + 1].id);
    }
  }

  protected prevSection(): void {
    const idx = this.apptSectionIndex();
    if (idx > 0) { this.apptModalSection.set(APPT_SECTIONS[idx - 1].id); }
  }

  protected submitAppt(): void { this.showNewApptModal.set(false); }
  protected stopProp(e: MouseEvent): void { e.stopPropagation(); }
}
