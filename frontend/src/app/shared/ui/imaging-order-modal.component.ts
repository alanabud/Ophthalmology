import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ImagingStudy, SurfaceTone } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

interface Tab { num: number; label: string; }
const TABS: Tab[] = [
  { num: 1, label: 'Order' },
  { num: 2, label: 'Clinical' },
  { num: 3, label: 'Protocol' },
  { num: 4, label: 'Results & Status' },
];

/**
 * Imaging Order maintenance — the SAME premium shell for create and edit.
 * mode = create | edit · initialValues = study ?? defaults · locked = [studyId, patient]
 * onSubmit = edit ? updateImagingStudy(by studyId) : createImagingStudy
 */
@Component({
  selector: 'app-imaging-order-modal',
  imports: [FormsModule],
  styleUrl: './maintenance-modal.scss',
  template: `
    @if (open()) {
      <div class="mm-overlay" (click)="cancel()"></div>
      <div class="mm-panel" role="dialog" [attr.aria-label]="isEdit() ? 'Edit imaging order' : 'New imaging order'">
        <header class="mm-head">
          <span class="mm-eyebrow">Imaging Operations</span>
          <button class="mm-x" type="button" (click)="cancel()" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
        </header>
        <div class="mm-title-row">
          <h1 class="mm-title">
            @if (isEdit()) { Edit imaging order<span class="mm-title__name"> · {{ patient || studyToEdit()?.patient }}</span> }
            @else { New imaging order }
          </h1>
          @if (isEdit()) { <span class="mm-locked">{{ studyToEdit()?.studyId }} · locked</span> }
        </div>

        <div class="mm-body">
          <nav class="mm-rail">
            @for (t of tabs; track t.num) {
              <button class="mm-railitem" [class.mm-railitem--on]="tab() === t.num" type="button" (click)="tab.set(t.num)">
                <span class="mm-railnum">{{ t.num < 10 ? '0' + t.num : t.num }}</span>{{ t.label }}
              </button>
            }
          </nav>

          <div class="mm-content">
            @if (submitted()) {
              <div class="mm-success">
                <div class="mm-success__ic">✓</div>
                @if (isEdit()) { <strong>Changes saved</strong><p>{{ patient }}'s imaging order has been updated.</p> }
                @else { <strong>Order created</strong><p>{{ patient }}'s imaging order has been queued.</p> }
              </div>
            } @else {
              @switch (tab()) {
                @case (1) {
                  <p class="mm-sec">Order details</p>
                  <div class="mm-grid">
                    <label class="mf mf--2"><span>Patient <i>*</i></span>
                      <input type="text" [(ngModel)]="patient" [readonly]="isEdit()" [class.mf--locked]="isEdit()" placeholder="Patient name"></label>
                    <label class="mf"><span>Order ID</span>
                      <input type="text" [value]="isEdit() ? studyToEdit()?.studyId : 'Auto on save'" readonly class="mf--locked"></label>
                    <label class="mf"><span>Modality <i>*</i></span>
                      <select [(ngModel)]="modality"><option value="">Select…</option>@for (m of modalities; track m) { <option [value]="m">{{ m }}</option> }</select></label>
                    <label class="mf"><span>Laterality</span>
                      <select [(ngModel)]="laterality"><option value="">—</option>@for (l of lateralities; track l) { <option [value]="l">{{ l }}</option> }</select></label>
                    <label class="mf"><span>Priority</span>
                      <select [(ngModel)]="urgency"><option value="">—</option>@for (u of urgencies; track u) { <option [value]="u">{{ u }}</option> }</select></label>
                    <label class="mf mf--2"><span>Ordering provider</span>
                      <input type="text" [(ngModel)]="orderedBy" placeholder="Dr. …"></label>
                  </div>
                }
                @case (2) {
                  <p class="mm-sec">Clinical context</p>
                  <div class="mm-grid">
                    <label class="mf mf--full"><span>Clinical indication</span>
                      <textarea rows="3" [(ngModel)]="clinicalIndication" placeholder="Reason for study / working diagnosis"></textarea></label>
                    <label class="mf mf--2"><span>Linked encounter ID</span>
                      <input type="text" [(ngModel)]="linkedEncounterId" placeholder="Encounter reference"></label>
                  </div>
                }
                @case (3) {
                  <p class="mm-sec">Protocol &amp; coding</p>
                  <div class="mm-grid">
                    <label class="mf mf--2"><span>Protocol</span><input type="text" [(ngModel)]="protocol" placeholder="e.g. Macular cube 512x128"></label>
                    <label class="mf"><span>CPT code</span><input type="text" [(ngModel)]="cptCode" placeholder="92134"></label>
                    <label class="mf"><span>Study date</span><input type="date" [(ngModel)]="studyDate"></label>
                  </div>
                }
                @case (4) {
                  <p class="mm-sec">Results &amp; status</p>
                  <div class="mm-grid">
                    <label class="mf"><span>Status</span>
                      <select [(ngModel)]="status">@for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }</select></label>
                    <label class="mf"><span>Quality score</span>
                      <select [(ngModel)]="qualityScore"><option value="">—</option><option value="Excellent">Excellent</option><option value="Good">Good</option><option value="Fair">Fair</option><option value="Poor — repeat">Poor — repeat</option></select></label>
                    <label class="mf"><span>Reported by</span><input type="text" [(ngModel)]="reportedBy" placeholder="Interpreting provider"></label>
                    <label class="mf mf--full"><span>Findings</span><textarea rows="2" [(ngModel)]="findings" placeholder="Acquisition / technical findings"></textarea></label>
                    <label class="mf mf--full"><span>Impression summary</span><textarea rows="2" [(ngModel)]="impressionSummary" placeholder="Radiologic impression"></textarea></label>
                  </div>
                }
              }
            }
          </div>
        </div>

        <footer class="mm-foot">
          <button class="mm-btn" type="button" [disabled]="tab() === 1" (click)="tab.set(tab() - 1)">← Previous</button>
          <span class="mm-foot__ind">{{ tab() }} / 4 · {{ currentLabel }}</span>
          @if (tab() < 4) {
            <button class="mm-btn mm-btn--next" type="button" (click)="tab.set(tab() + 1)">Next →</button>
          } @else {
            <button class="mm-btn mm-btn--submit" type="button" [disabled]="!canSubmit || saving()" (click)="submit()">
              @if (isEdit()) { {{ saving() ? 'Saving…' : 'Save changes' }} }
              @else { {{ saving() ? 'Creating…' : 'Create order' }} }
            </button>
          }
          <button class="mm-btn mm-btn--cancel" type="button" (click)="cancel()">Cancel</button>
        </footer>
      </div>
    }
  `,
})
export class ImagingOrderModalComponent {
  private readonly store = inject(EnterpriseStoreService);

