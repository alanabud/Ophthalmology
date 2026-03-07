import { Component, inject } from '@angular/core';

import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-inventory-page',
  imports: [StatusChipComponent],
  templateUrl: './inventory-page.component.html',
  styleUrl: './inventory-page.component.scss'
})
export class InventoryPageComponent {
  protected readonly inventory = inject(EnterpriseStoreService).inventory;
}
