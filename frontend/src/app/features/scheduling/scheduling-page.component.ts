import { Component, inject } from '@angular/core';

import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-scheduling-page',
  imports: [StatusChipComponent],
  templateUrl: './scheduling-page.component.html',
  styleUrl: './scheduling-page.component.scss'
})
export class SchedulingPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly scheduleLanes = this.store.scheduleLanes;
  protected readonly waitlist = this.store.waitlist;
  protected readonly aiInsights = this.store.aiInsights;
}