  readonly open = input(false);
  readonly studyToEdit = input<ImagingStudy | null>(null);
  readonly closed = output<void>();

  protected readonly isEdit = signal(false);
  protected readonly tabs = TABS;
  protected readonly tab = signal(1);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);

  readonly modalities = ['OCT Macula', 'OCT Optic Nerve', 'OCT-A', 'Biometry', 'HVF 24-2', 'HVF 30-2', 'Fundus Photo', 'Fluorescein Angiography', 'ICG Angiography', 'B-scan Ultrasound', 'Corneal Topography', 'Corneal Pachymetry', 'Specular Microscopy'];
  readonly lateralities = ['OD', 'OS', 'OU'];
  readonly urgencies = ['Routine', 'Today', 'Same day', 'Urgent', 'STAT'];
  readonly statuses = ['Ordered', 'Queued', 'In progress', 'Pending review', 'Interpreted'];

  protected patient = ''; protected modality = ''; protected laterality = '';
  protected urgency = 'Routine'; protected orderedBy = '';
  protected clinicalIndication = ''; protected linkedEncounterId = '';
  protected protocol = ''; protected cptCode = ''; protected studyDate = '';
  protected status = 'Ordered'; protected findings = ''; protected impressionSummary = '';
  protected qualityScore = ''; protected reportedBy = '';

  constructor() {
    effect(() => {
      const s = this.studyToEdit();
      if (s) { this.isEdit.set(true); this.populate(s); }
      else { this.isEdit.set(false); }
    });
  }

  private populate(s: ImagingStudy): void {
    this.patient = s.patient; this.modality = s.modality; this.laterality = s.laterality ?? '';
    this.urgency = s.urgency ?? 'Routine'; this.orderedBy = s.orderedBy ?? '';
    this.clinicalIndication = s.clinicalIndication ?? ''; this.linkedEncounterId = s.linkedEncounterId ?? '';
    this.protocol = s.protocol ?? ''; this.cptCode = s.cptCode ?? ''; this.studyDate = s.studyDate ?? '';
    this.status = s.status || 'Ordered'; this.findings = s.findings ?? ''; this.impressionSummary = s.impressionSummary ?? '';
    this.qualityScore = s.qualityScore ?? ''; this.reportedBy = s.reportedBy ?? '';
    this.tab.set(1);
  }

  protected get currentLabel(): string { return TABS.find(t => t.num === this.tab())?.label ?? ''; }
  protected get canSubmit(): boolean { return !!this.patient.trim() && !!this.modality; }

  private toneFor(status: string): SurfaceTone {
    return status === 'Interpreted' ? 'success' : status === 'Pending review' ? 'warning' : status === 'In progress' ? 'info' : 'neutral';
  }

  protected submit(): void {
    if (!this.canSubmit || this.saving()) return;
    this.saving.set(true);
    const tone = this.toneFor(this.status);
    if (this.isEdit() && this.studyToEdit()) {
      this.store.updateImagingStudy({
        ...this.studyToEdit()!,
        patient: this.patient.trim(), modality: this.modality, laterality: this.laterality, urgency: this.urgency,
        orderedBy: this.orderedBy.trim() || 'Attending', clinicalIndication: this.clinicalIndication.trim(),
        linkedEncounterId: this.linkedEncounterId.trim() || undefined, protocol: this.protocol.trim(), cptCode: this.cptCode.trim(),
        studyDate: this.studyDate, status: this.status, tone, findings: this.findings.trim(),
        impressionSummary: this.impressionSummary.trim(), qualityScore: this.qualityScore, reportedBy: this.reportedBy.trim() || undefined,
      });
    } else {
      const clinicId = this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park';
      this.store.createImagingStudy({
        clinicId, patient: this.patient.trim(), modality: this.modality, studyId: `IMG-${String(Date.now()).slice(-5)}`,
        orderedBy: this.orderedBy.trim() || 'Attending', status: this.status, tone,
        findings: this.findings.trim() || 'Pending acquisition', aiSignal: 'Awaiting scan', studyDate: this.studyDate,
        laterality: this.laterality, clinicalIndication: this.clinicalIndication.trim(), urgency: this.urgency,
        protocol: this.protocol.trim(), cptCode: this.cptCode.trim(),
      });
    }
    this.saving.set(false); this.submitted.set(true);
    setTimeout(() => this.reset(), 1500);
  }

  protected cancel(): void { this.reset(); }
  private reset(): void {
    this.tab.set(1); this.submitted.set(false); this.saving.set(false);
    this.patient = ''; this.modality = ''; this.laterality = ''; this.urgency = 'Routine'; this.orderedBy = '';
    this.clinicalIndication = ''; this.linkedEncounterId = ''; this.protocol = ''; this.cptCode = ''; this.studyDate = '';
    this.status = 'Ordered'; this.findings = ''; this.impressionSummary = ''; this.qualityScore = ''; this.reportedBy = '';
    this.closed.emit();
  }
}
