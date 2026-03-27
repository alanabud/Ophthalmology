import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SurgeryCase } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { AppModalComponent } from '../../shared/ui/app-modal.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-surgery-page',
  imports: [FormsModule, AppModalComponent, StatusChipComponent],
  templateUrl: './surgery-page.component.html',
  styleUrl: './surgery-page.component.scss'
})
export class SurgeryPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly cases = this.store.surgeryCases;

  // Stats
  protected readonly readyCount = computed(() => this.cases().filter(c => c.readiness === 'Ready' || c.tone === 'success').length);
  protected readonly holdCount = computed(() => this.cases().filter(c => c.readiness === 'Hold' || c.tone === 'critical').length);
  protected readonly scheduledCount = computed(() => this.cases().filter(c => c.readiness === 'Scheduled' || c.tone === 'info').length);

  // Modal state
  protected readonly selectedCase = signal<SurgeryCase | null>(null);
  protected readonly editingCase = signal<SurgeryCase | null>(null);
  protected readonly viewOpen = signal(false);
  protected readonly createOpen = signal(false);

  // Form fields
  protected fPatient = '';
  protected fProcedure = '';
  protected fSurgeon = '';
  protected fDate = '';
  protected fTime = '';
  protected fSide = '';
  protected fAnesthesiaType = '';
  protected fImplant = '';
  protected fIolModel = '';
  protected fIolPower = '';
  protected fAxialLength = '';
  protected fTargetRefraction = '';
  protected fAnesthesiologist = '';
  protected fCirculator = '';
  protected fAllergies = '';
  protected fComorbidities = '';
  protected fPreOpDx = '';
  protected fPostOpPlan = '';
  protected fRisk = '';

  readonly procedureOptions = ['Phacoemulsification + IOL (OD)', 'Phacoemulsification + IOL (OS)', 'Cataract with toric IOL', 'Cataract with premium IOL', 'SLT OU', 'SLT OD', 'SLT OS', 'YAG Capsulotomy', 'Intravitreal Injection (OD)', 'Intravitreal Injection (OS)', 'Trabeculectomy', 'Ahmed Valve Implant', 'Pterygium Excision', 'Corneal Transplant (DSAEK)', 'Vitrectomy PPV'];
  readonly sideOptions = ['OD', 'OS', 'OU'];
  readonly anesthesiaOptions = ['Topical anesthesia', 'Topical + monitored anesthesia care', 'Topical + IV sedation option pending', 'Retrobulbar block', 'General anesthesia'];

  protected viewCase(c: SurgeryCase): void {
    this.selectedCase.set(c);
    this.viewOpen.set(true);
  }

  protected openCreate(): void {
    this.editingCase.set(null);
    this.fPatient = '';
    this.fProcedure = '';
    this.fSurgeon = '';
    this.fDate = '';
    this.fTime = '';
    this.fSide = '';
    this.fAnesthesiaType = '';
    this.fImplant = '';
    this.fIolModel = '';
    this.fIolPower = '';
    this.fAxialLength = '';
    this.fTargetRefraction = '';
    this.fAnesthesiologist = '';
    this.fCirculator = '';
    this.fAllergies = 'NKDA';
    this.fComorbidities = '';
    this.fPreOpDx = '';
    this.fPostOpPlan = '';
    this.fRisk = 'Low';
    this.createOpen.set(true);
  }

  protected saveCase(): void {
    if (!this.fPatient.trim() || !this.fProcedure.trim()) return;
    const clinicId = this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park';
    this.store.createSurgeryCase({
      clinicId,
      patient: this.fPatient.trim(),
      procedure: this.fProcedure.trim(),
      surgeon: this.fSurgeon.trim() || 'TBD',
      date: this.fDate || 'TBD',
      readiness: 'Pending review',
      tone: 'neutral',
      implant: this.fIolModel.trim() || this.fImplant.trim() || 'TBD',
      clearance: 'Pending',
      risk: this.fRisk.trim() || 'Not assessed',
      caseId: `ASC-${String(Date.now()).slice(-6)}`,
      side: this.fSide,
      scheduledTime: this.fTime,
      anesthesiaType: this.fAnesthesiaType,
      iOLModel: this.fIolModel.trim(),
      iOLPower: this.fIolPower.trim(),
      axialLength: this.fAxialLength.trim(),
      targetRefraction: this.fTargetRefraction.trim(),
      anesthesiologist: this.fAnesthesiologist.trim(),
      circulator: this.fCirculator.trim(),
      allergies: this.fAllergies.trim() || 'NKDA',
      comorbidities: this.fComorbidities.trim(),
      preOpDiagnosis: this.fPreOpDx.trim(),
      postOpPlan: this.fPostOpPlan.trim(),
    });
    this.createOpen.set(false);
  }

  protected closeView(): void { this.viewOpen.set(false); this.selectedCase.set(null); }
  protected closeCreate(): void { this.createOpen.set(false); }
}
