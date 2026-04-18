import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { WaitlistRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { NewAppointmentModalComponent } from '../../shared/ui/new-appointment-modal.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

type ScheduleView = 'board' | 'waitlist';

@Component({
  selector: 'app-scheduling-page',
  imports: [FormsModule, NewAppointmentModalComponent, StatusChipComponent],
  templateUrl: './scheduling-page.component.html',
  styleUrl: './scheduling-page.component.scss'
})
export class SchedulingPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly scheduleLanes = this.store.scheduleLanes;
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

  /* ── KPI helpers ─────────────────────────────────── */
  protected readonly totalScheduled = computed(() =>
    this.scheduleLanes().reduce((sum, lane) => sum + lane.blocks.length, 0)
  );
  protected readonly waitlistCount = computed(() => this.waitlist().length);
  protected readonly confirmedCount = computed(() =>
    this.scheduleLanes()
      .flatMap((l) => l.blocks)
      .filter((b) => b.status === 'Confirmed' || b.status === 'Checked-in' || b.status === 'Checked in').length
  );
  protected readonly noShowRisk = 5; // Static AI prediction

  /* ── Modal state ─────────────────────────────────── */
  protected readonly apptModalOpen = signal(false);
  protected readonly selectedEntry = signal<WaitlistRecord | null>(null);
  protected readonly prefillEntry = signal<WaitlistRecord | null>(null);
  protected readonly viewOpen = signal(false);

  protected openCreate(): void {
    this.prefillEntry.set(null);
    this.selectedEntry.set(null);
    this.apptModalOpen.set(true);
  }

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
