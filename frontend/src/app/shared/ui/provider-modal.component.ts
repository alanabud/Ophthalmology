import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ProviderRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

const TABS = [
  { num: 1, label: 'Identity' }, { num: 2, label: 'Credentials' }, { num: 3, label: 'Specialty / Role' },
  { num: 4, label: 'Schedule Defaults' }, { num: 5, label: 'Billing / NPI' }, { num: 6, label: 'Status / Notes' },
];

@Component({
  selector: 'app-provider-modal',
  imports: [FormsModule],
  styleUrl: './maintenance-modal.scss',
  template: `
    @if (open()) {
      <div class="mm-overlay" (click)="cancel()"></div>
      <div class="mm-panel" role="dialog" [attr.aria-label]="isEdit() ? 'Edit provider' : 'New provider'">
        <header class="mm-head"><span class="mm-eyebrow">Practice · Providers</span>
          <button class="mm-x" type="button" (click)="cancel()" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
        </header>
        <div class="mm-title-row">
          <h1 class="mm-title">@if (isEdit()) { Edit provider<span class="mm-title__name"> · {{ displayName || recordToEdit()?.displayName }}</span> } @else { New provider }</h1>
          @if (isEdit()) { <span class="mm-locked">{{ recordToEdit()?.id }}@if (recordToEdit()?.npi) { · NPI {{ recordToEdit()?.npi }} } · locked</span> }
        </div>
        <div class="mm-body">
          <nav class="mm-rail">@for (t of tabs; track t.num) { <button class="mm-railitem" [class.mm-railitem--on]="tab() === t.num" type="button" (click)="tab.set(t.num)"><span class="mm-railnum">{{ t.num < 10 ? '0' + t.num : t.num }}</span>{{ t.label }}</button> }</nav>
          <div class="mm-content">
            @if (submitted()) {
              <div class="mm-success"><div class="mm-success__ic">✓</div>
                @if (isEdit()) { <strong>Changes saved</strong><p>{{ displayName }} provider record updated.</p> } @else { <strong>Provider created</strong><p>{{ displayName }} added to the provider directory.</p> }
              </div>
            } @else {
              @switch (tab()) {
                @case (1) { <p class="mm-sec">Provider identity</p><div class="mm-grid">
                  <label class="mf mf--2"><span>Display name <i>*</i></span><input type="text" [(ngModel)]="displayName" placeholder="Dr. Alina Cho"></label>
                  <label class="mf"><span>Provider ID</span><input type="text" [value]="isEdit() ? recordToEdit()?.id : 'Auto on save'" readonly class="mf--locked"></label>
                  <label class="mf"><span>First name</span><input type="text" [(ngModel)]="firstName"></label>
                  <label class="mf"><span>Last name</span><input type="text" [(ngModel)]="lastName"></label>
                  <label class="mf"><span>Credentials</span><input type="text" [(ngModel)]="credentials" placeholder="MD / OD / COA"></label>
                </div> }
                @case (2) { <p class="mm-sec">Credentials &amp; licensing</p><div class="mm-grid">
                  <label class="mf"><span>NPI <i>*</i></span><input type="text" [(ngModel)]="npi" [readonly]="isEdit()" [class.mf--locked]="isEdit()" placeholder="10-digit NPI"></label>
                  <label class="mf"><span>License number</span><input type="text" [(ngModel)]="licenseNumber"></label>
                  <label class="mf"><span>DEA number</span><input type="text" [(ngModel)]="deaNumber"></label>
                  <label class="mf"><span>Taxonomy</span><input type="text" [(ngModel)]="taxonomy" placeholder="207W…"></label>
                </div> }
                @case (3) { <p class="mm-sec">Specialty &amp; role</p><div class="mm-grid">
                  <label class="mf"><span>Specialty</span><input type="text" [(ngModel)]="specialty" placeholder="Glaucoma / Retina / …"></label>
                  <label class="mf"><span>Role</span><select [(ngModel)]="role"><option value="">—</option><option>Physician</option><option>OD</option><option>Technician</option><option>Billing</option><option>Scheduler</option><option>Admin</option></select></label>
                  <label class="mf"><span>Default location</span><select [(ngModel)]="defaultLocation"><option value="">—</option>@for (l of locations(); track l.id) { <option [value]="l.name">{{ l.name }}</option> }</select></label>
                </div> }
                @case (4) { <p class="mm-sec">Schedule defaults</p><div class="mm-grid">
                  <label class="mf"><span>Default start</span><input type="time" [(ngModel)]="defaultStartTime"></label>
                  <label class="mf"><span>Default end</span><input type="time" [(ngModel)]="defaultEndTime"></label>
                  <label class="mf"><span>Slot length (min)</span><input type="text" [(ngModel)]="slotMinutes" placeholder="20"></label>
                  <label class="mf"><span>Working days</span><input type="text" [(ngModel)]="workingDays" placeholder="Mon–Fri"></label>
                </div> }
                @case (5) { <p class="mm-sec">Billing flags</p><div class="mm-grid">
                  <label class="mf mf--check"><input type="checkbox" [(ngModel)]="billingProvider"> Billing provider</label>
                  <label class="mf mf--check"><input type="checkbox" [(ngModel)]="renderingProvider"> Rendering provider</label>
                  <label class="mf mf--check"><input type="checkbox" [(ngModel)]="referringProvider"> Referring provider</label>
                </div> }
                @case (6) { <p class="mm-sec">Status &amp; notes</p><div class="mm-grid">
                  <label class="mf"><span>Phone</span><input type="text" [(ngModel)]="phone"></label>
                  <label class="mf mf--2"><span>Email</span><input type="email" [(ngModel)]="email"></label>
                  <label class="mf mf--check"><input type="checkbox" [(ngModel)]="active"> Active</label>
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
          @else { <button class="mm-btn mm-btn--submit" type="button" [disabled]="!canSubmit || saving()" (click)="submit()">@if (isEdit()) { {{ saving() ? 'Saving…' : 'Save changes' }} } @else { {{ saving() ? 'Creating…' : 'Create provider' }} }</button> }
          <button class="mm-btn mm-btn--cancel" type="button" (click)="cancel()">Cancel</button>
        </footer>
      </div>
    }
  `,
})
export class ProviderModalComponent {
  private readonly store = inject(EnterpriseStoreService);
  readonly open = input(false);
  readonly recordToEdit = input<ProviderRecord | null>(null);
  readonly closed = output<void>();
  protected readonly locations = this.store.locationsList;

