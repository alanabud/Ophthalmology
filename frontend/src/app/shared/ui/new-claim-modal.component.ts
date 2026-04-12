import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ClaimCptRow, ClaimRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

interface Tab { num: number; label: string; }

const TABS: Tab[] = [
  { num: 1,  label: 'Claim Overview' },
  { num: 2,  label: 'Patient & Subscriber' },
  { num: 3,  label: 'Insurance / Payer' },
  { num: 4,  label: 'Clinical Context' },
  { num: 5,  label: 'Coding' },
  { num: 6,  label: 'Financials' },
  { num: 7,  label: 'Submission' },
  { num: 8,  label: 'Denials / Follow-up' },
  { num: 9,  label: 'Attachments' },
  { num: 10, label: 'Audit / System' },
];

@Component({
  selector: 'app-new-claim-modal',
  imports: [FormsModule],
  templateUrl: './new-claim-modal.component.html',
  styleUrl: './new-claim-modal.component.scss'
})
export class NewClaimModalComponent {
  private readonly store = inject(EnterpriseStoreService);

  readonly open = input(false);
  readonly claimToEdit = input<ClaimRecord | null>(null);
  readonly closed = output<void>();

  protected readonly isEditMode = signal(false);

  constructor() {
    effect(() => {
      const c = this.claimToEdit();
      if (c) {
        this.isEditMode.set(true);
        this.populateFromRecord(c);
      } else {
        this.isEditMode.set(false);
        this.resetForm();
      }
    });
  }

  private populateFromRecord(c: ClaimRecord): void {
    /* Tab 1 */
    this.claimType     = c.claimType     ?? 'Professional';
    this.claimStatus   = c.status        ?? 'Draft';
    this.priority      = c.priority      ?? 'Normal';
    this.dateOfService = c.dateOfService ?? '';
    this.billingBatch  = c.billingBatch  ?? '';
    this.placeOfService    = c.placeOfService    ?? '';
    this.renderingProvider = c.renderingProvider ?? '';
    this.billingProvider   = c.billingProvider   ?? '';
    this.referringProvider = c.referringProvider ?? '';
    this.assignedBiller = c.assignedBiller ?? '';
    this.workQueue      = c.workQueue      ?? '';
    /* Tab 2 */
    this.patientSearch  = c.patient      ?? '';
    this.mrn            = c.mrn          ?? '';
    this.accountNumber  = c.accountNumber ?? '';
    this.patientDob     = c.patientDob   ?? '';
    this.patientSex     = c.patientSex   ?? '';
    this.subscriberName = c.subscriberName ?? '';
    this.subscriberDob  = c.subscriberDob  ?? '';
    this.subscriberMemberId    = c.subscriberMemberId    ?? '';
    this.subscriberGroupNumber = c.subscriberGroupNumber ?? '';
    this.subscriberRelationship = c.subscriberRelationship ?? 'Self';
    this.eligibilityStatus      = c.eligibilityStatus ?? '';
    this.eligibilityVerifiedDate = c.eligibilityVerifiedDate ?? '';
    /* Tab 3 */
    this.primaryPayer   = c.primaryPayer   ?? c.payer ?? '';
    this.secondaryPayer = c.secondaryPayer ?? '';
    this.financialClass = c.financialClass ?? '';
    this.authNumber     = c.authNumber     ?? '';
    this.authValidFrom  = c.authValidFrom  ?? '';
    this.authValidTo    = c.authValidTo    ?? '';
    this.referralNumber = c.referralNumber ?? '';
    /* Tab 4 */
    this.laterality  = c.laterality  ?? '';
    this.visitType   = c.visitType   ?? '';
    this.primaryDx   = c.primaryDx   ?? '';
    this.secondaryDx = c.secondaryDx ?? '';
    this.tertiaryDx  = c.tertiaryDx  ?? '';
    this.globalPeriod     = c.globalPeriodIndicator ?? false;
    this.postOpDay         = c.postOpDay         ?? '';
    this.relatedSurgeryDate = c.relatedSurgeryDate ?? '';
    this.medicalNecessityNotes = c.medicalNecessityNotes ?? '';
    /* Tab 5 */
    this.cptRows = c.cptRows?.length
      ? c.cptRows.map((r) => ({ ...r }))
      : [this.blankCptRow()];
    /* Tab 6 */
    this.totalCharges     = c.totalCharges     ?? c.amount ?? '';
    this.allowedAmount    = c.allowedAmount    ?? '';
    this.expectedReimb    = c.expectedReimbursement ?? '';
    this.copay            = c.copay            ?? '';
    this.deductible       = c.deductible       ?? '';
    this.patientResp      = c.patientResponsibility ?? '';
    this.contractAdj      = c.contractualAdjustment ?? '';
    this.balanceDue       = c.balanceDue       ?? '';
    this.feeSchedule      = c.feeSchedule      ?? '';
    /* Tab 7 */
    this.submissionMethod  = c.submissionMethod  ?? 'Electronic';
    this.submissionTrack   = c.submissionTrackingNumber ?? '';
    this.resubmissionCode  = c.resubmissionCode  ?? '';
    this.submissionNotes   = c.submissionNotes   ?? '';
    this.validationStatus  = c.validationStatus  ?? '';
    /* Tab 8 */
    this.denialCode        = c.denialCode        ?? '';
    this.denialCategory    = c.denialCategory    ?? '';
    this.denialDescription = c.denialDescription ?? '';
    this.followUpOwner     = c.followUpOwner     ?? '';
    this.followUpDate      = c.followUpDate      ?? '';
    this.appealDeadline    = c.appealDeadline    ?? '';
    this.appealStatus      = c.appealStatus      ?? '';
    this.rootCauseCategory = c.rootCauseCategory ?? '';
    this.internalBillingNotes = c.internalBillingNotes ?? '';
    /* Tab 10 */
    this.createdBy = c.createdBy ?? '';
    this.createdOn = c.createdOn ?? '';
    this.currentTab.set(1);
  }

