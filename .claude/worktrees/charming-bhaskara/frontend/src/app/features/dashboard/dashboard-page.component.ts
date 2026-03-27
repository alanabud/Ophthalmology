import { NgClass } from '@angular/common';
import { computed, Component, inject } from '@angular/core';

import { OperationsMatrixRow, SurfaceTone } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

const SEVERITY_RANK: Record<SurfaceTone, number> = {
  critical: 4,
  warning: 3,
  accent: 2,
  info: 1,
  success: 0,
  neutral: 0
};

@Component({
  selector: 'app-dashboard-page',
  imports: [NgClass],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {
  protected readonly store = inject(EnterpriseStoreService);

  protected readonly currentClinic    = this.store.currentClinic;
  protected readonly dailyBriefing    = this.store.dailyBriefing;
  protected readonly notifications    = this.store.notifications;
  protected readonly actionQueue      = this.store.actionQueue;
  protected readonly operationsMatrix = this.store.operationsMatrix;
  protected readonly liveBoards       = this.store.liveBoards;
  protected readonly executiveMetrics = this.store.executiveMetrics;
  protected readonly aiBriefSignals   = this.store.aiBriefSignals;
  protected readonly aiBriefActions   = this.store.aiBriefActions;

  protected readonly matrixSummary = computed(() => {
    const rows = this.operationsMatrix();
    let onTrack = 0, atRisk = 0, critical = 0;
    for (const row of rows) {
      const worst = this.rowSeverity(row);
      if (worst === 'critical') critical++;
      else if (worst === 'warning') atRisk++;
      else onTrack++;
    }
    return { onTrack, atRisk, critical };
  });

  protected readonly intelBlocks = computed(() => {
    const signals = this.aiBriefSignals();
    const briefing = this.dailyBriefing();
    return [
      {
        label:  'Network Status',
        value:  briefing.tone === 'critical' ? 'Elevated Stress' : briefing.tone === 'warning' ? 'Moderate Stress' : 'Stable',
        detail: briefing.summary,
        tone:   briefing.tone,
        icon:   'status'
      },
      ...signals.slice(0, 3).map(s => ({
        label:  s.label,
        value:  s.value,
        detail: s.detail,
        tone:   s.tone,
        icon:   'signal'
      }))
    ].slice(0, 4);
  });

  protected readonly criticalEscalations = computed(() =>
    this.notifications().filter(n => n.tone === 'critical')
  );

  protected readonly supportBoards = computed(() => {
    const boards = this.liveBoards();
    return boards.slice(0, 2);
  });

  protected rowSeverity(row: OperationsMatrixRow): SurfaceTone {
    const tones: SurfaceTone[] = [
      row.waitTone, row.utilizationTone, row.imagingTone,
      row.ascTone,  row.claimsTone,      row.staffTone
    ];
    return tones.reduce((worst, t) =>
      SEVERITY_RANK[t] > SEVERITY_RANK[worst] ? t : worst,
    'neutral' as SurfaceTone);
  }

  protected rowClass(row: OperationsMatrixRow): string {
    const sev = this.rowSeverity(row);
    const focused = this.currentClinic().id === row.clinicId ? 'matrix-row--focused ' : '';
    if (sev === 'critical') return `${focused}matrix-row--critical`;
    if (sev === 'warning')  return `${focused}matrix-row--warning`;
    return `${focused}matrix-row--ok`;
  }

  protected actionClass(tone: SurfaceTone): string {
    if (tone === 'critical') return 'action-chip action-chip--critical';
    if (tone === 'warning')  return 'action-chip action-chip--warning';
    return 'action-chip action-chip--primary';
  }

  protected queuePriorityClass(tone: SurfaceTone): string {
    return `queue-priority queue-priority--${tone}`;
  }
}
