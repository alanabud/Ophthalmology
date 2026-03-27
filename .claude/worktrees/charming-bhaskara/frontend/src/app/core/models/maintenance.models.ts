/**
 * ENTERPRISE MAINTENANCE DATA MODELS
 * EyeNet Ophthalmology Platform — Premium Enterprise Edition
 *
 * Field depth requirements:
 * - Identifiers, internal/external codes
 * - Short/long names, descriptions, categories
 * - Status & lifecycle state fields
 * - Effective/expiration dates, timestamps
 * - Created_by / updated_by / approved_by
 * - Locking/version fields, audit trail
 * - Tenant/clinic scoping, compliance flags
 * - Integration mapping fields, reporting tags
 * - Workflow routing, escalation, risk flags
 * - Billing and clinical relevance flags
 * - Custom attributes / extensibility support
 */

import { SurfaceTone } from './enterprise.models';

/* ================================================================
   SHARED AUDIT / LIFECYCLE FIELDS
   ================================================================ */

export interface AuditTrail {
  createdAt:        string;
  createdBy:        string;
  createdByName:    string;
  updatedAt:        string;
  updatedBy:        string;
  updatedByName:    string;
  version:          number;
  isLocked:         boolean;
  lockedAt?:        string;
  lockedBy?:        string;
  lockedReason?:    string;
  approvedAt?:      string;
  approvedBy?:      string;
  approvedByName?:  string;
  lastReviewedAt?:  string;
  lastReviewedBy?:  string;
  archivedAt?:      string;
  archivedBy?:      string;
  changeNote?:      string;
}

export type ActiveState   = 'active' | 'inactive' | 'archived' | 'pending' | 'suspended';
export type ApprovalState = 'approved' | 'pending_review' | 'rejected' | 'draft';

/* ================================================================
   ORGANIZATION
   ================================================================ */

export interface Organization extends AuditTrail {
  id:                    string;
  externalId?:           string;           // integration reference
  shortCode:             string;           // 2-6 char code
  legalName:             string;
  displayName:           string;
  dba?:                  string;           // Doing Business As
  ein:                   string;           // Employer ID Number
  npi:                   string;           // National Provider Identifier (Org)
  taxonomy:              string;           // NUCC taxonomy code
  medicareProvider?:     string;
  medicaidProvider?:     string;
  accreditationBody?:    string;           // AAAHC, Joint Commission, etc.
  accreditationNumber?:  string;
  accreditationExpiry?:  string;
  organizationType:      'health_system' | 'group_practice' | 'asc' | 'optical' | 'independent';
  ownershipType:         'private' | 'public' | 'non_profit' | 'hospital_based' | 'pe_backed';
  primaryContact:        string;
  primaryEmail:          string;
  primaryPhone:          string;
  faxNumber?:            string;
  billingAddress:        Address;
  physicalAddress:       Address;
  mailingAddress?:       Address;
  website?:              string;
  logoUrl?:              string;
  fiscalYearStart:       string;           // MM-DD
  timezone:              string;
  currency:              string;
  languageDefault:       string;
  clinicCount:           number;
  providerCount:         number;
  activeState:           ActiveState;
  complianceStatus:      ApprovalState;
  hipaaOfficer:          string;
  privacyOfficer:        string;
  complianceOfficer:     string;
  billingContact:        string;
  itContact:             string;
  emrSystemName?:        string;
  emrVersion?:           string;
  pmSystemName?:         string;
  clearinghouse?:        string;
  practiceManagementId?: string;
  contractStartDate?:    string;
  contractEndDate?:      string;
  subscriptionTier?:     string;
  customAttributes?:     Record<string, string>;
  notes?:                string;
  reportingTag?:         string;
  sortOrder:             number;
}

/* ================================================================
   ADDRESS (shared)
   ================================================================ */

export interface Address {
  line1:    string;
  line2?:   string;
  city:     string;
  state:    string;
  zip:      string;
  country:  string;
  county?:  string;
  lat?:     number;
  lng?:     number;
}

/* ================================================================
   CLINIC
   ================================================================ */

export interface Clinic extends AuditTrail {
  id:                     string;
  organizationId:         string;
  organizationName:       string;
  externalId?:            string;
  shortLabel:             string;           // 2-4 char code
  name:                   string;
  displayName:            string;
  dba?:                   string;
  clinicType:             'ophthalmology' | 'retina' | 'glaucoma' | 'cataract_asc' | 'optometry' | 'optical' | 'multi_specialty';
  specialties:            string[];
  address:                Address;
  phone:                  string;
  fax?:                   string;
  email?:                 string;
  website?:               string;
  npi:                    string;
  tin:                    string;
  medicareNumber?:        string;
  medicaidNumber?:        string;
  placeOfServiceCode:     string;           // CMS POS code
  billingName:            string;
  billingNpi?:            string;
  timezone:               string;
  businessHours:          BusinessHours[];
  holidaySchedule?:       string;           // ref to holiday template
  examRoomCount:          number;
  operatingRoomCount:     number;
  laserSuiteCount:        number;
  imagingRoomCount:       number;
  maxDailyCapacity:       number;
  targetUtilization:      number;           // 0-100
  waitTimeTargetMinutes:  number;
  emrSiteId?:             string;
  pmSiteId?:              string;
  clearinghouseSiteId?:   string;
  primaryPhysician:       string;
  clinicDirector:         string;
  officeManager:          string;
  billingContact:         string;
  techContact?:           string;
  isAscLicensed:          boolean;
  ascLicenseNumber?:      string;
  ascLicenseExpiry?:      string;
  isMedicareApproved:     boolean;
  isMedicaidApproved:     boolean;
  accreditationBody?:     string;
  accreditationNumber?:   string;
  accreditationExpiry?:   string;
  complianceStatus:       ApprovalState;
  activeState:            ActiveState;
  isTestClinic:           boolean;
  parentClinicId?:        string;           // satellite → main
  networkRegion:          string;
  reportingGroup?:        string;
  customAttributes?:      Record<string, string>;
  notes?:                 string;
  sortOrder:              number;
}

