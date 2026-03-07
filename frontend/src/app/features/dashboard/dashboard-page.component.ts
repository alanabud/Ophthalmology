import { Component, inject } from '@angular/core';

import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { AiInsightCardComponent } from '../../shared/ui/ai-insight-card.component';
import { MetricCardComponent } from '../../shared/ui/metric-card.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [AiInsightCardComponent, MetricCardComponent, StatusChipComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly executiveMetrics = this.store.executiveMetrics;
  protected readonly liveBoards = this.store.liveBoards;
  protected readonly aiInsights = this.store.aiInsights;
  protected readonly dailyBriefing = this.store.dailyBriefing;
  protected readonly actionQueue = this.store.actionQueue;
  protected readonly clinicComparison = this.store.clinicComparison;
  protected readonly notifications = this.store.notifications;
}
