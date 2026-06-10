import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppointmentRecord, LocationRecord, ProviderRecord, WaitlistRecord } from '../../core/models/enterprise.models';
import { AuthStateService } from '../../core/services/auth-state.service';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { LocationModalComponent } from '../../shared/ui/location-modal.component';
import { NewAppointmentModalComponent } from '../../shared/ui/new-appointment-modal.component';
import { ProviderModalComponent } from '../../shared/ui/provider-modal.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

type ScheduleView = 'board' | 'waitlist';
type BoardScope = 'day' | 'week';

interface BoardLane {
  provider: string;
  specialty: string;
  appointments: AppointmentRecord[];
}

const STATUSES = ['Scheduled', 'Confirmed', 'Checked-in', 'In progress', 'Completed', 'No-show', 'Cancelled'];
const DAY_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

function toMin(t: string): number { const [h, m] = (t || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); }
function toHHMM(min: number): string { return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`; }

@Component({
  selector: 'app-scheduling-page',
  imports: [FormsModule, LocationModalComponent, NewAppointmentModalComponent, ProviderModalComponent, StatusChipComponent],
  templateUrl: './scheduling-page.component.html',
  styleUrl: './scheduling-page.component.scss'
})
export class SchedulingPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  private readonly auth = inject(AuthStateService);
  protected readonly waitlist = this.store.waitlist;
  protected readonly aiInsights = this.store.aiInsights;

  /* ── View / filter state ─────────────────────────── */
  protected readonly activeView = signal<ScheduleView>('board');
  protected searchQuery = '';
  protected filterPriority = '';

  protected readonly filteredWaitlist = computed(() => {
    let list = this.waitlist();
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (e) =>
          e.patient.toLowerCase().includes(q) ||
          e.request.toLowerCase().includes(q)
      );
    }
    if (this.filterPriority) {
      list = list.filter((e) => e.priority === this.filterPriority);
    }
    return list;
  });

  /* ── Persisted visual board (Sprint 10) ───────────────
     Single source of truth: store.appointments — the same collection
     the premium New/Edit modal writes to. No visual-only records. */
  protected readonly appointments = this.store.appointments;
  protected readonly statuses = STATUSES;
  protected readonly daySlots = DAY_SLOTS;

  protected readonly boardScope = signal<BoardScope>('day');
  protected readonly boardDate = signal(new Date().toISOString().slice(0, 10));
  protected readonly providerFilter = signal('');
  protected readonly locationFilter = signal('');
  protected readonly conflictMsg = signal('');
  protected readonly dropHot = signal('');
  private conflictTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly weekDays = computed(() => {
    const d = new Date(this.boardDate() + 'T12:00:00');
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return day.toISOString().slice(0, 10);
    });
  });

  /** Appointments in the visible window after provider/location filters. */
  protected readonly boardAppointments = computed(() => {
    const scope = this.boardScope();
    const dates = scope === 'day' ? [this.boardDate()] : this.weekDays();
    const prov = this.providerFilter();
    const loc = this.locationsList().find((l) => l.id === this.locationFilter());
    return this.appointments()
      .filter((a) => dates.includes(a.date))
      .filter((a) => !prov || a.provider === prov)
      .filter((a) => !loc || a.clinicId === loc.clinicId)
      .sort((x, y) => x.date.localeCompare(y.date) || toMin(x.startTime) - toMin(y.startTime));
  });

  /** Provider lanes — every active provider gets a column (empty-state included). */
  protected readonly boardLanes = computed<BoardLane[]>(() => {
    const appts = this.boardAppointments();
    const prov = this.providerFilter();
    const lanes = this.store.providersList()
      .filter((p) => p.active && p.role !== 'Technician')
      .filter((p) => !prov || p.displayName === prov)
      .map((p) => ({ provider: p.displayName, specialty: p.specialty || '', appointments: appts.filter((a) => a.provider === p.displayName) }));
    // Providers that exist only on appointment records still get a lane — nothing hidden.
    for (const a of appts) {
      if (!lanes.some((l) => l.provider === a.provider)) {
        lanes.push({ provider: a.provider, specialty: a.specialty || '', appointments: appts.filter((x) => x.provider === a.provider) });
      }
    }
    return lanes;
  });

  protected apptsInSlot(lane: BoardLane, slot: string): AppointmentRecord[] {
    const s = toMin(slot);
    return lane.appointments.filter((a) => toMin(a.startTime) >= s && toMin(a.startTime) < s + 60);
  }
  protected apptsOnDay(date: string): AppointmentRecord[] {
    return this.boardAppointments().filter((a) => a.date === date);
  }

  /* ── KPI helpers (derived from persisted records) ── */
  protected readonly totalScheduled = computed(() => this.boardAppointments().length);
  protected readonly waitlistCount = computed(() => this.waitlist().length);
  protected readonly confirmedCount = computed(() =>
    this.boardAppointments().filter((a) => a.status === 'Confirmed' || a.status === 'Checked-in').length
  );
  protected readonly noShowCount = computed(() =>
    this.boardAppointments().filter((a) => a.status === 'No-show' || a.status === 'Cancelled').length
  );
  protected readonly conflictCount = computed(() => {
    const appts = this.boardAppointments().filter((a) => a.status !== 'Cancelled' && a.status !== 'No-show');
    let n = 0;
    for (let i = 0; i < appts.length; i++) {
      for (let j = i + 1; j < appts.length; j++) {
        const a = appts[i], b = appts[j];
        if (a.provider === b.provider && a.date === b.date &&
            toMin(a.startTime) < Math.max(toMin(b.endTime), toMin(b.startTime) + 1) &&
            Math.max(toMin(a.endTime), toMin(a.startTime) + 1) > toMin(b.startTime)) n++;
      }
    }
    return n;
  });

  /* ── Drag & drop → persisted moves ────────────────── */
  protected onDragStart(ev: DragEvent, a: AppointmentRecord): void {
    ev.dataTransfer?.setData('text/plain', a.id);
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
  }
  protected onDragOver(ev: DragEvent, key: string): void {
    ev.preventDefault();
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
    this.dropHot.set(key);
  }
  protected onDragLeave(key: string): void { if (this.dropHot() === key) this.dropHot.set(''); }

  /** Day board: drop onto a provider × time slot → retime + reassign. */
  protected onDropSlot(ev: DragEvent, provider: string, slot: string): void {
    ev.preventDefault();
    this.dropHot.set('');
    const id = ev.dataTransfer?.getData('text/plain');
    const appt = id && this.appointments().find((a) => a.id === id);
    if (!appt) return;
    const dur = Math.max(toMin(appt.endTime) - toMin(appt.startTime), 15);
    const startTime = slot;
    const endTime = toHHMM(toMin(slot) + dur);
    const date = this.boardDate();
    if (appt.provider === provider && appt.startTime === startTime && appt.date === date) return;
    const clash = this.store.appointmentConflict({ id: appt.id, date, startTime, endTime, provider });
    if (clash) {
      this.warnConflict(`Blocked: ${provider} already has ${clash.patient} (${clash.id}) at ${clash.startTime}–${clash.endTime} on ${date}.`);
      return;
    }
    this.store.moveAppointment(appt.id, { date, startTime, endTime, provider }, this.auth.displayName());
  }

  /** Week board: drop onto a day column → re-date, keep time + provider. */
  protected onDropDay(ev: DragEvent, date: string): void {
    ev.preventDefault();
    this.dropHot.set('');
    const id = ev.dataTransfer?.getData('text/plain');
    const appt = id && this.appointments().find((a) => a.id === id);
    if (!appt || appt.date === date) return;
    const clash = this.store.appointmentConflict({ id: appt.id, date, startTime: appt.startTime, endTime: appt.endTime, provider: appt.provider });
    if (clash) {
      this.warnConflict(`Blocked: ${appt.provider} already has ${clash.patient} (${clash.id}) at ${clash.startTime}–${clash.endTime} on ${date}.`);
      return;
    }
    this.store.moveAppointment(appt.id, { date }, this.auth.displayName());
  }

  private warnConflict(msg: string): void {
    this.conflictMsg.set(msg);
    if (this.conflictTimer) clearTimeout(this.conflictTimer);
    this.conflictTimer = setTimeout(() => this.conflictMsg.set(''), 6000);
  }

  protected onStatusChange(a: AppointmentRecord, status: string): void {
    if (status && status !== a.status) this.store.setAppointmentStatus(a.id, status, this.auth.displayName());
  }

  protected shiftDate(days: number): void {
    const d = new Date(this.boardDate() + 'T12:00:00');
    d.setDate(d.getDate() + (this.boardScope() === 'week' ? days * 7 : days));
    this.boardDate.set(d.toISOString().slice(0, 10));
  }
  protected dayLabel(date: string): string {
    return new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  /* ── Modal state ─────────────────────────────────── */
  protected readonly apptModalOpen = signal(false);
  protected readonly selectedEntry = signal<WaitlistRecord | null>(null);
  protected readonly prefillEntry = signal<WaitlistRecord | null>(null);
  protected readonly viewOpen = signal(false);

  /* ── Appointments (Sprint 9A) ─────────────────────── */
  protected readonly apptToEdit = signal<AppointmentRecord | null>(null);

  protected openCreate(): void {
    this.prefillEntry.set(null);
    this.selectedEntry.set(null);
    this.apptToEdit.set(null);
    this.apptModalOpen.set(true);
  }

  protected editAppointment(a: AppointmentRecord): void { this.apptToEdit.set(a); }
  protected closeAppt(): void { this.apptModalOpen.set(false); this.apptToEdit.set(null); this.prefillEntry.set(null); }

  /* ── Providers + Locations maintenance (Sprint 9B) ──── */
  protected readonly providers = this.store.providersList;
  protected readonly locations = this.store.locationsList;
  protected readonly locationsList = this.store.locationsList;

  protected readonly provOpen = signal(false);
  protected readonly provToEdit = signal<ProviderRecord | null>(null);
  protected newProvider(): void { this.provToEdit.set(null); this.provOpen.set(true); }
  protected editProvider(p: ProviderRecord): void { this.provToEdit.set(p); }
  protected closeProvider(): void { this.provOpen.set(false); this.provToEdit.set(null); }

  protected readonly locOpen = signal(false);
  protected readonly locToEdit = signal<LocationRecord | null>(null);
  protected newLocation(): void { this.locToEdit.set(null); this.locOpen.set(true); }
  protected editLocation(l: LocationRecord): void { this.locToEdit.set(l); }
  protected closeLocation(): void { this.locOpen.set(false); this.locToEdit.set(null); }

  protected openBookFromWaitlist(entry: WaitlistRecord): void {
    this.prefillEntry.set(entry);
    this.apptModalOpen.set(true);
    this.viewOpen.set(false);
  }

  protected viewEntry(entry: WaitlistRecord): void {
    this.selectedEntry.set(entry);
    this.viewOpen.set(true);
  }

  protected closeView(): void {
    this.viewOpen.set(false);
    this.selectedEntry.set(null);
  }

  protected setView(v: ScheduleView): void { this.activeView.set(v); }
}
