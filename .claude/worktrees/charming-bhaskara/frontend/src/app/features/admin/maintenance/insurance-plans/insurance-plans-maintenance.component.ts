import { Component, signal } from '@angular/core';
import { MaintenanceListComponent, MaintenanceColumn } from '../maintenance-list.component';

const COLUMNS: MaintenanceColumn[] = [
  { key: 'payerShortCode', header: 'Code',       width: '70px', mono: true },
  { key: 'payerName',      header: 'Payer',       sortable: true },
  { key: 'planName',       header: 'Plan Name',   sortable: true },
  { key: 'planType',       header: 'Type',        width: '140px' },
  { key: 'networkStatus',  header: 'Network',     width: '120px', chip: true, chipAuto: false },
  { key: 'electronicPayerId', header: 'EDI Payer', width: '100px', mono: true },
  { key: 'claimTimelimit', header: 'Filing Limit', width: '100px', right: true },
  { key: 'requiresPreAuth', header: 'Auth',       width: '70px',  chip: true, chipAuto: false },
  { key: 'activeState',    header: 'Status',      width: '90px',  chip: true, chipAuto: true },
];

const MOCK_PLANS = [
  { payerShortCode: 'MCR', payerName: 'Medicare', planName: 'Medicare Part B', planType: 'Medicare', networkStatus: 'Participating', electronicPayerId: '01112', claimTimelimit: '365 days', requiresPreAuth: 'Limited', activeState: 'active' },
  { payerShortCode: 'MCD', payerName: 'Florida Medicaid', planName: 'FL Medicaid FFS', planType: 'Medicaid', networkStatus: 'Participating', electronicPayerId: '59354', claimTimelimit: '12 months', requiresPreAuth: 'Yes', activeState: 'active' },
  { payerShortCode: 'BCBS', payerName: 'Blue Cross Blue Shield FL', planName: 'BlueOptions PPO', planType: 'Commercial PPO', networkStatus: 'In-Network', electronicPayerId: '04112', claimTimelimit: '180 days', requiresPreAuth: 'Yes', activeState: 'active' },
  { payerShortCode: 'AET', payerName: 'Aetna', planName: 'Aetna HMO Choice', planType: 'Commercial HMO', networkStatus: 'In-Network', electronicPayerId: '60054', claimTimelimit: '120 days', requiresPreAuth: 'Yes', activeState: 'active' },
  { payerShortCode: 'UHC', payerName: 'UnitedHealthcare', planName: 'UHC Choice Plus PPO', planType: 'Commercial PPO', networkStatus: 'In-Network', electronicPayerId: '87726', claimTimelimit: '180 days', requiresPreAuth: 'Yes', activeState: 'active' },
  { payerShortCode: 'HUM', payerName: 'Humana', planName: 'HumanaChoice PPO', planType: 'Medicare Advantage', networkStatus: 'In-Network', electronicPayerId: '61101', claimTimelimit: '180 days', requiresPreAuth: 'Yes', activeState: 'active' },
  { payerShortCode: 'CVT', payerName: 'Cigna', planName: 'Cigna Open Access Plus', planType: 'Commercial PPO', networkStatus: 'In-Network', electronicPayerId: '62308', claimTimelimit: '180 days', requiresPreAuth: 'Limited', activeState: 'active' },
  { payerShortCode: 'MOL', payerName: 'Molina Healthcare', planName: 'Molina Medicaid', planType: 'Managed Medicaid', networkStatus: 'Participating', electronicPayerId: '23284', claimTimelimit: '12 months', requiresPreAuth: 'Yes', activeState: 'active' },
];

@Component({
  selector: 'app-insurance-plans-maintenance',
  imports: [MaintenanceListComponent],
  template: `
    <app-maintenance-list
      pageTitle="Insurance Plans"
      eyebrow="Billing & Revenue"
      description="Manage payer contracts, plan-level configuration, EDI identifiers, claim timely filing limits, and authorization requirements."
      [columns]="columns"
      [rows]="rows()"
      [canCreate]="true"
      [canExport]="true"
      [canImport]="true"
    />
  `
})
export class InsurancePlansMaintenanceComponent {
  protected readonly columns = COLUMNS;
  protected readonly rows = signal(MOCK_PLANS);
}
