export type SurfaceTone = 'accent' | 'success' | 'warning' | 'critical' | 'neutral' | 'info';
export type MetricKind = 'status' | 'trend' | 'queue' | 'target' | 'risk';

export interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

export interface NavigationItem {
  label: string;
  route: string;
  icon: string;
  summary: string;
  badge?: string;
  counter?: string;
  children?: string[];
  tone?: SurfaceTone;
}

export interface ClinicContext {
  id: string;
  shortLabel: string;
  name: string;
  region: string;
  readiness: number;
  waitMinutes: number;
  utilization: number;
  openIssues: number;
  revenueDelta: string;
  statusLabel?: string;
  statusTone?: SurfaceTone;
  pressureSource?: string;
  nextThreshold?: string;
}

export interface ProviderContext {
  id: string;
  clinicId: string;
  shortLabel: string;
  name: string;
  specialty: string;
  status: string;
  utilization: number;
  room: string;
  nextSlot: string;
}

export interface SystemIndicator {
  label: string;
  value: string;
  tone: SurfaceTone;
  detail: string;
}

export interface AlertRecord {
  id: string;
  title: string;
  detail: string;
  tone: SurfaceTone;
  count: number;
  clinic: string;
}

export interface QuickAction {
  label: string;
  detail: string;
  tone: SurfaceTone;
}

export interface ExecutiveMetricDetail {
  label: string;
  value: string;
  tone?: SurfaceTone;
}

export interface ExecutiveMetric {
  id: string;
  label: string;
  value: string;
  delta: string;
  detail: string;
  tone: SurfaceTone;
  spark: number[];
  kind?: MetricKind;
  details?: ExecutiveMetricDetail[];
}

export interface LiveBoardRow {
  label: string;
  supporting: string;
  value: string;
  tone: SurfaceTone;
  tags: string[];
}

export interface LiveBoardCard {
  id: string;
  title: string;
  subtitle: string;
  tone: SurfaceTone;
  rows: LiveBoardRow[];
  footer: string;
}

export interface DailyBriefingSignal {
  label: string;
  value: string;
  detail: string;
  tone: SurfaceTone;
}

export interface DailyBriefing {
  id: string;
  headline: string;
  summary: string;
  bullets: string[];
  tone: SurfaceTone;
  updatedAt: string;
  signals?: DailyBriefingSignal[];
  recommendedActions?: string[];
}

export interface AiInsight {
  id: string;
  category: string;
  title: string;
  summary: string;
  rationale: string;
  recommendation: string;
  confidence: string;
  tone: SurfaceTone;
}

export interface ActionQueueItem {
  id: string;
  title: string;
  owner: string;
  clinic: string;
  due: string;
  workflow: string;
  nextStep: string;
  tone: SurfaceTone;
  count: string;
}

export interface OperationsMatrixRow {
  clinicId: string;
  clinic: string;
  waitTime: string;
  waitTone: SurfaceTone;
  utilization: string;
  utilizationTone: SurfaceTone;
  imagingBacklog: string;
  imagingTone: SurfaceTone;
  ascReadiness: string;
  ascTone: SurfaceTone;
  claimsRisk: string;
  claimsTone: SurfaceTone;
  staffLoad: string;
  staffTone: SurfaceTone;
  recommendedAction: string;
  note: string;
}

export interface CommandSignal {
  id: string;
  title: string;
  value: string;
  detail: string;
  meta: string;
  tone: SurfaceTone;
}

export interface PatientRecord {
  id: string;
  clinicId: string;
  mrn: string;
  fullName: string;
  dob: string;
  status: string;
  statusTone: SurfaceTone;
  lastEncounter: string;
  nextVisit: string;
  balance: string;
  insurance: string;
  chartCompleteness: string;
  careGap: string;
  imageStatus: string;
  aiFlag: string;
}

export interface PatientTimelineItem {
  time: string;
  title: string;
  detail: string;
  tone: SurfaceTone;
}

export interface PatientBriefing {
  title: string;
  summary: string;
  tone: SurfaceTone;
}

