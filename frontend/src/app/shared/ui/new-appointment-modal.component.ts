import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppointmentRecord, WaitlistRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

interface Tab { num: number; label: string; }

const TABS: Tab[] = [
  { num: 1, label: 'Appointment' },
  { num: 2, label: 'Patient' },
  { num: 3, label: 'Clinical' },
  { num: 4, label: 'Insurance / Auth' },
  { num: 5, label: 'Pre-Visit' },
  { num: 6, label: 'Notes / Audit' },
];

@Component({
  selector: 'app-new-appointment-modal',
  imports: [FormsModule],
  templateUrl: './new-appointment-modal.component.html',
  styleUrl: './new-appointment-modal.component.scss'
})
export class NewAppointmentModalComponent {
  private readonly store = inject(EnterpriseStoreService);

  readonly open = input(false);
  /** Pass a WaitlistRecord to prefill from waitlist entry */
  readonly waitlistEntry = input<WaitlistRecord | null>(null);
  /** Pass an AppointmentRecord to edit an existing appointment */
  readonly appointmentToEdit = input<AppointmentRecord | null>(null);
  /** Pass a patient name + MRN to prefill from patient context */
  readonly prefillPatient = input<{ name: string; mrn: string } | null>(null);
  readonly closed = output<void>();

  protected readonly isEditMode = signal(false);

  constructor() {
    effect(() => {
      const apt = this.appointmentToEdit();
      if (apt) {
        this.isEditMode.set(true);
        this.populateFromRecord(apt);
        return;
      }
      this.isEditMode.set(false);
      this.resetForm();

      /* Prefill from waitlist */
      const wl = this.waitlistEntry();
      if (wl) {
        this.patientSearch     = wl.patient;
        this.mrn               = wl.mrn ?? '';
        this.dob               = wl.dob ?? '';
        this.phone             = wl.phone ?? '';
        this.primaryPayer      = wl.insurance ?? '';
        this.visitCategory     = wl.visitType ?? '';
        this.laterality        = wl.laterality ?? '';
        this.chiefComplaint    = wl.chiefComplaint ?? '';
        this.referringProvider = wl.referringProvider ?? '';
        this.eligibilityStatus = wl.eligibilityStatus ?? '';
        this.authNumber        = wl.authStatus ?? '';
        this.internalNotes     = wl.notes ?? '';
      }

      /* Prefill from patient context */
      const pp = this.prefillPatient();
      if (pp) {
        this.patientSearch = pp.name;
        this.mrn           = pp.mrn;
      }
    });
  }

  private populateFromRecord(a: AppointmentRecord): void {
    /* Tab 1 */
    this.appointmentType   = a.appointmentType;
    this.visitCategory     = a.visitCategory;
    this.apptStatus        = a.status;
    this.priority          = a.priority;
    this.apptDate          = a.date;
    this.startTime         = a.startTime;
    this.endTime           = a.endTime;
    this.duration          = a.duration;
    this.provider          = a.provider;
    this.secondaryProvider = a.secondaryProvider;
    this.room              = a.room;
    this.lane              = a.lane;
    this.specialty         = a.specialty;
    /* Tab 2 */
    this.patientSearch = a.patient;
    this.mrn           = a.mrn;
    this.dob           = a.dob;
    this.phone         = a.phone;
    this.email         = a.email;
    /* Tab 3 */
    this.laterality        = a.laterality;
    this.visitReason       = a.visitReason;
    this.chiefComplaint    = a.chiefComplaint;
    this.referringProvider = a.referringProvider;
    this.recallType        = a.recallType;
    this.recallInterval    = a.recallInterval;
    this.linkedEncounterId = a.linkedEncounterId;
    this.preOpNotes        = a.preOpNotes;
    /* Tab 4 */
    this.primaryPayer            = a.primaryPayer;
    this.memberId                = a.memberId;
    this.eligibilityStatus       = a.eligibilityStatus;
    this.eligibilityVerifiedDate = a.eligibilityVerifiedDate;
    this.authRequired            = a.authRequired;
    this.authNumber              = a.authNumber;
    this.authValidFrom           = a.authValidFrom;
    this.authValidTo             = a.authValidTo;
    this.referralNumber          = a.referralNumber;
    this.copayCollected          = a.copayCollected;
    this.copayAmount             = a.copayAmount;
    /* Tab 5 */
    this.consentSigned         = a.consentSigned;
    this.hipaaAcknowledged     = a.hipaaAcknowledged;
    this.idVerified            = a.idVerified;
    this.insuranceCardCopied   = a.insuranceCardCopied;
    this.medicalHistoryReviewed = a.medicalHistoryReviewed;
    this.medicationsReviewed   = a.medicationsReviewed;
    this.allergiesReviewed     = a.allergiesReviewed;
    this.specialPrep           = a.specialPrep;
    this.patientArrivalTime    = a.patientArrivalTime;
    /* Tab 6 */
    this.internalNotes = a.internalNotes;
    this.cancelReason  = a.cancelReason;
    this.noShowReason  = a.noShowReason;
    this.currentTab.set(1);
  }

