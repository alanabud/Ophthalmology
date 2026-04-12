import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ClaimRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { NewClaimModalComponent } from '../../shared/ui/new-claim-modal.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

type WorkQueue = 'all' | 'denial' | 'follow-up' | 'ready' | 'drafts';

@Component({
  selector: 'app-billing-page',
  imports: [FormsModule, NewClaimModalComponent, StatusChipComponent],
  templateUrl: './billing-page.component.html',
  styleUrl: './billing-page.component.scss'
})
export class BillingPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly claims = this.store.claims;
  protected readonly aiInsights = this.store.aiInsights;

  /* ── Search / filter state ───────────────────────── */
  protected searchQuery  = '';
  protected filterPayer  = '';
  protected filterStatus = '';
  protected activeQueue  = signal<WorkQueue>('all');

  protected readonly filteredClaims = computed(() => {
    let list = this.claims();
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter((c) =>
        c.claim.toLowerCase().includes(q) ||
        c.patient.toLowerCase().includes(q) ||
        c.payer.toLowerCase().includes(q)
      );
    }
    if (this.filterPayer) {
      list = list.filter((c) => c.payer.toLowerCase().includes(this.filterPayer.toLowerCase()));
    }
    if (this.filterStatus) {
      list = list.filter((c) => c.status === this.filterStatus);
    }
    const q2 = this.activeQueue();
    if (q2 === 'denial')   list = list.filter((c) => c.status === 'Denied' || c.status === 'Rejected');
    if (q2 === 'follow-up') list = list.filter((c) => c.denialRisk === 'High' || c.denialRisk === 'Medium');
    if (q2 === 'ready')    list = list.filter((c) => c.status === 'Ready to submit' || c.status === 'Draft');
    if (q2 === 'drafts')   list = list.filter((c) => c.status === 'Draft');
    return list;
  });

  /* ── KPI helpers ──────────────────────────────────── */
  protected readonly totalOutstanding = computed(() => this.claims().length);
  protected readonly readyToSubmit = computed(() =>
    this.claims().filter((c) => c.status === 'Ready to submit' || c.status === 'Draft').length
  );
  protected readonly deniedCount = computed(() =>
    this.claims().filter((c) => c.status === 'Denied' || c.status === 'Rejected').length
  );
  protected readonly followUpDue = computed(() =>
    this.claims().filter((c) => c.denialRisk === 'High').length
  );

  /* ── Modal state ──────────────────────────────────── */
  protected readonly claimModalOpen   = signal(false);
  protected readonly claimToEdit      = signal<ClaimRecord | null>(null);
  protected readonly viewOpen         = signal(false);
  protected readonly selectedClaim    = signal<ClaimRecord | null>(null);

  protected openCreate(): void {
    this.claimToEdit.set(null);
    this.claimModalOpen.set(true);
  }

  protected openEdit(claim: ClaimRecord): void {
    this.claimToEdit.set(claim);
    this.claimModalOpen.set(true);
  }

  protected viewClaim(claim: ClaimRecord): void {
    this.selectedClaim.set(claim);
    this.viewOpen.set(true);
  }

  protected closeView(): void {
    this.viewOpen.set(false);
    this.selectedClaim.set(null);
  }

  protected submitClaim(claim: ClaimRecord): void {
    this.store.submitClaim(claim.claim);
  }

  protected setQueue(q: WorkQueue): void {
    this.activeQueue.set(q);
  }
}
