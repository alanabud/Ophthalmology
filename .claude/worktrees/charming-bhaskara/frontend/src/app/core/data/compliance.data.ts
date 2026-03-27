import { ComplianceEvent } from '../models/enterprise.models';

export const COMPLIANCE_EVENTS: ComplianceEvent[] = [
  {
    clinicId: 'lake-nona',
    event: 'Unsigned laser encounter remains open beyond policy threshold',
    actor: 'Dr. Evelyn Sato',
    clinic: 'Lake Nona',
    time: '10:08 AM',
    tone: 'warning',
    detail: 'Two charts still need attestation after procedure completion.'
  },
  {
    clinicId: 'tampa-asc',
    event: 'Role-permission change applied to ASC coordinator group',
    actor: 'Platform admin',
    clinic: 'Regional',
    time: '09:52 AM',
    tone: 'info',
    detail: 'Inventory confirmation permission added for implant workflows.'
  },
  {
    clinicId: 'winter-park',
    event: 'Patient chart opened outside scheduled visit window',
    actor: 'Technician J. Fields',
    clinic: 'Winter Park',
    time: '09:30 AM',
    tone: 'critical',
    detail: 'Access was documented for same-day triage, pending supervisor review.'
  },
  {
    clinicId: 'clermont',
    event: 'MFA enrollment completion improved to 98%',
    actor: 'Security automation',
    clinic: 'Regional',
    time: '08:58 AM',
    tone: 'success',
    detail: 'Only one temporary user remains outside target.'
  }
];
