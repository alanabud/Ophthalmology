import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { PatientRecord } from '../../core/models/enterprise.models';
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
  private readonly router = inject(Router);

  protected readonly query = signal('');
  protected readonly statusFilter = signal('');
  protected readonly clinicFilter = signal('');
  protected readonly newPatientOpen = signal(false);
  protected readonly selectedPatientId = signal<string | null>(null);
  protected readonly editingPatient = signal<import('../../core/models/enterprise.models').PatientRecord | null>(null);

  protected readonly allPatients = this.store.patients;
  protected readonly clinics = this.store.clinicOptions;
  protected readonly patientBriefings = this.store.patientBriefings;

  protected readonly patients = computed(() => {
    const search = this.query().trim().toLowerCase();
    let records = this.store.patients();

    if (search) {
      records = records.filter(
        (r) =>
          r.fullName.toLowerCase().includes(search) ||
          r.mrn.toLowerCase().includes(search) ||
          r.insurance.toLowerCase().includes(search) ||
          r.status.toLowerCase().includes(search)
      );
    }
    if (this.clinicFilter()) {
      records = records.filter((r) => r.clinicId === this.clinicFilter());
    }
    return records;
  });

  protected readonly selectedPatient = computed<PatientRecord | null>(() => {
    const id = this.selectedPatientId();
    if (!id) return null;
    return this.patients().find((p) => p.id === id) ?? null;
  });

  protected readonly recallGaps = 7;
  protected readonly balanceOver = 14;
  protected readonly highRisk = 5;
  protected readonly unsignedCharts = 3;
  protected readonly pendingAuths = 6;

  protected selectPatient(patient: PatientRecord): void {
    this.selectedPatientId.set(patient.id);
  }

  protected viewPatient(patient: PatientRecord): void {
    this.selectedPatientId.set(patient.id);
    // Scroll detail panel into view on small screens
    setTimeout(() => {
      document.querySelector('.pt-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  protected editPatient(patient: PatientRecord): void {
    this.selectedPatientId.set(patient.id);
    this.editingPatient.set(patient);
    this.newPatientOpen.set(true);
  }

  protected schedulePatient(_patient: PatientRecord): void {
    this.router.navigate(['/scheduling']);
  }
}