  protected readonly isEdit = signal(false);
  protected readonly tabs = TABS;
  protected readonly tab = signal(1);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);

  protected displayName = ''; protected firstName = ''; protected lastName = ''; protected credentials = ''; protected npi = '';
  protected licenseNumber = ''; protected deaNumber = ''; protected taxonomy = '';
  protected specialty = ''; protected role = ''; protected defaultLocation = '';
  protected defaultStartTime = ''; protected defaultEndTime = ''; protected slotMinutes = ''; protected workingDays = '';
  protected billingProvider = false; protected renderingProvider = false; protected referringProvider = false;
  protected phone = ''; protected email = ''; protected active = true; protected notes = '';

  constructor() {
    effect(() => { const r = this.recordToEdit(); if (r) { this.isEdit.set(true); this.populate(r); } else { this.isEdit.set(false); } });
  }
  private populate(r: ProviderRecord): void {
    this.displayName = r.displayName; this.firstName = r.firstName ?? ''; this.lastName = r.lastName ?? ''; this.credentials = r.credentials ?? ''; this.npi = r.npi ?? '';
    this.licenseNumber = r.licenseNumber ?? ''; this.deaNumber = r.deaNumber ?? ''; this.taxonomy = r.taxonomy ?? '';
    this.specialty = r.specialty ?? ''; this.role = r.role ?? ''; this.defaultLocation = r.defaultLocation ?? '';
    this.defaultStartTime = r.defaultStartTime ?? ''; this.defaultEndTime = r.defaultEndTime ?? ''; this.slotMinutes = r.slotMinutes ?? ''; this.workingDays = r.workingDays ?? '';
    this.billingProvider = r.billingProvider ?? false; this.renderingProvider = r.renderingProvider ?? false; this.referringProvider = r.referringProvider ?? false;
    this.phone = r.phone ?? ''; this.email = r.email ?? ''; this.active = r.active ?? true; this.notes = r.notes ?? ''; this.tab.set(1);
  }
  protected get currentLabel(): string { return TABS.find(t => t.num === this.tab())?.label ?? ''; }
  protected get canSubmit(): boolean { return !!this.displayName.trim() && !!this.npi.trim(); }

  protected submit(): void {
    if (!this.canSubmit || this.saving()) return;
    this.saving.set(true);
    const fields = {
      displayName: this.displayName.trim(), firstName: this.firstName.trim(), lastName: this.lastName.trim(), credentials: this.credentials.trim(),
      licenseNumber: this.licenseNumber.trim(), deaNumber: this.deaNumber.trim(), taxonomy: this.taxonomy.trim(),
      specialty: this.specialty.trim(), role: (this.role || undefined) as ProviderRecord['role'], defaultLocation: this.defaultLocation,
      defaultStartTime: this.defaultStartTime, defaultEndTime: this.defaultEndTime, slotMinutes: this.slotMinutes.trim(), workingDays: this.workingDays.trim(),
      billingProvider: this.billingProvider, renderingProvider: this.renderingProvider, referringProvider: this.referringProvider,
      phone: this.phone.trim(), email: this.email.trim(), active: this.active, notes: this.notes.trim(), updatedOn: new Date().toISOString().slice(0, 10),
    };
    if (this.isEdit() && this.recordToEdit()) {
      this.store.updateProvider({ ...this.recordToEdit()!, ...fields });
    } else {
      const clinicId = this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park';
      this.store.createProvider({ id: `prov-${Date.now()}`, clinicId, npi: this.npi.trim(), createdOn: new Date().toISOString().slice(0, 10), ...fields });
    }
    this.saving.set(false); this.submitted.set(true);
    setTimeout(() => this.reset(), 1500);
  }
  protected cancel(): void { this.reset(); }
  private reset(): void {
    this.tab.set(1); this.submitted.set(false); this.saving.set(false);
    this.displayName = ''; this.firstName = ''; this.lastName = ''; this.credentials = ''; this.npi = '';
    this.licenseNumber = ''; this.deaNumber = ''; this.taxonomy = '';
    this.specialty = ''; this.role = ''; this.defaultLocation = '';
    this.defaultStartTime = ''; this.defaultEndTime = ''; this.slotMinutes = ''; this.workingDays = '';
    this.billingProvider = false; this.renderingProvider = false; this.referringProvider = false;
    this.phone = ''; this.email = ''; this.active = true; this.notes = '';
    this.closed.emit();
  }
}
