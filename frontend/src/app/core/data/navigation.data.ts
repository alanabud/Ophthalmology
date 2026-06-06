import { NavigationSection } from '../models/enterprise.models';

/**
 * Consolidated, honest navigation.
 *
 * Rules enforced here:
 *   1. Every item routes to a real, distinct page — no two items share a route.
 *   2. No misleading links: a label always opens the module it names.
 *   3. Module sub-features (e.g. OCT/Biometry, Claims, Lens Planning) live as
 *      in-page tabs/sections inside their parent module — never as separate
 *      sidebar links that quietly land on the same page.
 *
 *   counter = badge value (empty string = no badge)
 *   tone    = badge colour semantics:
 *             'critical' → red   'warning' → amber
 *             'info'     → blue  'accent'  → cobalt   (neutral = no colour)
 */
export const NAVIGATION_SECTIONS: NavigationSection[] = [
  // ── COMMAND ────────────────────────────────────────────────────────────────
  {
    label: 'Command',
    items: [
      {
        label: 'Dashboard',
        route: '/command-center',
        icon: 'DB',
        summary: 'Command center — regional bottlenecks, AI intervention, escalation control',
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
        summary: 'Appointments, check-in / out, waitlist fit logic, and no-show risk',
        counter: '3',
        tone: 'warning',
      },
      {
        label: 'Encounters',
        route: '/encounters',
        icon: 'EM',
        summary: 'Charts, unsigned notes, in-progress exams, chart closure watch',
        counter: '8',
        tone: 'warning',
      },
    ],
  },

  // ── PATIENT RECORDS ────────────────────────────────────────────────────────
  {
    label: 'Patient Records',
    items: [
      {
        label: 'Patients',
        route: '/patients',
        icon: 'PT',
        summary: '286 active today — charts, orders, prescriptions, recall gaps, high-risk flags',
        counter: '286',
        tone: 'info',
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
        summary: 'OCT / biometry, visual fields, results review — 2 unread criticals',
        counter: '2',
        tone: 'critical',
      },
    ],
  },

  // ── SURGERY & ASC ──────────────────────────────────────────────────────────
  {
    label: 'Surgery & ASC',
    items: [
      {
        label: 'Surgery',
        route: '/surgery',
        icon: 'SX',
        summary: 'Cases, lens planning, ASC readiness, post-op follow-up — 3 blocked',
        counter: '3',
        tone: 'critical',
      },
    ],
  },

  // ── OPTICAL ────────────────────────────────────────────────────────────────
  {
    label: 'Optical',
    items: [
      {
        label: 'Optical',
        route: '/optical',
        icon: 'OP',
        summary: '23 open orders, 5 premium pickups, lens validation, lab ETA watch',
        counter: '5',
        tone: 'warning',
      },
      {
        label: 'Inventory',
        route: '/inventory',
        icon: 'IV',
        summary: '7 shortages, implant forecast, reorder pressure',
        counter: '7',
        tone: 'critical',
      },
    ],
  },

  // ── REVENUE CYCLE ──────────────────────────────────────────────────────────
  {
    label: 'Revenue Cycle',
    items: [
      {
        label: 'Billing',
        route: '/billing',
        icon: 'BL',
        summary: 'Claims, payments, coding review, denials — 12 blocked claims',
        counter: '12',
        tone: 'warning',
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
        summary: 'Clinic variance, provider output, margin signals, risk monitor, reports',
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
    ],
  },

  // ── ADMINISTRATION ────────────────────────────────────────────────────────
  {
    label: 'Administration',
    items: [
      {
        label: 'Integrations',
        route: '/integrations',
        icon: 'IT',
        summary: '2 degraded feeds, device sync, clearinghouse jobs',
        counter: '2',
        tone: 'info',
      },
      {
        label: 'Admin',
        route: '/admin',
        icon: 'AD',
        summary: 'Clinics, providers, users & roles, platform settings',
        counter: '',
        tone: 'neutral',
      },
    ],
  },
];
