import { AnalyticsPoint, ProviderProductivity, RoleMatrixItem } from '../models/enterprise.models';

export const ANALYTICS_POINTS: AnalyticsPoint[] = [
  {
    label: 'Regional gross collections',
    value: '$412K',
    delta: '+6.8%',
    tone: 'success',
    detail: 'Driven by ASC cataract volume and improved claim clearance.'
  },
  {
    label: 'Denials by payer',
    value: '3.1%',
    delta: '-0.8 pts',
    tone: 'accent',
    detail: 'AI coding review reduced avoidable cataract edits.'
  },
  {
    label: 'Provider productivity',
    value: '92%',
    delta: '+4 pts',
    tone: 'accent',
    detail: 'Retina and ASC blocks are pacing above plan.'
  },
  {
    label: 'Optical gross margin',
    value: '61%',
    delta: '+2.4 pts',
    tone: 'success',
    detail: 'Premium lens mix and same-day pickup improved conversion.'
  }
];

export const ROLE_MATRIX: RoleMatrixItem[] = [
  {
    role: 'Regional operations executive',
    scope: 'Cross-clinic command, analytics, staffing, and billing visibility',
    clinics: 'All clinics',
    mfa: 'Required',
    lastChange: 'Mar 5, 2026',
    tone: 'accent'
  },
  {
    role: 'ASC coordinator',
    scope: 'Surgery readiness, implant confirmation, staffing, postop pipeline',
    clinics: 'Tampa ASC',
    mfa: 'Required',
    lastChange: 'Today 09:52',
    tone: 'warning'
  },
  {
    role: 'Revenue integrity analyst',
    scope: 'Claims, denials, coding, payment exceptions',
    clinics: 'Regional',
    mfa: 'Required',
    lastChange: 'Feb 28, 2026',
    tone: 'info'
  },
  {
    role: 'Optical manager',
    scope: 'Lab orders, pickup, retail sales, frame inventory',
    clinics: 'Tampa ASC + Optical',
    mfa: 'Required',
    lastChange: 'Feb 25, 2026',
    tone: 'success'
  }
];

export const PROVIDER_PRODUCTIVITY: ProviderProductivity[] = [
  {
    clinicId: 'winter-park',
    provider: 'Dr. Alina Cho',
    focus: 'Retina',
    encounters: '29 today',
    utilization: '94%',
    documentationLag: '1 chart',
    collections: '$28.4K projected',
    tone: 'accent'
  },
  {
    clinicId: 'clermont',
    provider: 'Dr. Marcus Vale',
    focus: 'Cataract / Cornea',
    encounters: '24 today',
    utilization: '97%',
    documentationLag: 'On target',
    collections: '$19.1K projected',
    tone: 'warning'
  },
  {
    clinicId: 'lake-nona',
    provider: 'Dr. Evelyn Sato',
    focus: 'Glaucoma',
    encounters: '18 today',
    utilization: '84%',
    documentationLag: '2 charts',
    collections: '$12.8K projected',
    tone: 'info'
  },
  {
    clinicId: 'tampa-asc',
    provider: 'Dr. Jordan Pike',
    focus: 'ASC Cataract',
    encounters: '14 cases',
    utilization: '93%',
    documentationLag: '0 cases',
    collections: '$43.2K projected',
    tone: 'critical'
  }
];