export interface ScheduleBlock {
  time: string;
  duration: string;
  patient: string;
  visitType: string;
  status: string;
  tone: SurfaceTone;
  lane: string;
}

export interface ScheduleLane {
  clinicId: string;
  provider: string;
  specialty: string;
  utilization: string;
  lag: string;
  blocks: ScheduleBlock[];
}

export interface WaitlistRecord {
  clinicId: string;
  patient: string;
  request: string;
  preferredWindow: string;
  fitScore: string;
  tone: SurfaceTone;
  /* Extended optional fields */
  mrn?: string;
  dob?: string;
  phone?: string;
  insurance?: string;
  referringProvider?: string;
  waitlistDate?: string;
  priority?: string;
  laterality?: string;
  visitType?: string;
  appointmentType?: string;
  providerPreference?: string;
  insuranceName?: string;
  contactPhone?: string;
  addedDate?: string;
  chiefComplaint?: string;
  authStatus?: string;
  eligibilityStatus?: string;
  addedBy?: string;
  notes?: string;
}

export interface AppointmentRecord {
  id: string;
  clinicId: string;
  /* Overview */
  appointmentType: string;
  visitCategory: string;
  status: string;
  tone: SurfaceTone;
  priority: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  provider: string;
  secondaryProvider: string;
  room: string;
  lane: string;
  specialty: string;
  /* Patient */
  patient: string;
  mrn: string;
  dob: string;
  phone: string;
  email: string;
  /* Clinical */
  laterality: string;
  visitReason: string;
  chiefComplaint: string;
  referringProvider: string;
  recallType: string;
  recallInterval: string;
  linkedEncounterId: string;
  preOpNotes: string;
  /* Insurance */
  primaryPayer: string;
  memberId: string;
  eligibilityStatus: string;
  eligibilityVerifiedDate: string;
  authRequired: boolean;
  authNumber: string;
  authValidFrom: string;
  authValidTo: string;
  referralNumber: string;
  copayCollected: boolean;
  copayAmount: string;
  /* Pre-visit checklist */
  consentSigned: boolean;
  hipaaAcknowledged: boolean;
  idVerified: boolean;
  insuranceCardCopied: boolean;
  medicalHistoryReviewed: boolean;
  medicationsReviewed: boolean;
  allergiesReviewed: boolean;
  specialPrep: string;
  patientArrivalTime: string;
  /* Audit */
  createdBy: string;
  createdOn: string;
  confirmedBy: string;
  confirmedOn: string;
  cancelReason: string;
  noShowReason: string;
  internalNotes: string;
  /* Source prefill tracking */
  sourcePatientId?: string;
  sourceWaitlistId?: string;
}

export interface EncounterValue {
  label: string;
  value: string;
  tone?: SurfaceTone;
}

export interface EncounterSection {
  title: string;
  status: string;
  tone: SurfaceTone;
  detail: string;
  values: EncounterValue[];
}

export interface EncounterWorkspace {
  clinicId: string;
  patientName: string;
  chartStatus: string;
  completionScore: string;
  visitReason: string;
  flags: string[];
  timeline: PatientTimelineItem[];
  sections: EncounterSection[];
  aiSummary: AiInsight[];
}

export interface ImagingStudy {
  clinicId: string;
  patient: string;
  modality: string;
  studyId: string;
  orderedBy: string;
  status: string;
  tone: SurfaceTone;
  findings: string;
  aiSignal: string;
  studyDate?: string;
  laterality?: string;
  clinicalIndication?: string;
  urgency?: string;
  protocol?: string;
  cptCode?: string;
  reportedBy?: string;
  reportedDate?: string;
  impressionSummary?: string;
  qualityScore?: string;
  linkedEncounterId?: string;
}