  private resetForm(): void {
    /* Tab 1 */
    this.claimType = 'Professional'; this.claimStatus = 'Draft';
    this.priority = 'Normal'; this.dateOfService = '';
    this.billingBatch = ''; this.placeOfService = '';
    this.renderingProvider = ''; this.billingProvider = '';
    this.referringProvider = ''; this.assignedBiller = '';
    this.workQueue = 'General';
    /* Tab 2 */
    this.patientSearch = ''; this.mrn = ''; this.accountNumber = '';
    this.patientDob = ''; this.patientSex = '';
    this.subscriberSameAsPatient = true;
    this.subscriberName = ''; this.subscriberDob = '';
    this.subscriberMemberId = ''; this.subscriberGroupNumber = '';
    this.subscriberRelationship = 'Self';
    this.eligibilityStatus = ''; this.eligibilityVerifiedDate = '';
    /* Tab 3 */
    this.primaryPayer = ''; this.secondaryPayer = '';
    this.financialClass = ''; this.authNumber = '';
    this.authValidFrom = ''; this.authValidTo = '';
    this.referralNumber = ''; this.authRequired = false;
    this.referralRequired = false;
    /* Tab 4 */
    this.laterality = ''; this.visitType = '';
    this.primaryDx = ''; this.secondaryDx = ''; this.tertiaryDx = '';
    this.globalPeriod = false; this.postOpDay = '';
    this.relatedSurgeryDate = ''; this.medicalNecessityNotes = '';
    this.docCompleteStatus = 'Incomplete';
    /* Tab 5 */
    this.cptRows = [this.blankCptRow()];
    /* Tab 6 */
    this.totalCharges = ''; this.allowedAmount = '';
    this.expectedReimb = ''; this.copay = '';
    this.deductible = ''; this.patientResp = '';
    this.contractAdj = ''; this.balanceDue = '';
    this.feeSchedule = '';
    /* Tab 7 */
    this.submissionMethod = 'Electronic'; this.submissionTrack = '';
    this.resubmissionCode = ''; this.submissionNotes = '';
    this.validationStatus = 'Not validated';
    /* Tab 8 */
    this.denialCode = ''; this.denialCategory = '';
    this.denialDescription = ''; this.followUpOwner = '';
    this.followUpDate = ''; this.appealDeadline = '';
    this.appealStatus = ''; this.rootCauseCategory = '';
    this.internalBillingNotes = '';
    /* Tab 10 */
    this.createdBy = ''; this.createdOn = '';
    this.currentTab.set(1);
  }

