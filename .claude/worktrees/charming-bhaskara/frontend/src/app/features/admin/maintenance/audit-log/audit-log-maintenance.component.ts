import { Component, signal } from '@angular/core';
import { MaintenanceListComponent, MaintenanceColumn } from '../maintenance-list.component';

const COLUMNS: MaintenanceColumn[] = [
  { key: 'timestamp',    header: 'Timestamp',    width: '160px', mono: true, sortable: true },
  { key: 'userName',     header: 'User',         sortable: true },
  { key: 'userRole',     header: 'Role',         width: '130px' },
  { key: 'clinicName',   header: 'Clinic',       sortable: true },
  { key: 'actionCategory', header: 'Category',   width: '110px', chip: true, chipAuto: false },
  { key: 'actionDescription', header: 'Action',  sortable: true },
  { key: 'resourceType', header: 'Resource',     width: '120px' },
  { key: 'isPhiAccess',  header: 'PHI',          width: '60px',  chip: true, chipAuto: false },
  { key: 'riskLevel',    header: 'Risk',         width: '80px',  chip: true, chipAuto: true },
  { key: 'outcome',      header: 'Outcome',      width: '90px',  chip: true, chipAuto: true },
];

const MOCK_AUDIT = [
  { timestamp: '2026-03-07 09:42:18', userName: 'Dr. A. Patel', userRole: 'Physician', clinicName: 'Lake Nona', actionCategory: 'Clinical', actionDescription: 'Signed encounter note #EN-48291', resourceType: 'Encounter', isPhiAccess: 'Yes', riskLevel: 'low', outcome: 'success' },
  { timestamp: '2026-03-07 09:38:55', userName: 'B. Martinez', userRole: 'Billing Specialist', clinicName: 'Orlando Central', actionCategory: 'Billing', actionDescription: 'Submitted claim batch #CL-2026-0307-01', resourceType: 'Claim Batch', isPhiAccess: 'Yes', riskLevel: 'low', outcome: 'success' },
  { timestamp: '2026-03-07 09:31:20', userName: 'S. Thompson', userRole: 'Office Manager', clinicName: 'Clermont', actionCategory: 'Admin', actionDescription: 'Modified schedule template: Dr. Singh WP', resourceType: 'Schedule Template', isPhiAccess: 'No', riskLevel: 'medium', outcome: 'success' },
  { timestamp: '2026-03-07 09:22:08', userName: 'T. Rodriguez', userRole: 'Technician', clinicName: 'Sanford', actionCategory: 'Clinical', actionDescription: 'Uploaded OCT study for patient MRN 84921', resourceType: 'Imaging Study', isPhiAccess: 'Yes', riskLevel: 'low', outcome: 'success' },
  { timestamp: '2026-03-07 09:18:44', userName: 'Admin API', userRole: 'System', clinicName: 'Network', actionCategory: 'Integration', actionDescription: 'Payer eligibility batch completed: 148 records', resourceType: 'Integration Feed', isPhiAccess: 'Yes', riskLevel: 'low', outcome: 'success' },
  { timestamp: '2026-03-07 08:54:12', userName: 'K. Wilson', userRole: 'Billing Supervisor', clinicName: 'Lake Nona', actionCategory: 'Config', actionDescription: 'Updated fee schedule: Medicare 2026 — 12 line items', resourceType: 'Fee Schedule', isPhiAccess: 'No', riskLevel: 'high', outcome: 'success' },
  { timestamp: '2026-03-07 08:49:37', userName: 'Dr. J. Chen', userRole: 'Physician', clinicName: 'Orlando Central', actionCategory: 'Clinical', actionDescription: 'Accessed patient chart MRN 19283 (retina consult)', resourceType: 'Patient Chart', isPhiAccess: 'Yes', riskLevel: 'low', outcome: 'success' },
  { timestamp: '2026-03-07 08:31:02', userName: 'System Monitor', userRole: 'System', clinicName: 'Network', actionCategory: 'Integration', actionDescription: 'HL7 connection to Nextgen EMR timed out', resourceType: 'Integration Endpoint', isPhiAccess: 'No', riskLevel: 'medium', outcome: 'inactive' },
];

@Component({
  selector: 'app-audit-log-maintenance',
  imports: [MaintenanceListComponent],
  template: `
    <app-maintenance-list
      pageTitle="Audit Log"
      eyebrow="Governance"
      description="Read-only audit trail of all system actions including PHI access, configuration changes, integration events, and clinical workflow events. HIPAA compliant."
      [columns]="columns"
      [rows]="rows()"
      [canCreate]="false"
      [canExport]="true"
    />
  `
})
export class AuditLogMaintenanceComponent {
  protected readonly columns = COLUMNS;
  protected readonly rows = signal(MOCK_AUDIT);
}
