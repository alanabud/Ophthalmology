import { Component, inject } from '@angular/core';

import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-optical-page',
  imports: [StatusChipComponent],
  templateUrl: './optical-page.component.html',
  styleUrl: './optical-page.component.scss'
})
export class OpticalPageComponent {
  protected readonly orders = inject(EnterpriseStoreService).opticalOrders;
}
