import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PatientRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

export type DetailTab = 'overview' | 'demographics' | 'insurance' | 'financial' | 'clinical' | 'briefing';
export type RegistrationTab =
  | 'identity' | 'demographics' | 'contact' | 'insurance'
  | 'clinical' | 'scheduling' | 'financial' | 'compliance'
  | 'documents' | 'preferences' | 'risk' | 'audit';

export interface PatientFormState {
  mrn: string; externalId: string; firstName: string; middleName: string;
  lastName: string; suffix: string; preferredName: string; legalName: string;
  dob: string; sexAtBirth: string; genderIdentity: string; pronouns: string;
  ssn: string; maritalStatus: string; employmentStatus: string;
  occupation: string; employer: string; language: string;
  interpreterNeeded: string; race: string; ethnicity: string; nationality: string;
  mobilePhone: string; homePhone: string; workPhone: string; email: string;
  preferredContact: string; address1: string; address2: string;
  city: string; state: string; zip: string; country: string; county: string;
  timeZone: string; seasonalAddress: string;
  emergencyName: string; emergencyRelation: string; emergencyPhone: string;
  guardianName: string; guardianRelation: string; guardianPhone: string;
  primaryPayer: string; primaryPlan: string; memberId: string;
  groupNumber: string; policyHolder: string; policyHolderDob: string;
  policyHolderEmployer: string; relationToSubscriber: string;
  copay: string; deductible: string; coinsurance: string;
  effectiveDate: string; terminationDate: string;
  secondaryPayer: string; secondaryPlan: string; secondaryMemberId: string;
  tertiaryPayer: string; priorAuthRequired: string; referralRequired: string;
  guarantorName: string; guarantorAddress: string; guarantorPhone: string;
  financialClass: string; selfPay: string;
  pcp: string; referringProvider: string; referringSource: string;
  clinicLocation: string; assignedProvider: string; specialty: string;
  visitReason: string; ocularHistory: string; medicalHistory: string;
  allergies: string; medications: string; fallRisk: string;
  mobilityAssistance: string; specialAccommodations: string;
  transportationRisk: string; surgicalCandidate: string;
  retinaRisk: string; glaucomaMonitoring: string; diabeticEyeCare: string;
  visitType: string; newEstablished: string; recallCategory: string;
  preferredLocation: string; preferredProvider: string;
  schedulingNotes: string; noShowRisk: string; preferredTimeOfDay: string;
  preferredDays: string; reminderPreference: string;
  waitlistEligible: string; telehealthEligible: string;
  balanceDue: string; agingBucket: string; collectionsStatus: string;
  paymentPlan: string; creditHold: string; depositRequired: string;
  copayCollection: string; refundBalance: string;
  badDebt: string; financialAssistance: string;
  hipaaConsent: string; financialPolicySigned: string;
  assignmentOfBenefits: string; releaseOfInfo: string;
  consentDate: string; photoConsent: string; surgeryConsent: string;
  portalConsent: string; smsConsent: string; emailConsent: string;
  insuranceCard: string; photoId: string; referralDoc: string;
  consentForms: string; priorAuthDocs: string;
  portalEnabled: string; communicationPreference: string;
  marketingOptOut: string; recallOutreachAllowed: string;
  smsAllowed: string; emailAllowed: string; callAllowed: string; mailAllowed: string;
  vipFlag: string; interpreterFlag: string; collectionsRisk: string;
  complianceRisk: string; noShowRiskLevel: string;
  imagingBacklogRisk: string; surgicalReadinessRisk: string;
  specialHandlingNotes: string; chartQualityRisk: string; aiRiskScore: string;
  status: string; activeFlag: string; archiveState: string;
  createdAt: string; createdBy: string; updatedAt: string; updatedBy: string;
  lastVerifiedDate: string; verificationSource: string;
  mergeCandidate: string; duplicateReview: string;
  externalSyncStatus: string; sourceSystem: string;
  tenantId: string; clinicId: string; notes: string; internalComments: string;
}

