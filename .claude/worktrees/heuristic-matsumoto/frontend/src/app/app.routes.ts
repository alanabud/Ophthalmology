import { Routes } from '@angular/router';

import { publicOnlyGuard } from './core/guards/public-only.guard';
import { AppShellComponent } from './core/layout/app-shell.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [publicOnlyGuard],
    loadComponent: () =>
      import('./features/auth/login-page.component').then((module) => module.LoginPageComponent)
  },
  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'command-center'
      },
      {
        path: 'dashboard',
        pathMatch: 'full',
        redirectTo: 'command-center'
      },
      {
        path: 'command-center',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then(
            (module) => module.DashboardPageComponent
          )
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./features/patients/patients-page.component').then(
            (module) => module.PatientsPageComponent
          )
      },
      {
        path: 'scheduling',
        loadComponent: () =>
          import('./features/scheduling/scheduling-page.component').then(
            (module) => module.SchedulingPageComponent
          )
      },
      {
        path: 'encounters',
        loadComponent: () =>
          import('./features/encounters/encounters-page.component').then(
            (module) => module.EncountersPageComponent
          )
      },
      {
        path: 'imaging',
        loadComponent: () =>
          import('./features/imaging/imaging-page.component').then(
            (module) => module.ImagingPageComponent
          )
      },
      {
        path: 'surgery',
        loadComponent: () =>
          import('./features/surgery/surgery-page.component').then(
            (module) => module.SurgeryPageComponent
          )
      },
      {
        path: 'optical',
        loadComponent: () =>
          import('./features/optical/optical-page.component').then(
            (module) => module.OpticalPageComponent
          )
      },
      {
        path: 'billing',
        loadComponent: () =>
          import('./features/billing/billing-page.component').then(
            (module) => module.BillingPageComponent
          )
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory/inventory-page.component').then(
            (module) => module.InventoryPageComponent
          )
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/analytics/analytics-page.component').then(
            (module) => module.AnalyticsPageComponent
          )
      },
      {
        path: 'compliance',
        loadComponent: () =>
          import('./features/compliance/compliance-page.component').then(
            (module) => module.CompliancePageComponent
          )
      },
      {
        path: 'integrations',
        loadComponent: () =>
          import('./features/integrations/integrations-page.component').then(
            (module) => module.IntegrationsPageComponent
          )
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./features/admin/admin-page.component').then((module) => module.AdminPageComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'command-center'
  }
];
