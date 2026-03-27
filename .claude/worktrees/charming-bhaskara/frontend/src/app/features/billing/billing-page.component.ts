import { Component, inject } from '@angular/core';

import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-billing-page',
  imports: [StatusChipComponent],
  templateUrl: './billing-page.component.html',
  styleUrl: './billing-page.component.scss'
})
export class BillingPageComponent {
  protected readonly claims = inject(EnterpriseStoreService).claims;
  protected readonly aiInsights = inject(EnterpriseStoreService).aiInsights;
}