  protected readonly tabs = TABS;
  protected readonly currentTab = signal(1);
  protected readonly isSubmitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly clinics = this.store.clinicOptions;

  /* ─── Tab 1: Claim Overview ─────────────────────────────── */
  protected claimType      = 'Professional';
  protected claimStatus    = 'Draft';
  protected priority       = 'Normal';
  protected dateOfService  = '';
  protected serviceDateEnd = '';
  protected billingBatch   = '';
  protected placeOfService = '';
  protected department     = '';
  protected specialty      = '';
  protected encounterRef   = '';
  protected appointmentRef = '';
  protected surgicalCaseRef = '';
  protected renderingProvider  = '';
  protected billingProvider    = '';
  protected supervisingProvider = '';
  protected referringProvider  = '';
  protected orderingProvider   = '';
  protected assignedBiller     = '';
  protected assignedCollector  = '';
  protected workQueue          = 'General';

  /* ─── Tab 2: Patient & Subscriber ──────────────────────── */
  protected patientSearch   = '';
  protected mrn             = '';
  protected accountNumber   = '';
  protected chartNumber     = '';
  protected patientFullName = '';
  protected patientDob      = '';
  protected patientSex      = '';
  protected patientPhone    = '';
  protected patientEmail    = '';
  protected patientAddress  = '';
  protected guarantorName   = '';
  protected guarantorRel    = 'Self';
  protected subscriberSameAsPatient = true;
  protected subscriberName  = '';
  protected subscriberDob   = '';
  protected subscriberMemberId    = '';
  protected subscriberGroupNumber = '';
  protected subscriberEmployer    = '';
  protected subscriberRelationship = 'Self';
  protected preferredLanguage      = 'English';
  protected eligibilityStatus      = '';
  protected eligibilityVerifiedDate = '';
  protected eligibilityVerifiedBy  = '';

  /* ─── Tab 3: Insurance / Payer ──────────────────────────── */
  protected primaryPayer   = '';
  protected secondaryPayer = '';
  protected tertiaryPayer  = '';
  protected planName       = '';
  protected financialClass = '';
  protected payerType      = '';
  protected claimDestination  = '';
  protected clearinghouse     = '';
  protected memberId          = '';
  protected groupNumber       = '';
  protected planEffectiveDate = '';
  protected planTermDate      = '';
  protected authRequired      = false;
  protected authNumber        = '';
  protected authValidFrom     = '';
  protected authValidTo       = '';
  protected referralRequired  = false;
  protected referralNumber    = '';
  protected cobDetails        = '';
  protected accidentIndicator = false;
  protected autoInsurance     = false;
  protected workersComp      = false;

  /* ─── Tab 4: Ophthalmology Clinical Context ─────────────── */
  protected laterality  = '';
  protected visitType   = '';
  protected primaryDx   = '';
  protected secondaryDx = '';
  protected tertiaryDx  = '';
  protected procedureLink   = '';
  protected surgicalProcLink = '';
  protected globalPeriod     = false;
  protected postOpDay        = '';
  protected relatedSurgeryDate = '';
  protected operativeNoteAttached = false;
  protected medicalNecessityNotes = '';
  protected docCompleteStatus     = 'Incomplete';
  protected visionRelated         = false;
  protected medVisionBenefit      = 'Medical';
  protected injectionMedication   = '';
  protected injectionJCode        = '';

  /* ─── Tab 5: Coding ─────────────────────────────────────── */
  protected cptRows: ClaimCptRow[] = [this.blankCptRow()];

  private blankCptRow(): ClaimCptRow {
    return {
      cptCode: '', modifier1: '', modifier2: '', units: '1',
      diagPointer: '1', serviceDate: '', pos: '11',
      charge: '', renderingNpi: '', ndcCode: '', notes: ''
    };
  }

  protected addCptRow(): void {
    this.cptRows = [...this.cptRows, this.blankCptRow()];
  }

