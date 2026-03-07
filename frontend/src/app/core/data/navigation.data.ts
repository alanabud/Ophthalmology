import { NavigationSection } from '../models/enterprise.models';

export const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    label: 'Operations',
    items: [
      {
        label: 'Command Center',
        route: '/command-center',
        icon: 'CC',
        summary: 'Regional flow, AI briefing, escalations',
        counter: '12',
        children: ['Regional view', 'Escalations', 'Readiness'],
        tone: 'accent'
      },
      {
        label: 'Patients',
        route: '/patients',
        icon: 'PT',
        summary: 'Demographics, chart readiness, care gaps',
        counter: '286',
        children: ['Search', 'Recall worklist', 'Balances'],
        tone: 'info'
      },
      {
        label: 'Scheduling',
        route: '/scheduling',
        icon: 'SC',
        summary: 'Provider lanes, waitlist, no-show risk',
        counter: '34',
        children: ['Clinic board', 'Waitlist', 'Optimization'],
        tone: 'accent'
      },
      {
        label: 'Encounters',
        route: '/encounters',
        icon: 'EM',
        summary: 'Exam progression, chart completion, AI scribe',
        counter: '19',
        children: ['In progress', 'Unsigned', 'Follow-up'],
        tone: 'warning'
      },
      {
        label: 'Imaging',
        route: '/imaging',
        icon: 'IM',
        summary: 'Diagnostic queue, reviews, AI findings assist',
        counter: '11',
        children: ['OCT queue', 'Results', 'Annotations'],
        tone: 'info'
      },
      {
        label: 'Surgery',
        route: '/surgery',
        icon: 'SX',
        summary: 'ASC readiness, lens inventory, staffing',
        counter: '5',
        children: ['Cases', 'Pre-op', 'Post-op'],
        tone: 'critical'
      },
      {
        label: 'Optical',
        route: '/optical',
        icon: 'OP',
        summary: 'Lab orders, pickup pipeline, retail intelligence',
        counter: '23',
        children: ['Orders', 'Recommendations', 'Pickup'],
        tone: 'warning'
      }
    ]
  },
  {
    label: 'Revenue And Oversight',
    items: [
      {
        label: 'Billing',
        route: '/billing',
        icon: 'BL',
        summary: 'Claims, denials, payment velocity, AI coding',
        counter: '52',
        children: ['Draft claims', 'Denials', 'A/R aging'],
        tone: 'warning'
      },
      {
        label: 'Inventory',
        route: '/inventory',
        icon: 'IV',
        summary: 'Implants, drops, frames, forecasted shortages',
        counter: '7',
        children: ['Shortages', 'Reorders', 'Forecast'],
        tone: 'critical'
      },
      {
        label: 'Analytics',
        route: '/analytics',
        icon: 'AN',
        summary: 'Clinic comparisons, productivity, narrative insight',
        counter: '9',
        children: ['Regional KPIs', 'Providers', 'Profitability'],
        tone: 'accent'
      },
      {
        label: 'Compliance',
        route: '/compliance',
        icon: 'CP',
        summary: 'Audit watchtower, access anomalies, MFA posture',
        counter: '4',
        children: ['Audit feed', 'Sensitive access', 'PHI controls'],
        tone: 'critical'
      }
    ]
  },
  {
    label: 'Platform',
    items: [
      {
        label: 'Integrations',
        route: '/integrations',
        icon: 'IN',
        summary: 'EHR, devices, clearinghouse, jobs',
        counter: '18',
        children: ['Devices', 'API jobs', 'Failures'],
        tone: 'info'
      },
      {
        label: 'Admin',
        route: '/admin',
        icon: 'AD',
        summary: 'Tenants, roles, clinic settings, provisioning',
        counter: '3',
        children: ['RBAC', 'Clinics', 'Policies'],
        tone: 'neutral'
      }
    ]
  }
];
