import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { WaitlistRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { AppModalComponent } from '../../shared/ui/app-modal.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-scheduling-page',
  imports: [FormsModule, AppModalComponent, StatusChipComponent],
  templateUrl: './scheduling-page.component.html',
  styleUrl: './scheduling-page.component.scss'
})
export class SchedulingPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly scheduleLanes = this.store.scheduleLanes;
  protected readonly waitlist = this.store.waitlist;
  protected readonly aiInsights = this.store.aiInsights;

  // Modal state
  protected readonly selectedEntry = signal<WaitlistRecord | null>(null);
  protected readonly viewOpen = signal(false);
  protected readonly bookOpen = signal(false);
  protected readonly createOpen = signal(false);

  // Create form fields
  protected fPatient = '';
  protected fRequest = '';
  protected fPreferredWindow = '';

  // Book form fields
  protected fBookDate = '';
  protected fBookTime = '';
  protected fBookProvider = '';

  protected viewEntry(entry: WaitlistRecord): void {
    this.selectedEntry.set(entry);
    this.viewOpen.set(true);
  }

  protected openBook(entry: WaitlistRecord): void {
    this.selectedEntry.set(entry);
    this.fBookDate = '';
    this.fBookTime = '';
    this.fBookProvider = '';
    this.bookOpen.set(true);
  }

  protected confirmBook(): void {
    if (!this.fBookDate || !this.fBookProvider) return;
    // In a real app, this would move the entry to a confirmed slot.
    // For now we close the modal — the waitlist entry remains visible.
    this.bookOpen.set(false);
    this.selectedEntry.set(null);
  }

  protected openCreate(): void {
    this.fPatient = '';
    this.fRequest = '';
    this.fPreferredWindow = '';
    this.createOpen.set(true);
  }

  protected saveEntry(): void {
    if (!this.fPatient.trim()) return;
    const clinicId = this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park';
    this.store.createWaitlistEntry({
      clinicId,
      patient: this.fPatient.trim(),
      request: this.fRequest.trim() || 'General visit',
      preferredWindow: this.fPreferredWindow.trim() || 'Flexible',
      fitScore: 'Pending',
      tone: 'neutral',
    });
    this.createOpen.set(false);
  }

  protected closeView(): void { this.viewOpen.set(false); this.selectedEntry.set(null); }
  protected closeBook(): void { this.bookOpen.set(false); this.selectedEntry.set(null); }
  protected closeCreate(): void { this.createOpen.set(false); }
}