  protected removeCptRow(idx: number): void {
    if (this.cptRows.length <= 1) return;
    this.cptRows = this.cptRows.filter((_, i) => i !== idx);
  }

  protected get codingTotal(): string {
    const total = this.cptRows.reduce((sum, row) => {
      const charge = parseFloat(row.charge.replace(/[^0-9.]/g, '')) || 0;
      const units  = parseFloat(row.units) || 1;
      return sum + charge * units;
    }, 0);
    return total > 0 ? `$${total.toFixed(2)}` : '';
  }

  /* ─── Tab 6: Financials ──────────────────────────────────── */
  protected totalCharges  = '';
  protected allowedAmount = '';
  protected expectedReimb = '';
  protected copay         = '';
  protected coinsurance   = '';
  protected deductible    = '';
  protected nonCovered    = '';
  protected patientResp   = '';
  protected writeOff      = '';
  protected contractAdj   = '';
  protected balanceDue    = '';
  protected paymentReceived = '';
  protected unappliedPayment = '';
  protected feeSchedule   = '';
  protected pricingMethod = 'Contract rate';

  /* ─── Tab 7: Submission ──────────────────────────────────── */
  protected submissionMethod  = 'Electronic';
  protected clearinghouseStatus = '';
  protected transmissionBatch   = '';
  protected submissionTrack     = '';
  protected resubmissionCode    = '';
  protected frequencyCode       = '1';
  protected origRefNumber       = '';
  protected submissionNotes     = '';
  protected validationStatus    = 'Not validated';
  protected preScrubStatus      = '';
  protected attachReqd: string[] = [];
  protected attachSent: string[] = [];

  /* ─── Tab 8: Denials / Follow-up ────────────────────────── */
  protected rejectionReason     = '';
  protected denialCategory      = '';
  protected denialCode          = '';
  protected denialDescription   = '';
  protected carcCode            = '';
  protected rarcCode            = '';
  protected followUpOwner       = '';
  protected nextAction          = '';
  protected followUpDate        = '';
  protected appealNeeded        = false;
  protected appealDeadline      = '';
  protected appealStatus        = '';
  protected rebillIndicator     = false;
  protected correctedClaim      = false;
  protected timelyFilingRisk    = false;
  protected rootCauseCategory   = '';
  protected internalBillingNotes = '';
  protected payerCallNotes       = '';
  protected escalationLevel      = '';
  protected resolutionSummary    = '';

  /* ─── Tab 9: Attachments ─────────────────────────────────── */
  protected attachPriorAuth    = false;
  protected attachReferral     = false;
  protected attachOpNote       = false;
  protected attachClinicalNote = false;
  protected attachImaging      = false;
  protected attachConsent      = false;
  protected attachEOB          = false;
  protected attachMedNecessity = false;
  protected attachOpticalRx    = false;
  protected attachDocNotes     = '';

  /* ─── Tab 10: Audit / System ─────────────────────────────── */
  protected createdBy   = '';
  protected createdOn   = '';
  protected updatedBy   = '';
  protected updatedOn   = '';
  protected lastActivity = '';
  protected lastClaimEvent = '';
  protected lastSyncStatus = '';
  protected integrationStatus = '';
  protected importSource = '';
  protected errorDetails = '';

  /* ─── Helpers ─────────────────────────────────────────────── */
  protected get currentTabLabel(): string {
    return TABS.find((t) => t.num === this.currentTab())?.label ?? '';
  }

  protected get canSubmit(): boolean {
    return !!this.patientSearch.trim() && !!this.dateOfService && !!this.primaryPayer.trim();
  }

  protected get claimStatusTone(): string {
    const s = this.claimStatus;
    if (s === 'Denied' || s === 'Rejected') return 'critical';
    if (s === 'Partially paid') return 'warning';
    if (s === 'Paid' || s === 'Accepted') return 'success';
    if (s === 'Submitted') return 'accent';
    return 'neutral';
  }

  protected goTo(num: number): void { this.currentTab.set(num); }
  protected prev(): void { if (this.currentTab() > 1)  this.currentTab.update((t) => t - 1); }
  protected next(): void { if (this.currentTab() < 10) this.currentTab.update((t) => t + 1); }

  protected cancel(): void {
    this.resetForm();
    this.closed.emit();
  }

