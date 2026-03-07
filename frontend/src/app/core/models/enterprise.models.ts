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

