import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ClaimRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { AppModalComponent } from '../../shared/ui/app-modal.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-billing-page',
  imports: [FormsModule, AppModalComponent, StatusChipComponent],
  templateUrl: './billing-page.component.html',
  styleUrl: './billing-page.component.scss'
})
export class BillingPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly claims = this.store.claims;
  protected readonly aiInsights = this.store.aiInsights;

  // Modal state
  protected readonly selectedClaim = signal<ClaimRecord | null>(null);
  protected readonly editingClaim = signal<ClaimRecord | null>(null);
  protected readonly viewOpen = signal(false);
  protected readonly formOpen = signal(false);

  // Form fields
  protected fPatient = '';
  protected fPayer = '';
  protected fAmount = '';
  protected fProcedure = '';

  protected viewClaim(claim: ClaimRecord): void {
    this.selectedClaim.set(claim);
    this.viewOpen.set(true);
  }

  protected openEdit(claim: ClaimRecord): void {
    this.editingClaim.set(claim);
    this.fPatient = claim.patient;
    this.fPayer = claim.payer;
    this.fAmount = claim.amount;
    this.fProcedure = claim.nextAction;
    this.formOpen.set(true);
  }

  protected openCreate(): void {
    this.editingClaim.set(null);
    this.fPatient = '';
    this.fPayer = '';
    this.fAmount = '';
    this.fProcedure = '';
    this.formOpen.set(true);
  }

  protected submitClaim(claim: ClaimRecord): void {
    this.store.submitClaim(claim.claim);
  }

  protected saveClaim(): void {
    if (!this.fPatient.trim()) return;
    const clinicId = this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park';
    if (this.editingClaim()) {
      this.store.updateClaim({
        ...this.editingClaim()!,
        patient: this.fPatient.trim(),
        payer: this.fPayer.trim(),
        amount: this.fAmount.trim(),
        nextAction: this.fProcedure.trim(),
      });
    } else {
      const id = `CLM-${String(Date.now()).slice(-6)}`;
      this.store.createClaim({
        clinicId,
        claim: id,
        patient: this.fPatient.trim(),
        payer: this.fPayer.trim() || 'Self-pay',
        amount: this.fAmount.trim() || '$0.00',
        status: 'Draft',
        tone: 'neutral',
        denialRisk: 'Low',
        nextAction: this.fProcedure.trim() || 'Review before submit',
      });
    }
    this.formOpen.set(false);
    this.editingClaim.set(null);
  }

  protected closeView(): void { this.viewOpen.set(false); this.selectedClaim.set(null); }
  protected closeForm(): void { this.formOpen.set(false); this.editingClaim.set(null); }
}
