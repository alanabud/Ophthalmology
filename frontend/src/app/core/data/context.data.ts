import {
  AlertRecord,
  ClinicContext,
  ProviderContext,
  QuickAction,
  SystemIndicator,
} from '../models/enterprise.models';

export const CLINICS: ClinicContext[] = [
  {
    id: 'network',
    shortLabel: 'NW',
    name: 'Acuity Eye Network',
    region: 'Regional command view',
    readiness: 94,
    waitMinutes: 18,
    utilization: 92,
    openIssues: 12,
    revenueDelta: '+4.8%'
  },
  {
    id: 'winter-park',
    shortLabel: 'WP',
    name: 'Winter Park Retina',
    region: 'Central Florida',
    readiness: 96,
    waitMinutes: 14,
    utilization: 91,
    openIssues: 3,
    revenueDelta: '+6.1%'
  },
  {
    id: 'clermont',
    shortLabel: 'CL',
    name: 'Clermont Cataract Center',
    region: 'West Orlando',
    readiness: 89,
    waitMinutes: 26,
    utilization: 95,
    openIssues: 4,
    revenueDelta: '+2.2%'
  },
  {
    id: 'lake-nona',
    shortLabel: 'LN',
    name: 'Lake Nona Glaucoma Institute',
    region: 'Lake Nona',
    readiness: 92,
    waitMinutes: 19,
    utilization: 87,
    openIssues: 2,
    revenueDelta: '+5.3%'
  },
  {
    id: 'tampa-asc',
    shortLabel: 'TA',
    name: 'Tampa ASC + Optical',
    region: 'Gulf Coast',
    readiness: 87,
    waitMinutes: 22,
    utilization: 93,
    openIssues: 5,
    revenueDelta: '+3.4%'
  }
];

export const PROVIDERS: ProviderContext[] = [
  {
    id: 'cho',
    clinicId: 'winter-park',
    shortLabel: 'AC',
    name: 'Dr. Alina Cho',
    specialty: 'Retina',
    status: 'In procedure room',
    utilization: 94,
    room: 'Retina 3',
    nextSlot: '11:20'
  },
  {
    id: 'vale',
    clinicId: 'clermont',
    shortLabel: 'MV',
    name: 'Dr. Marcus Vale',
    specialty: 'Cataract / Cornea',
    status: 'Running 18 min late',
    utilization: 97,
    room: 'Exam 5',
    nextSlot: '11:35'
  },
  {
    id: 'sato',
    clinicId: 'lake-nona',
    shortLabel: 'ES',
    name: 'Dr. Evelyn Sato',
    specialty: 'Glaucoma',
    status: 'Documentation block',
    utilization: 84,
    room: 'Laser 2',
    nextSlot: '11:05'
  },
  {
    id: 'rios',
    clinicId: 'winter-park',
    shortLabel: 'PR',
    name: 'Dr. Priya Rios',
    specialty: 'Retina / Uveitis',
    status: 'On time',
    utilization: 88,
    room: 'Imaging 1',
    nextSlot: '10:55'
  },
  {
    id: 'pike',
    clinicId: 'tampa-asc',
    shortLabel: 'JP',
    name: 'Dr. Jordan Pike',
    specialty: 'ASC Cataract',
    status: 'Case turnover',
    utilization: 93,
    room: 'OR 2',
    nextSlot: '12:10'
  }
];

export const SYSTEM_INDICATORS: SystemIndicator[] = [
  {
    label: 'System health',
    value: 'Stable',
    tone: 'success',
    detail: 'API latency 142 ms across clinical routes'
  },
  {
    label: 'Integration health',
    value: '2 degraded',
    tone: 'warning',
    detail: 'Clearinghouse acknowledgements delayed in one payer lane'
  },
  {
    label: 'Urgent workflows',
    value: '4 escalations',
    tone: 'critical',
    detail: 'Lens confirmations and denied claims need attention'
  }
];

export const ALERTS: AlertRecord[] = [
  {
    id: 'alert-1',
    title: '3 cataract cases missing final lens confirmation',
    detail: 'Tampa ASC case carts cannot close until implant lot validation is recorded.',
    tone: 'critical',
    count: 3,
    clinic: 'Tampa ASC + Optical'
  },
  {
    id: 'alert-2',
    title: '12 claims require modifier review before submission',
    detail: 'Medicare cataract bundle edits are triggering preventable denials.',
    tone: 'warning',
    count: 12,
    clinic: 'Regional'
  },
  {
    id: 'alert-3',
    title: 'Clinic throughput is down 12% in Clermont',
    detail: 'Imaging backlog is extending cataract workup turnover beyond target.',
    tone: 'critical',
    count: 1,
    clinic: 'Clermont Cataract Center'
  },
  {
    id: 'alert-4',
    title: 'AI flagged elevated no-show risk for tomorrow retina block',
    detail: 'Five patients share transport barriers and unconfirmed reminders.',
    tone: 'accent',
    count: 5,
    clinic: 'Winter Park Retina'
  }
];

export const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Create urgent add-on slot',
    detail: 'Open an overbook lane with technician coverage check',
    tone: 'critical'
  },
  {
    label: 'Launch denial scrub',
    detail: 'Run AI coding review on high-risk claims in draft',
    tone: 'warning'
  },
  {
    label: 'Open imaging triage',
    detail: 'Sort studies by physician review deadline and AI finding severity',
    tone: 'accent'
  }
];
