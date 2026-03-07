import { Component, inject } from '@angular/core';

import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-admin-page',
  imports: [StatusChipComponent],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss'
})
export class AdminPageComponent {
  protected readonly roleMatrix = inject(EnterpriseStoreService).roleMatrix;
  protected readonly clinics = inject(EnterpriseStoreService).clinicComparison;
}
