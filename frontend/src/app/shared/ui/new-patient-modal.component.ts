import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { AppModalComponent } from './app-modal.component';

@Component({
  selector: 'app-new-patient-modal',
  imports: [AppModalComponent, FormsModule],
  templateUrl: './new-patient-modal.component.html',
  styleUrl: './new-patient-modal.component.scss'
})
export class NewPatientModalComponent {
  private readonly store = inject(EnterpriseStoreService);

  readonly open = input(false);
  readonly closed = output<void>();

  protected readonly clinics = this.store.clinicOptions;
  protected readonly isSubmitting = signal(false);
  protected readonly submitted = signal(false);

  protected firstName = '';
  protected lastName = '';
  protected dob = '';
  protected insurance = '';
  protected clinicId = '';

  protected get canSubmit(): boolean {
    return !!this.firstName.trim() && !!this.lastName.trim() && !!this.dob;
  }

  protected submit(): void {
    if (!this.canSubmit || this.isSubmitting()) return;

    this.isSubmitting.set(true);

    const targetClinicId =
      this.clinicId || (this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park');

    this.store.createPatient({
      id: `pt-new-${Date.now()}`,
      clinicId: targetClinicId,
      mrn: `NEW-${String(Date.now()).slice(-6)}`,
      fullName: `${this.firstName.trim()} ${this.lastName.trim()}`,
      dob: this.dob,
      status: 'New Patient',
      statusTone: 'info',
      lastEncounter: '—',
      nextVisit: 'Pending scheduling',
      balance: '$0.00',
      insurance: this.insurance.trim() || 'Not provided',
      chartCompleteness: '0%',
      careGap: 'Initial intake pending',
      imageStatus: 'No imaging on file',
      aiFlag: 'New patient — no prior history'
    });

    this.isSubmitting.set(false);
    this.submitted.set(true);

    setTimeout(() => {
      this.resetAndClose();
    }, 1400);
  }

  protected cancel(): void {
    this.resetAndClose();
  }

  private resetAndClose(): void {
    this.firstName = '';
    this.lastName = '';
    this.dob = '';
    this.insurance = '';
    this.clinicId = '';
    this.submitted.set(false);
    this.isSubmitting.set(false);
    this.closed.emit();
  }
}
