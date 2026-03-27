import { Component, inject } from '@angular/core';

import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

@Component({
  selector: 'app-analytics-page',
  templateUrl: './analytics-page.component.html',
  styleUrl: './analytics-page.component.scss'
})
export class AnalyticsPageComponent {
  protected readonly analyticsPoints = inject(EnterpriseStoreService).analyticsPoints;
  protected readonly clinicComparison = inject(EnterpriseStoreService).clinicComparison;
  protected readonly providerProductivity = inject(EnterpriseStoreService).providerProductivity;
}
