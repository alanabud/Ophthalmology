import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { DocumentRecord } from '../../core/models/enterprise.models';
import { AuthStateService } from '../../core/services/auth-state.service';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

const TABS = [
  { num: 1, label: 'Identity' }, { num: 2, label: 'Linkage' }, { num: 3, label: 'File' },
  { num: 4, label: 'Classification' }, { num: 5, label: 'Privacy' }, { num: 6, label: 'Notes / Audit' },
];

@Component({
  selector: 'app-document-modal',
  imports: [FormsModule],
  styleUrl: './maintenance-modal.scss',
  template: `
    @if (open()) {
      <div class="mm-overlay" (click)="cancel()"></div>
      <div class="mm-panel" role="dialog" [attr.aria-label]="isEdit() ? 'Edit document' : 'New document'">
        <header class="mm-head"><span class="mm-eyebrow">Records · Documents</span>
          <button class="mm-x" type="button" (click)="cancel()" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
        </header>
        <div class="mm-title-row">
          <h1 class="mm-title">@if (isEdit()) { Edit document<span class="mm-title__name"> · {{ title || recordToEdit()?.title }}</span> } @else { New document }</h1>
          @if (isEdit()) { <span class="mm-locked">{{ recordToEdit()?.id }} · locked</span> }
          @if (privacyLevel !== 'Standard') { <span class="mm-locked mm-locked--sys">{{ privacyLevel }}</span> }
        </div>
        <div class="mm-body">
          <nav class="mm-rail">@for (t of tabs; track t.num) { <button class="mm-railitem" [class.mm-railitem--on]="tab() === t.num" type="button" (click)="tab.set(t.num)"><span class="mm-railnum">{{ t.num < 10 ? '0' + t.num : t.num }}</span>{{ t.label }}</button> }</nav>
          <div class="mm-content">
            @if (submitted()) {
              <div class="mm-success"><div class="mm-success__ic">✓</div>
                @if (isEdit()) { <strong>Changes saved</strong><p>{{ title }} updated.</p> } @else { <strong>Document saved</strong><p>{{ title }} stored securely.</p> }
              </div>
            } @else {
              @switch (tab()) {
                @case (1) { <p class="mm-sec">Identity</p><div class="mm-grid">
                  <label class="mf mf--2"><span>Title <i>*</i></span><input type="text" [(ngModel)]="title" placeholder="e.g. Glaucoma referral letter"></label>
                  <label class="mf"><span>Document ID</span><input type="text" [value]="isEdit() ? recordToEdit()?.id : 'Auto on save'" readonly class="mf--locked"></label>
                  <label class="mf"><span>Status</span><select [(ngModel)]="status"><option>Draft</option><option>Active</option><option>Archived</option></select></label>
                  <label class="mf"><span>Uploaded by</span><input type="text" [(ngModel)]="uploadedBy"></label>
                </div> }
                @case (2) { <p class="mm-sec">Linkage</p><div class="mm-grid">
                  <label class="mf"><span>Linked to <i>*</i></span><select [(ngModel)]="linkedEntityType"><option value="patient">Patient</option><option value="referral">Referral</option><option value="claim">Claim</option><option value="imaging">Imaging order</option><option value="provider">Provider</option><option value="location">Location</option><option value="general">General</option></select></label>
                  <label class="mf"><span>Entity ID <i>*</i></span><input type="text" [(ngModel)]="linkedEntityId" placeholder="e.g. WP-100234 / REF-100455"></label>
                  <label class="mf"><span>Patient MRN (if applicable)</span><input type="text" [(ngModel)]="patientId"></label>
                </div>
                  <p class="mm-hint">Files are stored at <code>documents/{{ linkedEntityType }}/{{ linkedEntityId || '…' }}/&#123;documentId&#125;/&#123;file&#125;</code> — never as a public URL.</p>
                }
                @case (3) { <p class="mm-sec">File</p>
                  @if (isEdit() && recordToEdit()?.fileName && !selectedFile()) {
                    <div class="doc-current">
                      <div class="doc-current__meta"><strong>{{ recordToEdit()?.fileName }}</strong><span>{{ recordToEdit()?.fileType }} · {{ fmtSize(recordToEdit()?.fileSize ?? 0) }} · {{ recordToEdit()?.uploadStatus }}</span></div>
                      <button class="mm-btn" type="button" (click)="download()">Download</button>
                    </div>
                  }
                  <div class="mm-grid">
                    <label class="mf mf--full"><span>{{ isEdit() ? 'Replace file (optional)' : 'Upload file' }} @if (!isEdit()) { <i>*</i> }</span>
                      <input type="file" (change)="onFile($event)" accept=".pdf,image/*,.doc,.docx">
                    </label>
                  </div>
                  @if (selectedFile(); as f) {
                    <div class="doc-current"><div class="doc-current__meta"><strong>{{ f.name }}</strong><span>{{ f.type || 'file' }} · {{ fmtSize(f.size) }}</span></div></div>
                  }
                  @if (previewUrl(); as url) {
                    <div class="doc-preview">
                      @if (previewIsImage()) { <img [src]="url" alt="preview"> } @else if (previewSafe(); as safe) { <iframe [src]="safe" title="preview"></iframe> }
                    </div>
                  } @else if (isEdit()) {
                    <button class="mm-btn" type="button" (click)="loadPreview()">Load preview</button>
                  }
                }
                @case (4) { <p class="mm-sec">Classification</p><div class="mm-grid">
                  <label class="mf"><span>Category <i>*</i></span><select [(ngModel)]="category"><option>Clinical</option><option>Insurance</option><option>Referral</option><option>Imaging</option><option>Billing</option><option>Consent</option><option>Administrative</option><option>Other</option></select></label>
                  <label class="mf mf--2"><span>Tags (comma-separated)</span><input type="text" [(ngModel)]="tagsText" placeholder="referral, glaucoma"></label>
                </div> }
                @case (5) { <p class="mm-sec">Privacy</p><div class="mm-grid">
                  <label class="mf"><span>Privacy level <i>*</i></span><select [(ngModel)]="privacyLevel"><option>Standard</option><option>Restricted</option><option>Confidential</option></select></label>
                </div>
                  <p class="mm-hint">🔒 Access is resolved through authenticated, token-scoped Storage reads. No public listing or anonymous file access. Confidential documents are surfaced only to authorized roles.</p>
                }
                @case (6) { <p class="mm-sec">Notes &amp; audit</p><div class="mm-grid">
                  <label class="mf mf--full"><span>Description</span><input type="text" [(ngModel)]="description"></label>
                  <label class="mf mf--full"><span>Notes</span><textarea rows="2" [(ngModel)]="notes"></textarea></label>
                </div>
                  @if (isEdit()) {
                    <div class="esec"><span class="mm-sec" style="margin-top:14px">Audit trail</span>
                      @if (audit().length) {
                        <ol class="doc-audit">@for (a of audit(); track $index) { <li><span class="doc-audit__dot"></span><div><strong>{{ a.action }}</strong><span>{{ a.at }}@if (a.by) { · {{ a.by }} }@if (a.detail) { · {{ a.detail }} }</span></div></li> }</ol>
                      } @else { <p class="mm-hint">No audit events yet.</p> }
                    </div>
                  }
                }
              }
            }
          </div>
        </div>
        <footer class="mm-foot">
          <button class="mm-btn" type="button" [disabled]="tab() === 1" (click)="tab.set(tab() - 1)">← Previous</button>
          <span class="mm-foot__ind">{{ tab() }} / 6 · {{ currentLabel }}</span>
          @if (isEdit() && recordToEdit()?.status !== 'Archived') { <button class="mm-btn mm-btn--cancel" type="button" (click)="archive()">Archive</button> }
          @if (tab() < 6) { <button class="mm-btn mm-btn--next" type="button" (click)="tab.set(tab() + 1)">Next →</button> }
          @else { <button class="mm-btn mm-btn--submit" type="button" [disabled]="!canSubmit || saving()" (click)="submit()">@if (isEdit()) { {{ saving() ? 'Saving…' : 'Save changes' }} } @else { {{ saving() ? 'Uploading…' : 'Create document' }} }</button> }
          <button class="mm-btn mm-btn--cancel" type="button" (click)="cancel()">Cancel</button>
        </footer>
      </div>
    }
  `,
})
export class DocumentModalComponent {
  private readonly store = inject(EnterpriseStoreService);
  private readonly auth = inject(AuthStateService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly open = input(false);
  readonly recordToEdit = input<DocumentRecord | null>(null);
  readonly closed = output<void>();

  protected readonly isEdit = signal(false);
  protected readonly tabs = TABS;
  protected readonly tab = signal(1);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);