export interface BusinessHours {
  dayOfWeek:    0 | 1 | 2 | 3 | 4 | 5 | 6;
  openTime:     string;   // HH:mm
  closeTime:    string;
  isOpen:       boolean;
  lunchStart?:  string;
  lunchEnd?:    string;
}

/* ================================================================
   DEPARTMENT
   ================================================================ */

export interface Department extends AuditTrail {
  id:                string;
  clinicId:          string;
  clinicName:        string;
  organizationId:    string;
  externalId?:       string;
  code:              string;
  name:              string;
  shortName:         string;
  description?:      string;
  departmentType:    'clinical' | 'surgical' | 'imaging' | 'optical' | 'billing' | 'admin' | 'pharmacy';
  parentDeptId?:     string;
  headProvider?:     string;
  deptManager?:      string;
  costCenter?:       string;
  glCode?:           string;
  schedulingColor?:  string;
  isBillable:        boolean;
  isImagingDept:     boolean;
  isSurgicalDept:    boolean;
  activeState:       ActiveState;
  sortOrder:         number;
  notes?:            string;
}

/* ================================================================
   PROVIDER
   ================================================================ */

export interface Provider extends AuditTrail {
  id:                        string;
  organizationId:            string;
  primaryClinicId:           string;
  additionalClinicIds:       string[];
  departmentId?:             string;
  externalId?:               string;          // EMR/PM system ID
  npi:                       string;
  stateLicenseNumber:        string;
  stateLicenseState:         string;
  stateLicenseExpiry:        string;
  deaNumber?:                string;
  deaSchedules?:             string[];
  deaExpiry?:                string;
  upin?:                     string;           // legacy
  medicareProviderId?:       string;
  medicaidProviderId?:       string;
  blueShieldId?:             string;
  firstName:                 string;
  middleName?:               string;
  lastName:                  string;
  suffix?:                   string;          // MD, DO, OD, etc.
  displayName:               string;
  shortLabel:                string;
  gender:                    string;
  dateOfBirth?:              string;
  email:                     string;
  phone:                     string;
  mobilePhone?:              string;
  emergencyContact?:         string;
  emergencyPhone?:           string;
  primarySpecialty:          string;          // Ophthalmology, Optometry, etc.
  secondarySpecialties:      string[];
  subspecialty?:             string;          // Retina, Glaucoma, Cataract, Cornea
  providerType:              'physician' | 'od' | 'np' | 'pa' | 'fellow' | 'resident' | 'tech_supervisor';
  boardCertifications:       BoardCertification[];
  medicalSchool?:            string;
  medicalSchoolGradYear?:    number;
  residencyProgram?:         string;
  residencyCompletionYear?:  number;
  fellowshipProgram?:        string;
  fellowshipCompletionYear?: number;
  privilegedProcedures:      string[];
  surgicalPrivileges:        string[];
  hospitalAffiliations:      string[];
  malpracticeCarrier?:       string;
  malpracticeNumber?:        string;
  malpracticeExpiry?:        string;
  malpracticeCoverage?:      string;
  credentialingStatus:       ApprovalState;
  credentialingExpiry?:      string;
  credentialingNotes?:       string;
  employmentType:            'employee' | 'partner' | 'independent_contractor' | 'locum';
  employmentStartDate?:      string;
  employmentEndDate?:        string;
  fte:                       number;          // 0.0 - 1.0
  targetEncountersPerDay:    number;
  targetRvuPerDay:           number;
  schedulingColor?:          string;
  schedulingTemplate?:       string;
  isBillableProvider:        boolean;
  supervisorProviderId?:     string;
  activeState:               ActiveState;
  complianceFlags:           string[];
  reportingTag?:             string;
  customAttributes?:         Record<string, string>;
  notes?:                    string;
}

export interface BoardCertification {
  board:        string;
  specialty:    string;
  certifiedDate: string;
  expiryDate:   string;
  status:       'active' | 'expired' | 'pending';
}

/* ================================================================
   STAFF
   ================================================================ */

