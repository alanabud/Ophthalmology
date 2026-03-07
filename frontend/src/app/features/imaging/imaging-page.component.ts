import { Component, inject } from '@angular/core';

import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-imaging-page',
  imports: [StatusChipComponent],
  templateUrl: './imaging-page.component.html',
  styleUrl: './imaging-page.component.scss'
})
export class ImagingPageComponent {
  protected readonly studies = inject(EnterpriseStoreService).imagingStudies;
}
