import { Component, signal } from '@angular/core';
import { MaintenanceListComponent, MaintenanceColumn } from '../maintenance-list.component';

const COLUMNS: MaintenanceColumn[] = [
  { key: 'code',             header: 'CPT Code',    width: '100px', mono: true, sortable: true },
  { key: 'shortDescription', header: 'Description', sortable: true },
  { key: 'category',        header: 'Category',     width: '140px' },
  { key: 'ophSection',      header: 'Ophthalmic',   width: '120px' },
  { key: 'facilityRVU',     header: 'Fac. RVU',     width: '85px',  right: true },
  { key: 'nonFacilityRVU',  header: 'Non-Fac RVU',  width: '85px',  right: true },
  { key: 'defaultFee',      header: 'Default Fee',  width: '100px', right: true },
  { key: 'isSurgical',      header: 'Surgical',     width: '80px',  chip: true, chipAuto: false },
  { key: 'requiresPreAuth', header: 'Auth Reqd',    width: '90px',  chip: true, chipAuto: false },
  { key: 'isActive',        header: 'Status',       width: '80px',  chip: true, chipAuto: true },
];

const MOCK_CODES = [
  { code: '66984', shortDescription: 'Extracapsular cataract removal with IOL, 1 stage', category: 'Eye/Ocular Adnexa', ophSection: 'Anterior Segment', facilityRVU: '12.08', nonFacilityRVU: '16.44', defaultFee: '$2,847', isSurgical: 'Yes', requiresPreAuth: 'Yes', isActive: 'active' },
  { code: '66982', shortDescription: 'Complex cataract removal with IOL, 1 stage', category: 'Eye/Ocular Adnexa', ophSection: 'Anterior Segment', facilityRVU: '16.86', nonFacilityRVU: '21.22', defaultFee: '$3,920', isSurgical: 'Yes', requiresPreAuth: 'Yes', isActive: 'active' },
  { code: '92004', shortDescription: 'Ophthalmological exam, new patient, comprehensive', category: 'Ophthalmology', ophSection: 'General', facilityRVU: '2.41', nonFacilityRVU: '3.57', defaultFee: '$285', isSurgical: 'No', requiresPreAuth: 'No', isActive: 'active' },
  { code: '92012', shortDescription: 'Ophthalmological exam, established, intermediate', category: 'Ophthalmology', ophSection: 'General', facilityRVU: '0.97', nonFacilityRVU: '1.48', defaultFee: '$112', isSurgical: 'No', requiresPreAuth: 'No', isActive: 'active' },
  { code: '92014', shortDescription: 'Ophthalmological exam, established, comprehensive', category: 'Ophthalmology', ophSection: 'General', facilityRVU: '1.64', nonFacilityRVU: '2.48', defaultFee: '$192', isSurgical: 'No', requiresPreAuth: 'No', isActive: 'active' },
  { code: '92083', shortDescription: 'Visual field examination, unilateral or bilateral', category: 'Special Ophthalmology', ophSection: 'Testing', facilityRVU: '0.85', nonFacilityRVU: '1.33', defaultFee: '$125', isSurgical: 'No', requiresPreAuth: 'No', isActive: 'active' },
  { code: '92134', shortDescription: 'Scanning computerized ophthalmic diagnostic imaging, posterior segment (OCT)', category: 'Special Ophthalmology', ophSection: 'Imaging', facilityRVU: '0.87', nonFacilityRVU: '1.52', defaultFee: '$148', isSurgical: 'No', requiresPreAuth: 'No', isActive: 'active' },
  { code: '67210', shortDescription: 'Destruction of localized lesion of retina', category: 'Retina/Choroid/Vitreous', ophSection: 'Posterior Segment', facilityRVU: '6.44', nonFacilityRVU: '8.73', defaultFee: '$1,420', isSurgical: 'Yes', requiresPreAuth: 'Yes', isActive: 'active' },
  { code: '66170', shortDescription: 'Fistulization of sclera for glaucoma; trabeculectomy', category: 'Glaucoma', ophSection: 'Glaucoma', facilityRVU: '20.11', nonFacilityRVU: '26.54', defaultFee: '$4,890', isSurgical: 'Yes', requiresPreAuth: 'Yes', isActive: 'active' },
  { code: '65855', shortDescription: 'Trabeculoplasty by laser surgery, 1 or more sessions', category: 'Glaucoma', ophSection: 'Glaucoma', facilityRVU: '4.28', nonFacilityRVU: '6.11', defaultFee: '$890', isSurgical: 'Yes', requiresPreAuth: 'Yes', isActive: 'active' },
  { code: 'L8616', shortDescription: 'Iol insert eye, high power, per lens', category: 'HCPCS Level II', ophSection: 'Anterior Segment', facilityRVU: '—', nonFacilityRVU: '—', defaultFee: '$450', isSurgical: 'No', requiresPreAuth: 'Yes', isActive: 'active' },
];

@Component({
  selector: 'app-procedure-codes-maintenance',
  imports: [MaintenanceListComponent],
  template: `
    <app-maintenance-list
      pageTitle="Procedure Codes"
      eyebrow="Clinical Catalog"
      description="Manage CPT and HCPCS procedure code library with RVU values, fee schedules, authorization requirements, and ophthalmology-specific classification."
      [columns]="columns"
      [rows]="rows()"
      [canCreate]="true"
      [canExport]="true"
      [canImport]="true"
    />
  `
})
export class ProcedureCodesMaintenanceComponent {
  protected readonly columns = COLUMNS;
  protected readonly rows = signal(MOCK_CODES);
}