export interface Staff extends AuditTrail {
  id:                    string;
  organizationId:        string;
  primaryClinicId:       string;
  additionalClinicIds:   string[];
  departmentId?:         string;
  externalId?:           string;
  employeeId:            string;
  firstName:             string;
  middleName?:           string;
  lastName:              string;
  displayName:           string;
  preferredName?:        string;
  email:                 string;
  phone:                 string;
  mobilePhone?:          string;
  role:                  string;            // job title
  roleCategory:          'clinical' | 'technical' | 'optical' | 'billing' | 'admin' | 'it' | 'management';
  systemRole:            string;            // auth role ID
  credentialType?:       string;            // MA, LPN, COA, COT, CPCO, CPC, etc.
  credentialNumber?:     string;
  credentialExpiry?:     string;
  licenseNumber?:        string;
  licenseState?:         string;
  licenseExpiry?:        string;
  certifications:        StaffCertification[];
  supervisorId?:         string;
  supervisorName?:       string;
  employmentType:        'full_time' | 'part_time' | 'per_diem' | 'contract' | 'temp';
  employmentStartDate?:  string;
  employmentEndDate?:    string;
  fte:                   number;
  schedulingColor?:      string;
  assignedRooms:         string[];
  assignedProviders:     string[];
  competencies:          StaffCompetency[];
  isBillingAuthorized:   boolean;
  isChartSignatory:      boolean;
  mfaEnabled:            boolean;
  lastLoginAt?:          string;
  passwordExpiresAt?:    string;
  trainingCompletedAt?:  string;
  hipaaTrainingExpiry?:  string;
  activeState:           ActiveState;
  onboardingStatus?:     'pending' | 'in_progress' | 'complete';
  offboardingDate?:      string;
  offboardingReason?:    string;
  customAttributes?:     Record<string, string>;
  notes?:                string;
}

export interface StaffCertification {
  name:         string;
  issuingBody:  string;
  issueDate:    string;
  expiryDate:   string;
  status:       'active' | 'expired' | 'pending_renewal';
}

export interface StaffCompetency {
  competency:    string;
  assessedDate:  string;
  assessedBy:    string;
  score?:        number;
  status:        'passed' | 'failed' | 'pending';
}

/* ================================================================
   INSURANCE PLAN
   ================================================================ */

export interface InsurancePlan extends AuditTrail {
  id:                     string;
  organizationId:         string;
  payerId:                string;
  payerName:              string;
  payerShortCode:         string;
  externalPayerId?:       string;        // clearinghouse payer ID
  planId:                 string;
  planName:               string;
  planDisplayName:        string;
  planType:               'commercial' | 'medicare' | 'medicaid' | 'medicare_advantage' | 'managed_medicaid' | 'tricare' | 'workers_comp' | 'self_pay' | 'charity';
  lineOfBusiness?:        string;        // HMO, PPO, POS, EPO, etc.
  networkStatus:          'in_network' | 'out_of_network' | 'participating' | 'non_participating';
  contractNumber?:        string;
  contractStartDate?:     string;
  contractEndDate?:       string;
  feeScheduleId?:         string;
  primaryClaimAddress:    Address;
  electronicPayerId:      string;        // EDI 837 payer ID
  electronicEraId?:       string;        // EDI 835 payer ID
  eligibilityPayerId?:    string;        // 270/271 payer ID
  submissionMethod:       'electronic' | 'paper' | 'portal';
  claimTimelimitDays:     number;
  requiresPreAuth:        boolean;
  requiresReferral:       boolean;
  requiresCoordination:   boolean;
  copayAmount?:           number;
  coinsurancePercent?:    number;
  deductibleAmount?:      number;
  outOfPocketMax?:        number;
  claimsContact?:         string;
  claimsPhone?:           string;
  claimsEmail?:           string;
  authorizationPhone?:    string;
  authorizationFax?:      string;
  authorizationPortal?:   string;
  eligibilityPhone?:      string;
  billingNotes?:          string;
  denyReasonPatterns?:    string[];
  priorityOrder:          number;        // for COB coordination
  isAccepted:             boolean;
  acceptanceNotes?:       string;
  activeState:            ActiveState;
  effectiveDate:          string;
  terminationDate?:       string;
  reportingTag?:          string;
  customAttributes?:      Record<string, string>;
  notes?:                 string;
}

/* ================================================================
   PROCEDURE CODE (CPT / HCPCS)
   ================================================================ */

export interface ProcedureCode extends AuditTrail {
  id:                      string;
  organizationId:          string;
  codeSet:                 'cpt' | 'hcpcs_b' | 'hcpcs_c' | 'icd10_pcs' | 'custom';
  code:                    string;
  codeVersion?:            string;      // year
  shortDescription:        string;
  longDescription:         string;
  clinicalDescription?:    string;
  categoryCode?:           string;      // CPT category
  categoryName?:           string;
  subcategoryCode?:        string;
  subcategoryName?:        string;
  specialtyTag?:           string;      // ophthalmology, retina, etc.
  ophthalmologySection?:   string;      // Anterior segment, posterior, etc.
  isGlobalSurgical:        boolean;
  globalPeriodDays?:       number;
  isBilateral:             boolean;
  isSurgical:              boolean;
  isImagingCode:           boolean;
  isEMCode:                boolean;
  requiresModifier:        boolean;
  allowedModifiers:        string[];
  excludedModifiers:       string[];
  requiresDiagnosis:       boolean;
  compatibleDiagnosisCodes: string[];
  requiredDiagnosisCodes:  string[];
  defaultDiagnosisCode?:   string;
  requiresPreAuth:         boolean;
  preAuthPayers?:          string[];
  requiresReferral:        boolean;
  facilityRVU?:            number;
  nonFacilityRVU?:         number;
  workRVU?:                number;
  practiceExpenseRVU?:     number;
  malpracticeRVU?:         number;
  nationalFacilityRate?:   number;
  nationalNonFacilityRate?: number;
  defaultFee:              number;
  isAddOnCode:             boolean;
  parentCodeRequired?:     string;
  bundlesWith?:            string[];
  cannotBilledWith?:       string[];
  activePriceOverrides?:   PricingOverride[];
  isActive:                boolean;
  isBillable:              boolean;
  isFavorite:              boolean;
  displayOrder:            number;
  internalCategory?:       string;
  internalNotes?:          string;
  complianceNotes?:        string;
  effectiveDate:           string;
  terminationDate?:        string;
  customAttributes?:       Record<string, string>;
}

