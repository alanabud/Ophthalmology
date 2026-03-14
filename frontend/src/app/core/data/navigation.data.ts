import { NavigationSection } from '../models/enterprise.models';

export const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    label: 'Operations',
    items: [
      {
        label: 'Command Center',
        route: '/command-center',
        icon: 'CC',
        summary: 'Regional bottlenecks, AI intervention, cutoff control',
        counter: '12',
        children: ['Throughput watch', 'Escalations', 'Readiness'],
        tone: 'accent'
      },
      {
        label: 'Patients',
        route: '/patients',
        icon: 'PT',
        summary: '286 active today, 9 recalls, 4 balance escalations',
        counter: '286',
        children: ['Search', 'Recall worklist', 'Balances'],
        tone: 'info'
      },
      {
        label: 'Scheduling',
        route: '/scheduling',
        icon: 'SC',
        summary: '3 delays, waitlist match pressure, no-show risk',
        counter: '3',
        children: ['Clinic board', 'Waitlist', 'Optimization'],
        tone: 'accent'
      },
      {
        label: 'Encounters',
        route: '/encounters',
        icon: 'EM',
        summary: '8 unsigned, 11 in progress, chart closure watch',
        counter: '8',
        children: ['In progress', 'Unsigned', 'Follow-up'],
        tone: 'warning'
      },
      {
        label: 'Imaging',
        route: '/imaging',
        icon: 'IM',
        summary: '2 unread criticals, OCT backlog, review queue',
        counter: '2',
        children: ['OCT queue', 'Results', 'Annotations'],
        tone: 'critical'
      },
      {
        label: 'Surgery',
        route: '/surgery',
        icon: 'SX',
        summary: '3 cases blocked by lens or clearance readiness',
        counter: '3',
        children: ['Cases', 'Pre-op', 'Post-op'],
        tone: 'critical'
      },
      {
        label: 'Optical',
        route: '/optical',
        icon: 'OP',
        summary: '23 open orders, 5 premium pickups, lab ETA watch',
        counter: '5',
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
        summary: '12 blocked claims, modifier review, denial salvage',
        counter: '12',
        children: ['Draft claims', 'Denials', 'A/R aging'],
        tone: 'warning'
      },
      {
        label: 'Inventory',
        route: '/inventory',
        icon: 'IV',
        summary: '7 shortages, implant forecast, reorder pressure',
        counter: '7',
        children: ['Shortages', 'Reorders', 'Forecast'],
        tone: 'critical'
      },
      {
        label: 'Analytics',
        route: '/analytics',
        icon: 'AN',
        summary: 'Clinic variance, provider output, margin signals',
        counter: '9',
        children: ['Regional KPIs', 'Providers', 'Profitability'],
        tone: 'accent'
      },
      {
        label: 'Compliance',
        route: '/compliance',
        icon: 'CP',
        summary: '4 high-trust alerts, sensitive access, MFA posture',
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
        summary: '2 degraded feeds, device sync, clearinghouse jobs',
        counter: '2',
        children: ['Devices', 'API jobs', 'Failures'],
        tone: 'info'
      },
      {
        label: 'Admin',
        route: '/admin',
        icon: 'AD',
        summary: '3 policy changes, RBAC posture, clinic provisioning',
        counter: '3',
        children: ['RBAC', 'Clinics', 'Policies'],
        tone: 'neutral'
      }
    ]
  }
];
