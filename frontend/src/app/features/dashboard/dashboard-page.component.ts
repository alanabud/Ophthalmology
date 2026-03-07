import { computed, Component, inject } from '@angular/core';

import { LiveBoardCard } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

const BOARD_PRIORITY = ['queue', 'billing', 'surgery', 'provider'];

@Component({
  selector: 'app-dashboard-page',
  imports: [StatusChipComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly currentClinic = this.store.currentClinic;
  protected readonly dailyBriefing = this.store.dailyBriefing;
  protected readonly notifications = this.store.notifications;
  protected readonly actionQueue = this.store.actionQueue;
  protected readonly operationsMatrix = this.store.operationsMatrix;
  protected readonly liveBoards = this.store.liveBoards;
  protected readonly dashboardSubtitle = computed(() => this.dailyBriefing().summary);
  protected readonly supportBoards = computed(() => {
    const boards = this.liveBoards();
    const prioritized = BOARD_PRIORITY
      .map((id) => boards.find((board) => board.id === id) ?? null)
      .filter((board): board is LiveBoardCard => board !== null);

    return prioritized.slice(0, 2);
  });
}