export interface PricingOverride {
  payerId:        string;
  payerName:      string;
  feeScheduleId:  string;
  rate:           number;
  unit:           string;
  effectiveDate:  string;
  expirationDate?: string;
}

/* ================================================================
   DIAGNOSIS CODE (ICD-10-CM)
   ================================================================ */

export interface DiagnosisCode extends AuditTrail {
  id:                      string;
  organizationId:          string;
  icd10Code:               string;
  shortDescription:        string;
  longDescription:         string;
  clinicalDescription?:    string;
  billableFlag:            boolean;
  headerFlag:              boolean;          // parent category, not billable
  codeCategory:            string;           // H00-H59 Eye
  codeBlock:               string;           // H53 visual disturbances
  isOphthalmic:            boolean;
  ophthalmicCategory?:     string;           // cornea, lens, retina, etc.
  laterality:              'bilateral' | 'unilateral' | 'both' | 'none';
  isChronicCondition:      boolean;
  isAcuteCondition:        boolean;
  chronicCarePeriodMonths?: number;
  isDMRelated:             boolean;
  requiresClinicalNotes:   boolean;
  defaultComorbidities?:   string[];
  compatibleProcedures?:   string[];
  requiresEncounterNote:   boolean;
  hccCategory?:            string;          // CMS HCC for risk adjustment
  hccWeight?:              number;
  isExclusionCode:         boolean;
  exclusionReason?:        string;
  effectiveDate:           string;
  terminationDate?:        string;
  isFavorite:              boolean;
  displayOrder:            number;
  internalCategory?:       string;
  notes?:                  string;
}

/* ================================================================
   MODIFIER CODE
   ================================================================ */

export interface ModifierCode extends AuditTrail {
  id:                  string;
  organizationId:      string;
  modifier:            string;              // 2 char
  description:         string;
  longDescription?:    string;
  modifierType:        'cpt' | 'hcpcs' | 'anesthesia' | 'custom';
  appliesToSurgical:   boolean;
  appliesToEM:         boolean;
  appliesToImaging:    boolean;
  reimbursementImpact: 'increases' | 'decreases' | 'neutral' | 'informational';
  paymentAdjustment?:  number;             // % if applicable
  requiresDocumentation: boolean;
  documentationNotes?:   string;
  commonUseCases?:       string[];
  cannotCombineWith?:    string[];
  isActive:              boolean;
  displayOrder:          number;
  internalNotes?:        string;
}

/* ================================================================
   FEE SCHEDULE
   ================================================================ */

export interface FeeSchedule extends AuditTrail {
  id:                  string;
  organizationId:      string;
  name:                string;
  displayName:         string;
  description?:        string;
  scheduleType:        'standard' | 'payer_contract' | 'medicare_par' | 'medicaid' | 'self_pay' | 'prompt_pay' | 'charity';
  payerId?:            string;
  payerName?:          string;
  contractId?:         string;
  effectiveDate:       string;
  expirationDate?:     string;
  annualUpdateDate?:   string;
  adjustmentFactor?:   number;             // % to apply to base RVU
  geographicAdjustment?: string;           // GPCI locality
  lineItems:           FeeScheduleLine[];
  isDefault:           boolean;
  appliedToClinicIds:  string[];
  activeState:         ActiveState;
  approvalStatus:      ApprovalState;
  approvedByName?:     string;
  lastRecalculatedAt?: string;
  notes?:              string;
}

export interface FeeScheduleLine {
  id:              string;
  feeScheduleId:   string;
  procedureCodeId: string;
  cptCode:         string;
  description:     string;
  facilityRate:    number;
  nonFacilityRate: number;
  unit:            string;
  modifiers?:      string[];
  effectiveDate:   string;
  expirationDate?: string;
  lastUpdatedAt:   string;
}

/* ================================================================
   APPOINTMENT TYPE
   ================================================================ */

export interface AppointmentType extends AuditTrail {
  id:                        string;
  organizationId:            string;
  clinicIds:                 string[];
  code:                      string;
  name:                      string;
  displayName:               string;
  shortLabel:                string;
  description?:              string;
  appointmentCategory:       'new_patient' | 'established' | 'follow_up' | 'surgical_consult' | 'post_op' | 'optical' | 'refraction' | 'emergency' | 'telehealth';
  visitType:                 string;
  defaultDurationMinutes:    number;
  minDurationMinutes:        number;
  maxDurationMinutes:        number;
  bufferAfterMinutes:        number;
  preparationMinutes:        number;
  cleanupMinutes:            number;
  defaultProviderType?:      string;
  requiresPhysician:         boolean;
  requiresTech:              boolean;
  requiresOptician:          boolean;
  billingCodes:              string[];
  defaultDiagnosisCodes:     string[];
  schedulingColor:           string;
  schedulingPriority:        number;          // 1-10
  isNewPatientSlot:          boolean;
  isTelehealth:              boolean;
  requiresPreRegistration:   boolean;
  requiresInsuranceVerify:   boolean;
  requiresAuthorizationCheck: boolean;
  patientInstructions?:      string;
  confirmationTemplate?:     string;
  reminderTemplateId?:       string;
  reminderLeadHours:         number;
  requiredEquipment?:        string[];
  requiredForms?:            string[];
  requiredConsents?:         string[];
  allowPatientScheduling:    boolean;
  allowPortalScheduling:     boolean;
  requiresReferral:          boolean;
  isActive:                  boolean;
  isBillable:                boolean;
  displayOrder:              number;
  customAttributes?:         Record<string, string>;
  notes?:                    string;
}

