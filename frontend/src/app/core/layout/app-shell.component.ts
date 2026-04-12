import { NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { DailyBriefingSignal } from '../../core/models/enterprise.models';
import { EnterpriseSelectComponent, EnterpriseSelectOption } from '../../shared/ui/enterprise-select.component';
import { NewPatientModalComponent } from '../../shared/ui/new-patient-modal.component';
import { QuickCreateModalComponent } from '../../shared/ui/quick-create-modal.component';
import { AuthStateService } from '../services/auth-state.service';
import { EnterpriseStoreService } from '../services/enterprise-store.service';

@Component({
  selector: 'app-shell',
  imports: [EnterpriseSelectComponent, NewPatientModalComponent, NgClass, QuickCreateModalComponent, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss'
})
export class AppShellComponent {
  private readonly store = inject(EnterpriseStoreService);
  private readonly authState = inject(AuthStateService);

  protected readonly navigationSections = this.store.navigationSections;
  protected readonly clinicOptions = this.store.clinicOptions;
  protected readonly providerOptions = this.store.providerOptions;
  protected readonly currentClinic = this.store.currentClinic;
  protected readonly currentProvider = this.store.currentProvider;
  protected readonly notifications = this.store.notifications;
  protected readonly dailyBriefing = this.store.dailyBriefing;
  protected readonly aiBriefSignals = this.store.aiBriefSignals;
  protected readonly aiBriefActions = this.store.aiBriefActions;
  protected readonly selectedDate = this.store.selectedDate;
  protected readonly organizationName = this.store.organizationName;
  protected readonly environmentLabel = this.store.environmentLabel;
  protected readonly isAuthenticated = this.authState.isAuthenticated;
  protected readonly isSandboxSession = this.authState.isSandboxSession;
  protected readonly displayName = this.authState.displayName;
  protected readonly userEmail = this.authState.userEmail;
  protected readonly openAlertCount = computed(() =>
    this.notifications().reduce((count, alert) => count + alert.count, 0)
  );
  protected readonly clinicSelectOptions = computed<EnterpriseSelectOption[]>(() =>
    this.clinicOptions().map((clinic) => ({
      value: clinic.id,
      label: clinic.name,
      meta: clinic.id === 'network' ? clinic.region : `${clinic.waitMinutes} min wait`,
      tone: clinic.openIssues >= 5 ? 'critical' : clinic.openIssues >= 4 ? 'warning' : 'accent'
    }))
  );
  protected readonly providerSelectOptions = computed<EnterpriseSelectOption[]>(() =>
    this.providerOptions().map((provider) => ({
      value: provider.id,
      label: provider.name,
      meta: provider.id === 'all' ? provider.specialty : provider.specialty,
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
  protected readonly accountInitials = computed(() => {
    const tokens = this.displayName().split(/\s+/).filter(Boolean);
    return (tokens[0]?.[0] ?? 'G') + (tokens[1]?.[0] ?? 'S');
  });
  protected readonly mainDragSignal = computed(() =>
    this.selectSignal('Main drag') ?? this.selectSignal(undefined, 'critical')
  );
  protected readonly revenueRiskSignal = computed(() =>
    this.selectSignal('Revenue risk') ?? this.selectSignal(undefined, 'warning')
  );
  protected readonly actionPreview = computed(() => this.aiBriefActions().slice(0, 3));

  protected setActiveClinic(clinicId: string): void {
    this.store.setActiveClinic(clinicId);
  }

  protected setActiveProvider(providerId: string): void {
    this.store.setActiveProvider(providerId);
  }

  protected setSelectedDate(dateValue: string): void {
    this.store.setSelectedDate(dateValue);
  }

  protected readonly quickCreateOpen = signal(false);
  protected readonly newPatientOpen = signal(false);

  protected openQuickCreate(): void {
    this.quickCreateOpen.set(true);
  }

  protected onQuickCreateAction(action: 'new-patient'): void {
    if (action === 'new-patient') {
      this.newPatientOpen.set(true);
    }
  }

  private readonly router = inject(Router);

  protected signOut(): void {
    this.authState.clearSession();
    void this.router.navigateByUrl('/login');
  }

  private selectSignal(label?: string, tone?: DailyBriefingSignal['tone']): DailyBriefingSignal | null {
    return (
      this.aiBriefSignals().find((signal) => (label ? signal.label === label : true) && (tone ? signal.tone === tone : true)) ??
      this.aiBriefSignals()[0] ??
      null
    );
  }
}
