import { computed, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DailyBriefingSignal, LiveBoardCard, OperationsMatrixRow, SurfaceTone } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { EnterpriseSelectComponent, EnterpriseSelectOption } from '../../shared/ui/enterprise-select.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

type MatrixScope = 'focus' | 'attention' | 'all';
type QueueScope = 'priority' | 'critical' | 'all';
type SupportView = 'escalations' | 'focus' | 'queue' | 'boards';
type HeaderTray = 'create' | 'alerts';

interface WorkspaceStatusItem {
  label: string;
  value: string;
  tone: SurfaceTone;
}

const BOARD_PRIORITY = ['queue', 'billing', 'surgery', 'provider'];
const MATRIX_SCOPE_OPTIONS: Array<{ id: MatrixScope; label: string }> = [
  { id: 'all', label: 'All clinics' },
  { id: 'attention', label: 'Needs attention' },
  { id: 'focus', label: 'Focused clinic' }
];
const QUEUE_SCOPE_OPTIONS: Array<{ id: QueueScope; label: string }> = [
  { id: 'priority', label: 'Priority' },
  { id: 'critical', label: 'Critical only' },
  { id: 'all', label: 'All items' }
];
const SUPPORT_VIEW_OPTIONS: Array<{ id: SupportView; label: string }> = [
  { id: 'escalations', label: 'Escalations' },
  { id: 'focus', label: 'Clinic focus' },
  { id: 'queue', label: 'Action queue' },
  { id: 'boards', label: 'Live board' }
];

function isEscalationTone(tone: SurfaceTone): boolean {
  return tone === 'critical' || tone === 'warning';
}

