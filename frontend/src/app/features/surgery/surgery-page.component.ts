import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SurgeryCase } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { AppModalComponent } from '../../shared/ui/app-modal.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-surgery-page',
  imports: [FormsModule, AppModalComponent, StatusChipComponent],
  templateUrl: './surgery-page.component.html',
  styleUrl: './surgery-page.component.scss'
})
export class SurgeryPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly cases = this.store.surgeryCases;

  // Modal state
  protected readonly selectedCase = signal<SurgeryCase | null>(null);
  protected readonly viewOpen = signal(false);
  protected readonly createOpen = signal(false);

  // Create form fields
  protected fPatient = '';
  protected fProcedure = '';
  protected fSurgeon = '';
  protected fDate = '';
  protected fImplant = '';
  protected fRisk = '';

  protected viewCase(c: SurgeryCase): void {
    this.selectedCase.set(c);
    this.viewOpen.set(true);
  }

  protected openCreate(): void {
    this.fPatient = '';
    this.fProcedure = '';
    this.fSurgeon = '';
    this.fDate = '';
    this.fImplant = '';
    this.fRisk = '';
    this.createOpen.set(true);
  }

  protected saveCase(): void {
    if (!this.fPatient.trim() || !this.fProcedure.trim()) return;
    const clinicId = this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park';
    this.store.createSurgeryCase({
      clinicId,
      patient: this.fPatient.trim(),
      procedure: this.fProcedure.trim(),
      surgeon: this.fSurgeon.trim() || 'TBD',
      date: this.fDate || 'TBD',
      readiness: 'Pending review',
      tone: 'neutral',
      implant: this.fImplant.trim() || 'TBD',
      clearance: 'Pending',
      risk: this.fRisk.trim() || 'Not assessed',
    });
    this.createOpen.set(false);
  }

  protected closeView(): void { this.viewOpen.set(false); this.selectedCase.set(null); }
  protected closeCreate(): void { this.createOpen.set(false); }
}
