/**
 * Maintenance module navigation configuration.
 * Defines all sections and entity screens within the admin maintenance area.
 */

export interface MaintenanceNavSection {
  label:  string;
  icon:   string;
  items:  MaintenanceNavItem[];
}

export interface MaintenanceNavItem {
  label:    string;
  route:    string;
  icon:     string;
  badge?:   string;
  badgeTone?: string;
  count?:   number;
}

export const MAINTENANCE_NAV: MaintenanceNavSection[] = [
  {
    label: 'Network Setup',
    icon:  '🏢',
    items: [
      { label: 'Organizations',     route: 'organizations',      icon: '🏛' },
      { label: 'Clinics',           route: 'clinics',            icon: '🏥' },
      { label: 'Departments',       route: 'departments',        icon: '📂' },
      { label: 'Network Regions',   route: 'regions',            icon: '🗺' },
    ]
  },
  {
    label: 'Providers & Staff',
    icon:  '👩‍⚕️',
    items: [
      { label: 'Providers',            route: 'providers',         icon: '🩺' },
      { label: 'Credentialing',        route: 'credentialing',     icon: '📋', badge: '4', badgeTone: 'warning' },
      { label: 'Staff',                route: 'staff',             icon: '👥' },
      { label: 'Roles & Permissions',  route: 'roles',             icon: '🔐' },
      { label: 'Scheduling Templates', route: 'scheduling-templates', icon: '📅' },
    ]
  },
  {
    label: 'Clinical Catalog',
    icon:  '🔬',
    items: [
      { label: 'Procedure Codes',      route: 'procedure-codes',   icon: '📊' },
      { label: 'Diagnosis Codes',      route: 'diagnosis-codes',   icon: '🔍' },
      { label: 'Modifiers',            route: 'modifiers',         icon: '#' },
      { label: 'Appointment Types',    route: 'appointment-types', icon: '📅' },
      { label: 'Imaging Modalities',   route: 'imaging-modalities',icon: '📸' },
      { label: 'ASC Readiness Rules',  route: 'asc-readiness',     icon: '✅' },
      { label: 'Surgical Preferences', route: 'surgical-prefs',    icon: '🔧' },
      { label: 'Implant Catalog',      route: 'implant-catalog',   icon: '💎' },
    ]
  },
  {
    label: 'Optical & Inventory',
    icon:  '👓',
    items: [
      { label: 'Optical Products',     route: 'optical-products',  icon: '🕶' },
      { label: 'Inventory Locations',  route: 'inventory-locations',icon: '📦' },
      { label: 'Vendors & Suppliers',  route: 'vendors',           icon: '🏭' },
    ]
  },
  {
    label: 'Billing & Revenue',
    icon:  '💳',
    items: [
      { label: 'Insurance Plans',     route: 'insurance-plans',   icon: '🏦' },
      { label: 'Fee Schedules',       route: 'fee-schedules',     icon: '💲' },
      { label: 'Claim Rules',         route: 'claim-rules',       icon: '📋', badge: '3', badgeTone: 'critical' },
      { label: 'Authorization Rules', route: 'auth-rules',        icon: '🔑' },
      { label: 'Adjustment Reasons',  route: 'adjustment-reasons',icon: '↩' },
      { label: 'Denial Codes',        route: 'denial-codes',      icon: '🚫' },
    ]
  },
  {
    label: 'Workflows & Automation',
    icon:  '⚡',
    items: [
      { label: 'Workflow Rules',       route: 'workflow-rules',    icon: '🔄' },
      { label: 'Escalation Rules',     route: 'escalation-rules',  icon: '🚨' },
      { label: 'Notification Templates', route: 'notifications',   icon: '🔔' },
      { label: 'Task Templates',       route: 'task-templates',    icon: '☑' },
    ]
  },
  {
    label: 'Integrations & System',
    icon:  '🔌',
    items: [
      { label: 'Integration Endpoints', route: 'integrations',     icon: '🔌' },
      { label: 'Lookup Code Tables',    route: 'lookup-codes',     icon: '📖' },
      { label: 'Compliance Categories', route: 'compliance-codes', icon: '⚖' },
      { label: 'System Configuration',  route: 'configuration',    icon: '⚙' },
    ]
  },
  {
    label: 'Governance',
    icon:  '📜',
    items: [
      { label: 'Audit Log',             route: 'audit-log',        icon: '🗂' },
      { label: 'HIPAA Access Log',      route: 'hipaa-log',        icon: '🔒' },
      { label: 'Change History',        route: 'change-history',   icon: '📋' },
    ]
  },
];
