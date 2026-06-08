import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { GuarantorRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

const TABS = [
  { num: 1, label: 'Identity' }, { num: 2, label: 'Relationship' },
  { num: 3, label: 'Contact' }, { num: 4, label: 'Financial Responsibility' }, { num: 5, label: 'Audit' },
];

@Component({
  selector: 'app-guarantor-modal',
  imports: [FormsModule],
  styleUrl: './maintenance-modal.scss',
  template: `
    @if (open()) {
      <div class="mm-overlay" (click)="cancel()"></div>
      <div class="mm-panel" role="dialog" [attr.aria-label]="isEdit() ? 'Edit guarantor' : 'New guarantor'">
        <header class="mm-head"><span class="mm-eyebrow">Revenue Cycle · Guarantor</span>
          <button class="mm-x" type="button" (click)="cancel()" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
        </header>
        <div class="mm-title-row">
          <h1 class="mm-title">@if (isEdit()) { Edit guarantor<span class="mm-title__name"> · {{ (firstName + ' ' + lastName).trim() || recordToEdit()?.firstName }}</span> } @else { New guarantor }</h1>
          @if (isEdit()) { <span class="mm-locked">{{ recordToEdit()?.id }} · locked</span> }
        </div>
        <div class="mm-body">
          <nav class="mm-rail">@for (t of tabs; track t.num) { <button class="mm-railitem" [class.mm-railitem--on]="tab() === t.num" type="button" (click)="tab.set(t.num)"><span class="mm-railnum">{{ t.num < 10 ? '0' + t.num : t.num }}</span>{{ t.label }}</button> }</nav>
          <div class="mm-content">
            @if (submitted()) {
              <div class="mm-success"><div class="mm-success__ic">✓</div>
                @if (isEdit()) { <strong>Changes saved</strong><p>{{ firstName }} {{ lastName }}'s guarantor record updated.</p> } @else { <strong>Guarantor created</strong><p>{{ firstName }} {{ lastName }} added as a guarantor.</p> }
              </div>
            } @else {
              @switch (tab()) {
                @case (1) { <p class="mm-sec">Guarantor identity</p><div class="mm-grid">
                  <label class="mf"><span>Last name <i>*</i></span><input type="text" [(ngModel)]="lastName" placeholder="Last name"></label>
                  <label class="mf"><span>First name <i>*</i></span><input type="text" [(ngModel)]="firstName" placeholder="First name"></label>
                  <label class="mf"><span>Date of birth</span><input type="date" [(ngModel)]="dob"></label>
                  <label class="mf"><span>SSN (last 4)</span><input type="text" maxlength="4" [(ngModel)]="ssnLast4" placeholder="····"></label>
                  @if (isEdit()) { <div class="mf"><span>Guarantor ID</span><input type="text" [value]="recordToEdit()?.id" readonly class="mf--locked"></div> }
                </div> }
                @case (2) { <p class="mm-sec">Relationship to patient</p><div class="mm-grid">
                  <label class="mf"><span>Relationship</span><select [(ngModel)]="relationship"><option value="">—</option><option>Self</option><option>Spouse</option><option>Parent</option><option>Child</option><option>Guardian</option><option>Other</option></select></label>
                  <label class="mf"><span>Linked patient</span><input type="text" [(ngModel)]="linkedPatient" placeholder="Patient name"></label>
                  <label class="mf"><span>Patient MRN</span><input type="text" [(ngModel)]="linkedPatientMrn" placeholder="MRN"></label>
                </div> }
                @case (3) { <p class="mm-sec">Contact</p><div class="mm-grid">
                  <label class="mf"><span>Phone</span><input type="text" [(ngModel)]="phone" placeholder="(407) 555-…"></label>
                  <label class="mf mf--2"><span>Email</span><input type="email" [(ngModel)]="email" placeholder="name@example.com"></label>
                  <label class="mf mf--2"><span>Address</span><input type="text" [(ngModel)]="address" placeholder="Street"></label>
                  <label class="mf"><span>City</span><input type="text" [(ngModel)]="city"></label>
                  <label class="mf"><span>State</span><input type="text" [(ngModel)]="state" maxlength="2"></label>
                  <label class="mf"><span>ZIP</span><input type="text" [(ngModel)]="zip"></label>
                </div> }
                @case (4) { <p class="mm-sec">Financial responsibility</p><div class="mm-grid">
                  <label class="mf"><span>Responsibility %</span><input type="text" [(ngModel)]="responsibilityPct" placeholder="100"></label>
                  <label class="mf"><span>Billing preference</span><select [(ngModel)]="billingPreference"><option value="">—</option><option>Statement</option><option>E-statement</option><option>Auto-pay</option></select></label>
                  <label class="mf"><span>Statement delivery</span><select [(ngModel)]="statementDelivery"><option value="">—</option><option>Mail</option><option>Email</option><option>Portal</option></select></label>
                  <label class="mf mf--check"><input type="checkbox" [(ngModel)]="active"> Active guarantor</label>
                </div> }
                @case (5) { <p class="mm-sec">Audit &amp; notes</p><div class="mm-grid">
                  <label class="mf mf--full"><span>Notes</span><textarea rows="3" [(ngModel)]="notes" placeholder="Notes"></textarea></label>
                </div> }
              }
            }
          </div>
        </div>
        <footer class="mm-foot">
          <button class="mm-btn" type="button" [disabled]="tab() === 1" (click)="tab.set(tab() - 1)">← Previous</button>
          <span class="mm-foot__ind">{{ tab() }} / 5 · {{ currentLabel }}</span>
          @if (tab() < 5) { <button class="mm-btn mm-btn--next" type="button" (click)="tab.set(tab() + 1)">Next →</button> }
          @else { <button class="mm-btn mm-btn--submit" type="button" [disabled]="!canSubmit || saving()" (click)="submit()">@if (isEdit()) { {{ saving() ? 'Saving…' : 'Save changes' }} } @else { {{ saving() ? 'Creating…' : 'Create guarantor' }} }</button> }
          <button class="mm-btn mm-btn--cancel" type="button" (click)="cancel()">Cancel</button>
        </footer>
      </div>
    }
  `,
})
export class GuarantorModalComponent {
  private readonly store = inject(EnterpriseStoreService);
  readonly open = input(false);
  readonly recordToEdit = input<GuarantorRecord | null>(null);
  readonly closed = output<void>();

  protected readonly isEdit = signal(false);
  protected readonly tabs = TABS;
  protected readonly tab = signal(1);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);

  protected firstName = ''; protected lastName = ''; protected dob = ''; protected ssnLast4 = '';
  protected relationship = ''; protected linkedPatient = ''; protected linkedPatientMrn = '';
  protected phone = ''; protected email = ''; protected address = ''; protected city = ''; protected state = ''; protected zip = '';
  protected responsibilityPct = '100'; protected billingPreference = ''; protected statementDelivery = ''; protected active = true;
  protected notes = '';

  constructor() {
    effect(() => { const r = this.recordToEdit(); if (r) { this.isEdit.set(true); this.populate(r); } else { this.isEdit.set(false); } });
  }
  private populate(r: GuarantorRecord): void {
    this.firstName = r.firstName; this.lastName = r.lastName; this.dob = r.dob ?? ''; this.ssnLast4 = r.ssnLast4 ?? '';
    this.relationship = r.relationship ?? ''; this.linkedPatient = r.linkedPatient ?? ''; this.linkedPatientMrn = r.linkedPatientMrn ?? '';
    this.phone = r.phone ?? ''; this.email = r.email ?? ''; this.address = r.address ?? ''; this.city = r.city ?? ''; this.state = r.state ?? ''; this.zip = r.zip ?? '';
    this.responsibilityPct = r.responsibilityPct ?? '100'; this.billingPreference = r.billingPreference ?? ''; this.statementDelivery = r.statementDelivery ?? ''; this.active = r.active ?? true;
    this.notes = r.notes ?? ''; this.tab.set(1);
  }
  protected get currentLabel(): string { return TABS.find(t => t.num === this.tab())?.label ?? ''; }
  protected get canSubmit(): boolean { return !!this.firstName.trim() && !!this.lastName.trim(); }

  protected submit(): void {
    if (!this.canSubmit || this.saving()) return;
    this.saving.set(true);
    const fields = {
      firstName: this.firstName.trim(), lastName: this.lastName.trim(), dob: this.dob, ssnLast4: this.ssnLast4.trim(),
      relationship: this.relationship, linkedPatient: this.linkedPatient.trim(), linkedPatientMrn: this.linkedPatientMrn.trim(),
      phone: this.phone.trim(), email: this.email.trim(), address: this.address.trim(), city: this.city.trim(), state: this.state.trim(), zip: this.zip.trim(),
      responsibilityPct: this.responsibilityPct.trim(), billingPreference: this.billingPreference, statementDelivery: this.statementDelivery, active: this.active,
      notes: this.notes.trim(), updatedOn: new Date().toISOString().slice(0, 10),
    };
    if (this.isEdit() && this.recordToEdit()) {
      this.store.updateGuarantor({ ...this.recordToEdit()!, ...fields });
    } else {
      const clinicId = this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park';
      this.store.createGuarantor({ id: `gar-${Date.now()}`, clinicId, createdOn: new Date().toISOString().slice(0, 10), ...fields });
    }
    this.saving.set(false); this.submitted.set(true);
    setTimeout(() => this.reset(), 1500);
  }
  protected cancel(): void { this.reset(); }
  private reset(): void {
    this.tab.set(1); this.submitted.set(false); this.saving.set(false);
    this.firstName = ''; this.lastName = ''; this.dob = ''; this.ssnLast4 = '';
    this.relationship = ''; this.linkedPatient = ''; this.linkedPatientMrn = '';
    this.phone = ''; this.email = ''; this.address = ''; this.city = ''; this.state = ''; this.zip = '';
    this.responsibilityPct = '100'; this.billingPreference = ''; this.statementDelivery = ''; this.active = true; this.notes = '';
    this.closed.emit();
  }
}