  protected saveDraft(): void {
    this.claimStatus = 'Draft';
    this.persist();
    this.closed.emit();
  }

  protected submit(): void {
    if (!this.canSubmit || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    setTimeout(() => {
      this.persist();
      this.isSubmitting.set(false);
      this.submitted.set(true);
    }, 900);
  }

  private persist(): void {
    const clinicId = this.store.activeClinicId() !== 'network'
      ? this.store.activeClinicId()
      : 'winter-park';

    const baseRecord: ClaimRecord = {
      clinicId,
      claim: this.claimToEdit()?.claim ?? `CLM-${String(Date.now()).slice(-6)}`,
      patient: this.patientSearch.trim() || this.patientFullName.trim(),
      payer: this.primaryPayer.trim() || 'Self-pay',
      amount: this.totalCharges.trim() || this.codingTotal || '$0.00',
      status: this.claimStatus,
      tone: (this.claimStatus === 'Denied' || this.claimStatus === 'Rejected') ? 'critical'
          : (this.claimStatus === 'Paid' || this.claimStatus === 'Accepted')   ? 'accent'
          : (this.claimStatus === 'Partially paid')                             ? 'warning'
          : 'neutral',
      denialRisk: this.denialCode ? 'High' : this.appealNeeded ? 'Medium' : 'Low',
      nextAction: this.nextAction.trim() || this.submissionNotes.trim() || 'Review before submit',
      /* extended */
      claimType: this.claimType, priority: this.priority,
      dateOfService: this.dateOfService, billingBatch: this.billingBatch,
      placeOfService: this.placeOfService, renderingProvider: this.renderingProvider,
      billingProvider: this.billingProvider, referringProvider: this.referringProvider,
      assignedBiller: this.assignedBiller, workQueue: this.workQueue,
      mrn: this.mrn, accountNumber: this.accountNumber,
      patientDob: this.patientDob, patientSex: this.patientSex,
      subscriberName: this.subscriberName, subscriberDob: this.subscriberDob,
      subscriberMemberId: this.subscriberMemberId,
      subscriberGroupNumber: this.subscriberGroupNumber,
      subscriberRelationship: this.subscriberRelationship,
      eligibilityStatus: this.eligibilityStatus,
      eligibilityVerifiedDate: this.eligibilityVerifiedDate,
      primaryPayer: this.primaryPayer, secondaryPayer: this.secondaryPayer,
      financialClass: this.financialClass,
      authNumber: this.authNumber, authValidFrom: this.authValidFrom, authValidTo: this.authValidTo,
      referralNumber: this.referralNumber,
      laterality: this.laterality, visitType: this.visitType,
      primaryDx: this.primaryDx, secondaryDx: this.secondaryDx, tertiaryDx: this.tertiaryDx,
      globalPeriodIndicator: this.globalPeriod, postOpDay: this.postOpDay,
      relatedSurgeryDate: this.relatedSurgeryDate,
      medicalNecessityNotes: this.medicalNecessityNotes,
      cptRows: this.cptRows,
      totalCharges: this.totalCharges, allowedAmount: this.allowedAmount,
      expectedReimbursement: this.expectedReimb,
      copay: this.copay, deductible: this.deductible,
      patientResponsibility: this.patientResp,
      contractualAdjustment: this.contractAdj, balanceDue: this.balanceDue,
      feeSchedule: this.feeSchedule,
      submissionMethod: this.submissionMethod,
      submissionTrackingNumber: this.submissionTrack,
      resubmissionCode: this.resubmissionCode, submissionNotes: this.submissionNotes,
      validationStatus: this.validationStatus,
      denialCode: this.denialCode, denialCategory: this.denialCategory,
      denialDescription: this.denialDescription,
      followUpOwner: this.followUpOwner, followUpDate: this.followUpDate,
      appealDeadline: this.appealDeadline, appealStatus: this.appealStatus,
      rootCauseCategory: this.rootCauseCategory,
      internalBillingNotes: this.internalBillingNotes,
    };

    if (this.isEditMode()) {
      this.store.updateClaim(baseRecord);
    } else {
      this.store.createClaim(baseRecord);
    }
  }
}