  private resetForm(): void {
    /* Tab 1 */
    this.appointmentType = 'Office visit'; this.visitCategory = '';
    this.apptStatus = 'Scheduled'; this.priority = 'Routine';
    this.apptDate = ''; this.startTime = ''; this.endTime = '';
    this.duration = '30'; this.provider = ''; this.secondaryProvider = '';
    this.room = ''; this.lane = ''; this.specialty = '';
    /* Tab 2 */
    this.patientSearch = ''; this.mrn = ''; this.dob = '';
    this.phone = ''; this.email = '';
    /* Tab 3 */
    this.laterality = ''; this.visitReason = ''; this.chiefComplaint = '';
    this.referringProvider = ''; this.recallType = ''; this.recallInterval = '';
    this.linkedEncounterId = ''; this.preOpNotes = '';
    /* Tab 4 */
    this.primaryPayer = ''; this.memberId = '';
    this.eligibilityStatus = ''; this.eligibilityVerifiedDate = '';
    this.authRequired = false; this.authNumber = '';
    this.authValidFrom = ''; this.authValidTo = '';
    this.referralNumber = ''; this.copayCollected = false; this.copayAmount = '';
    /* Tab 5 */
    this.consentSigned = false; this.hipaaAcknowledged = false;
    this.idVerified = false; this.insuranceCardCopied = false;
    this.medicalHistoryReviewed = false; this.medicationsReviewed = false;
    this.allergiesReviewed = false; this.specialPrep = '';
    this.patientArrivalTime = '';
    /* Tab 6 */
    this.internalNotes = ''; this.cancelReason = ''; this.noShowReason = '';
    this.currentTab.set(1);
  }

  protected readonly tabs = TABS;
  protected readonly currentTab = signal(1);
  protected readonly isSubmitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly clinics = this.store.clinicOptions;

  /* ─── Tab 1: Appointment Overview ─────────────────── */
  protected appointmentType   = 'Office visit';
  protected visitCategory     = '';
  protected apptStatus        = 'Scheduled';
  protected priority          = 'Routine';
  protected apptDate          = '';
  protected startTime         = '';
  protected endTime           = '';
  protected duration          = '30';
  protected provider          = '';
  protected secondaryProvider = '';
  protected technicianName    = '';
  protected room              = '';
  protected lane              = '';
  protected specialty         = '';
  protected equipment         = '';
  protected clinicLocation    = '';
  protected confirmationSent  = false;
  protected reminderSent      = false;

  /* ─── Tab 2: Patient ──────────────────────────────── */
  protected patientSearch    = '';
  protected mrn              = '';
  protected dob              = '';
  protected phone            = '';
  protected email            = '';
  protected preferredLanguage = 'English';
  protected interpreterNeeded = false;
  protected accessibilityNeeds = '';
  protected transportationNeeded = false;
  protected escortName       = '';

  /* ─── Tab 3: Clinical Context ─────────────────────── */
  protected laterality        = '';
  protected visitReason       = '';
  protected chiefComplaint    = '';
  protected referringProvider = '';
  protected orderingProvider  = '';
  protected recallType        = '';
  protected recallInterval    = '';
  protected linkedEncounterId = '';
  protected linkedSurgeryId   = '';
  protected preOpRequired     = false;
  protected preOpNotes        = '';
  protected urgencyReason     = '';
  protected diagnosisHint     = '';
  protected previousVisitRef  = '';
  protected drugAdminRequired = false;
  protected dilationRequired  = false;
  protected imagingRequired   = false;

  /* ─── Tab 4: Insurance / Authorization ────────────── */
  protected primaryPayer            = '';
  protected secondaryPayer          = '';
  protected memberId                = '';
  protected groupNumber             = '';
  protected eligibilityStatus       = '';
  protected eligibilityVerifiedDate = '';
  protected eligibilityVerifiedBy   = '';
  protected authRequired            = false;
  protected authNumber              = '';
  protected authValidFrom           = '';
  protected authValidTo             = '';
  protected authVisitsRemaining     = '';
  protected referralRequired        = false;
  protected referralNumber          = '';
  protected referralExpiry          = '';
  protected copayCollected          = false;
  protected copayAmount             = '';
  protected financialClass          = '';
  protected preAuthStatus           = '';

  /* ─── Tab 5: Pre-Visit Checklist ─────────────────── */
  protected consentSigned           = false;
  protected hipaaAcknowledged       = false;
  protected idVerified              = false;
  protected insuranceCardCopied     = false;
  protected medicalHistoryReviewed  = false;
  protected medicationsReviewed     = false;
  protected allergiesReviewed       = false;
  protected vitalsRequired          = false;
  protected gttRequired             = false;
  protected labsRequired            = false;
  protected specialPrep             = '';
  protected patientArrivalTime      = '';
  protected patientCheckedIn        = false;
  protected roomed                  = false;
  protected waitTimeMinutes         = '';

  /* ─── Tab 6: Notes / Audit ────────────────────────── */
  protected internalNotes  = '';
  protected cancelReason   = '';
  protected noShowReason   = '';
  protected scheduledBy    = '';
  protected confirmedBy    = '';
  protected confirmedOn    = '';

