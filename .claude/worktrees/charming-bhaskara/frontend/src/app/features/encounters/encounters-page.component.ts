import { Component, inject } from '@angular/core';

import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-encounters-page',
  imports: [StatusChipComponent],
  templateUrl: './encounters-page.component.html',
  styleUrl: './encounters-page.component.scss'
})
export class EncountersPageComponent {
  protected readonly encounter = inject(EnterpriseStoreService).encounterWorkspace;
}
