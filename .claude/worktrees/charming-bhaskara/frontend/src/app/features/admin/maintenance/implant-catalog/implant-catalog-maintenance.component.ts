import { Component, signal } from '@angular/core';
import { MaintenanceListComponent, MaintenanceColumn } from '../maintenance-list.component';

const COLUMNS: MaintenanceColumn[] = [
  { key: 'catalogNumber',  header: 'Catalog #',    width: '110px', mono: true, sortable: true },
  { key: 'itemName',       header: 'IOL Name',     sortable: true },
  { key: 'manufacturerName', header: 'Manufacturer', sortable: true },
  { key: 'iolType',        header: 'IOL Type',     width: '110px' },
  { key: 'lensMaterial',   header: 'Material',     width: '110px' },
  { key: 'opticDiameter',  header: 'Optic Ø',      width: '80px',  right: true },
  { key: 'aConstant',      header: 'A-Const',      width: '80px',  right: true, mono: true },
  { key: 'powerRange',     header: 'Power Range',  width: '120px' },
  { key: 'billableCode',   header: 'HCPCS',        width: '80px',  mono: true },
  { key: 'unitCost',       header: 'Unit Cost',    width: '90px',  right: true },
  { key: 'activeState',    header: 'Status',       width: '90px',  chip: true, chipAuto: true },
];

const MOCK_IMPLANTS = [
  { catalogNumber: 'ZCB00', itemName: 'TECNIS Monofocal IOL', manufacturerName: 'Johnson & Johnson Vision', iolType: 'Monofocal', lensMaterial: 'Hydrophobic Acrylic', opticDiameter: '6.0 mm', aConstant: '119.3', powerRange: '+5.0 to +34.0D', billableCode: 'V2630', unitCost: '$185', activeState: 'active' },
  { catalogNumber: 'SN60WF', itemName: 'AcrySof IQ IOL', manufacturerName: 'Alcon Laboratories', iolType: 'Monofocal', lensMaterial: 'Hydrophobic Acrylic', opticDiameter: '6.0 mm', aConstant: '119.1', powerRange: '+6.0 to +30.0D', billableCode: 'V2630', unitCost: '$170', activeState: 'active' },
  { catalogNumber: 'ZKBTF', itemName: 'TECNIS Toric II IOL', manufacturerName: 'Johnson & Johnson Vision', iolType: 'Toric', lensMaterial: 'Hydrophobic Acrylic', opticDiameter: '6.0 mm', aConstant: '119.3', powerRange: '+5.0 to +34.0D, T2-T9', billableCode: 'V2632', unitCost: '$295', activeState: 'active' },
  { catalogNumber: 'SN6AT', itemName: 'AcrySof IQ Toric IOL', manufacturerName: 'Alcon Laboratories', iolType: 'Toric', lensMaterial: 'Hydrophobic Acrylic', opticDiameter: '6.0 mm', aConstant: '119.1', powerRange: '+6.0 to +30.0D, T2-T9', billableCode: 'V2632', unitCost: '$280', activeState: 'active' },
  { catalogNumber: 'ZKB00', itemName: 'TECNIS Symfony IOL (EDF)', manufacturerName: 'Johnson & Johnson Vision', iolType: 'EDF', lensMaterial: 'Hydrophobic Acrylic', opticDiameter: '6.0 mm', aConstant: '119.3', powerRange: '+6.0 to +34.0D', billableCode: 'V2632', unitCost: '$520', activeState: 'active' },
  { catalogNumber: 'LAL', itemName: 'RxSight Light Adjustable Lens', manufacturerName: 'RxSight', iolType: 'Light Adjustable', lensMaterial: 'Silicone Photoreactive', opticDiameter: '6.0 mm', aConstant: '118.9', powerRange: '+10.0 to +35.0D', billableCode: 'V2632', unitCost: '$1,450', activeState: 'active' },
  { catalogNumber: 'PanOptix', itemName: 'AcrySof IQ PanOptix Trifocal', manufacturerName: 'Alcon Laboratories', iolType: 'Trifocal', lensMaterial: 'Hydrophobic Acrylic', opticDiameter: '6.0 mm', aConstant: '119.0', powerRange: '+6.0 to +34.0D', billableCode: 'V2632', unitCost: '$580', activeState: 'active' },
  { catalogNumber: 'CT LUCIA', itemName: 'CT LUCIA 611P IOL', manufacturerName: 'Carl Zeiss Meditec', iolType: 'Monofocal', lensMaterial: 'Hydrophilic Acrylic', opticDiameter: '6.0 mm', aConstant: '118.6', powerRange: '+0.0 to +35.0D', billableCode: 'V2630', unitCost: '$210', activeState: 'active' },
];

@Component({
  selector: 'app-implant-catalog-maintenance',
  imports: [MaintenanceListComponent],
  template: `
    <app-maintenance-list
      pageTitle="Implant Catalog"
      eyebrow="Clinical Catalog"
      description="Manage IOL and implant catalog including lens constants, power ranges, UDI registration, HCPCS billing codes, and surgeon preference rankings."
      [columns]="columns"
      [rows]="rows()"
      [canCreate]="true"
      [canExport]="true"
      [canImport]="true"
    />
  `
})
export class ImplantCatalogMaintenanceComponent {
  protected readonly columns = COLUMNS;
  protected readonly rows = signal(MOCK_IMPLANTS);
}
