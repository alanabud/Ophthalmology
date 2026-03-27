import { Component, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MAINTENANCE_NAV, MaintenanceNavSection } from './maintenance-nav.data';

@Component({
  selector: 'app-maintenance-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './maintenance-shell.component.html',
  styleUrl: './maintenance-shell.component.scss'
})
export class MaintenanceShellComponent {
  protected readonly navSections: MaintenanceNavSection[] = MAINTENANCE_NAV;
  protected readonly searchQuery = signal('');

  protected readonly filteredSections = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.navSections;
    return this.navSections
      .map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.label.toLowerCase().includes(q) || section.label.toLowerCase().includes(q)
        )
      }))
      .filter(section => section.items.length > 0);
  });

  protected setSearch(value: string): void {
    this.searchQuery.set(value);
  }
}