/* ================================================================
   IMPLANT / IOL CATALOG
   ================================================================ */

export interface ImplantCatalog extends AuditTrail {
  id:                     string;
  organizationId:         string;
  manufacturerId:         string;
  manufacturerName:       string;
  manufacturerCode?:      string;         // external catalog code
  catalogNumber:          string;
  gtin?:                  string;         // Global Trade Item Number
  udi?:                   string;         // Unique Device Identifier
  ndcCode?:               string;         // National Drug Code if applicable
  itemName:               string;
  brandName?:             string;
  genericName?:           string;
  displayName:            string;
  shortLabel:             string;
  description?:           string;
  implantCategory:        'iol' | 'vitreous_substitute' | 'glaucoma_device' | 'corneal_ring' | 'scleral_plug' | 'amniotic_membrane' | 'other';
  iolType?:               'monofocal' | 'toric' | 'multifocal' | 'edf' | 'trifocal' | 'light_adjustable' | 'accommodating';
  lensDesign?:            string;
  lensMaterial?:          string;         // hydrophilic, hydrophobic, silicone
  opticDiameter?:         number;         // mm
  overallLength?:         number;         // mm
  aConstant?:             number;         // SRK/T
  a4Constant?:            number;         // Holladay 4
  surgeonFactor?:         number;
  haigisA0?:              number;
  haigisA1?:              number;
  haigisA2?:              number;
  barrettConstant?:       number;
  powerRangeMin?:         number;
  powerRangeMax?:         number;
  powerIncrement?:        number;
  cylinderPowerRangeMin?: number;
  cylinderPowerRangeMax?: number;
  addPower?:              string;
  uvBlocker:              boolean;
  blueFilter:             boolean;
  fdaClearanceDate?:      string;
  fdaApprovalNumber?:     string;
  isoClassification?:     string;
  sterile:                boolean;
  storageTemp?:           string;
  shelfLifeMonths?:       number;
  unitCost?:              number;
  billableCode?:          string;         // V-code or HCPCS
  allowedBillingAmount?:  number;
  preferenceLevel:        'preferred' | 'standard' | 'limited' | 'restricted';
  surgeonPreferences?:    SurgeonImplantPreference[];
  activeState:            ActiveState;
  approvalStatus:         ApprovalState;
  inServiceDate?:         string;
  outOfServiceDate?:      string;
  clinicalNotes?:         string;
  complianceNotes?:       string;
  customAttributes?:      Record<string, string>;
  notes?:                 string;
}

export interface SurgeonImplantPreference {
  providerId:     string;
  providerName:   string;
  preferenceRank: number;
  notes?:         string;
}

/* ================================================================
   OPTICAL PRODUCT CATALOG
   ================================================================ */

export interface OpticalProduct extends AuditTrail {
  id:                    string;
  organizationId:        string;
  clinicIds:             string[];
  manufacturerId:        string;
  manufacturerName:      string;
  vendorId?:             string;
  vendorName?:           string;
  vendorCatalogId?:      string;
  upcCode?:              string;
  sku:                   string;
  productName:           string;
  brandName?:            string;
  displayName:           string;
  productCategory:       'frame' | 'lens' | 'contact_lens' | 'solution' | 'accessory' | 'low_vision';
  productSubcategory?:   string;
  gender?:               'men' | 'women' | 'unisex' | 'kids';
  material?:             string;           // titanium, TR90, acetate, etc.
  color?:                string;
  styleCode?:            string;
  lensType?:             string;           // if lens product
  lensDesign?:           string;          // bifocal, progressive, SV, etc.
  lensMaterial?:         string;
  arCoating?:            boolean;
  uvCoating?:            boolean;
  polarized?:            boolean;
  photochromic?:         boolean;
  eyeSize?:              number;           // mm
  bridgeSize?:           number;
  templeLength?:         number;
  unitCost:              number;
  retailPrice:           number;
  insurancePrice?:       number;
  hcpcsCode?:            string;
  billableAmount?:       number;
  reorderPoint:          number;
  reorderQuantity:       number;
  onHandQuantity:        number;
  isActive:              boolean;
  isFeatured:            boolean;
  displayOrder:          number;
  notes?:                string;
}

/* ================================================================
   AUTHORIZATION RULE
   ================================================================ */

export interface AuthorizationRule extends AuditTrail {
  id:                       string;
  organizationId:           string;
  ruleCode:                 string;
  ruleName:                 string;
  description?:             string;
  payerId?:                 string;
  payerName?:               string;
  planIds:                  string[];
  procedureCodes:           string[];
  diagnosisCodes?:          string[];
  providerTypes?:           string[];
  placeOfServiceCodes?:     string[];
  requiresPreAuth:          boolean;
  requiresConcurrentAuth:   boolean;
  requiresRetroAuth:        boolean;
  authLeadTimeDays:         number;
  authValidityDays:         number;
  authUnit:                 'visit' | 'procedure' | 'episode' | 'units';
  maxUnitsPerAuth?:         number;
  documentationRequired:    string[];
  authorizationPortal?:     string;
  authorizationPhone?:      string;
  authorizationFax?:        string;
  denialAppealProcess?:     string;
  escalationProviderId?:    string;
  autoRequestEnabled:       boolean;
  alertLeadDays:            number;       // days before expiry to alert
  priorityLevel:            'high' | 'medium' | 'low';
  effectiveDate:            string;
  expirationDate?:          string;
  isActive:                 boolean;
  complianceNotes?:         string;
  notes?:                   string;
}