  protected title = ''; protected status: DocumentRecord['status'] = 'Active'; protected uploadedBy = '';
  protected linkedEntityType: DocumentRecord['linkedEntityType'] = 'patient'; protected linkedEntityId = ''; protected patientId = '';
  protected category: DocumentRecord['category'] = 'Clinical'; protected tagsText = '';
  protected privacyLevel: DocumentRecord['privacyLevel'] = 'Standard';
  protected description = ''; protected notes = '';

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly previewSafe = signal<SafeResourceUrl | null>(null);
  protected readonly previewIsImage = signal(false);
  private setPreview(url: string, isImage: boolean): void {
    this.previewUrl.set(url); this.previewIsImage.set(isImage);
    this.previewSafe.set(isImage ? null : this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  protected readonly audit = computed(() => {
    const r = this.recordToEdit();
    return r ? (this.store.documentAudit()[r.id] ?? []) : [];
  });

  constructor() {
    effect(() => { const r = this.recordToEdit(); if (r) { this.isEdit.set(true); this.populate(r); } else { this.isEdit.set(false); } });
  }
  private populate(r: DocumentRecord): void {
    this.title = r.title; this.status = r.status; this.uploadedBy = r.uploadedBy ?? '';
    this.linkedEntityType = r.linkedEntityType; this.linkedEntityId = r.linkedEntityId; this.patientId = r.patientId ?? '';
    this.category = r.category; this.tagsText = (r.tags ?? []).join(', ');
    this.privacyLevel = r.privacyLevel; this.description = r.description ?? ''; this.notes = r.notes ?? '';
    this.selectedFile.set(null); this.clearPreview(); this.tab.set(1);
  }

  protected fmtSize(b: number): string { return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : (b / 1024).toFixed(0) + ' KB'; }
  protected get currentLabel(): string { return TABS.find(t => t.num === this.tab())?.label ?? ''; }
  protected get canSubmit(): boolean {
    const base = !!this.title.trim() && !!this.category && !!this.linkedEntityType && !!this.linkedEntityId.trim();
    return this.isEdit() ? base : base && !!this.selectedFile();
  }

  protected onFile(ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0] ?? null;
    this.clearPreview();
    this.selectedFile.set(f);
    if (f && (f.type.startsWith('image/') || f.type === 'application/pdf')) {
      this.setPreview(URL.createObjectURL(f), f.type.startsWith('image/'));
    }
  }
  protected async loadPreview(): Promise<void> {
    const r = this.recordToEdit(); if (!r) return;
    try {
      const url = await this.store.resolveDocumentUrl(r, this.auth.displayName());
      this.setPreview(url, (r.fileType || '').startsWith('image/'));
    } catch (e) { console.warn('preview failed', e); }
  }
  protected async download(): Promise<void> {
    const r = this.recordToEdit(); if (!r) return;
    try { const url = await this.store.resolveDocumentUrl(r, this.auth.displayName()); window.open(url, '_blank'); }
    catch (e) { console.warn('download failed', e); }
  }
  private clearPreview(): void { const u = this.previewUrl(); if (u && u.startsWith('blob:')) URL.revokeObjectURL(u); this.previewUrl.set(null); this.previewSafe.set(null); }

  protected async submit(): Promise<void> {
    if (!this.canSubmit || this.saving()) return;
    this.saving.set(true);
    const tags = this.tagsText.split(',').map(s => s.trim()).filter(Boolean);
    if (this.isEdit() && this.recordToEdit()) {
      await this.store.updateDocument({
        ...this.recordToEdit()!, title: this.title.trim(), status: this.status, uploadedBy: this.uploadedBy.trim(),
        linkedEntityType: this.linkedEntityType, linkedEntityId: this.linkedEntityId.trim(), patientId: this.patientId.trim() || undefined,
        category: this.category, tags, privacyLevel: this.privacyLevel, description: this.description.trim(), notes: this.notes.trim(),
      }, this.selectedFile());
    } else {
      const clinicId = this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park';
      await this.store.createDocument({
        id: `DOC-${String(Date.now()).slice(-6)}`, clinicId, title: this.title.trim(), category: this.category, status: this.status,
        linkedEntityType: this.linkedEntityType, linkedEntityId: this.linkedEntityId.trim(), patientId: this.patientId.trim() || undefined,
        uploadedBy: this.uploadedBy.trim() || this.auth.displayName(), description: this.description.trim(), tags, privacyLevel: this.privacyLevel, notes: this.notes.trim(),
      }, this.selectedFile()!);
    }
    this.saving.set(false); this.submitted.set(true);
    setTimeout(() => this.reset(), 1500);
  }

  protected archive(): void {
    const r = this.recordToEdit(); if (!r) return;
    this.store.archiveDocument(r.id, this.auth.displayName());
    this.reset();
  }

  protected cancel(): void { this.reset(); }
  private reset(): void {
    this.tab.set(1); this.submitted.set(false); this.saving.set(false);
    this.title = ''; this.status = 'Active'; this.uploadedBy = '';
    this.linkedEntityType = 'patient'; this.linkedEntityId = ''; this.patientId = '';
    this.category = 'Clinical'; this.tagsText = ''; this.privacyLevel = 'Standard'; this.description = ''; this.notes = '';
    this.clearPreview(); this.selectedFile.set(null);
    this.closed.emit();
  }
}