export interface SurgeryCase {
  clinicId: string;
  patient: string;
  procedure: string;
  surgeon: string;
  date: string;
  readiness: string;
  tone: SurfaceTone;
  implant: string;
  clearance: string;
  risk: string;
  // Extended fields
  caseId?: string;
  side?: string;
  scheduledTime?: string;
  anesthesiaType?: string;
  anesthesiologist?: string;
  circulator?: string;
  iOLModel?: string;
  iOLPower?: string;
  axialLength?: string;
  targetRefraction?: string;
  allergies?: string;
  comorbidities?: string;
  preOpDiagnosis?: string;
  postOpPlan?: string;
  consentSigned?: boolean;
  consentDate?: string;
  bloodType?: string;
  h2Status?: string;
  antibioticProphylaxis?: string;
  specialEquipment?: string;
  caseNotes?: string;
  aiFlag?: string;
  checklistComplete?: boolean;
  biometryConfirmed?: boolean;
  patientWeight?: string;
  patientHeight?: string;
  emergencyContact?: string;
  transportArranged?: boolean;
  preOpLab?: string;
  preOpECG?: string;
}

export interface OpticalOrder {
  clinicId: string;
  patient: string;
  order: string;
  lens: string;
  frame: string;
  status: string;
  tone: SurfaceTone;
  pickup: string;
  recommendation: string;
  /* Prescription fields */
  odSphere?: string;
  odCylinder?: string;
  odAxis?: string;
  odAdd?: string;
  osSphere?: string;
  osCylinder?: string;
  osAxis?: string;
  osAdd?: string;
  pd?: string;
  nearPd?: string;
  /* Order details */
  mrn?: string;
  dob?: string;
  phone?: string;
  insurance?: string;
  provider?: string;
  prescribedBy?: string;
  lab?: string;
  labName?: string;
  labOrderId?: string;
  rxDate?: string;
  dispenseDate?: string;
  deliveryMethod?: string;
  coating?: string;
  coatings?: string;
  tint?: string;
  notes?: string;
  balanceDue?: string;
  depositPaid?: string;
}

export interface ClaimCptRow {
  cptCode: string;
  modifier1: string;
  modifier2: string;
  units: string;
  diagPointer: string;
  serviceDate: string;
  pos: string;
  charge: string;
  renderingNpi: string;
  ndcCode: string;
  notes: string;
}

export interface ClaimRecord {
  clinicId: string;
  claim: string;
  patient: string;
  payer: string;
  amount: string;
  status: string;
  tone: SurfaceTone;
  denialRisk: string;
  nextAction: string;
  /* Extended production-grade fields (all optional for backward-compat) */
  cptCodes?: string;
  modifiers?: string;
  units?: number | string;
  revenueCode?: string;
  icd10Primary?: string;
  icd10Secondary?: string;
  icd10Tertiary?: string;
  paidAmount?: string;
  submittedDate?: string;
  billingNotes?: string;
  claimType?: string;
  priority?: string;
  dateOfService?: string;
  billingBatch?: string;
  placeOfService?: string;
  renderingProvider?: string;
  billingProvider?: string;
  referringProvider?: string;
  assignedBiller?: string;
  workQueue?: string;
  mrn?: string;
  accountNumber?: string;
  patientDob?: string;
  patientSex?: string;
  subscriberName?: string;
  subscriberDob?: string;
  subscriberMemberId?: string;
  subscriberGroupNumber?: string;
  subscriberRelationship?: string;
  eligibilityStatus?: string;
  eligibilityVerifiedDate?: string;
  primaryPayer?: string;
  secondaryPayer?: string;
  financialClass?: string;
  authNumber?: string;
  authValidFrom?: string;
  authValidTo?: string;
  referralNumber?: string;
  laterality?: string;
  visitType?: string;
  primaryDx?: string;
  secondaryDx?: string;
  tertiaryDx?: string;
  globalPeriodIndicator?: boolean;
  postOpDay?: string;
  relatedSurgeryDate?: string;
  medicalNecessityNotes?: string;
  cptRows?: ClaimCptRow[];
  totalCharges?: string;
  allowedAmount?: string;
  expectedReimbursement?: string;
  copay?: string;
  deductible?: string;
  patientResponsibility?: string;
  contractualAdjustment?: string;
  balanceDue?: string;
  feeSchedule?: string;
  submissionMethod?: string;
  submissionTrackingNumber?: string;
  resubmissionCode?: string;
  submissionNotes?: string;
  validationStatus?: string;
  denialCode?: string;
  denialCategory?: string;
  denialDescription?: string;
  followUpOwner?: string;
  followUpDate?: string;
  appealDeadline?: string;
  appealStatus?: string;
  rootCauseCategory?: string;
  internalBillingNotes?: string;
  createdBy?: string;
  createdOn?: string;
  updatedBy?: string;
  updatedOn?: string;
}

