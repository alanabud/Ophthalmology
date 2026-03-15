import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PatientRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

interface Tab { num: number; label: string; }

const TABS: Tab[] = [
  { num: 1,  label: 'Identity' },
  { num: 2,  label: 'Demographics' },
  { num: 3,  label: 'Contact & Address' },
  { num: 4,  label: 'Insurance & Guarantor' },
  { num: 5,  label: 'Clinical / Referrals' },
  { num: 6,  label: 'Scheduling' },
  { num: 7,  label: 'Financial' },
  { num: 8,  label: 'Compliance & Consents' },
  { num: 9,  label: 'Documents' },
  { num: 10, label: 'Preferences' },
  { num: 11, label: 'Risk & Flags' },
  { num: 12, label: 'Audit & Admin' },
];

@Component({
  selector: 'app-new-patient-modal',
  imports: [FormsModule],
  templateUrl: './new-patient-modal.component.html',
  styleUrl: './new-patient-modal.component.scss'
})
export class NewPatientModalComponent {
  private readonly store = inject(EnterpriseStoreService);

  readonly open = input(false);
  readonly patientToEdit = input<PatientRecord | null>(null);
  readonly closed = output<void>();

  protected readonly isEditMode = signal(false);

  constructor() {
    effect(() => {
      const p = this.patientToEdit();
      if (p) {
        this.isEditMode.set(true);
        this.populateFromRecord(p);
      } else {
        this.isEditMode.set(false);
      }
    });
  }

  private populateFromRecord(p: PatientRecord): void {
    // Split fullName into first / last (last word = last name, rest = first)
    const parts = p.fullName.trim().split(' ');
    this.firstName = parts.slice(0, -1).join(' ') || parts[0] || '';
    this.lastName  = parts.length > 1 ? parts[parts.length - 1] : '';
    this.dob           = p.dob;
    this.insuranceName = p.insurance !== 'Not provided' ? p.insurance : '';
    this.clinicId      = p.clinicId;
    this.currentTab.set(1);
  }

  protected readonly tabs = TABS;
  protected readonly currentTab = signal(1);
  protected readonly isSubmitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly clinics = this.store.clinicOptions;

  /* Tab 1: Identity */
  protected lastName = '';         protected firstName = '';
  protected middleName = '';       protected suffix = '';
  protected preferredName = '';    protected legalName = '';
  protected dob = '';              protected sexAtBirth = '';
  protected genderIdentity = '';   protected pronouns = '';
  protected ssnLast4 = '';         protected maritalStatus = '';
  protected employmentStatus = ''; protected occupation = '';
  protected employer = '';         protected primaryLanguage = 'English';
  protected interpreterNeeded = 'No';
  protected race = '';             protected ethnicity = '';
  protected nationality = '';

  /* Tab 2: Demographics */
  protected height = '';      protected weight = '';
  protected bloodType = '';   protected smokingStatus = '';
  protected alcoholUse = '';  protected drugUse = '';

  /* Tab 3: Contact & Address */
  protected addressLine1 = '';   protected addressLine2 = '';
  protected city = '';           protected state = '';
  protected zip = '';            protected phoneMobile = '';
  protected phoneHome = '';      protected phoneWork = '';
  protected email = '';
  protected emergencyName = '';  protected emergencyRel = '';
  protected emergencyPhone = '';

  /* Tab 4: Insurance & Guarantor */
  protected insuranceName = '';      protected memberId = '';
  protected groupNumber = '';        protected subscriber = '';
  protected subscriberRel = 'Self';  protected insurance2 = '';
  protected guarantorName = '';      protected guarantorRel = '';
  protected guarantorDob = '';       protected guarantorPhone = '';

  /* Tab 5: Clinical / Referrals */
  protected referringProvider = '';  protected pcpName = '';
  protected specialty = '';          protected referralNumber = '';
  protected referralExpiry = '';     protected chiefComplaint = '';
  protected clinicId = '';           protected preferredProvider = '';

  /* Tab 6: Scheduling */
  protected visitType = '';          protected schedulingPriority = '';
  protected appointmentDate = '';    protected appointmentTime = '';
  protected schedulingNotes = '';    protected recallPeriod = '';

  /* Tab 7: Financial */
  protected paymentPlan = 'None';    protected selfPayDiscount = '';
  protected collectionFlag = 'None'; protected financialNotes = '';

  /* Tab 8: Compliance & Consents */
  protected hipaaDate = '';   protected aobDate = '';
  protected privacyDate = ''; protected consentDate = '';

  /* Tab 9: Documents */
  protected idUploaded = false;
  protected insCardUploaded = false;
  protected referralDocUploaded = false;
  protected docNotes = '';

  /* Tab 10: Preferences */
  protected preferredContact = 'Mobile phone';
  protected reminderMethod = 'SMS';
  protected portalAccess = 'Yes — invite on save';
  protected langPref = 'English';
  protected accessibilityNeeds = '';

  /* Tab 11: Risk & Flags */
  protected allergyFlags = '';       protected behavioralNote = '';
  protected fallRisk = 'Not assessed';
  protected infectiousDisease = 'None known';
  protected careCoordination = '';
  protected vipFlag = false;         protected researchConsent = false;

  /* Tab 12: Audit & Admin */
  protected registrationSource = 'Front desk — walk-in';
  protected internalNotes = '';

  protected get currentTabLabel(): string {
    return TABS.find((t) => t.num === this.currentTab())?.label ?? '';
  }

  protected get canSubmit(): boolean {
    return !!this.lastName.trim() && !!this.firstName.trim() && !!this.dob;
  }

  protected goTo(num: number): void { this.currentTab.set(num); }
  protected prev(): void { if (this.currentTab() > 1)  this.currentTab.update((t) => t - 1); }
  protected next(): void { if (this.currentTab() < 12) this.currentTab.update((t) => t + 1); }

  protected submit(): void {
    if (!this.canSubmit || this.isSubmitting()) return;
    this.isSubmitting.set(true);

    const targetClinicId = this.clinicId ||
      (this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park');

    this.store.createPatient({
      id: `pt-new-${Date.now()}`,
      clinicId: targetClinicId,
      mrn: `NEW-${String(Date.now()).slice(-6)}`,
      fullName: `${this.firstName.trim()} ${this.lastName.trim()}`,
      dob: this.dob,
      status: 'New Patient',
      statusTone: 'info',
      lastEncounter: '—',
      nextVisit: this.appointmentDate
        ? `${this.appointmentDate}${this.appointmentTime ? ' ' + this.appointmentTime : ''}`.trim()
        : 'Pending scheduling',
      balance: '$0.00',
      insurance: this.insuranceName.trim() || 'Not provided',
      chartCompleteness: '0%',
      careGap: 'Initial intake pending',
      imageStatus: 'No imaging on file',
      aiFlag: 'New patient — no prior history'
    });

    this.isSubmitting.set(false);
    this.submitted.set(true);
    setTimeout(() => this.resetAndClose(), 1600);
  }

  protected cancel(): void { this.resetAndClose(); }

  private resetAndClose(): void {
    this.currentTab.set(1);
    this.submitted.set(false);
    this.isSubmitting.set(false);
    this.lastName = ''; this.firstName = ''; this.middleName = '';
    this.dob = ''; this.insuranceName = ''; this.clinicId = '';
    this.closed.emit();
  }
}