function rowNeedsAttention(row: OperationsMatrixRow): boolean {
  return [row.waitTone, row.utilizationTone, row.imagingTone, row.ascTone, row.claimsTone, row.staffTone].some(
    (tone) => isEscalationTone(tone)
  );
}

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, EnterpriseSelectComponent, StatusChipComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly currentClinic = this.store.currentClinic;
  protected readonly currentProvider = this.store.currentProvider;
  protected readonly selectedDate = this.store.selectedDate;
  protected readonly clinicOptions = this.store.clinicOptions;
  protected readonly providerOptions = this.store.providerOptions;
  protected readonly systemIndicators = this.store.systemIndicators;
  protected readonly notifications = this.store.notifications;
  protected readonly quickActions = this.store.quickActions;
  protected readonly actionQueue = this.store.actionQueue;
  protected readonly operationsMatrix = this.store.operationsMatrix;
  protected readonly liveBoards = this.store.liveBoards;
  protected readonly aiBriefSignals = this.store.aiBriefSignals;
  protected readonly dailyBriefing = this.store.dailyBriefing;
  protected readonly matrixScopeOptions = MATRIX_SCOPE_OPTIONS;
  protected readonly queueScopeOptions = QUEUE_SCOPE_OPTIONS;
  protected readonly supportViewOptions = SUPPORT_VIEW_OPTIONS;
  protected readonly matrixScope = signal<MatrixScope>('all');
  protected readonly queueScope = signal<QueueScope>('priority');
  protected readonly supportView = signal<SupportView>('queue');
  protected readonly selectedBoardId = signal<string>('queue');
  protected readonly openHeaderTray = signal<HeaderTray | null>(null);
  protected readonly topEscalations = computed(() => this.notifications().slice(0, 3));
  protected readonly openAlertCount = computed(() =>
    this.notifications().reduce((count, alert) => count + alert.count, 0)
  );
  protected readonly clinicSelectOptions = computed<EnterpriseSelectOption[]>(() =>
    this.clinicOptions().map((clinic) => ({
      value: clinic.id,
      label:
        clinic.id === 'network'
          ? 'Network'
          : clinic.name
              .replace(' Retina', '')
              .replace(' Cataract Center', '')
              .replace(' Glaucoma Institute', '')
              .replace(' + Optical', ''),
      meta: clinic.id === 'network' ? clinic.region : `${clinic.waitMinutes} min wait`,
      tone: clinic.openIssues >= 5 ? 'critical' : clinic.openIssues >= 4 ? 'warning' : 'accent'
    }))
  );
  protected readonly providerSelectOptions = computed<EnterpriseSelectOption[]>(() =>
    this.providerOptions().map((provider) => ({
      value: provider.id,
      label: provider.id === 'all' ? 'All providers' : provider.name.replace('Dr. ', 'Dr '),
      meta: provider.specialty,
      tone:
        provider.id === 'all'
          ? 'accent'
          : provider.utilization >= 97
            ? 'critical'
            : provider.utilization >= 92
              ? 'warning'
              : 'accent'
    }))
  );
  protected readonly systemPosture = computed<WorkspaceStatusItem[]>(() =>
    this.systemIndicators().map((indicator) => ({
      label:
        indicator.label === 'System health'
          ? 'System'
          : indicator.label === 'Integration health'
            ? 'Integrations'
            : 'Urgent workflows',
      value: indicator.value,
      tone: indicator.tone
    }))
  );
  protected readonly supportBoards = computed(() => {
    const boards = this.liveBoards();
    const prioritized = BOARD_PRIORITY
      .map((id) => boards.find((board) => board.id === id) ?? null)
      .filter((board): board is LiveBoardCard => board !== null);
    const prioritizedIds = new Set(prioritized.map((board) => board.id));
    const remaining = boards.filter((board) => !prioritizedIds.has(board.id));

    return [...prioritized, ...remaining];
  });
  protected readonly currentBoard = computed(() => {
    const boards = this.supportBoards();
    return boards.find((board) => board.id === this.selectedBoardId()) ?? boards[0] ?? null;
  });
  protected readonly activeBoardId = computed(() => this.currentBoard()?.id ?? null);
  protected readonly filteredOperationsMatrix = computed(() => {
    const rows = this.operationsMatrix();

    switch (this.matrixScope()) {
      case 'all':
        return rows;
      case 'attention':
        return rows.filter((row) => rowNeedsAttention(row));
      case 'focus': {
        if (this.currentClinic().id !== 'network') {
          return rows.filter((row) => row.clinicId === this.currentClinic().id);
        }

        const networkFocus = rows.filter((row) => rowNeedsAttention(row));
        return (networkFocus.length > 0 ? networkFocus : rows).slice(0, 2);
      }
    }
  });
  protected readonly clinicFocusRows = computed(() => {
    const rows = this.operationsMatrix();

    if (this.currentClinic().id !== 'network') {
      return rows.filter((row) => row.clinicId === this.currentClinic().id);
    }

    const networkFocus = rows.filter((row) => rowNeedsAttention(row));
    return (networkFocus.length > 0 ? networkFocus : rows).slice(0, 2);
  });
  protected readonly filteredActionQueue = computed(() => {
    const items = this.actionQueue();

    switch (this.queueScope()) {
      case 'all':
        return items;
      case 'critical':
        return items.filter((item) => item.tone === 'critical');
      case 'priority':
        return items.filter((item) => item.tone === 'critical' || item.tone === 'warning' || item.tone === 'accent');
    }
  });
  protected readonly matrixSummaries = computed(() => {
    const status = this.selectSignal('Regional status') ?? this.aiBriefSignals()[0] ?? null;
    const mainDrag = this.selectSignal('Main drag') ?? this.selectSignal(undefined, 'critical');
    const revenueRisk = this.selectSignal('Revenue risk') ?? this.selectSignal(undefined, 'warning');
    const immediateAction = this.selectSignal('Immediate action') ?? null;

    return [
      {
        label: 'Network status',
        value: status?.value ?? 'Stable',
        detail: status?.detail ?? 'Regional posture is inside target range.',
        tone: status?.tone ?? 'accent'
      },
      {
        label: 'Throughput risk',
        value: mainDrag?.value ?? 'Contained',
        detail: mainDrag?.detail ?? 'No material throughput risk is building.',
        tone: mainDrag?.tone ?? 'warning'
      },
      {
        label: 'Revenue risk',
        value: revenueRisk?.value ?? 'Contained',
        detail: revenueRisk?.detail ?? 'Revenue exposure remains controlled.',
        tone: revenueRisk?.tone ?? 'warning'
      },
      {
        label: 'Immediate actions',
        value: `${Math.min(this.actionQueue().length, 3)}`,
        detail: immediateAction?.value ?? `${this.actionQueue().length} queued today`,
        tone: immediateAction?.tone ?? 'accent'
      }
    ];
  });

  protected setActiveClinic(clinicId: string): void {
    this.store.setActiveClinic(clinicId);
  }

  protected setActiveProvider(providerId: string): void {
    this.store.setActiveProvider(providerId);
  }

  protected setSelectedDate(dateValue: string): void {
    this.store.setSelectedDate(dateValue);
  }

  protected toggleHeaderTray(tray: HeaderTray): void {
    this.openHeaderTray.update((current) => (current === tray ? null : tray));
  }

  protected setMatrixScope(scope: MatrixScope): void {
    this.matrixScope.set(scope);
  }

  protected setQueueScope(scope: QueueScope): void {
    this.queueScope.set(scope);
  }

  protected setSupportView(view: SupportView): void {
    this.supportView.set(view);
  }

  protected setSelectedBoard(boardId: string): void {
    this.selectedBoardId.set(boardId);
  }

  private selectSignal(label?: string, tone?: DailyBriefingSignal['tone']): DailyBriefingSignal | null {
    return (
      this.aiBriefSignals().find((signal) => (label ? signal.label === label : true) && (tone ? signal.tone === tone : true)) ??
      this.aiBriefSignals()[0] ??
      null
    );
  }
}
