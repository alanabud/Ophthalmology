import { Component, inject } from '@angular/core';

import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-compliance-page',
  imports: [StatusChipComponent],
  templateUrl: './compliance-page.component.html',
  styleUrl: './compliance-page.component.scss'
})
export class CompliancePageComponent {
  protected readonly events = inject(EnterpriseStoreService).complianceEvents;
  protected readonly roleMatrix = inject(EnterpriseStoreService).roleMatrix;
}