/* ================================================================
   CLAIM VALIDATION RULE
   ================================================================ */

export interface ClaimRule extends AuditTrail {
  id:                      string;
  organizationId:          string;
  ruleCode:                string;
  ruleName:                string;
  description?:            string;
  ruleCategory:            'modifier' | 'diagnosis' | 'bundling' | 'duplicate' | 'timely_filing' | 'authorization' | 'eligibility' | 'coordination' | 'medical_necessity';
  severity:                'error' | 'warning' | 'info';
  payerIds?:               string[];       // null = all payers
  procedureCodes?:         string[];
  diagnosisCodes?:         string[];
  conditions:              ClaimRuleCondition[];
  actions:                 ClaimRuleAction[];
  autoCorrect:             boolean;
  blockSubmission:         boolean;
  notifyBiller:            boolean;
  notifyProvider:          boolean;
  escalationRequired:      boolean;
  effectiveDate:           string;
  expirationDate?:         string;
  isActive:                boolean;
  lastTriggeredAt?:        string;
  triggerCount:            number;
  notes?:                  string;
}

export interface ClaimRuleCondition {
  field:     string;
  operator:  'equals' | 'not_equals' | 'contains' | 'in' | 'not_in' | 'gt' | 'lt' | 'exists' | 'not_exists';
  value:     string | string[] | number;
}

export interface ClaimRuleAction {
  actionType: 'add_modifier' | 'remove_modifier' | 'change_code' | 'add_note' | 'flag_review' | 'reject' | 'hold';
  value?:     string;
  message?:   string;
}

/* ================================================================
   SCHEDULING TEMPLATE (Block Schedule)
   ================================================================ */

export interface SchedulingTemplate extends AuditTrail {
  id:                    string;
  organizationId:        string;
  clinicId:              string;
  clinicName:            string;
  providerId?:           string;
  providerName?:         string;
  templateName:          string;
  description?:          string;
  templateType:          'provider_schedule' | 'resource_block' | 'clinic_template' | 'holiday';
  dayOfWeek?:            number;           // 0-6 for recurring
  startDate?:            string;           // for date-specific
  endDate?:              string;
  recurrencePattern?:    string;           // iCal RRULE
  timeBlocks:            ScheduleTimeBlock[];
  totalCapacity:         number;
  newPatientSlots:       number;
  urgentSlots:           number;
  isActive:              boolean;
  effectiveDate:         string;
  expirationDate?:       string;
  notes?:                string;
}

export interface ScheduleTimeBlock {
  startTime:       string;        // HH:mm
  endTime:         string;
  appointmentType: string;
  capacity:        number;
  room?:           string;
  label?:          string;
}

/* ================================================================
   NOTIFICATION TEMPLATE
   ================================================================ */

export interface NotificationTemplate extends AuditTrail {
  id:                  string;
  organizationId:      string;
  clinicIds:           string[];
  templateCode:        string;
  templateName:        string;
  description?:        string;
  channel:             'email' | 'sms' | 'push' | 'in_app' | 'fax' | 'phone';
  triggerEvent:        string;             // appointment_reminder, claim_denied, etc.
  audienceType:        'patient' | 'provider' | 'staff' | 'biller' | 'admin' | 'payer';
  subject?:            string;             // email subject
  bodyTemplate:        string;             // handlebars/mustache template
  variables:           TemplateVariable[];
  language:            string;
  isHtml:              boolean;
  fromName?:           string;
  fromEmail?:          string;
  replyToEmail?:       string;
  attachments?:        string[];
  sendLeadHours?:      number;
  sendAtTime?:         string;             // HH:mm in clinic TZ
  requiresOptIn:       boolean;
  isActive:            boolean;
  testLastSentAt?:     string;
  notes?:              string;
}

export interface TemplateVariable {
  name:         string;
  description:  string;
  dataSource:   string;
  required:     boolean;
  defaultValue?: string;
}

/* ================================================================
   ESCALATION RULE
   ================================================================ */

export interface EscalationRule extends AuditTrail {
  id:                    string;
  organizationId:        string;
  clinicIds:             string[];
  ruleCode:              string;
  ruleName:              string;
  description?:          string;
  triggerDomain:         'patient_flow' | 'imaging' | 'billing' | 'surgery' | 'compliance' | 'clinical' | 'system';
  triggerEvent:          string;
  conditions:            EscalationCondition[];
  triggerDelayMinutes?:  number;
  severity:              'critical' | 'high' | 'medium' | 'low';
  escalationPath:        EscalationStep[];
  suppressDuplicateMinutes?: number;
  businessHoursOnly:     boolean;
  isActive:              boolean;
  lastTriggeredAt?:      string;
  triggerCount:          number;
  notes?:                string;
}

export interface EscalationCondition {
  metric:    string;
  threshold: string | number;
  operator:  string;
}

export interface EscalationStep {
  stepOrder:         number;
  notifyRoles:       string[];
  notifyUsers?:      string[];
  channel:           'in_app' | 'email' | 'sms' | 'phone';
  templateId?:       string;
  delayMinutes:      number;
  requiresAck:       boolean;
}

