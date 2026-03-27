import { Routes } from '@angular/router';

export const MAINTENANCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./maintenance-shell.component').then(m => m.MaintenanceShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'clinics',
        pathMatch: 'full'
      },
      {
        path: 'clinics',
        loadComponent: () =>
          import('./clinics/clinics-maintenance.component').then(m => m.ClinicsMaintenanceComponent)
      },
      {
        path: 'providers',
        loadComponent: () =>
          import('./providers/providers-maintenance.component').then(m => m.ProvidersMaintenanceComponent)
      },
      {
        path: 'procedure-codes',
        loadComponent: () =>
          import('./procedure-codes/procedure-codes-maintenance.component').then(m => m.ProcedureCodesMaintenanceComponent)
      },
      {
        path: 'insurance-plans',
        loadComponent: () =>
          import('./insurance-plans/insurance-plans-maintenance.component').then(m => m.InsurancePlansMaintenanceComponent)
      },
      {
        path: 'implant-catalog',
        loadComponent: () =>
          import('./implant-catalog/implant-catalog-maintenance.component').then(m => m.ImplantCatalogMaintenanceComponent)
      },
      {
        path: 'audit-log',
        loadComponent: () =>
          import('./audit-log/audit-log-maintenance.component').then(m => m.AuditLogMaintenanceComponent)
      },
    ]
  }
];
