import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ReferralRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

const TABS = [
  { num: 1, label: 'Referral Info' }, { num: 2, label: 'Patient / Source' }, { num: 3, label: 'Provider Routing' },
  { num: 4, label: 'Authorization / Insurance' }, { num: 5, label: 'Clinical Reason' }, { num: 6, label: 'Status / Notes' },
];

@Component({
  selector: 'app-referral-modal',
  imports: [FormsModule],
  styleUrl: './maintenance-modal.scss',
  template: `
    @if (open()) {
      <div class="mm-overlay" (click)="cancel()"></div>
      <div class="mm-panel" role="dialog" [attr.aria-label]="isEdit() ? 'Edit referral' : 'New referral'">
        <header class="mm-head"><span class="mm-eyebrow">Clinical · Referrals</span>
          <button class="mm-x" type="button" (click)="cancel()" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
        </header>
        <div class="mm-title-row">
          <h1 class="mm-title">@if (isEdit()) { Edit referral<span class="mm-title__name"> · {{ patient || recordToEdit()?.patient || recordToEdit()?.referralNumber }}</span> } @else { New referral }</h1>
          @if (isEdit()) { <span class="mm-locked">{{ recordToEdit()?.referralNumber }} · locked</span> }
        </div>
        <div class="mm-body">
          <nav class="mm-rail">@for (t of tabs; track t.num) { <button class="mm-railitem" [class.mm-railitem--on]="tab() === t.num" type="button" (click)="tab.set(t.num)"><span class="mm-railnum">{{ t.num < 10 ? '0' + t.num : t.num }}</span>{{ t.label }}</button> }</nav>
          <div class="mm-content">
            @if (submitted()) {
              <div class="mm-success"><div class="mm-success__ic">✓</div>
                @if (isEdit()) { <strong>Changes saved</strong><p>Referral {{ recordToEdit()?.referralNumber }} updated.</p> } @else { <strong>Referral created</strong><p>Referral logged for {{ patient || 'patient' }}.</p> }
              </div>
            } @else {
              @switch (tab()) {
                @case (1) { <p class="mm-sec">Referral information</p><div class="mm-grid">
                  <label class="mf"><span>Referral number</span><input type="text" [value]="isEdit() ? recordToEdit()?.referralNumber : 'Auto on save'" readonly class="mf--locked"></label>
                  <label class="mf"><span>Status <i>*</i></span><select [(ngModel)]="status"><option value="">—</option><option>New</option><option>Pending</option><option>Scheduled</option><option>Completed</option><option>Declined</option><option>Expired</option></select></label>
                  <label class="mf"><span>Priority</span><select [(ngModel)]="priority"><option value="">—</option><option>Routine</option><option>Today</option><option>Urgent</option><option>STAT</option></select></label>
                </div> }
                @case (2) { <p class="mm-sec">Patient &amp; referral source</p><div class="mm-grid">
                  <label class="mf"><span>Patient <i>*</i></span><input type="text" [(ngModel)]="patient" placeholder="Patient name"></label>
                  <label class="mf"><span>Patient MRN</span><input type="text" [(ngModel)]="patientMrn"></label>
                  <label class="mf"><span>Referral source <i>*</i></span><input type="text" [(ngModel)]="referralSource" placeholder="Referring provider / practice"></label>
                  <label class="mf"><span>Referring provider</span><input type="text" [(ngModel)]="referringProvider"></label>
                  <label class="mf"><span>Referring practice</span><input type="text" [(ngModel)]="referringPractice"></label>
                  <label class="mf"><span>Source phone</span><input type="text" [(ngModel)]="sourcePhone"></label>
                </div> }
                @case (3) { <p class="mm-sec">Provider routing</p><div class="mm-grid">
                  <label class="mf"><span>Route to provider</span><select [(ngModel)]="toProvider"><option value="">—</option>@for (p of providers(); track p.id) { <option [value]="p.displayName">{{ p.displayName }}</option> }</select></label>
                  <label class="mf"><span>Location</span><select [(ngModel)]="toLocation"><option value="">—</option>@for (l of locations(); track l.id) { <option [value]="l.name">{{ l.name }}</option> }</select></label>
                  <label class="mf"><span>Specialty</span><input type="text" [(ngModel)]="specialty"></label>
                </div> }
                @case (4) { <p class="mm-sec">Authorization &amp; insurance</p><div class="mm-grid">
                  <label class="mf mf--check"><input type="checkbox" [(ngModel)]="authRequired"> Authorization required</label>
                  <label class="mf"><span>Auth number</span><input type="text" [(ngModel)]="authNumber"></label>
                  <label class="mf"><span>Insurance</span><select [(ngModel)]="insurance"><option value="">—</option>@for (i of payers(); track i.id) { <option [value]="i.payerName">{{ i.payerName }}</option> }</select></label>
                  <label class="mf"><span>Valid from</span><input type="date" [(ngModel)]="validFrom"></label>
                  <label class="mf"><span>Valid to</span><input type="date" [(ngModel)]="validTo"></label>
                  <label class="mf"><span>Visits authorized</span><input type="text" [(ngModel)]="visitsAuthorized" placeholder="3"></label>
                </div> }
                @case (5) { <p class="mm-sec">Clinical reason</p><div class="mm-grid">
                  <label class="mf mf--2"><span>Reason for referral</span><input type="text" [(ngModel)]="reason"></label>
                  <label class="mf"><span>Diagnosis (ICD-10)</span><input type="text" [(ngModel)]="diagnosis" placeholder="H40.11"></label>
                  <label class="mf mf--full"><span>Clinical notes</span><textarea rows="3" [(ngModel)]="clinicalNotes"></textarea></label>
                </div> }
                @case (6) { <p class="mm-sec">Status &amp; notes</p><div class="mm-grid">
                  <label class="mf mf--check"><input type="checkbox" [(ngModel)]="active"> Active referral</label>
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
          @else { <button class="mm-btn mm-btn--submit" type="button" [disabled]="!canSubmit || saving()" (click)="submit()">@if (isEdit()) { {{ saving() ? 'Saving…' : 'Save changes' }} } @else { {{ saving() ? 'Creating…' : 'Create referral' }} }</button> }
          <button class="mm-btn mm-btn--cancel" type="button" (click)="cancel()">Cancel</button>
        </footer>
      </div>
    }
  `,
})
export class ReferralModalComponent {
  private readonly store = inject(EnterpriseStoreService);
  readonly open = input(false);
  readonly recordToEdit = input<ReferralRecord | null>(null);
  readonly closed = output<void>();
  protected readonly providers = this.store.providersList;
  protected readonly locations = this.store.locationsList;
  protected readonly payers = this.store.insurancePayers;