/* ================================================================
   ROLE / PERMISSION MATRIX
   ================================================================ */

export interface RoleDefinition extends AuditTrail {
  id:                  string;
  organizationId:      string;
  roleCode:            string;
  roleName:            string;
  displayName:         string;
  description?:        string;
  roleLevel:           'network' | 'clinic' | 'department' | 'provider' | 'self';
  parentRoleId?:       string;
  permissions:         Permission[];
  defaultClinicScope:  'all' | 'assigned' | 'self';
  mfaRequired:         boolean;
  sessionTimeoutMinutes: number;
  passwordPolicy?:     string;
  isSystemRole:        boolean;
  isActive:            boolean;
  sortOrder:           number;
  notes?:              string;
}

export interface Permission {
  resource:   string;         // patients, claims, schedule, etc.
  actions:    ('view' | 'create' | 'edit' | 'delete' | 'export' | 'approve' | 'sign' | 'submit')[];
  conditions?: string;        // row-level filter expression
}

/* ================================================================
   LOOKUP / CODE TABLE (generic)
   ================================================================ */

export interface LookupCode extends AuditTrail {
  id:              string;
  organizationId:  string;
  codeSet:         string;         // e.g., 'place_of_service', 'revenue_code', 'adjustment_reason'
  code:            string;
  shortName:       string;
  longName:        string;
  description?:    string;
  externalCode?:   string;         // e.g., CMS code
  parentCodeId?:   string;
  categoryCode?:   string;
  isSystem:        boolean;        // system-managed, cannot delete
  isEditable:      boolean;
  isActive:        boolean;
  displayOrder:    number;
  customField1?:   string;
  customField2?:   string;
  notes?:          string;
}

/* ================================================================
   INTEGRATION ENDPOINT
   ================================================================ */

export interface IntegrationEndpoint extends AuditTrail {
  id:                     string;
  organizationId:         string;
  clinicIds:              string[];
  integrationName:        string;
  displayName:            string;
  description?:           string;
  integrationCategory:    'ehr' | 'practice_management' | 'imaging' | 'lab' | 'pharmacy' | 'clearinghouse' | 'payer' | 'patient_portal' | 'analytics' | 'ai_service';
  protocol:               'hl7v2' | 'fhir_r4' | 'rest_api' | 'soap' | 'sftp' | 'direct_secure' | 'database';
  direction:              'inbound' | 'outbound' | 'bidirectional';
  endpointUrl?:           string;
  host?:                  string;
  port?:                  number;
  authMethod:             'api_key' | 'oauth2' | 'basic' | 'client_cert' | 'ssh_key' | 'none';
  authCredentialId?:      string;     // reference to secrets manager
  tlsVersion?:            string;
  messageTypes:           string[];   // HL7 segments or FHIR resource types
  pollingIntervalSeconds?: number;
  webhookEnabled:         boolean;
  webhookUrl?:            string;
  retryPolicy?:           string;
  maxRetries:             number;
  timeoutSeconds:         number;
  lastSyncAt?:            string;
  lastSyncStatus?:        'success' | 'partial' | 'error' | 'idle';
  lastErrorMessage?:      string;
  messageCountToday:      number;
  errorCountToday:        number;
  isActive:               boolean;
  isMonitored:            boolean;
  alertOnFailure:         boolean;
  maintenanceWindow?:     string;
  documentationUrl?:      string;
  vendorContact?:         string;
  notes?:                 string;
}

/* ================================================================
   WORKFLOW RULE
   ================================================================ */

export interface WorkflowRule extends AuditTrail {
  id:                  string;
  organizationId:      string;
  clinicIds:           string[];
  ruleCode:            string;
  ruleName:            string;
  description?:        string;
  workflowDomain:      'scheduling' | 'clinical' | 'billing' | 'imaging' | 'surgery' | 'optical' | 'compliance';
  triggerEvent:        string;
  conditions:          WorkflowCondition[];
  actions:             WorkflowAction[];
  priority:            number;
  isActive:            boolean;
  stopOnMatch:         boolean;
  requiresApproval:    boolean;
  approverRoles:       string[];
  effectiveDate:       string;
  expirationDate?:     string;
  lastTriggeredAt?:    string;
  triggerCount:        number;
  notes?:              string;
}

export interface WorkflowCondition {
  field:    string;
  operator: string;
  value:    string | string[] | number | boolean;
  logic:    'AND' | 'OR';
}

export interface WorkflowAction {
  actionType:   string;
  targetField?: string;
  value?:       string | number | boolean;
  templateId?:  string;
  assigneeRole?: string;
  assigneeId?:  string;
  notes?:       string;
}

/* ================================================================
   IMAGING MODALITY / EQUIPMENT
   ================================================================ */

export interface ImagingModality extends AuditTrail {
  id:                    string;
  organizationId:        string;
  clinicId:              string;
  clinicName:            string;
  externalId?:           string;
  assetTag?:             string;
  modalityCode:          string;       // OCT, FUNDUS, VF, TOPOGRAPHY, BIOMETRY, etc.
  modalityName:          string;
  displayName:           string;
  manufacturer:          string;
  modelNumber:           string;
  serialNumber:          string;
  softwareVersion?:      string;
  roomNumber?:           string;
  floor?:                string;
  building?:             string;
  purchaseDate?:         string;
  warrantyExpiry?:       string;
  lastMaintenanceDate?:  string;
  nextMaintenanceDate?:  string;
  maintenanceVendor?:    string;
  maintenanceContract?:  string;
  calibrationInterval?:  string;
  lastCalibrationDate?:  string;
  averageScanMinutes:    number;
  dicomSupported:        boolean;
  pacsIntegrated:        boolean;
  aiAnalysisEnabled:     boolean;
  dailyCapacity:         number;
  activeState:           ActiveState;
  notes?:                string;
}

