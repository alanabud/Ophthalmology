import { Component, signal } from '@angular/core';
import { MaintenanceListComponent, MaintenanceColumn } from '../maintenance-list.component';

const COLUMNS: MaintenanceColumn[] = [
  { key: 'npi',          header: 'NPI',         width: '120px', mono: true, sortable: true },
  { key: 'displayName',  header: 'Provider',    sortable: true },
  { key: 'providerType', header: 'Type',        width: '100px', chip: true, chipAuto: false },
  { key: 'primarySpecialty', header: 'Specialty', sortable: true },
  { key: 'primaryClinic', header: 'Clinic',     sortable: true },
  { key: 'stateLicense', header: 'License',     width: '120px', mono: true },
  { key: 'licenseExpiry', header: 'Lic. Expiry', width: '110px', sortable: true },
  { key: 'credentialingStatus', header: 'Credentialing', width: '130px', chip: true, chipAuto: true },
  { key: 'activeState',  header: 'Status',      width: '90px',  chip: true, chipAuto: true },
];

const MOCK_PROVIDERS = [
  { npi: '1234567890', displayName: 'Dr. Anika Patel, MD', providerType: 'Physician', primarySpecialty: 'Ophthalmology', primaryClinic: 'Lake Nona', stateLicense: 'FL-ME-88421', licenseExpiry: '2027-03-31', credentialingStatus: 'approved', activeState: 'active' },
  { npi: '2345678901', displayName: 'Dr. James Chen, MD', providerType: 'Physician', primarySpecialty: 'Retina', primaryClinic: 'Orlando Central', stateLicense: 'FL-ME-79203', licenseExpiry: '2026-11-30', credentialingStatus: 'approved', activeState: 'active' },
  { npi: '3456789012', displayName: 'Dr. Maria Rivera, MD', providerType: 'Physician', primarySpecialty: 'Glaucoma', primaryClinic: 'Altamonte', stateLicense: 'FL-ME-64512', licenseExpiry: '2025-08-31', credentialingStatus: 'pending_review', activeState: 'active' },
  { npi: '4567890123', displayName: 'Dr. Kevin Singh, MD', providerType: 'Physician', primarySpecialty: 'Cataract', primaryClinic: 'Clermont', stateLicense: 'FL-ME-57834', licenseExpiry: '2027-01-31', credentialingStatus: 'approved', activeState: 'active' },
  { npi: '5678901234', displayName: 'Dr. Sandra Williams, OD', providerType: 'OD', primarySpecialty: 'Optometry', primaryClinic: 'Winter Park', stateLicense: 'FL-OD-33291', licenseExpiry: '2026-06-30', credentialingStatus: 'approved', activeState: 'active' },
  { npi: '6789012345', displayName: 'Dr. Michael Thompson, MD', providerType: 'Physician', primarySpecialty: 'Cornea', primaryClinic: 'Sanford', stateLicense: 'FL-ME-44128', licenseExpiry: '2026-12-31', credentialingStatus: 'approved', activeState: 'active' },
  { npi: '7890123456', displayName: 'Dr. Rachel Kim, MD', providerType: 'Fellow', primarySpecialty: 'Retina', primaryClinic: 'Orlando Central', stateLicense: 'FL-ME-92834', licenseExpiry: '2025-06-30', credentialingStatus: 'pending_review', activeState: 'active' },
  { npi: '8901234567', displayName: 'Dr. Thomas Garcia, PA-C', providerType: 'PA', primarySpecialty: 'Ophthalmology', primaryClinic: 'Clermont', stateLicense: 'FL-PA-18423', licenseExpiry: '2026-09-30', credentialingStatus: 'approved', activeState: 'inactive' },
];

@Component({
  selector: 'app-providers-maintenance',
  imports: [MaintenanceListComponent],
  template: `
    <app-maintenance-list
      pageTitle="Providers"
      eyebrow="Clinical Setup"
      description="Manage ophthalmologist, optometrist, and mid-level provider profiles, credentials, and scheduling configuration."
      [columns]="columns"
      [rows]="rows()"
      [canCreate]="true"
      [canExport]="true"
      [canImport]="true"
    />
  `
})
export class ProvidersMaintenanceComponent {
  protected readonly columns = COLUMNS;
  protected readonly rows = signal(MOCK_PROVIDERS);
}
