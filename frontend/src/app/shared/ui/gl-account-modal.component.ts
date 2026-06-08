import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { GLAccountRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

const TABS = [
  { num: 1, label: 'Account' }, { num: 2, label: 'Classification' }, { num: 3, label: 'Posting Rules' },
  { num: 4, label: 'Tax / Reporting' }, { num: 5, label: 'System Protection' }, { num: 6, label: 'Status / Notes' },
];

@Component({
  selector: 'app-gl-account-modal',
  imports: [FormsModule],
  styleUrl: './maintenance-modal.scss',
  template: `
    @if (open()) {
      <div class="mm-overlay" (click)="cancel()"></div>
      <div class="mm-panel" role="dialog" [attr.aria-label]="isEdit() ? 'Edit GL account' : 'New GL account'">
        <header class="mm-head"><span class="mm-eyebrow">Finance · General Ledger</span>
          <button class="mm-x" type="button" (click)="cancel()" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
        </header>
        <div class="mm-title-row">
          <h1 class="mm-title">@if (isEdit()) { Edit GL account<span class="mm-title__name"> · {{ accountName || recordToEdit()?.accountName }}</span> } @else { New GL account }</h1>
          @if (isEdit()) { <span class="mm-locked">{{ recordToEdit()?.accountCode }} · locked</span> }
          @if (systemLocked()) { <span class="mm-locked mm-locked--sys">System account · protected</span> }
        </div>
        <div class="mm-body">
          <nav class="mm-rail">@for (t of tabs; track t.num) { <button class="mm-railitem" [class.mm-railitem--on]="tab() === t.num" type="button" (click)="tab.set(t.num)"><span class="mm-railnum">{{ t.num < 10 ? '0' + t.num : t.num }}</span>{{ t.label }}</button> }</nav>
          <div class="mm-content">
            @if (submitted()) {
              <div class="mm-success"><div class="mm-success__ic">✓</div>
                @if (isEdit()) { <strong>Changes saved</strong><p>Account {{ recordToEdit()?.accountCode }} updated.</p> } @else { <strong>Account created</strong><p>{{ accountName }} added to the chart of accounts.</p> }
              </div>
            } @else {
              @switch (tab()) {
                @case (1) { <p class="mm-sec">Account</p><div class="mm-grid">
                  <label class="mf"><span>Account code <i>*</i></span><input type="text" [(ngModel)]="accountCode" [readonly]="isEdit()" [class.mf--locked]="isEdit()" placeholder="4000"></label>
                  <label class="mf mf--2"><span>Account name <i>*</i></span><input type="text" [(ngModel)]="accountName" placeholder="Service Revenue — Professional"></label>
                  <label class="mf"><span>Type <i>*</i></span><select [(ngModel)]="accountType" [disabled]="systemLocked()" [class.mf--locked]="systemLocked()"><option value="">—</option><option>Asset</option><option>Liability</option><option>Equity</option><option>Revenue</option><option>Expense</option></select></label>
                  <label class="mf"><span>Normal balance <i>*</i></span><select [(ngModel)]="normalBalance" [disabled]="systemLocked()" [class.mf--locked]="systemLocked()"><option value="">—</option><option>Debit</option><option>Credit</option></select></label>
                </div>
                  @if (systemLocked()) { <p class="mm-hint">🔒 Type and normal balance are locked on system accounts to protect AR, revenue and financial statements. You can still edit name, description, status and notes.</p> }
                }
                @case (2) { <p class="mm-sec">Classification</p><div class="mm-grid">
                  <label class="mf"><span>Sub-type</span><input type="text" [(ngModel)]="subType" placeholder="Operating revenue"></label>
                  <label class="mf"><span>Category</span><input type="text" [(ngModel)]="category" placeholder="Patient services"></label>
                </div> }
                @case (3) { <p class="mm-sec">Posting rules</p><div class="mm-grid">
                  <label class="mf mf--check"><input type="checkbox" [(ngModel)]="allowManualPosting" [disabled]="systemLocked()"> Allow manual posting</label>
                  <label class="mf mf--check"><input type="checkbox" [(ngModel)]="requireDepartment"> Require department</label>
                  <label class="mf"><span>Default department</span><input type="text" [(ngModel)]="defaultDepartment"></label>
                </div> }
                @case (4) { <p class="mm-sec">Tax / reporting</p><div class="mm-grid">
                  <label class="mf"><span>Tax code</span><input type="text" [(ngModel)]="taxCode"></label>
                  <label class="mf"><span>Reporting category</span><input type="text" [(ngModel)]="reportingCategory" placeholder="Net patient revenue"></label>
                  <label class="mf"><span>Statement line</span><input type="text" [(ngModel)]="statementLine"></label>
                </div> }
                @case (5) { <p class="mm-sec">System protection</p><div class="mm-grid">
                  <label class="mf mf--check"><input type="checkbox" [(ngModel)]="systemAccount" [disabled]="isEdit()"> System account (core)</label>
                  <div class="mf mf--full"><span>Protection</span><p class="mm-hint">{{ systemAccount ? 'Code, type and normal balance are protected from edits once set. Only name, classification, description, status and notes can change.' : 'Standard account — all fields editable.' }}</p></div>
                </div> }
                @case (6) { <p class="mm-sec">Status &amp; notes</p><div class="mm-grid">
                  <label class="mf mf--check"><input type="checkbox" [(ngModel)]="active"> Active</label>
                  <label class="mf mf--full"><span>Description</span><input type="text" [(ngModel)]="description"></label>
                  <label class="mf mf--full"><span>Notes</span><textarea rows="3" [(ngModel)]="notes"></textarea></label>
                </div> }
              }
            }
          </div>
        </div>
        <footer class="mm-foot">
          <button class="mm-btn" type="button" [disabled]="tab() === 1" (click)="tab.set(tab() - 1)">← Previous</button>
          <span class="mm-foot__ind">{{ tab() }} / 6 · {{ currentLabel }}</span>
          @if (tab() < 6) { <button class="mm-btn mm-btn--next" type="button" (click)="tab.set(tab() + 1)">Next →</button> }
          @else { <button class="mm-btn mm-btn--submit" type="button" [disabled]="!canSubmit || saving()" (click)="submit()">@if (isEdit()) { {{ saving() ? 'Saving…' : 'Save changes' }} } @else { {{ saving() ? 'Creating…' : 'Create account' }} }</button> }
          <button class="mm-btn mm-btn--cancel" type="button" (click)="cancel()">Cancel</button>
        </footer>
      </div>
    }
  `,
})
export class GLAccountModalComponent {
  private readonly store = inject(EnterpriseStoreService);
  readonly open = input(false);
  readonly recordToEdit = input<GLAccountRecord | null>(null);
  readonly closed = output<void>();

  protected readonly isEdit = signal(false);
  protected readonly tabs = TABS;
  protected readonly tab = signal(1);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);

  protected accountCode = ''; protected accountName = ''; protected accountType = ''; protected normalBalance = '';
  protected subType = ''; protected category = '';
  protected allowManualPosting = false; protected requireDepartment = false; protected defaultDepartment = '';
  protected taxCode = ''; protected reportingCategory = ''; protected statementLine = '';
  protected systemAccount = false; protected active = true; protected description = ''; protected notes = '';

  /** System accounts lock code/type/normal-balance once they exist. */
  protected readonly systemLocked = computed(() => this.isEdit() && !!this.recordToEdit()?.systemAccount);

  constructor() {
    effect(() => { const r = this.recordToEdit(); if (r) { this.isEdit.set(true); this.populate(r); } else { this.isEdit.set(false); } });
  }
  private populate(r: GLAccountRecord): void {
    this.accountCode = r.accountCode; this.accountName = r.accountName; this.accountType = r.accountType ?? ''; this.normalBalance = r.normalBalance ?? '';
    this.subType = r.subType ?? ''; this.category = r.category ?? '';
    this.allowManualPosting = r.allowManualPosting ?? false; this.requireDepartment = r.requireDepartment ?? false; this.defaultDepartment = r.defaultDepartment ?? '';
    this.taxCode = r.taxCode ?? ''; this.reportingCategory = r.reportingCategory ?? ''; this.statementLine = r.statementLine ?? '';
    this.systemAccount = r.systemAccount ?? false; this.active = r.active ?? true; this.description = r.description ?? ''; this.notes = r.notes ?? ''; this.tab.set(1);
  }
  protected get currentLabel(): string { return TABS.find(t => t.num === this.tab())?.label ?? ''; }
  protected get canSubmit(): boolean { return !!this.accountName.trim() && !!this.accountCode.trim() && !!this.accountType && !!this.normalBalance; }

  protected submit(): void {
    if (!this.canSubmit || this.saving()) return;
    this.saving.set(true);
    const prev = this.recordToEdit();
    // System accounts: never let protected fields change, even if tampered.
    const accountType = this.systemLocked() ? prev!.accountType : (this.accountType as GLAccountRecord['accountType']);
    const normalBalance = this.systemLocked() ? prev!.normalBalance : (this.normalBalance as GLAccountRecord['normalBalance']);
    const fields = {
      accountName: this.accountName.trim(), accountType, normalBalance,
      subType: this.subType.trim(), category: this.category.trim(),
      allowManualPosting: this.systemLocked() ? prev!.allowManualPosting : this.allowManualPosting,
      requireDepartment: this.requireDepartment, defaultDepartment: this.defaultDepartment.trim(),
      taxCode: this.taxCode.trim(), reportingCategory: this.reportingCategory.trim(), statementLine: this.statementLine.trim(),
      active: this.active, description: this.description.trim(), notes: this.notes.trim(), updatedOn: new Date().toISOString().slice(0, 10),
    };
    if (this.isEdit() && prev) {
      this.store.updateGLAccount({ ...prev, ...fields });
    } else {
      const clinicId = this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park';
      this.store.createGLAccount({ id: `gl-${this.accountCode.trim()}`, clinicId, accountCode: this.accountCode.trim(), systemAccount: this.systemAccount, createdOn: new Date().toISOString().slice(0, 10), ...fields });
    }
    this.saving.set(false); this.submitted.set(true);
    setTimeout(() => this.reset(), 1500);
  }
  protected cancel(): void { this.reset(); }
  private reset(): void {
    this.tab.set(1); this.submitted.set(false); this.saving.set(false);
    this.accountCode = ''; this.accountName = ''; this.accountType = ''; this.normalBalance = '';
    this.subType = ''; this.category = '';
    this.allowManualPosting = false; this.requireDepartment = false; this.defaultDepartment = '';
    this.taxCode = ''; this.reportingCategory = ''; this.statementLine = '';
    this.systemAccount = false; this.active = true; this.description = ''; this.notes = '';
    this.closed.emit();
  }
}