const EMPTY_FORM: PatientFormState = {
  mrn: '', externalId: '', firstName: '', middleName: '', lastName: '', suffix: '',
  preferredName: '', legalName: '', dob: '', sexAtBirth: '', genderIdentity: '',
  pronouns: '', ssn: '', maritalStatus: '', employmentStatus: '', occupation: '',
  employer: '', language: 'English', interpreterNeeded: 'No', race: '', ethnicity: '',
  nationality: 'US Citizen',
  mobilePhone: '', homePhone: '', workPhone: '', email: '',
  preferredContact: 'Mobile', address1: '', address2: '', city: '', state: '',
  zip: '', country: 'United States', county: '', timeZone: 'Eastern (ET)',
  seasonalAddress: '',
  emergencyName: '', emergencyRelation: '', emergencyPhone: '',
  guardianName: '', guardianRelation: '', guardianPhone: '',
  primaryPayer: '', primaryPlan: '', memberId: '', groupNumber: '',
  policyHolder: '', policyHolderDob: '', policyHolderEmployer: '',
  relationToSubscriber: 'Self', copay: '', deductible: '', coinsurance: '',
  effectiveDate: '', terminationDate: '', secondaryPayer: '', secondaryPlan: '',
  secondaryMemberId: '', tertiaryPayer: '', priorAuthRequired: 'No',
  referralRequired: 'No', guarantorName: '', guarantorAddress: '', guarantorPhone: '',
  financialClass: 'Commercial', selfPay: 'No',
  pcp: '', referringProvider: '', referringSource: '', clinicLocation: '',
  assignedProvider: '', specialty: '', visitReason: '', ocularHistory: '',
  medicalHistory: '', allergies: 'NKDA', medications: '', fallRisk: 'No',
  mobilityAssistance: 'No', specialAccommodations: '', transportationRisk: 'No',
  surgicalCandidate: 'No', retinaRisk: 'No', glaucomaMonitoring: 'No',
  diabeticEyeCare: 'No',
  visitType: '', newEstablished: 'New', recallCategory: '', preferredLocation: '',
  preferredProvider: '', schedulingNotes: '', noShowRisk: 'Low',
  preferredTimeOfDay: 'Morning', preferredDays: '', reminderPreference: 'SMS',
  waitlistEligible: 'Yes', telehealthEligible: 'No',
  balanceDue: '$0.00', agingBucket: 'Current', collectionsStatus: 'None',
  paymentPlan: 'No', creditHold: 'No', depositRequired: 'No',
  copayCollection: 'Required', refundBalance: '$0.00', badDebt: 'No',
  financialAssistance: 'No',
  hipaaConsent: 'Not signed', financialPolicySigned: 'Not signed',
  assignmentOfBenefits: 'Not signed', releaseOfInfo: 'Not signed',
  consentDate: '', photoConsent: 'Not signed', surgeryConsent: 'N/A',
  portalConsent: 'Not signed', smsConsent: 'Not signed', emailConsent: 'Not signed',
  insuranceCard: '', photoId: '', referralDoc: '', consentForms: '', priorAuthDocs: '',
  portalEnabled: 'No', communicationPreference: 'SMS', marketingOptOut: 'No',
  recallOutreachAllowed: 'Yes', smsAllowed: 'Yes', emailAllowed: 'Yes',
  callAllowed: 'Yes', mailAllowed: 'Yes',
  vipFlag: 'No', interpreterFlag: 'No', collectionsRisk: 'Low',
  complianceRisk: 'Low', noShowRiskLevel: 'Low', imagingBacklogRisk: 'None',
  surgicalReadinessRisk: 'None', specialHandlingNotes: '', chartQualityRisk: 'None',
  aiRiskScore: 'Pending',
  status: 'Active', activeFlag: 'Active', archiveState: 'None',
  createdAt: '', createdBy: '', updatedAt: '', updatedBy: '', lastVerifiedDate: '',
  verificationSource: '', mergeCandidate: 'No', duplicateReview: 'Clear',
  externalSyncStatus: 'Pending', sourceSystem: 'Manual Entry', tenantId: 'AEN-001',
  clinicId: '', notes: '', internalComments: ''
};

export const REGISTRATION_TABS: Array<{ id: RegistrationTab; label: string; badge: string }> = [
  { id: 'identity',      label: 'Identity',              badge: '01' },
  { id: 'demographics',  label: 'Demographics',          badge: '02' },
  { id: 'contact',       label: 'Contact & Address',     badge: '03' },
  { id: 'insurance',     label: 'Insurance & Guarantor', badge: '04' },
  { id: 'clinical',      label: 'Clinical / Referrals',  badge: '05' },
  { id: 'scheduling',    label: 'Scheduling',            badge: '06' },
  { id: 'financial',     label: 'Financial',             badge: '07' },
  { id: 'compliance',    label: 'Compliance & Consents', badge: '08' },
  { id: 'documents',     label: 'Documents',             badge: '09' },
  { id: 'preferences',   label: 'Preferences',           badge: '10' },
  { id: 'risk',          label: 'Risk & Flags',          badge: '11' },
  { id: 'audit',         label: 'Audit & Admin',         badge: '12' },
];

