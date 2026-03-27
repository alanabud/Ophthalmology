import { Component, inject } from '@angular/core';

import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-surgery-page',
  imports: [StatusChipComponent],
  templateUrl: './surgery-page.component.html',
  styleUrl: './surgery-page.component.scss'
})
export class SurgeryPageComponent {
  protected readonly cases = inject(EnterpriseStoreService).surgeryCases;
}
