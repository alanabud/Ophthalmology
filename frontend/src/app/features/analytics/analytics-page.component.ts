import { Component, computed, inject } from '@angular/core';

import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

/**
 * Analytics (Sprint 14) — every metric derives from persisted, clinic-scoped
 * collections via centralized store selectors. Three honest states per panel:
 * loading, real data, or an explicit empty state. No fabricated KPIs.
 */
@Component({
  selector: 'app-analytics-page',
  imports: [],
  templateUrl: './analytics-page.component.html',
  styleUrl: './analytics-page.component.scss'
})
export class AnalyticsPageComponent {
  protected readonly store = inject(EnterpriseStoreService);

  protected readonly loading = computed(() => !this.store.firestoreReady() && !this.store.firestoreError());
  protected readonly protectedData = this.store.firestoreError;

  protected readonly summary = this.store.analyticsSummary;
  protected readonly revenue = this.store.analyticsRevenue;
  protected readonly appts = this.store.analyticsAppointments;
  protected readonly referrals = this.store.analyticsReferrals;
  protected readonly surgery = this.store.analyticsSurgery;
  protected readonly optical = this.store.analyticsOptical;
  protected readonly activity = this.store.analyticsActivity;

  /** Data-quality truth markers for pilot evaluators. */
  protected readonly dataQuality = computed(() => [
    { label: 'Claims loaded', count: this.revenue().total },
    { label: 'Appointments loaded', count: this.appts().total },
    { label: 'Referrals loaded', count: this.referrals().total },
    { label: 'Surgery records loaded', count: this.surgery().total },
    { label: 'Optical records loaded', count: this.optical().total },
    { label: 'Activity events loaded', count: this.activity().total },
  ]);

  protected fmt(n: number): string { return '$' + Math.round(n).toLocaleString('en-US'); }
  protected pct(part: number, whole: number): number { return whole ? Math.round((part / whole) * 100) : 0; }
}