export interface ComplianceEvent {
  clinicId: string;
  event: string;
  actor: string;
  clinic: string;
  time: string;
  tone: SurfaceTone;
  detail: string;
}

export interface AnalyticsPoint {
  label: string;
  value: string;
  delta: string;
  tone: SurfaceTone;
  detail: string;
}

export interface InventoryRecord {
  clinicId: string;
  item: string;
  location: string;
  onHand: string;
  daysRemaining: string;
  tone: SurfaceTone;
  forecast: string;
  nextOrder: string;

  // Basic Identification
  id?: string;
  itemName?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  manufacturer?: string;
  model?: string;
  sku?: string;
  mfrPartNumber?: string;
  lotNumber?: string;
  udi?: string;
  description?: string;
  clinicalNotes?: string;

  // Stock & Inventory Control
  onHandQty?: number;
  availableQty?: number;
  reservedQty?: number;
  reorderPoint?: number;
  reorderQty?: number;
  parLevel?: number;
  maxLevel?: number;
  unitOfMeasure?: string;
  packageSize?: string;
  unitsPerCase?: number;
  avgMonthlyUsage?: number;
  leadTimeDays?: number;
  lastRestockedDate?: string;
  nextOrderDate?: string;
  lastCountDate?: string;
  countVariance?: number;
  inventoryStatus?: string;

  // Location & Storage
  facility?: string;
  department?: string;
  room?: string;
  cabinetBin?: string;
  storageCondition?: string;
  assignedTeam?: string;
  secondaryLocation?: string;

  // Financial & Procurement
  preferredVendor?: string;
  secondaryVendor?: string;
  unitCost?: number;
  lastPurchaseCost?: number;
  contractPrice?: number;
  budgetCategory?: string;
  purchaseFrequency?: string;
  lastOrderDate?: string;
  lastReceivedDate?: string;
  invoiceRef?: string;
  taxable?: boolean;

  // Compliance & Traceability
  expirationDate?: string;
  requiresTempControl?: boolean;
  sterile?: boolean;
  controlledItem?: boolean;
  recallFlag?: boolean;
  regulatoryCategory?: string;
  fdaCompliance?: string;
  auditRequired?: boolean;
  custodyNotes?: string;

  // Lifecycle
  usageType?: string;
  serviceable?: boolean;
  calibrationRequired?: boolean;
  maintenanceRequired?: boolean;
  warrantyExpiration?: string;
  usefulLifeMonths?: number;
  retirementCriteria?: string;
  decommissioned?: boolean;

