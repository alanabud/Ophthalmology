import { NgClass } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthStateService } from '../services/auth-state.service';
import { EnterpriseStoreService } from '../services/enterprise-store.service';

@Component({
  selector: 'app-shell',
  imports: [NgClass, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss'
})
export class AppShellComponent {
  private readonly store = inject(EnterpriseStoreService);
  private readonly authState = inject(AuthStateService);

  protected readonly navigationSections = this.store.navigationSections;
  protected readonly dailyBriefing = this.store.dailyBriefing;
  protected readonly organizationName = this.store.organizationName;
  protected readonly environmentLabel = this.store.environmentLabel;
  protected readonly isAuthenticated = this.authState.isAuthenticated;
  protected readonly displayName = this.authState.displayName;
  protected readonly accountInitials = computed(() => {
    const tokens = this.displayName().split(/\s+/).filter(Boolean);
    return (tokens[0]?.[0] ?? 'G') + (tokens[1]?.[0] ?? 'S');
  });

  protected signOut(): void {
    this.authState.clearSession();
  }
}
