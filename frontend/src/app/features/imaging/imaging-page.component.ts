import { Component, inject, signal } from '@angular/core';
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

  // Modal state
  protected readonly selectedStudy = signal<ImagingStudy | null>(null);
  protected readonly viewOpen = signal(false);
  protected readonly reviewOpen = signal(false);
  protected readonly createOpen = signal(false);

  // Create form fields
  protected fPatient = '';
  protected fModality = '';
  protected fOrderedBy = '';

  // Review form fields
  protected fReviewNotes = '';

  readonly modalityOptions = ['OCT', 'Fundus Photo', 'Visual Field', 'OCT-A', 'B-scan', 'Fluorescein Angiography', 'Corneal Topography'];

  protected viewStudy(study: ImagingStudy): void {
    this.selectedStudy.set(study);
    this.viewOpen.set(true);
  }

  protected openReview(study: ImagingStudy): void {
    this.selectedStudy.set(study);
    this.fReviewNotes = '';
    this.reviewOpen.set(true);
  }

  protected openCreate(): void {
    this.fPatient = '';
    this.fModality = '';
    this.fOrderedBy = '';
    this.createOpen.set(true);
  }

  protected saveStudy(): void {
    if (!this.fPatient.trim() || !this.fModality) return;
    const clinicId = this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park';
    this.store.createImagingStudy({
      clinicId,
      patient: this.fPatient.trim(),
      modality: this.fModality,
      studyId: `IMG-${String(Date.now()).slice(-6)}`,
      orderedBy: this.fOrderedBy.trim() || 'Attending',
      status: 'Ordered',
      tone: 'info',
      findings: 'Pending acquisition',
      aiSignal: 'Awaiting scan',
    });
    this.createOpen.set(false);
  }

  protected saveReview(): void {
    // In a real app this would persist review notes; for now just close
    this.reviewOpen.set(false);
    this.selectedStudy.set(null);
  }

  protected closeView(): void { this.viewOpen.set(false); this.selectedStudy.set(null); }
  protected closeReview(): void { this.reviewOpen.set(false); this.selectedStudy.set(null); }
  protected closeCreate(): void { this.createOpen.set(false); }
}
