import { NavigationSection } from '../models/enterprise.models';

/**
 * Ophthalmology-specific grouped navigation.
 *
 * Structure: 9 clinically-oriented sections, each with focused items.
 *   counter = badge value (empty string = no badge)
 *   tone    = badge colour semantics:
 *             'critical' → red   'warning' → amber
 *             'info'     → blue  'accent'  → cobalt   (neutral = no colour)
 *
 * Items without dedicated routes share their section's primary route —
 * this is intentional for the demo; production would have unique paths.
 */
export const NAVIGATION_SECTIONS: NavigationSection[] = [
  // ── COMMAND ────────────────────────────────────────────────────────────────
  {
    label: 'Command',
    items: [
      {
        label: 'Command Center',
        route: '/command-center',
        icon: 'CC',
        summary: 'Regional bottlenecks, AI intervention, escalation control',
        counter: '12',
        tone: 'accent',
      },
      {
        label: "Today's Clinic",
        route: '/today',
        icon: '⚕',
        summary: 'Patient flow board, imaging queue, surgery and injection readiness',
        counter: '',
        tone: 'success',
      },
      {
        label: 'Action Inbox',
        route: '/command-center',
        icon: 'AI',
        summary: 'Consolidated urgent tasks across all modules',
        counter: '21',
        tone: 'critical',
      },
    ],
  },

  // ── CLINIC FLOW ────────────────────────────────────────────────────────────
  {
    label: 'Clinic Flow',
    items: [
      {
        label: 'Schedule',
        route: '/scheduling',
        icon: 'SC',
        summary: 'Appointments, waitlist fit logic, and no-show risk',
        counter: '3',
        tone: 'warning',
      },
      {
        label: 'Check-in / Out',
        route: '/scheduling',
        icon: 'CI',
        summary: 'Patient arrival, rooming, and checkout flow',
        counter: '',
        tone: 'neutral',
      },
      {
        label: 'Encounters',
        route: '/encounters',
        icon: 'EM',
        summary: 'Unsigned charts, in-progress exams, chart closure watch',
        counter: '8',
        tone: 'warning',
      },
      {
        label: 'Work Queues',
        route: '/command-center',
        icon: 'WQ',
        summary: 'Real-time operational exceptions requiring attention',
        counter: '',
        tone: 'neutral',
      },
    ],
  },

  // ── CLINICAL RECORDS ───────────────────────────────────────────────────────
  {
    label: 'Clinical Records',
    items: [
      {
        label: 'Patients',
        route: '/patients',
        icon: 'PT',
        summary: '286 active today, recall gaps, high-risk flags',
        counter: '286',
        tone: 'info',
      },
      {
        label: 'Charts',
        route: '/encounters',
        icon: 'CH',
        summary: 'Chart completion, documentation, signing queue',
        counter: '',
        tone: 'neutral',
      },
      {
        label: 'Orders',
        route: '/patients',
        icon: 'OR',
        summary: 'Medication orders, imaging orders, referral orders',
        counter: '',
        tone: 'neutral',
      },
      {
        label: 'Prescriptions',
        route: '/patients',
        icon: 'RX',
        summary: 'Glasses, contact lens, and medication prescriptions',
        counter: '',
        tone: 'neutral',
      },
    ],
  },

  // ── DIAGNOSTICS ────────────────────────────────────────────────────────────
  {
    label: 'Diagnostics',
    items: [
      {
        label: 'Imaging',
        route: '/imaging',
        icon: 'IM',
        summary: '2 unread criticals, OCT backlog, review queue',
        counter: '2',
        tone: 'critical',
      },
      {
        label: 'OCT / Biometry',
        route: '/imaging',
        icon: 'OB',
        summary: 'OCT Macula, OCT NFL, IOLMaster biometry queue',
        counter: '',
        tone: 'neutral',
      },
      {
        label: 'Visual Fields',
        route: '/imaging',
        icon: 'VF',
        summary: 'Visual field testing queue and results review',
        counter: '',
        tone: 'neutral',
      },
      {
        label: 'Results Review',
        route: '/imaging',
        icon: 'RR',
        summary: 'All diagnostic results pending physician review',
        counter: '',
        tone: 'neutral',
      },
    ],
  },

  // ── SURGERY & ASC ──────────────────────────────────────────────────────────
  {
    label: 'Surgery & ASC',
    items: [
      {
        label: 'Surgery Cases',
        route: '/surgery',
        icon: 'SX',
        summary: '3 cases blocked by lens or clearance readiness',
        counter: '3',
        tone: 'critical',
      },
      {
        label: 'Lens Planning',
        route: '/surgery',
        icon: 'LP',
        summary: 'IOL selection, biometry review, toric axis alignment',
        counter: '',
        tone: 'neutral',
      },
      {
        label: 'ASC Readiness',
        route: '/surgery',
        icon: 'AR',
        summary: 'Case cart, implant lot, consent, clearance status',
        counter: '',
        tone: 'neutral',
      },
      {
        label: 'Post-op Follow-up',
        route: '/surgery',
        icon: 'PO',
        summary: 'Post-op appointments, outcomes, and complication watch',
        counter: '',
        tone: 'neutral',
      },
    ],
  },

  // ── OPTICAL ────────────────────────────────────────────────────────────────
  {
    label: 'Optical',
    items: [
      {
        label: 'Optical Orders',
        route: '/optical',
        icon: 'OP',
        summary: '23 open orders, 5 premium pickups, lab ETA watch',
        counter: '5',
        tone: 'warning',
      },
      {
        label: 'Optical Inventory',
        route: '/inventory',
        icon: 'OI',
        summary: '7 shortages, implant forecast, reorder pressure',
        counter: '7',
        tone: 'critical',
      },
      {
        label: 'Lens Validation',
        route: '/optical',
        icon: 'LV',
        summary: 'Frame, lens, and coating confirmation before dispensing',
        counter: '',
        tone: 'neutral',
      },
    ],
  },

  // ── REVENUE ────────────────────────────────────────────────────────────────
  {
    label: 'Revenue',
    items: [
      {
        label: 'Billing',
        route: '/billing',
        icon: 'BL',
        summary: '12 blocked claims, modifier review, denial salvage',
        counter: '12',
        tone: 'warning',
      },
      {
        label: 'Claims',
        route: '/billing',
        icon: 'CL',
        summary: 'Active claim submissions and payer follow-up',
        counter: '',
        tone: 'neutral',
      },
      {
        label: 'Payments',
        route: '/billing',
        icon: 'PM',
        summary: 'ERA posting, patient payments, and balance review',
        counter: '',
        tone: 'neutral',
      },
      {
        label: 'Coding Review',
        route: '/billing',
        icon: 'CD',
        summary: 'Modifier review, CPT accuracy, diagnosis linkage',
        counter: '',
        tone: 'neutral',
      },
      {
        label: 'Denials',
        route: '/billing',
        icon: 'DN',
        summary: 'Denied and rejected claims requiring action',
        counter: '4',
        tone: 'critical',
      },
    ],
  },

  // ── INTELLIGENCE ──────────────────────────────────────────────────────────
  {
    label: 'Intelligence',
    items: [
      {
        label: 'Analytics',
        route: '/analytics',
        icon: 'AN',
        summary: 'Clinic variance, provider output, margin signals',
        counter: '',
        tone: 'neutral',
      },
      {
        label: 'Compliance',
        route: '/compliance',
        icon: 'CP',
        summary: '4 high-trust alerts, sensitive access, MFA posture',
        counter: '4',
        tone: 'critical',
      },
      {
        label: 'Risk Monitor',
        route: '/analytics',
        icon: 'RM',
        summary: 'Revenue exposure, clinical risk, and operational risk',
        counter: '',
        tone: 'neutral',
      },
      {
        label: 'Reports',
        route: '/analytics',
        icon: 'RP',
        summary: 'Scheduled and on-demand operational reports',
        counter: '',
        tone: 'neutral',
      },
    ],
  },

  // ── ADMINISTRATION ────────────────────────────────────────────────────────
  {
    label: 'Administration',
    items: [
      {
        label: 'Clinics',
        route: '/admin',
        icon: 'CK',
        summary: 'Clinic setup, hours, room configuration',
        counter: '',
        tone: 'neutral',
      },
      {
        label: 'Providers',
        route: '/admin',
        icon: 'PV',
        summary: 'Provider profiles, schedules, and credentialing',
        counter: '',
        tone: 'neutral',
      },
      {
        label: 'Integrations',
        route: '/integrations',
        icon: 'IT',
        summary: '2 degraded feeds, device sync, clearinghouse jobs',
        counter: '2',
        tone: 'info',
      },
      {
        label: 'Settings',
        route: '/admin',
        icon: 'ST',
        summary: 'Platform settings, RBAC, and clinic provisioning',
        counter: '',
        tone: 'neutral',
      },
    ],
  },
];