  protected readonly isEdit = signal(false);
  protected readonly tabs = TABS;
  protected readonly tab = signal(1);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);

  protected patient = ''; protected patientMrn = ''; protected referralSource = ''; protected referringProvider = ''; protected referringPractice = ''; protected sourcePhone = '';
  protected toProvider = ''; protected toLocation = ''; protected specialty = '';
  protected authRequired = false; protected authNumber = ''; protected insurance = ''; protected validFrom = ''; protected validTo = ''; protected visitsAuthorized = '';
  protected reason = ''; protected diagnosis = ''; protected clinicalNotes = '';
  protected status = 'New'; protected priority = 'Routine'; protected active = true; protected notes = '';

  constructor() {
    effect(() => { const r = this.recordToEdit(); if (r) { this.isEdit.set(true); this.populate(r); } else { this.isEdit.set(false); } });
  }
  private populate(r: ReferralRecord): void {
    this.patient = r.patient ?? ''; this.patientMrn = r.patientMrn ?? ''; this.referralSource = r.referralSource ?? ''; this.referringProvider = r.referringProvider ?? ''; this.referringPractice = r.referringPractice ?? ''; this.sourcePhone = r.sourcePhone ?? '';
    this.toProvider = r.toProvider ?? ''; this.toLocation = r.toLocation ?? ''; this.specialty = r.specialty ?? '';
    this.authRequired = r.authRequired ?? false; this.authNumber = r.authNumber ?? ''; this.insurance = r.insurance ?? ''; this.validFrom = r.validFrom ?? ''; this.validTo = r.validTo ?? ''; this.visitsAuthorized = r.visitsAuthorized ?? '';
    this.reason = r.reason ?? ''; this.diagnosis = r.diagnosis ?? ''; this.clinicalNotes = r.clinicalNotes ?? '';
    this.status = r.status ?? 'New'; this.priority = r.priority ?? 'Routine'; this.active = r.active ?? true; this.notes = r.notes ?? ''; this.tab.set(1);
  }
  protected get currentLabel(): string { return TABS.find(t => t.num === this.tab())?.label ?? ''; }
  protected get canSubmit(): boolean { return !!this.patient.trim() && !!this.referralSource.trim() && !!this.status; }

  protected submit(): void {
    if (!this.canSubmit || this.saving()) return;
    this.saving.set(true);
    const fields = {
      patient: this.patient.trim(), patientMrn: this.patientMrn.trim(), referralSource: this.referralSource.trim(), referringProvider: this.referringProvider.trim(), referringPractice: this.referringPractice.trim(), sourcePhone: this.sourcePhone.trim(),
      toProvider: this.toProvider, toLocation: this.toLocation, specialty: this.specialty.trim(),
      authRequired: this.authRequired, authNumber: this.authNumber.trim(), insurance: this.insurance, validFrom: this.validFrom, validTo: this.validTo, visitsAuthorized: this.visitsAuthorized.trim(),
      reason: this.reason.trim(), diagnosis: this.diagnosis.trim(), clinicalNotes: this.clinicalNotes.trim(),
      status: this.status, priority: this.priority, active: this.active, notes: this.notes.trim(), updatedOn: new Date().toISOString().slice(0, 10),
    };
    if (this.isEdit() && this.recordToEdit()) {
      this.store.updateReferral({ ...this.recordToEdit()!, ...fields });
    } else {
      const clinicId = this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park';
      this.store.createReferral({ id: `ref-${Date.now()}`, clinicId, referralNumber: `REF-${String(Date.now()).slice(-6)}`, createdOn: new Date().toISOString().slice(0, 10), ...fields });
    }
    this.saving.set(false); this.submitted.set(true);
    setTimeout(() => this.reset(), 1500);
  }
  protected cancel(): void { this.reset(); }
  private reset(): void {
    this.tab.set(1); this.submitted.set(false); this.saving.set(false);
    this.patient = ''; this.patientMrn = ''; this.referralSource = ''; this.referringProvider = ''; this.referringPractice = ''; this.sourcePhone = '';
    this.toProvider = ''; this.toLocation = ''; this.specialty = '';
    this.authRequired = false; this.authNumber = ''; this.insurance = ''; this.validFrom = ''; this.validTo = ''; this.visitsAuthorized = '';
    this.reason = ''; this.diagnosis = ''; this.clinicalNotes = '';
    this.status = 'New'; this.priority = 'Routine'; this.active = true; this.notes = '';
    this.closed.emit();
  }
}