  /* ─── Computed helpers ────────────────────────────── */
  protected get currentTabLabel(): string {
    return TABS.find((t) => t.num === this.currentTab())?.label ?? '';
  }

  protected get canSubmit(): boolean {
    return !!this.patientSearch.trim() && !!this.apptDate && !!this.provider.trim();
  }

  protected get checklistPercent(): number {
    const items = [
      this.consentSigned, this.hipaaAcknowledged, this.idVerified,
      this.insuranceCardCopied, this.medicalHistoryReviewed,
      this.medicationsReviewed, this.allergiesReviewed,
    ];
    const done = items.filter(Boolean).length;
    return Math.round((done / items.length) * 100);
  }

  protected get statusTone(): string {
    const s = this.apptStatus;
    if (s === 'Cancelled' || s === 'No-show') return 'critical';
    if (s === 'Checked-in' || s === 'Confirmed') return 'success';
    if (s === 'Waitlisted') return 'warning';
    return 'neutral';
  }

  protected goTo(num: number): void { this.currentTab.set(num); }
  protected prev(): void { if (this.currentTab() > 1) this.currentTab.update((t) => t - 1); }
  protected next(): void { if (this.currentTab() < 6) this.currentTab.update((t) => t + 1); }

  protected cancel(): void {
    this.resetForm();
    this.closed.emit();
  }

  protected submit(): void {
    if (!this.canSubmit || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    setTimeout(() => {
      this.persist();
      this.isSubmitting.set(false);
      this.submitted.set(true);
    }, 700);
  }

  private persist(): void {
    const clinicId = this.store.activeClinicId() !== 'network'
      ? this.store.activeClinicId()
      : 'winter-park';

    const record: AppointmentRecord = {
      id: this.appointmentToEdit()?.id ?? `APT-${String(Date.now()).slice(-6)}`,
      clinicId,
      appointmentType: this.appointmentType,
      visitCategory: this.visitCategory,
      status: this.apptStatus,
      tone: (this.apptStatus === 'Cancelled' || this.apptStatus === 'No-show') ? 'critical'
          : (this.apptStatus === 'Confirmed' || this.apptStatus === 'Checked-in') ? 'accent'
          : 'neutral',
      priority: this.priority,
      date: this.apptDate,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
      provider: this.provider,
      secondaryProvider: this.secondaryProvider,
      room: this.room,
      lane: this.lane,
      specialty: this.specialty,
      patient: this.patientSearch.trim(),
      mrn: this.mrn,
      dob: this.dob,
      phone: this.phone,
      email: this.email,
      laterality: this.laterality,
      visitReason: this.visitReason,
      chiefComplaint: this.chiefComplaint,
      referringProvider: this.referringProvider,
      recallType: this.recallType,
      recallInterval: this.recallInterval,
      linkedEncounterId: this.linkedEncounterId,
      preOpNotes: this.preOpNotes,
      primaryPayer: this.primaryPayer,
      memberId: this.memberId,
      eligibilityStatus: this.eligibilityStatus,
      eligibilityVerifiedDate: this.eligibilityVerifiedDate,
      authRequired: this.authRequired,
      authNumber: this.authNumber,
      authValidFrom: this.authValidFrom,
      authValidTo: this.authValidTo,
      referralNumber: this.referralNumber,
      copayCollected: this.copayCollected,
      copayAmount: this.copayAmount,
      consentSigned: this.consentSigned,
      hipaaAcknowledged: this.hipaaAcknowledged,
      idVerified: this.idVerified,
      insuranceCardCopied: this.insuranceCardCopied,
      medicalHistoryReviewed: this.medicalHistoryReviewed,
      medicationsReviewed: this.medicationsReviewed,
      allergiesReviewed: this.allergiesReviewed,
      specialPrep: this.specialPrep,
      patientArrivalTime: this.patientArrivalTime,
      createdBy: this.scheduledBy,
      createdOn: new Date().toISOString().slice(0, 10),
      confirmedBy: this.confirmedBy,
      confirmedOn: this.confirmedOn,
      cancelReason: this.cancelReason,
      noShowReason: this.noShowReason,
      internalNotes: this.internalNotes,
    };

    // Persist the appointment by id — update existing, or create new (no duplicate).
    if (this.isEditMode() && this.appointmentToEdit()) {
      this.store.updateAppointment({ ...this.appointmentToEdit()!, ...record });
    } else {
      this.store.createAppointment(record);
      this.store.createWaitlistEntry({
        clinicId,
        patient: record.patient,
        request: record.visitReason || record.visitCategory || record.appointmentType,
        preferredWindow: record.date ? `${record.date} ${record.startTime}`.trim() : 'Flexible',
        fitScore: this.apptStatus === 'Scheduled' ? 'Confirmed' : 'Booked',
        tone: 'accent',
        mrn: record.mrn, dob: record.dob, phone: record.phone, insurance: record.primaryPayer,
        referringProvider: record.referringProvider, laterality: record.laterality,
        visitType: record.visitCategory, chiefComplaint: record.chiefComplaint,
        eligibilityStatus: record.eligibilityStatus, notes: record.internalNotes,
      });
    }
  }
}
