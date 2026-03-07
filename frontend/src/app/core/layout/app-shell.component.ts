import { NgClass } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { EnterpriseSelectComponent, EnterpriseSelectOption } from '../../shared/ui/enterprise-select.component';
import { AuthStateService } from '../services/auth-state.service';
import { EnterpriseStoreService } from '../services/enterprise-store.service';

const PAGE_TITLES: Record<string, string> = {
  '/command-center': 'Command Center',
  '/patients': 'Patients',
  '/scheduling': 'Scheduling',
  '/encounters': 'Encounters',
  '/imaging': 'Imaging',
  '/surgery': 'Surgery',
  '/optical': 'Optical',
  '/billing': 'Billing',
  '/inventory': 'Inventory',
  '/analytics': 'Analytics',
  '/compliance': 'Compliance',
  '/integrations': 'Integrations',
  '/admin': 'Admin',
  '/login': 'Login'
};

@Component({
  selector: 'app-shell',
  imports: [EnterpriseSelectComponent, NgClass, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss'
})
export class AppShellComponent {
  private readonly store = inject(EnterpriseStoreService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  protected readonly navigationSections = this.store.navigationSections;
  protected readonly clinicOptions = this.store.clinicOptions;
  protected readonly providerOptions = this.store.providerOptions;
  protected readonly currentClinic = this.store.currentClinic;
  protected readonly currentProvider = this.store.currentProvider;
  protected readonly systemIndicators = this.store.systemIndicators;
  protected readonly notifications = this.store.notifications;
  protected readonly quickActions = this.store.quickActions;
  protected readonly dailyBriefing = this.store.dailyBriefing;
  protected readonly actionQueue = this.store.actionQueue;
  protected readonly aiWorkspaceOpen = this.store.aiWorkspaceOpen;
  protected readonly selectedDate = this.store.selectedDate;
  protected readonly clinicComparison = this.store.clinicComparison;
  protected readonly organizationName = this.store.organizationName;
  protected readonly environmentLabel = this.store.environmentLabel;
  protected readonly isAuthenticated = this.authState.isAuthenticated;
  protected readonly displayName = this.authState.displayName;
  protected readonly roleLabel = computed(() =>
    this.authState.context()?.role_codes?.[0]?.replaceAll('_', ' ') ?? 'preview workspace'
  );
  protected readonly openAlertCount = computed(() =>
    this.notifications().reduce((count, alert) => count + alert.count, 0)
  );
  protected readonly clinicSelectOptions = computed<EnterpriseSelectOption[]>(() =>
    this.clinicOptions().map((clinic) => ({
      value: clinic.id,
      label: clinic.name,
      meta:
        clinic.id === 'network'
          ? clinic.region
          : `${clinic.waitMinutes} min wait • ${clinic.utilization}% utilized • ${clinic.readiness} readiness`,
      tone: clinic.openIssues >= 5 ? 'critical' : clinic.openIssues >= 4 ? 'warning' : 'accent'
    }))
  );
  protected readonly providerSelectOptions = computed<EnterpriseSelectOption[]>(() =>
    this.providerOptions().map((provider) => ({
      value: provider.id,
      label: provider.name,
      meta:
        provider.id === 'all'
          ? provider.specialty
          : `${provider.specialty} • ${provider.room} • Next ${provider.nextSlot}`,
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
  protected readonly routeUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );
  protected readonly currentTitle = computed(() => PAGE_TITLES[this.routeUrl()] ?? 'Command Center');

  protected setActiveClinic(clinicId: string): void {
    this.store.setActiveClinic(clinicId);
  }

  protected setActiveProvider(providerId: string): void {
    this.store.setActiveProvider(providerId);
  }

  protected setSelectedDate(dateValue: string): void {
    this.store.setSelectedDate(dateValue);
  }

  protected toggleAiWorkspace(): void {
    this.store.toggleAiWorkspace();
  }

  protected signOut(): void {
    this.authState.clearSession();
  }
}
