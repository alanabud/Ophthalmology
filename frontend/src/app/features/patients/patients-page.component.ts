import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { NewPatientModalComponent } from '../../shared/ui/new-patient-modal.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-patients-page',
  imports: [FormsModule, NewPatientModalComponent, StatusChipComponent],
  templateUrl: './patients-page.component.html',
  styleUrl: './patients-page.component.scss'
})
export class PatientsPageComponent {
  private readonly store = inject(EnterpriseStoreService);

  protected readonly query = signal('');
  protected readonly newPatientOpen = signal(false);
  protected readonly patients = computed(() => {
    const search = this.query().trim().toLowerCase();
    const records = this.store.patients();
    if (!search) {
      return records;
    }
    return records.filter(
      (record) =>
        record.fullName.toLowerCase().includes(search) ||
        record.mrn.toLowerCase().includes(search) ||
        record.aiFlag.toLowerCase().includes(search)
    );
  });
  protected readonly selectedPatient = computed(() => this.patients()[0] ?? this.store.patients()[0]);
  protected readonly patientBriefings = this.store.patientBriefings;

  protected setQuery(value: string): void {
    this.query.set(value);
  }
}