  // Notes & Audit
  internalNotes?: string;
  attachmentCount?: number;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface IntegrationFeedItem {
  name: string;
  status: string;
  tone: SurfaceTone;
  lastSync: string;
  detail: string;
}

export interface RoleMatrixItem {
  role: string;
  scope: string;
  clinics: string;
  mfa: string;
  lastChange: string;
  tone: SurfaceTone;
}

export interface ProviderProductivity {
  clinicId: string;
  provider: string;
  focus: string;
  encounters: string;
  utilization: string;
  documentationLag: string;
  collections: string;
  tone: SurfaceTone;
}

// ── Doctor Cockpit / Today's Clinic ──────────────────────────────────────────
export type FlowStation =
  | 'checked-in' | 'tech-workup' | 'imaging'
  | 'dilating' | 'ready' | 'with-doctor' | 'checkout';

export interface ReadinessItem {
  label: string;
  done: boolean;
  required: boolean;
}

/** Audit entry for a patient stage movement on the Live Patient Flow board. */
export interface FlowMove {
  id?: string;           // storage id (patientId + sequence)
  patientId?: string;    // owning patient (for Firestore grouping)
  at: string;            // timestamp label, e.g. "9:42 AM"
  iso?: string;          // sortable ISO timestamp (Sprint 6)
  from: FlowStation;
  to: FlowStation;
  skipped: boolean;      // true if the move jumped past required stages
  reason?: string;       // required justification when skipping
}

/** A clinical note appended to a patient's encounter from the drawer. */
export interface ClinicalNote {
  at: string;
  author: string;
  text: string;
}

/** A timestamped audit entry for an imaging or claim work item. */
export interface WorkAudit {
  at: string;
  iso?: string;          // sortable ISO timestamp (Sprint 6)
  action: string;
  detail?: string;
}

// ── Encounter workflow (Sprint 6) ────────────────────────────────────────────
export type EncounterStageId =
  | 'checked-in' | 'intake' | 'pre-test' | 'provider-exam'
  | 'assessment' | 'orders' | 'checkout' | 'billing-ready';

export type StageStatus = 'not-started' | 'in-progress' | 'complete' | 'blocked';

export type EncounterOrderType = 'imaging' | 'procedure' | 'medication' | 'referral' | 'follow-up' | 'surgery-consult';

export interface EncounterOrder {
  id: string;
  type: EncounterOrderType;
  detail: string;
  status: 'ordered' | 'in-progress' | 'completed';
  createdAt: string;     // ISO
}

export interface EncounterAudit {
  at: string;
  iso: string;           // sortable
  action: string;
  detail?: string;
}

/**
 * Workflow state for a patient's visit. Clinical truth (VA/IOP/exam/dx/plan)
 * lives in PatientClinicalRecord; this record carries stage progress and the
 * workflow-specific fields (intake, workup extras, A/P extras, orders, checkout).
 */
export interface EncounterRecord {
  patientId: string;
  mrn: string;
  encounterId: string;
  intake?: {
    chiefComplaint?: string;
    visitType?: string;
    eye?: 'OD' | 'OS' | 'OU';
    allergiesReviewed?: boolean;
    medsReviewed?: boolean;
    ocularHxReviewed?: boolean;
    systemicHxReviewed?: boolean;
    consentStatus?: 'pending' | 'signed' | 'n/a';
    notes?: string;
    completedAt?: string;
  };
  workup?: {
    pupils?: string;
    eom?: string;
    confrontation?: string;
    refractionStatus?: string;
    dilationStatus?: string;
    techNotes?: string;
    completedAt?: string;
  };
  assessment?: {
    followUpInterval?: string;
    patientEducation?: string;
    medicationChanges?: string;
    procedureRecommendation?: string;
    surgeryConsider?: boolean;
    completedAt?: string;
  };
  examCompletedAt?: string;
  orders: EncounterOrder[];
  checkout?: {
    instructionsReady?: boolean;
    completedAt?: string;
  };
  audit: EncounterAudit[];
  updatedAt?: string;
}

// ── EMR clinical record (persisted, editable) ────────────────────────────────
export interface ClinicalAllergy { substance: string; reaction?: string; severity?: 'mild' | 'moderate' | 'severe'; }
export interface ClinicalMedication { name: string; dose?: string; route?: string; }
export interface ClinicalDiagnosis { icd10?: string; description?: string; eye?: 'OD' | 'OS' | 'OU' | 'N/A'; }

export interface PatientClinicalRecord {
  patientId: string;
  mrn: string;
  encounterId: string;
  providerId?: string;
  visitDate?: string;
  chiefComplaint?: string;
  visualAcuity: { od?: string; os?: string; ou?: string; pinholeOd?: string; pinholeOs?: string; };
  iop: { od?: number; os?: number; method?: 'Goldmann' | 'iCare' | 'Tonopen' | 'Other'; measuredAt?: string; };
  allergies: ClinicalAllergy[];
  medications: ClinicalMedication[];
  ocularHistory: string[];
  systemicHistory?: string[];
  examFindings: {
    external?: string; lidsLashes?: string; conjunctiva?: string; cornea?: string;
    anteriorChamber?: string; iris?: string; lens?: string; vitreous?: string;
    retina?: string; opticNerve?: string; macula?: string; vessels?: string; periphery?: string;
  };
  diagnosis: ClinicalDiagnosis[];
  assessmentPlan?: string;
  updatedAt?: string;
  updatedBy?: string;
}

/**
 * Canonical patient identity (Sprint 8) — unifies the demographic roster and
 * the clinically-active encounter datasets behind one patient model.
 */
export type PatientMatchStatus =
  | 'linked' | 'possible-match' | 'unmatched-roster' | 'unmatched-encounter' | 'merged';

export interface CanonicalPatient {
  id: string;                 // canonical id (flow id when clinical, else roster id)
  canonicalMrn: string;
  legacyMrns: string[];
  name: string;
  dob?: string;
  age?: number;
  insurance?: string;
  flowId?: string;            // → clinical / encounter / imaging / billing / flow records
  rosterId?: string;          // → demographic record
  source: 'registry' | 'flow' | 'merged';
  matchStatus: PatientMatchStatus;
  hasEncounter: boolean;
  possibleDuplicate?: boolean;
  // demographic passthrough
  status?: string;
  lastEncounter?: string;
  nextVisit?: string;
  balance?: string;
  careGap?: string;
}

/** Document maintenance record (Sprint 9D) — metadata only; file lives in Storage. */
export interface DocumentRecord {
  id: string;
  clinicId: string;
  title: string;
  category: 'Clinical' | 'Insurance' | 'Referral' | 'Imaging' | 'Billing' | 'Consent' | 'Administrative' | 'Other';
  status: 'Draft' | 'Active' | 'Archived';
  linkedEntityType: 'patient' | 'referral' | 'claim' | 'imaging' | 'provider' | 'location' | 'general';
  linkedEntityId: string;
  patientId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;            // privacy-safe path; NO public URL persisted
  uploadStatus?: 'uploaded' | 'pending' | 'failed';
  uploadedBy?: string;
  uploadedAt: string;
  updatedAt: string;
  description?: string;
  tags?: string[];
  privacyLevel: 'Standard' | 'Restricted' | 'Confidential';
  notes?: string;
}

/** Document lifecycle audit event (Sprint 9D). */
export interface DocumentAudit {
  id?: string;
  documentId: string;
  action: 'uploaded' | 'updated' | 'archived' | 'restored' | 'viewed' | 'downloaded';
  at: string;
  iso: string;
  by?: string;
  detail?: string;
}

/** Referral maintenance record (Sprint 9C). */
export interface ReferralRecord {
  id: string;
  clinicId: string;
  referralNumber: string;
  // Patient / source
  patient?: string;
  patientMrn?: string;
  referralSource?: string;          // referring provider / practice (required)
  referringProvider?: string;
  referringPractice?: string;
  sourcePhone?: string;
  // Provider routing
  toProvider?: string;
  toLocation?: string;
  specialty?: string;
  // Authorization / insurance
  authRequired?: boolean;
  authNumber?: string;
  insurance?: string;
  validFrom?: string;
  validTo?: string;
  visitsAuthorized?: string;
  // Clinical reason
  reason?: string;
  diagnosis?: string;
  clinicalNotes?: string;
  // Status
  status?: string;                  // New / Pending / Scheduled / Completed / Declined / Expired
  priority?: string;
  notes?: string;
  active?: boolean;
  createdBy?: string; createdOn?: string; updatedBy?: string; updatedOn?: string;
}

/** General Ledger account maintenance record (Sprint 9C). */
export interface GLAccountRecord {
  id: string;
  clinicId: string;
  accountCode: string;              // locked identifier
  accountName: string;
  accountType?: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  normalBalance?: 'Debit' | 'Credit';
  // Classification
  subType?: string;
  category?: string;
  // Posting rules
  allowManualPosting?: boolean;
  requireDepartment?: boolean;
  defaultDepartment?: string;
  // Tax / reporting
  taxCode?: string;
  reportingCategory?: string;
  statementLine?: string;
  // System protection
  systemAccount?: boolean;          // core account — code/type/balance locked
  // Status
  active?: boolean;
  description?: string;
  notes?: string;
  createdBy?: string; createdOn?: string; updatedBy?: string; updatedOn?: string;
}

/** Provider / staff maintenance record (Sprint 9B). */
export interface ProviderRecord {
  id: string;
  clinicId: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  credentials?: string;        // MD / OD / COA …
  npi?: string;
  // Specialty / role
  specialty?: string;
  role?: 'Physician' | 'OD' | 'Technician' | 'Billing' | 'Scheduler' | 'Admin';
  defaultLocation?: string;
  // Credentials
  licenseNumber?: string;
  deaNumber?: string;
  taxonomy?: string;
  // Schedule defaults
  defaultStartTime?: string;
  defaultEndTime?: string;
  slotMinutes?: string;
  workingDays?: string;
  // Billing flags
  billingProvider?: boolean;
  renderingProvider?: boolean;
  referringProvider?: boolean;
  // Contact / status
  phone?: string;
  email?: string;
  active?: boolean;
  notes?: string;
  createdBy?: string; createdOn?: string; updatedBy?: string; updatedOn?: string;
}

/** Location / facility maintenance record (Sprint 9B). */
export interface LocationRecord {
  id: string;
  clinicId: string;
  name: string;
  type?: 'Clinic' | 'Surgery Center' | 'Optical' | 'Admin' | 'Imaging';
  // Address
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  timeZone?: string;
  // Operating hours / capacity
  hours?: string;
  defaultCapacity?: string;
  rooms?: string;              // comma-separated resource list
  // Billing / facility
  facilityNpi?: string;
  taxId?: string;
  placeOfService?: string;
  // Status
  active?: boolean;
  notes?: string;
  createdBy?: string; createdOn?: string; updatedBy?: string; updatedOn?: string;
}

/** Insurance payer maintenance record (Sprint 9A). */
export interface InsuranceRecord {
  id: string;
  clinicId: string;
  payerName: string;
  payerId: string;
  payerType?: string;        // Commercial / Government / Vision / Self-pay
  planType?: string;         // HMO / PPO / Medicare / Medicaid
  ediPayerId?: string;
  // Eligibility
  eligibilityPhone?: string;
  eligibilityStatus?: string;
  eligibilityVerified?: string;
  // Rules / Authorization
  authRequired?: boolean;
  authPhone?: string;
  timelyFilingDays?: string;
  referralRequired?: boolean;
  // Billing defaults
  claimsAddress?: string;
  feeSchedule?: string;
  defaultPlaceOfService?: string;
  acceptsElectronic?: boolean;
  // Audit
  active?: boolean;
  notes?: string;
  createdBy?: string; createdOn?: string; updatedBy?: string; updatedOn?: string;
}

/** Guarantor (financially responsible party) maintenance record (Sprint 9A). */
export interface GuarantorRecord {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  // Relationship
  relationship?: string;
  linkedPatient?: string;
  linkedPatientMrn?: string;
  dob?: string;
  ssnLast4?: string;
  // Contact
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  // Financial responsibility
  responsibilityPct?: string;
  billingPreference?: string;
  statementDelivery?: string;
  // Audit
  active?: boolean;
  notes?: string;
  createdBy?: string; createdOn?: string; updatedBy?: string; updatedOn?: string;
}

/** Confirmed canonical identity link (non-destructive — never mutates sources). */
export interface CanonicalIdentityMapping {
  id: string;
  canonicalPatientId: string;          // the clinical (flow) patient id
  sourceType: 'roster' | 'encounter' | 'billing' | 'imaging';
  sourcePatientId: string;             // the demographic (roster) record id
  legacyMrn?: string;
  confidence?: number;
  confirmedBy?: string;
  confirmedAt?: string;                // ISO
  auditReason?: string;
}

/** A reviewed identity-match decision so false matches don't resurface. */
export interface IdentityMatchDecision {
  id: string;                          // deterministic pair key
  candidateA: string;
  candidateB: string;
  decision: 'confirmed' | 'rejected';
  reason?: string;
  confidence?: number;
  reviewedBy?: string;
  reviewedAt?: string;                 // ISO
}

/** Timestamped clinical change record for the unified patient history. */
export interface ClinicalAuditEntry {
  id?: string;
  patientId: string;
  encounterId?: string;
  action: 'clinical-update';
  changedSections: string[];
  note?: string;
  createdAt: string;
  iso?: string;          // sortable ISO timestamp (Sprint 6)
  createdBy?: string;
}

/**
 * Persisted operational state for a patient's imaging or claim work item.
 * Keyed by patientId. Status drives the module work queues; the Command
 * Center reflects these statuses back into its risk flags / KPIs.
 */
export interface WorkItemState {
  id: string;            // patientId (Firestore docId)
  status?: string;       // lifecycle status (module-specific)
  holdReason?: string;   // claims: reason a claim is on hold
  notes?: ClinicalNote[];
  audit?: WorkAudit[];
}

export interface PatientFlowRecord {
  id: string;
  clinicId: string;
  mrn: string;
  name: string;
  age: number;
  visitType: string;
  visitCategory: 'cataract' | 'retina' | 'glaucoma' | 'comprehensive' | 'post-op' | 'lasik' | 'optical' | 'injection';
  laterality?: 'OD' | 'OS' | 'OU';
  station: FlowStation;
  provider: string;
  scheduledTime: string;
  arrivedAt: string;
  waitMinutes: number;
  tone: SurfaceTone;
  readinessItems: ReadinessItem[];
  nextAction: string;
  aiFlag?: string;
  insurance?: string;
  injectionMedication?: string;
  authStatus?: 'valid' | 'expired' | 'pending';
  authExpiry?: string;
  lateralityConfirmed?: boolean;
  octComplete?: boolean;
  consentCurrent?: boolean;
  biometryComplete?: boolean;
  lensSelected?: boolean;
  consentSigned?: boolean;
  clearanceReceived?: boolean;
  iolOrdered?: boolean;
  // ── Encounter-level state (persisted) ──
  urgent?: boolean;
  notes?: ClinicalNote[];
}

export interface CockpitImagingItem {
  id: string;
  clinicId: string;
  patientName: string;
  mrn: string;
  modality: string;
  status: 'pending' | 'in-progress' | 'complete' | 'overdue';
  tone: SurfaceTone;
  waitMinutes: number;
  room: string;
  priority: 'stat' | 'routine' | 'overdue';
}

export interface SurgicalReadinessCase {
  id: string;
  clinicId: string;
  patientName: string;
  mrn: string;
  procedure: string;
  surgeryDate: string;
  provider: string;
  biometryComplete: boolean;
  lensSelected: boolean;
  consentSigned: boolean;
  clearanceReceived: boolean;
  iolOrdered: boolean;
  ascPacketComplete: boolean;
  insuranceAuth: boolean;
  postOpScheduled: boolean;
  blockers: string[];
  tone: SurfaceTone;
}

export interface InjectionSafetyRecord {
  id: string;
  clinicId: string;
  patientName: string;
  mrn: string;
  medication: string;
  laterality: 'OD' | 'OS' | 'OU';
  authStatus: 'valid' | 'expired' | 'pending';
  authExpiry?: string;
  octComplete: boolean;
  lateralityConfirmed: boolean;
  consentCurrent: boolean;
  medicationVerified: boolean;
  lotCaptured: boolean;
  tone: SurfaceTone;
  blockers: string[];
}

export interface AiBriefingItem {
  type: 'critical' | 'warning' | 'info' | 'success';
  text: string;
}