export const DETAIL_TABS: Array<{ id: DetailTab; label: string }> = [
  { id: 'overview',     label: 'Overview'     },
  { id: 'demographics', label: 'Demographics' },
  { id: 'insurance',    label: 'Insurance'    },
  { id: 'financial',    label: 'Financial'    },
  { id: 'clinical',     label: 'Clinical'     },
  { id: 'briefing',     label: 'AI Briefing'  },
];

@Component({
  selector: 'app-patients-page',
  imports: [FormsModule, StatusChipComponent],
  templateUrl: './patients-page.component.html',
  styleUrl: './patients-page.component.scss'
})
export class PatientsPageComponent {
  private readonly store = inject(EnterpriseStoreService);

  protected readonly allPatients    = this.store.patients;
  protected readonly patientBriefings = this.store.patientBriefings;

  protected readonly registrationTabs = REGISTRATION_TABS;
  protected readonly detailTabs       = DETAIL_TABS;

  protected readonly query      = signal('');
  protected readonly selectedId = signal<string | null>(null);
  protected readonly detailTab  = signal<DetailTab>('overview');

  protected readonly showModal       = signal(false);
  protected readonly registrationTab = signal<RegistrationTab>('identity');

  protected form: PatientFormState = { ...EMPTY_FORM };

  protected readonly filteredPatients = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q
      ? this.allPatients().filter(p =>
          p.fullName.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q) ||
          p.insurance.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q) ||
          p.aiFlag.toLowerCase().includes(q)
        )
      : this.allPatients();
  });

  protected readonly selectedPatient = computed(() => {
    const id = this.selectedId();
    return id ? (this.allPatients().find(p => p.id === id) ?? null) : null;
  });

  protected readonly registrationTabIndex = computed(() =>
    REGISTRATION_TABS.findIndex(t => t.id === this.registrationTab())
  );

  protected readonly kpiStats = computed(() => {
    const n = this.allPatients().length;
    return [
      { label: 'Active in scope', value: n.toString(), sub: 'patients today',    tone: 'accent'   as const },
      { label: 'Recall gaps',     value: '7',          sub: 'needs outreach',    tone: 'warning'  as const },
      { label: 'Balance > $250',  value: '14',         sub: 'needs attention',   tone: 'critical' as const },
      { label: 'High-risk today', value: '5',          sub: 'AI flagged',        tone: 'critical' as const },
      { label: 'Unsigned charts', value: '3',          sub: 'due today',         tone: 'warning'  as const },
      { label: 'Pending auths',   value: '6',          sub: 'expiring this week', tone: 'warning' as const },
    ];
  });

  protected readonly savedAt = signal<string>('');

  protected saveDraft(): void {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    this.savedAt.set(`Draft saved ${h > 12 ? h - 12 : h}:${m} ${ampm}`);
  }

  protected setQuery(value: string): void { this.query.set(value); }

  protected selectPatient(id: string): void {
    this.selectedId.set(this.selectedId() === id ? null : id);
    this.detailTab.set('overview');
  }

  protected setDetailTab(tab: DetailTab): void { this.detailTab.set(tab); }

  protected openNewPatient(): void {
    this.form = { ...EMPTY_FORM };
    this.registrationTab.set('identity');
    this.showModal.set(true);
  }

  protected closeModal(): void { this.showModal.set(false); }

  protected setRegistrationTab(tab: RegistrationTab): void {
    this.registrationTab.set(tab);
  }

  protected nextTab(): void {
    const idx = this.registrationTabIndex();
    if (idx < REGISTRATION_TABS.length - 1) {
      this.registrationTab.set(REGISTRATION_TABS[idx + 1].id);
    }
  }

  protected prevTab(): void {
    const idx = this.registrationTabIndex();
    if (idx > 0) {
      this.registrationTab.set(REGISTRATION_TABS[idx - 1].id);
    }
  }

  protected submitRegistration(): void { this.showModal.set(false); }

  protected stopProp(e: MouseEvent): void { e.stopPropagation(); }

  protected trackById(_: number, p: PatientRecord): string { return p.id; }
}
