import { Component, signal } from '@angular/core';
import { MaintenanceListComponent, MaintenanceColumn } from '../maintenance-list.component';

const COLUMNS: MaintenanceColumn[] = [
  { key: 'shortLabel',   header: 'Code',       width: '70px',  mono: true },
  { key: 'name',         header: 'Clinic Name', sortable: true },
  { key: 'clinicType',   header: 'Type',        width: '120px' },
  { key: 'region',       header: 'Region',      sortable: true },
  { key: 'npi',          header: 'NPI',         width: '120px', mono: true },
  { key: 'placeOfService', header: 'POS',       width: '60px',  mono: true },
  { key: 'examRooms',    header: 'Rooms',       width: '70px',  right: true },
  { key: 'maxCapacity',  header: 'Capacity',    width: '80px',  right: true },
  { key: 'isAscLicensed', header: 'ASC',        width: '60px',  chip: true, chipAuto: false },
  { key: 'activeState',  header: 'Status',      width: '90px',  chip: true, chipAuto: true },
];

const MOCK_CLINICS = [
  { shortLabel: 'NW', name: 'Acuity Eye Network (Regional)', clinicType: 'Multi-specialty', region: 'Regional', npi: '1000000001', placeOfService: '11', examRooms: 28, maxCapacity: 120, isAscLicensed: 'Yes', activeState: 'active' },
  { shortLabel: 'CL', name: 'Clermont Cataract Center', clinicType: 'Cataract/ASC', region: 'West Orlando', npi: '1000000002', placeOfService: '24', examRooms: 6, maxCapacity: 32, isAscLicensed: 'Yes', activeState: 'active' },
  { shortLabel: 'LN', name: 'Lake Nona Glaucoma Institute', clinicType: 'Glaucoma', region: 'Lake Nona', npi: '1000000003', placeOfService: '11', examRooms: 8, maxCapacity: 40, isAscLicensed: 'No', activeState: 'active' },
  { shortLabel: 'OC', name: 'Orlando Central Ophthalmology', clinicType: 'Ophthalmology', region: 'Downtown Orlando', npi: '1000000004', placeOfService: '11', examRooms: 10, maxCapacity: 48, isAscLicensed: 'No', activeState: 'active' },
  { shortLabel: 'WP', name: 'Winter Park Retina', clinicType: 'Retina', region: 'Winter Park', npi: '1000000005', placeOfService: '11', examRooms: 6, maxCapacity: 24, isAscLicensed: 'No', activeState: 'active' },
  { shortLabel: 'AL', name: 'Altamonte Springs Eye Care', clinicType: 'Ophthalmology', region: 'Altamonte', npi: '1000000006', placeOfService: '11', examRooms: 5, maxCapacity: 22, isAscLicensed: 'No', activeState: 'active' },
  { shortLabel: 'SF', name: 'Sanford Comprehensive Eye', clinicType: 'Ophthalmology', region: 'Sanford', npi: '1000000007', placeOfService: '11', examRooms: 7, maxCapacity: 30, isAscLicensed: 'No', activeState: 'active' },
];

@Component({
  selector: 'app-clinics-maintenance',
  imports: [MaintenanceListComponent],
  template: `
    <app-maintenance-list
      pageTitle="Clinics"
      eyebrow="Network Setup"
      description="Configure clinic locations, capacity, NPI registration, ASC licensing, and operational parameters."
      [columns]="columns"
      [rows]="rows()"
      [canCreate]="true"
      [canExport]="true"
    />
  `
})
export class ClinicsMaintenanceComponent {
  protected readonly columns = COLUMNS;
  protected readonly rows = signal(MOCK_CLINICS);
}
