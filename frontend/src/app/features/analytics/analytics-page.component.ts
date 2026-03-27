import { Component, inject, signal } from '@angular/core';

import { ClinicContext, ProviderProductivity } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { AppModalComponent } from '../../shared/ui/app-modal.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-analytics-page',
  imports: [AppModalComponent, StatusChipComponent],
  templateUrl: './analytics-page.component.html',
  styleUrl: './analytics-page.component.scss'
})
export class AnalyticsPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly analyticsPoints = this.store.analyticsPoints;
  protected readonly clinicComparison = this.store.clinicComparison;
  protected readonly providerProductivity = this.store.providerProductivity;

  // Modal state
  protected readonly selectedClinic = signal<ClinicContext | null>(null);
  protected readonly selectedProvider = signal<ProviderProductivity | null>(null);
  protected readonly clinicViewOpen = signal(false);
  protected readonly providerViewOpen = signal(false);

  protected viewClinic(clinic: ClinicContext): void {
    this.selectedClinic.set(clinic);
    this.clinicViewOpen.set(true);
  }

  protected viewProvider(provider: ProviderProductivity): void {
    this.selectedProvider.set(provider);
    this.providerViewOpen.set(true);
  }

  protected closeClinicView(): void { this.clinicViewOpen.set(false); this.selectedClinic.set(null); }
  protected closeProviderView(): void { this.providerViewOpen.set(false); this.selectedProvider.set(null); }
}
