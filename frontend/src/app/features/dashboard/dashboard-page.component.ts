import { computed, Component, inject } from '@angular/core';

import { ExecutiveMetric, ExecutiveMetricDetail, MetricKind } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { AiInsightCardComponent } from '../../shared/ui/ai-insight-card.component';
import { MetricCardComponent } from '../../shared/ui/metric-card.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

const TEMPLATE_FILL: Record<string, string> = {
  network: '94%',
  'winter-park': '96%',
  clermont: '91%',
  'lake-nona': '92%',
  'tampa-asc': '93%'
};

const ADD_ON_VOLUME: Record<string, string> = {
  network: '11 add-ons',
  'winter-park': '2 add-ons',
  clermont: '1 add-on',
  'lake-nona': '0 add-ons',
  'tampa-asc': '0 add-ons'
};

const WAIT_TARGET: Record<string, string> = {
  network: '<=15 min',
  'winter-park': '<=15 min',
  clermont: '<=15 min',
  'lake-nona': '<=20 min',
  'tampa-asc': '<=18 min'
};

const WAIT_PRESSURE: Record<string, string> = {
  network: 'Worst clinic: Clermont 26',
  'winter-park': 'Imaging lane 18 min',
  clermont: 'OCT queue +11',
  'lake-nona': 'Laser lane 22 min',
  'tampa-asc': 'OR 2 turnover 22 min'
};

const UTILIZATION_PRESSURE: Record<string, string> = {
  network: '3 lanes overloaded',
  'winter-park': 'Retina lanes balanced',
  clermont: 'Marcus Vale overloaded',
  'lake-nona': 'Balanced',
  'tampa-asc': 'ASC block fully loaded'
};

const RISK_PRESSURE: Record<string, string> = {
  network: '12 blocked claims',
  'winter-park': '2 auth reviews',
  clermont: 'Imaging prep risk',
  'lake-nona': '2 unsigned charts',
  'tampa-asc': '3 cases at risk'
};

function metricKind(metricId: string): MetricKind {
  switch (metricId) {
    case 'scheduled':
    case 'balances':
      return 'trend';
    case 'flow':
    case 'claims':
    case 'optical':
      return 'queue';
    case 'surgeries':
    case 'noshow':
      return 'risk';
    case 'wait':
    case 'readiness':
      return 'target';
    case 'utilization':
    default:
      return 'status';
  }
}

