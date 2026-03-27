import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ImagingStudy } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { AppModalComponent } from '../../shared/ui/app-modal.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-imaging-page',
  imports: [FormsModule, AppModalComponent, StatusChipComponent],
  templateUrl: './imaging-page.component.html',
  styleUrl: './imaging-page.component.scss'
})
export class ImagingPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly studies = this.store.imagingStudies;

  // Stats
  protected readonly orderedCount = computed(() => this.studies().filter(s => s.status === 'Ordered' || s.status === 'Queued').length);
  protected readonly readyCount = computed(() => this.studies().filter(s => s.status.toLowerCase().includes('review')).length);
  protected readonly interpretedCount = computed(() => this.studies().filter(s => s.status === 'Interpreted').length);
  protected readonly urgentCount = computed(() => this.studies().filter(s => (s.urgency ?? '') === 'Urgent' || (s.urgency ?? '') === 'Same day').length);

  // Filters
  protected readonly searchQuery = signal('');
  protected readonly modalityFilter = signal('');
  protected readonly statusFilter = signal('');

  protected readonly filteredStudies = computed(() => {
    let list = this.studies();
    const q = this.searchQuery().toLowerCase().trim();
    const m = this.modalityFilter();
    const s = this.statusFilter();
    if (q) list = list.filter(st =>
      st.patient.toLowerCase().includes(q) ||
      st.studyId.toLowerCase().includes(q) ||
      st.orderedBy.toLowerCase().includes(q) ||
      (st.clinicalIndication ?? '').toLowerCase().includes(q)
    );
    if (m) list = list.filter(st => st.modality === m);
    if (s) list = list.filter(st => st.status === s);
    return list;
  });

  // Modal state
  protected readonly selectedStudy = signal<ImagingStudy | null>(null);
  protected readonly viewOpen = signal(false);
  protected readonly reviewOpen = signal(false);
  protected readonly createOpen = signal(false);

  // Create form fields
  protected fPatient = '';
  protected fModality = '';
  protected fOrderedBy = '';
  protected fLaterality = '';
  protected fUrgency = '';
  protected fClinicalIndication = '';
  protected fProtocol = '';
  protected fCptCode = '';
  protected fStudyDate = '';

  // Review form fields
  protected fImpressionSummary = '';
  protected fReviewNotes = '';
  protected fQualityScore = '';

  readonly modalityOptions = ['OCT Macula', 'OCT Optic Nerve', 'OCT-A', 'Biometry', 'HVF 24-2', 'HVF 30-2', 'Fundus Photo', 'Fluorescein Angiography', 'ICG Angiography', 'B-scan Ultrasound', 'Corneal Topography', 'Corneal Pachymetry', 'Specular Microscopy'];
  readonly lateralityOptions = ['OD', 'OS', 'OU'];
  readonly urgencyOptions = ['Routine', 'Today', 'Same day', 'Urgent', 'STAT'];

  protected viewStudy(study: ImagingStudy): void {
    this.selectedStudy.set(study);
    this.viewOpen.set(true);
  }

  protected openReview(study: ImagingStudy): void {
    this.selectedStudy.set(study);
    this.fImpressionSummary = study.impressionSummary ?? '';
    this.fReviewNotes = '';
    this.fQualityScore = study.qualityScore ?? '';
    this.reviewOpen.set(true);
  }

  protected openCreate(): void {
    this.fPatient = '';
    this.fModality = '';
    this.fOrderedBy = '';
    this.fLaterality = '';
    this.fUrgency = 'Routine';
    this.fClinicalIndication = '';
    this.fProtocol = '';
    this.fCptCode = '';
    this.fStudyDate = '';
    this.createOpen.set(true);
  }

  protected saveStudy(): void {
    if (!this.fPatient.trim() || !this.fModality) return;
    const clinicId = this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park';
    this.store.createImagingStudy({
      clinicId,
      patient: this.fPatient.trim(),
      modality: this.fModality,
      studyId: `IMG-${String(Date.now()).slice(-5)}`,
      orderedBy: this.fOrderedBy.trim() || 'Attending',
      status: 'Ordered',
      tone: 'info',
      findings: 'Pending acquisition',
      aiSignal: 'Awaiting scan',
      studyDate: this.fStudyDate,
      laterality: this.fLaterality,
      clinicalIndication: this.fClinicalIndication.trim(),
      urgency: this.fUrgency,
      protocol: this.fProtocol.trim(),
      cptCode: this.fCptCode.trim(),
    });
    this.createOpen.set(false);
  }

  protected saveReview(): void {
    this.reviewOpen.set(false);
    this.selectedStudy.set(null);
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.modalityFilter.set('');
    this.statusFilter.set('');
  }

  protected get hasActiveFilters(): boolean {
    return !!(this.searchQuery() || this.modalityFilter() || this.statusFilter());
  }

  protected closeView(): void { this.viewOpen.set(false); this.selectedStudy.set(null); }
  protected closeReview(): void { this.reviewOpen.set(false); this.selectedStudy.set(null); }
  protected closeCreate(): void { this.createOpen.set(false); }
}
