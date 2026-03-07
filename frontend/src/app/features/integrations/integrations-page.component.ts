import { Component, inject } from '@angular/core';

import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-integrations-page',
  imports: [StatusChipComponent],
  templateUrl: './integrations-page.component.html',
  styleUrl: './integrations-page.component.scss'
})
export class IntegrationsPageComponent {
  protected readonly integrations = inject(EnterpriseStoreService).integrations;
}
