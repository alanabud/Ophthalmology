import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { RoleMatrixItem } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { AppModalComponent } from '../../shared/ui/app-modal.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-compliance-page',
  imports: [FormsModule, AppModalComponent, StatusChipComponent],
  templateUrl: './compliance-page.component.html',
  styleUrl: './compliance-page.component.scss'
})
export class CompliancePageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly events = this.store.complianceEvents;
  protected readonly roleMatrix = this.store.roleMatrix;

  // Modal state
  protected readonly selectedRole = signal<RoleMatrixItem | null>(null);
  protected readonly editingRole = signal<RoleMatrixItem | null>(null);
  protected readonly viewOpen = signal(false);
  protected readonly formOpen = signal(false);

  // Form fields
  protected fRole = '';
  protected fScope = '';
  protected fClinics = '';
  protected fMfa = '';

  protected viewRole(role: RoleMatrixItem): void {
    this.selectedRole.set(role);
    this.viewOpen.set(true);
  }

  protected openEdit(role: RoleMatrixItem): void {
    this.editingRole.set(role);
    this.fRole = role.role;
    this.fScope = role.scope;
    this.fClinics = role.clinics;
    this.fMfa = role.mfa;
    this.formOpen.set(true);
  }

  protected openCreate(): void {
    this.editingRole.set(null);
    this.fRole = '';
    this.fScope = '';
    this.fClinics = '';
    this.fMfa = 'Required';
    this.formOpen.set(true);
  }

  protected saveRole(): void {
    if (!this.fRole.trim()) return;
    if (this.editingRole()) {
      this.store.updateRole({
        ...this.editingRole()!,
        role: this.fRole.trim(),
        scope: this.fScope.trim(),
        clinics: this.fClinics.trim(),
        mfa: this.fMfa.trim(),
        lastChange: 'Just now',
      });
    } else {
      this.store.createRole({
        role: this.fRole.trim(),
        scope: this.fScope.trim() || 'Clinic',
        clinics: this.fClinics.trim() || 'All',
        mfa: this.fMfa.trim() || 'Required',
        lastChange: 'Just now',
        tone: 'info',
      });
    }
    this.formOpen.set(false);
    this.editingRole.set(null);
  }

  protected closeView(): void { this.viewOpen.set(false); this.selectedRole.set(null); }
  protected closeForm(): void { this.formOpen.set(false); this.editingRole.set(null); }
}
