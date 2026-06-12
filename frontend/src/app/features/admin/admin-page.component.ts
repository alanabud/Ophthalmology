import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { GLAccountRecord, RoleMatrixItem } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { FirestoreService } from '../../core/services/firestore.service';

/** Read-only mirror of clinic claims minted by backend/claims-admin.js. */
interface StaffClaimEntry {
  email: string;
  clinicId: string;
  role: string;
  active: boolean;
  updatedAt?: string;
}
import { AppModalComponent } from '../../shared/ui/app-modal.component';
import { GLAccountModalComponent } from '../../shared/ui/gl-account-modal.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-admin-page',
  imports: [FormsModule, RouterLink, AppModalComponent, GLAccountModalComponent, StatusChipComponent],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss'
})
export class AdminPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  private readonly fs = inject(FirestoreService);
  protected readonly roleMatrix = this.store.roleMatrix;
  protected readonly clinics = this.store.clinicComparison;

  // ── Clinic access claims (Sprint 15) — read-only registry mirror ────────────
  protected readonly staffClaims = signal<StaffClaimEntry[] | null>(null);
  constructor() {
    void this.fs.getAll<StaffClaimEntry>('staffDirectory')
      .then((rows) => this.staffClaims.set(rows.sort((a, b) => a.email.localeCompare(b.email))))
      .catch(() => this.staffClaims.set([]));
  }

  // ── GL Accounts maintenance (Sprint 9C) ─────────────────────────────────────
  protected readonly glAccounts = this.store.glAccounts;
  protected readonly glOpen = signal(false);
  protected readonly glToEdit = signal<GLAccountRecord | null>(null);
  protected newGLAccount(): void { this.glToEdit.set(null); this.glOpen.set(true); }
  protected editGLAccount(a: GLAccountRecord): void { this.glToEdit.set(a); }
  protected closeGL(): void { this.glOpen.set(false); this.glToEdit.set(null); }

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