function metricDetails(metric: ExecutiveMetric, clinicId: string): ExecutiveMetricDetail[] {
  switch (metric.id) {
    case 'scheduled':
      return [
        { label: 'Template fill', value: TEMPLATE_FILL[clinicId] ?? TEMPLATE_FILL['network'], tone: 'success' },
        { label: 'Add-ons', value: ADD_ON_VOLUME[clinicId] ?? ADD_ON_VOLUME['network'], tone: 'accent' },
        { label: 'Flow pressure', value: clinicId === 'clermont' ? 'Consult prep' : 'Controlled', tone: clinicId === 'clermont' ? 'warning' : 'info' }
      ];
    case 'flow':
      return [
        { label: 'Queue posture', value: metric.delta, tone: metric.tone },
        { label: 'Pressure point', value: clinicId === 'network' ? 'Clermont imaging' : clinicId === 'tampa-asc' ? 'Pre-op hold' : clinicId === 'lake-nona' ? 'Chart sign-off' : 'Controlled', tone: metric.tone },
        { label: 'Action', value: clinicId === 'network' ? 'Route intervention' : 'Protect throughput', tone: 'accent' }
      ];
    case 'surgeries':
      return [
        { label: 'Ready', value: clinicId === 'tampa-asc' ? '11 cases' : clinicId === 'network' ? '11 cases' : '8 cases', tone: 'success' },
        { label: 'At risk', value: metric.delta, tone: 'warning' },
        { label: 'Blocked', value: clinicId === 'tampa-asc' || clinicId === 'network' ? '1 case' : '0 cases', tone: 'critical' }
      ];
    case 'claims':
      return [
        { label: 'Blocked', value: metric.delta, tone: 'critical' },
        { label: 'Cutoff', value: '4h 12m', tone: 'warning' },
        { label: 'Recovery', value: clinicId === 'network' ? '$48.6K' : clinicId === 'tampa-asc' ? '$31.4K' : 'Same-day release', tone: 'accent' }
      ];
    case 'balances':
      return [
        { label: '30-day A/R', value: '$61K', tone: 'info' },
        { label: 'Recall yield', value: '+9.1%', tone: 'success' },
        { label: 'Retail pickup', value: '$22K', tone: 'accent' }
      ];
    case 'optical':
      return [
        { label: 'Ready today', value: clinicId === 'tampa-asc' ? '5 pickups' : '6 pickups', tone: 'success' },
        { label: 'Lab delay', value: clinicId === 'tampa-asc' ? '2 orders' : '4 orders', tone: 'warning' },
        { label: 'Value', value: clinicId === 'tampa-asc' ? '$6.2K' : '$8.7K', tone: 'accent' }
      ];
    case 'wait':
      return [
        { label: 'Target', value: WAIT_TARGET[clinicId] ?? WAIT_TARGET['network'], tone: 'info' },
        { label: 'Pressure', value: WAIT_PRESSURE[clinicId] ?? WAIT_PRESSURE['network'], tone: metric.tone },
        { label: 'Trend', value: metric.delta, tone: metric.tone }
      ];
    case 'utilization':
      return [
        { label: 'Load state', value: UTILIZATION_PRESSURE[clinicId] ?? UTILIZATION_PRESSURE['network'], tone: metric.tone },
        { label: 'Float capacity', value: clinicId === 'network' ? '1.2 FTE' : clinicId === 'clermont' ? '0.3 FTE' : 'Stable', tone: clinicId === 'clermont' ? 'warning' : 'info' },
        { label: 'Action', value: clinicId === 'network' ? 'Rebalance lanes' : 'Monitor load', tone: 'accent' }
      ];
    case 'noshow':
      return [
        { label: 'High risk', value: clinicId === 'network' ? '5 tomorrow' : '3 tomorrow', tone: 'warning' },
        { label: 'Recovery', value: '2-3 visits', tone: 'success' },
        { label: 'Driver', value: 'Transport barriers', tone: 'info' }
      ];
    case 'readiness':
      return [
        { label: 'Clinical', value: clinicId === 'tampa-asc' ? '84' : clinicId === 'clermont' ? '90' : '96', tone: clinicId === 'tampa-asc' ? 'critical' : clinicId === 'clermont' ? 'warning' : 'success' },
        { label: 'Revenue', value: clinicId === 'network' ? '91' : clinicId === 'tampa-asc' ? '88' : '95', tone: clinicId === 'tampa-asc' ? 'warning' : 'accent' },
        { label: 'Pressure', value: RISK_PRESSURE[clinicId] ?? RISK_PRESSURE['network'], tone: clinicId === 'network' || clinicId === 'tampa-asc' || clinicId === 'clermont' ? 'warning' : 'info' }
      ];
    default:
      return [];
  }
}

@Component({
  selector: 'app-dashboard-page',
  imports: [AiInsightCardComponent, MetricCardComponent, StatusChipComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly currentClinic = this.store.currentClinic;
  protected readonly liveBoards = this.store.liveBoards;
  protected readonly aiInsights = this.store.aiInsights;
  protected readonly dailyBriefing = this.store.dailyBriefing;
  protected readonly aiBriefSignals = this.store.aiBriefSignals;
  protected readonly aiBriefActions = this.store.aiBriefActions;
  protected readonly actionQueue = this.store.actionQueue;
  protected readonly clinicComparison = this.store.clinicComparison;
  protected readonly notifications = this.store.notifications;
  protected readonly commandSignals = this.store.commandSignals;
  protected readonly operationsMatrix = this.store.operationsMatrix;
  protected readonly executiveMetrics = computed(() =>
    this.store.executiveMetrics().map((metric) => ({
      ...metric,
      kind: metricKind(metric.id),
      details: metricDetails(metric, this.currentClinic().id)
    }))
  );
}