/* ================================================================
   SURGICAL PREFERENCE CARD
   ================================================================ */

export interface SurgicalPreferenceCard extends AuditTrail {
  id:                  string;
  organizationId:      string;
  clinicId:            string;
  providerId:          string;
  providerName:        string;
  procedureCode:       string;
  procedureName:       string;
  cardName:            string;
  description?:        string;
  anesthesiaType:      string;
  eyeLateral:          'right' | 'left' | 'both' | 'unspecified';
  dilationProtocol?:   string;
  incisionType?:       string;
  preferredIol?:       string;
  backupIol?:          string;
  viscoelasticType?:   string;
  irrigationSolution?: string;
  sutureType?:         string;
  instrumentSet:       string[];
  supplies:            SurgicalSupply[];
  medications:         SurgicalMedication[];
  specialInstructions?: string;
  setupNotes?:         string;
  breakdownNotes?:     string;
  approvalStatus:      ApprovalState;
  isActive:            boolean;
  lastUsedDate?:       string;
  version:             number;
  notes?:              string;
}

export interface SurgicalSupply {
  itemId:       string;
  itemName:     string;
  catalogNumber?: string;
  quantity:     number;
  unit:         string;
  isRequired:   boolean;
  substituteId?: string;
}

export interface SurgicalMedication {
  medicationId:     string;
  medicationName:   string;
  ndc?:             string;
  dose:             string;
  route:            string;
  frequency:        string;
  preOp:            boolean;
  intraOp:          boolean;
  postOp:           boolean;
  instructions?:    string;
}

/* ================================================================
   ASC READINESS RULE
   ================================================================ */

export interface AscReadinessRule extends AuditTrail {
  id:                    string;
  organizationId:        string;
  clinicId:              string;
  ruleCode:              string;
  ruleName:              string;
  description?:          string;
  procedureCategory:     string;           // cataract, glaucoma, retina, etc.
  procedureCodes?:       string[];
  checklistItems:        AscChecklistItem[];
  requiresLensConfirm:   boolean;
  requiresPreOpExam:     boolean;
  preOpExamLeadDays:     number;
  requiresLabWork:       boolean;
  labWorkTypes?:         string[];
  requiresMedClearance:  boolean;
  requiresAnesthesia:    boolean;
  anesthesiaType?:       string;
  npoInstructions?:      string;
  consentForms:          string[];
  patientInstructions?:  string;
  readinessLeadDays:     number;            // days before surgery to complete
  isActive:              boolean;
  notes?:                string;
}

export interface AscChecklistItem {
  sequence:      number;
  checkItem:     string;
  description?:  string;
  requiredBy:    string;            // role responsible
  daysBeforeOr:  number;
  isRequired:    boolean;
  isAutoChecked: boolean;
  documentationType?: string;
}

/* ================================================================
   AUDIT LOG ENTRY (read-only)
   ================================================================ */

export interface AuditLogEntry {
  id:             string;
  organizationId: string;
  clinicId?:      string;
  clinicName?:    string;
  timestamp:      string;
  userId:         string;
  userName:       string;
  userRole:       string;
  ipAddress?:     string;
  userAgent?:     string;
  sessionId?:     string;
  actionCategory: 'auth' | 'patient' | 'clinical' | 'billing' | 'admin' | 'config' | 'integration' | 'compliance' | 'report';
  actionCode:     string;
  actionDescription: string;
  resourceType:   string;
  resourceId?:    string;
  resourceName?:  string;
  beforeState?:   Record<string, unknown>;
  afterState?:    Record<string, unknown>;
  changedFields?: string[];
  outcome:        'success' | 'failure' | 'partial';
  failureReason?: string;
  riskLevel:      'low' | 'medium' | 'high' | 'critical';
  isPhiAccess:    boolean;
  complianceFlag: boolean;
  complianceNote?: string;
}

/* ================================================================
   MAINTENANCE LIST / DETAIL UI MODELS
   ================================================================ */

export interface MaintenanceTableColumn {
  key:        string;
  header:     string;
  width?:     string;
  sortable?:  boolean;
  chipTone?:  boolean;          // render as chip
  dateFormat?: string;
  truncate?:  number;           // max chars
  align?:     'left' | 'right' | 'center';
}

export interface MaintenanceFilterDef {
  key:         string;
  label:       string;
  type:        'text' | 'select' | 'date_range' | 'checkbox' | 'multi_select';
  options?:    { value: string; label: string }[];
  placeholder?: string;
}

export interface MaintenanceEntityConfig {
  entityKey:    string;
  displayName:  string;
  pluralName:   string;
  icon:         string;
  route:        string;
  columns:      MaintenanceTableColumn[];
  filters:      MaintenanceFilterDef[];
  canCreate:    boolean;
  canEdit:      boolean;
  canDeactivate: boolean;
  canDelete:    boolean;
  canExport:    boolean;
  canImport:    boolean;
  hasVersioning: boolean;
  hasAuditTrail: boolean;
}
