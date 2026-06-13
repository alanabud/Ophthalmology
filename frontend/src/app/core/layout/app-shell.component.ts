import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { DailyBriefingSignal } from '../../core/models/enterprise.models';
import { EnterpriseSelectComponent, EnterpriseSelectOption } from '../../shared/ui/enterprise-select.component';
import { NewAppointmentModalComponent } from '../../shared/ui/new-appointment-modal.component';
import { NewClaimModalComponent } from '../../shared/ui/new-claim-modal.component';
import { NewPatientModalComponent } from '../../shared/ui/new-patient-modal.component';
import { QuickCreateModalComponent } from '../../shared/ui/quick-create-modal.component';
import { ActionService } from '../services/action.service';
import { AuthStateService } from '../services/auth-state.service';
import { EnterpriseStoreService } from '../services/enterprise-store.service';

@Component({
  selector: 'app-shell',
  imports: [EnterpriseSelectComponent, NewAppointmentModalComponent, NewClaimModalComponent, NewPatientModalComponent, QuickCreateModalComponent, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss'
})
export class AppShellComponent {
  private readonly store = inject(EnterpriseStoreService);
  private readonly authState = inject(AuthStateService);

  // ── Sidebar collapse state ─────────────────────────────────────────────────
  readonly sidebarCollapsed = signal<boolean>(
    localStorage.getItem('sidebar-collapsed') === 'true'
  );

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update(v => {
      const next = !v;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  }

  // Kick off Firestore seed + sync the moment the shell loads (non-blocking).
  // The app renders immediately with local data; Firestore data replaces it
  // in the background when ready.
  private readonly actionService = inject(ActionService);

  // React to actions dispatched by any child page (e.g. dashboard buttons)
  private readonly _actionEffect = effect(() => {
    const t = this.actionService.trigger();
    if (!t) return;
    switch (t.action) {
      case 'new-patient':    this.newPatientOpen.set(true);    break;
      case 'new-appointment': this.newAppointmentOpen.set(true); break;
      case 'new-claim':      this.newClaimOpen.set(true);      break;
    }
  });

  constructor() {
    void this.store.initFirestore();
  }

  protected readonly firestoreReady = this.store.firestoreReady;
  protected readonly firestoreError = this.store.firestoreError;

  protected readonly navigationSections = this.store.navigationSections;
  protected readonly clinicOptions = this.store.clinicOptions;
  protected readonly providerOptions = this.store.providerOptions;
  protected readonly currentClinic = this.store.currentClinic;
  protected readonly currentProvider = this.store.currentProvider;
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
  // ── Notifications (Sprint 19) — real, Firestore-backed, clinic-scoped ────────
  protected readonly notificationFeed = this.store.notificationFeed;
  protected readonly unreadCount = this.store.unreadNotificationCount;
  protected readonly notifBadge = computed(() => {
    const n = this.unreadCount();
    return n > 99 ? '99+' : String(n);
  });
  protected readonly notifOpen = signal(false);
  protected readonly notifFilter = signal<'all' | 'unread' | 'critical'>('all');
  protected readonly visibleNotifications = computed(() => {
    const f = this.notifFilter();
    const list = this.notificationFeed();
    if (f === 'unread') return list.filter(n => n.status === 'unread');
    if (f === 'critical') return list.filter(n => n.severity === 'critical');
    return list;
  });

  protected toggleNotifications(): void { this.notifOpen.update(v => !v); }
  protected closeNotifications(): void { this.notifOpen.set(false); }
  protected setNotifFilter(f: 'all' | 'unread' | 'critical'): void { this.notifFilter.set(f); }
  protected markNotifRead(id: string, ev?: Event): void { ev?.stopPropagation(); this.store.markNotificationRead(id); }
  protected markAllNotifRead(): void { this.store.markAllNotificationsRead(); }
  protected archiveNotif(id: string, ev?: Event): void { ev?.stopPropagation(); this.store.archiveNotification(id); }
  protected openNotification(n: { id: string; actionRoute?: string }): void {
    this.store.markNotificationRead(n.id);
    this.notifOpen.set(false);
    if (n.actionRoute) void this.router.navigateByUrl(n.actionRoute);
  }
  protected openNotificationCenter(filter?: string): void {
    this.notifOpen.set(false);
    void this.router.navigate(['/admin/notifications'], filter ? { queryParams: { filter } } : {});
  }
  protected timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }
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
  protected readonly newAppointmentOpen = signal(false);
  protected readonly newClaimOpen = signal(false);

  protected openQuickCreate(): void {
    this.quickCreateOpen.set(true);
  }

  protected onQuickCreateAction(action: 'new-patient' | 'new-appointment' | 'new-claim'): void {
    if (action === 'new-patient') {
      this.newPatientOpen.set(true);
    } else if (action === 'new-appointment') {
      this.newAppointmentOpen.set(true);
    } else if (action === 'new-claim') {
      this.newClaimOpen.set(true);
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
