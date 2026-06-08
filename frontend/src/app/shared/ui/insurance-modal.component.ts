import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { InsuranceRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

const TABS = [
  { num: 1, label: 'Payer' }, { num: 2, label: 'Eligibility' },
  { num: 3, label: 'Rules / Authorization' }, { num: 4, label: 'Billing Defaults' }, { num: 5, label: 'Audit' },
];

@Component({
  selector: 'app-insurance-modal',
  imports: [FormsModule],
  styleUrl: './maintenance-modal.scss',
  template: `
    @if (open()) {
      <div class="mm-overlay" (click)="cancel()"></div>
      <div class="mm-panel" role="dialog" [attr.aria-label]="isEdit() ? 'Edit insurance payer' : 'New insurance payer'">
        <header class="mm-head"><span class="mm-eyebrow">Revenue Cycle · Insurance</span>
          <button class="mm-x" type="button" (click)="cancel()" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
        </header>
        <div class="mm-title-row">
          <h1 class="mm-title">@if (isEdit()) { Edit insurance payer<span class="mm-title__name"> · {{ payerName || recordToEdit()?.payerName }}</span> } @else { New insurance payer }</h1>
          @if (isEdit()) { <span class="mm-locked">{{ recordToEdit()?.payerId }} · locked</span> }
        </div>
        <div class="mm-body">
          <nav class="mm-rail">@for (t of tabs; track t.num) { <button class="mm-railitem" [class.mm-railitem--on]="tab() === t.num" type="button" (click)="tab.set(t.num)"><span class="mm-railnum">{{ t.num < 10 ? '0' + t.num : t.num }}</span>{{ t.label }}</button> }</nav>
          <div class="mm-content">
            @if (submitted()) {
              <div class="mm-success"><div class="mm-success__ic">✓</div>
                @if (isEdit()) { <strong>Changes saved</strong><p>{{ payerName }} payer record updated.</p> } @else { <strong>Payer created</strong><p>{{ payerName }} added to the payer list.</p> }
              </div>
            } @else {
              @switch (tab()) {
                @case (1) { <p class="mm-sec">Payer identity</p><div class="mm-grid">
                  <label class="mf mf--2"><span>Payer name <i>*</i></span><input type="text" [(ngModel)]="payerName" placeholder="e.g. BCBS Florida"></label>
                  <label class="mf"><span>Payer ID <i>*</i></span><input type="text" [(ngModel)]="payerId" [readonly]="isEdit()" [class.mf--locked]="isEdit()" placeholder="BCBS-FL-22"></label>
                  <label class="mf"><span>Payer type</span><select [(ngModel)]="payerType"><option value="">—</option><option>Commercial</option><option>Government</option><option>Vision</option><option>Self-pay</option></select></label>
                  <label class="mf"><span>Plan type</span><select [(ngModel)]="planType"><option value="">—</option><option>HMO</option><option>PPO</option><option>Medicare</option><option>Medicaid</option><option>EPO</option></select></label>
                  <label class="mf"><span>EDI payer ID</span><input type="text" [(ngModel)]="ediPayerId" placeholder="00590"></label>
                  <label class="mf mf--check"><input type="checkbox" [(ngModel)]="active"> Active payer</label>
                </div> }
                @case (2) { <p class="mm-sec">Eligibility</p><div class="mm-grid">
                  <label class="mf"><span>Eligibility phone</span><input type="text" [(ngModel)]="eligibilityPhone" placeholder="1-800-…"></label>
                  <label class="mf"><span>Eligibility status</span><select [(ngModel)]="eligibilityStatus"><option value="">—</option><option>Active</option><option>Inactive</option><option>Termed</option></select></label>
                  <label class="mf"><span>Last verified</span><input type="date" [(ngModel)]="eligibilityVerified"></label>
                </div> }
                @case (3) { <p class="mm-sec">Rules &amp; authorization</p><div class="mm-grid">
                  <label class="mf mf--check"><input type="checkbox" [(ngModel)]="authRequired"> Prior authorization required</label>
                  <label class="mf"><span>Auth phone</span><input type="text" [(ngModel)]="authPhone" placeholder="1-800-…"></label>
                  <label class="mf"><span>Timely filing (days)</span><input type="text" [(ngModel)]="timelyFilingDays" placeholder="180"></label>
                  <label class="mf mf--check"><input type="checkbox" [(ngModel)]="referralRequired"> Referral required</label>
                </div> }
                @case (4) { <p class="mm-sec">Billing defaults</p><div class="mm-grid">
                  <label class="mf mf--2"><span>Claims address</span><input type="text" [(ngModel)]="claimsAddress" placeholder="PO Box …"></label>
                  <label class="mf"><span>Fee schedule</span><input type="text" [(ngModel)]="feeSchedule" placeholder="2026 schedule"></label>
                  <label class="mf"><span>Default place of service</span><input type="text" [(ngModel)]="defaultPlaceOfService" placeholder="11 — Office"></label>
                  <label class="mf mf--check"><input type="checkbox" [(ngModel)]="acceptsElectronic"> Accepts electronic claims</label>
                </div> }
                @case (5) { <p class="mm-sec">Audit &amp; notes</p><div class="mm-grid">
                  <label class="mf mf--full"><span>Notes</span><textarea rows="3" [(ngModel)]="notes" placeholder="Payer-specific billing notes"></textarea></label>
                  @if (isEdit()) { <div class="mf"><span>Record ID</span><input type="text" [value]="recordToEdit()?.id" readonly class="mf--locked"></div> }
                </div> }
              }
            }
          </div>
        </div>
        <footer class="mm-foot">
          <button class="mm-btn" type="button" [disabled]="tab() === 1" (click)="tab.set(tab() - 1)">← Previous</button>
          <span class="mm-foot__ind">{{ tab() }} / 5 · {{ currentLabel }}</span>
          @if (tab() < 5) { <button class="mm-btn mm-btn--next" type="button" (click)="tab.set(tab() + 1)">Next →</button> }
          @else { <button class="mm-btn mm-btn--submit" type="button" [disabled]="!canSubmit || saving()" (click)="submit()">@if (isEdit()) { {{ saving() ? 'Saving…' : 'Save changes' }} } @else { {{ saving() ? 'Creating…' : 'Create payer' }} }</button> }
          <button class="mm-btn mm-btn--cancel" type="button" (click)="cancel()">Cancel</button>
        </footer>
      </div>
    }
  `,
})
export class InsuranceModalComponent {
  private readonly store = inject(EnterpriseStoreService);
  readonly open = input(false);
  readonly recordToEdit = input<InsuranceRecord | null>(null);
  readonly closed = output<void>();

  protected readonly isEdit = signal(false);
  protected readonly tabs = TABS;
  protected readonly tab = signal(1);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);

  protected payerName = ''; protected payerId = ''; protected payerType = ''; protected planType = ''; protected ediPayerId = '';
  protected active = true;
  protected eligibilityPhone = ''; protected eligibilityStatus = ''; protected eligibilityVerified = '';
  protected authRequired = false; protected authPhone = ''; protected timelyFilingDays = ''; protected referralRequired = false;
  protected claimsAddress = ''; protected feeSchedule = ''; protected defaultPlaceOfService = ''; protected acceptsElectronic = true;
  protected notes = '';

  constructor() {
    effect(() => { const r = this.recordToEdit(); if (r) { this.isEdit.set(true); this.populate(r); } else { this.isEdit.set(false); } });
  }
  private populate(r: InsuranceRecord): void {
    this.payerName = r.payerName; this.payerId = r.payerId; this.payerType = r.payerType ?? ''; this.planType = r.planType ?? ''; this.ediPayerId = r.ediPayerId ?? '';
    this.active = r.active ?? true; this.eligibilityPhone = r.eligibilityPhone ?? ''; this.eligibilityStatus = r.eligibilityStatus ?? ''; this.eligibilityVerified = r.eligibilityVerified ?? '';
    this.authRequired = r.authRequired ?? false; this.authPhone = r.authPhone ?? ''; this.timelyFilingDays = r.timelyFilingDays ?? ''; this.referralRequired = r.referralRequired ?? false;
    this.claimsAddress = r.claimsAddress ?? ''; this.feeSchedule = r.feeSchedule ?? ''; this.defaultPlaceOfService = r.defaultPlaceOfService ?? ''; this.acceptsElectronic = r.acceptsElectronic ?? true;
    this.notes = r.notes ?? ''; this.tab.set(1);
  }
  protected get currentLabel(): string { return TABS.find(t => t.num === this.tab())?.label ?? ''; }
  protected get canSubmit(): boolean { return !!this.payerName.trim() && !!this.payerId.trim(); }

  protected submit(): void {
    if (!this.canSubmit || this.saving()) return;
    this.saving.set(true);
    const fields = {
      payerName: this.payerName.trim(), payerType: this.payerType, planType: this.planType, ediPayerId: this.ediPayerId.trim(),
      active: this.active, eligibilityPhone: this.eligibilityPhone.trim(), eligibilityStatus: this.eligibilityStatus, eligibilityVerified: this.eligibilityVerified,
      authRequired: this.authRequired, authPhone: this.authPhone.trim(), timelyFilingDays: this.timelyFilingDays.trim(), referralRequired: this.referralRequired,
      claimsAddress: this.claimsAddress.trim(), feeSchedule: this.feeSchedule.trim(), defaultPlaceOfService: this.defaultPlaceOfService.trim(), acceptsElectronic: this.acceptsElectronic,
      notes: this.notes.trim(), updatedOn: new Date().toISOString().slice(0, 10),
    };
    if (this.isEdit() && this.recordToEdit()) {
      this.store.updateInsurance({ ...this.recordToEdit()!, ...fields });
    } else {
      const clinicId = this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park';
      this.store.createInsurance({ id: `ins-${Date.now()}`, clinicId, payerId: this.payerId.trim(), createdOn: new Date().toISOString().slice(0, 10), ...fields });
    }
    this.saving.set(false); this.submitted.set(true);
    setTimeout(() => this.reset(), 1500);
  }
  protected cancel(): void { this.reset(); }
  private reset(): void {
    this.tab.set(1); this.submitted.set(false); this.saving.set(false);
    this.payerName = ''; this.payerId = ''; this.payerType = ''; this.planType = ''; this.ediPayerId = ''; this.active = true;
    this.eligibilityPhone = ''; this.eligibilityStatus = ''; this.eligibilityVerified = '';
    this.authRequired = false; this.authPhone = ''; this.timelyFilingDays = ''; this.referralRequired = false;
    this.claimsAddress = ''; this.feeSchedule = ''; this.defaultPlaceOfService = ''; this.acceptsElectronic = true; this.notes = '';
    this.closed.emit();
  }
}
