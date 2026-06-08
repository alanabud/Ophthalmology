import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { LocationRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

const TABS = [
  { num: 1, label: 'Location' }, { num: 2, label: 'Address' }, { num: 3, label: 'Operating Hours' },
  { num: 4, label: 'Rooms / Resources' }, { num: 5, label: 'Billing / Facility' }, { num: 6, label: 'Status / Notes' },
];

@Component({
  selector: 'app-location-modal',
  imports: [FormsModule],
  styleUrl: './maintenance-modal.scss',
  template: `
    @if (open()) {
      <div class="mm-overlay" (click)="cancel()"></div>
      <div class="mm-panel" role="dialog" [attr.aria-label]="isEdit() ? 'Edit location' : 'New location'">
        <header class="mm-head"><span class="mm-eyebrow">Practice · Locations</span>
          <button class="mm-x" type="button" (click)="cancel()" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
        </header>
        <div class="mm-title-row">
          <h1 class="mm-title">@if (isEdit()) { Edit location<span class="mm-title__name"> · {{ name || recordToEdit()?.name }}</span> } @else { New location }</h1>
          @if (isEdit()) { <span class="mm-locked">{{ recordToEdit()?.id }} · locked</span> }
        </div>
        <div class="mm-body">
          <nav class="mm-rail">@for (t of tabs; track t.num) { <button class="mm-railitem" [class.mm-railitem--on]="tab() === t.num" type="button" (click)="tab.set(t.num)"><span class="mm-railnum">{{ t.num < 10 ? '0' + t.num : t.num }}</span>{{ t.label }}</button> }</nav>
          <div class="mm-content">
            @if (submitted()) {
              <div class="mm-success"><div class="mm-success__ic">✓</div>
                @if (isEdit()) { <strong>Changes saved</strong><p>{{ name }} location record updated.</p> } @else { <strong>Location created</strong><p>{{ name }} added to the location list.</p> }
              </div>
            } @else {
              @switch (tab()) {
                @case (1) { <p class="mm-sec">Location</p><div class="mm-grid">
                  <label class="mf mf--2"><span>Location name <i>*</i></span><input type="text" [(ngModel)]="name" placeholder="Winter Park Main"></label>
                  <label class="mf"><span>Location ID</span><input type="text" [value]="isEdit() ? recordToEdit()?.id : 'Auto on save'" readonly class="mf--locked"></label>
                  <label class="mf"><span>Type</span><select [(ngModel)]="type"><option value="">—</option><option>Clinic</option><option>Surgery Center</option><option>Optical</option><option>Admin</option><option>Imaging</option></select></label>
                  <label class="mf"><span>Time zone</span><input type="text" [(ngModel)]="timeZone" placeholder="America/New_York"></label>
                </div> }
                @case (2) { <p class="mm-sec">Address</p><div class="mm-grid">
                  <label class="mf mf--2"><span>Street</span><input type="text" [(ngModel)]="address"></label>
                  <label class="mf"><span>Phone</span><input type="text" [(ngModel)]="phone"></label>
                  <label class="mf"><span>City</span><input type="text" [(ngModel)]="city"></label>
                  <label class="mf"><span>State</span><input type="text" maxlength="2" [(ngModel)]="state"></label>
                  <label class="mf"><span>ZIP</span><input type="text" [(ngModel)]="zip"></label>
                </div> }
                @case (3) { <p class="mm-sec">Operating hours &amp; capacity</p><div class="mm-grid">
                  <label class="mf mf--2"><span>Hours</span><input type="text" [(ngModel)]="hours" placeholder="Mon–Fri 8:00–17:00"></label>
                  <label class="mf"><span>Default capacity</span><input type="text" [(ngModel)]="defaultCapacity" placeholder="60"></label>
                </div> }
                @case (4) { <p class="mm-sec">Rooms / resources</p><div class="mm-grid">
                  <label class="mf mf--full"><span>Rooms (comma-separated)</span><input type="text" [(ngModel)]="rooms" placeholder="Exam 1, Exam 2, Imaging A"></label>
                </div> }
                @case (5) { <p class="mm-sec">Billing / facility</p><div class="mm-grid">
                  <label class="mf"><span>Facility NPI</span><input type="text" [(ngModel)]="facilityNpi"></label>
                  <label class="mf"><span>Tax ID</span><input type="text" [(ngModel)]="taxId"></label>
                  <label class="mf"><span>Place of service</span><input type="text" [(ngModel)]="placeOfService" placeholder="11 — Office"></label>
                </div> }
                @case (6) { <p class="mm-sec">Status &amp; notes</p><div class="mm-grid">
                  <label class="mf mf--check"><input type="checkbox" [(ngModel)]="active"> Active location</label>
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
          @else { <button class="mm-btn mm-btn--submit" type="button" [disabled]="!canSubmit || saving()" (click)="submit()">@if (isEdit()) { {{ saving() ? 'Saving…' : 'Save changes' }} } @else { {{ saving() ? 'Creating…' : 'Create location' }} }</button> }
          <button class="mm-btn mm-btn--cancel" type="button" (click)="cancel()">Cancel</button>
        </footer>
      </div>
    }
  `,
})
export class LocationModalComponent {
  private readonly store = inject(EnterpriseStoreService);
  readonly open = input(false);
  readonly recordToEdit = input<LocationRecord | null>(null);
  readonly closed = output<void>();

  protected readonly isEdit = signal(false);
  protected readonly tabs = TABS;
  protected readonly tab = signal(1);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);

  protected name = ''; protected type = ''; protected timeZone = '';
  protected address = ''; protected phone = ''; protected city = ''; protected state = ''; protected zip = '';
  protected hours = ''; protected defaultCapacity = ''; protected rooms = '';
  protected facilityNpi = ''; protected taxId = ''; protected placeOfService = '';
  protected active = true; protected notes = '';

  constructor() {
    effect(() => { const r = this.recordToEdit(); if (r) { this.isEdit.set(true); this.populate(r); } else { this.isEdit.set(false); } });
  }
  private populate(r: LocationRecord): void {
    this.name = r.name; this.type = r.type ?? ''; this.timeZone = r.timeZone ?? '';
    this.address = r.address ?? ''; this.phone = r.phone ?? ''; this.city = r.city ?? ''; this.state = r.state ?? ''; this.zip = r.zip ?? '';
    this.hours = r.hours ?? ''; this.defaultCapacity = r.defaultCapacity ?? ''; this.rooms = r.rooms ?? '';
    this.facilityNpi = r.facilityNpi ?? ''; this.taxId = r.taxId ?? ''; this.placeOfService = r.placeOfService ?? '';
    this.active = r.active ?? true; this.notes = r.notes ?? ''; this.tab.set(1);
  }
  protected get currentLabel(): string { return TABS.find(t => t.num === this.tab())?.label ?? ''; }
  protected get canSubmit(): boolean { return !!this.name.trim(); }

  protected submit(): void {
    if (!this.canSubmit || this.saving()) return;
    this.saving.set(true);
    const fields = {
      name: this.name.trim(), type: (this.type || undefined) as LocationRecord['type'], timeZone: this.timeZone.trim(),
      address: this.address.trim(), phone: this.phone.trim(), city: this.city.trim(), state: this.state.trim(), zip: this.zip.trim(),
      hours: this.hours.trim(), defaultCapacity: this.defaultCapacity.trim(), rooms: this.rooms.trim(),
      facilityNpi: this.facilityNpi.trim(), taxId: this.taxId.trim(), placeOfService: this.placeOfService.trim(),
      active: this.active, notes: this.notes.trim(), updatedOn: new Date().toISOString().slice(0, 10),
    };
    if (this.isEdit() && this.recordToEdit()) {
      this.store.updateLocation({ ...this.recordToEdit()!, ...fields });
    } else {
      const clinicId = this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park';
      this.store.createLocation({ id: `loc-${Date.now()}`, clinicId, createdOn: new Date().toISOString().slice(0, 10), ...fields });
    }
    this.saving.set(false); this.submitted.set(true);
    setTimeout(() => this.reset(), 1500);
  }
  protected cancel(): void { this.reset(); }
  private reset(): void {
    this.tab.set(1); this.submitted.set(false); this.saving.set(false);
    this.name = ''; this.type = ''; this.timeZone = '';
    this.address = ''; this.phone = ''; this.city = ''; this.state = ''; this.zip = '';
    this.hours = ''; this.defaultCapacity = ''; this.rooms = '';
    this.facilityNpi = ''; this.taxId = ''; this.placeOfService = '';
    this.active = true; this.notes = '';
    this.closed.emit();
  }
}
