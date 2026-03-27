import { SurgeryCase } from '../models/enterprise.models';

export const SURGERY_CASES: SurgeryCase[] = [
  {
    clinicId: 'tampa-asc',
    patient: 'Nia Patterson',
    procedure: 'OD cataract with toric IOL',
    surgeon: 'Dr. Jordan Pike',
    date: 'Today 12:10',
    readiness: 'Hold',
    tone: 'critical',
    implant: 'Clareon Toric pending final lot confirmation',
    clearance: 'Cleared',
    risk: 'Case start at risk if not closed in 30 min'
  },
  {
    clinicId: 'tampa-asc',
    patient: 'Elena Mendez',
    procedure: 'OS cataract with monofocal IOL',
    surgeon: 'Dr. Jordan Pike',
    date: 'Today 13:00',
    readiness: 'Ready',
    tone: 'success',
    implant: 'Confirmed and staged',
    clearance: 'Cleared',
    risk: 'Low risk'
  },
  {
    clinicId: 'clermont',
    patient: 'Heather Keller',
    procedure: 'Premium IOL counseling to surgery conversion',
    surgeon: 'Dr. Marcus Vale',
    date: 'Needs scheduling',
    readiness: 'Financial review pending',
    tone: 'warning',
    implant: 'Lens selection complete',
    clearance: 'Awaiting financing',
    risk: 'Conversion may slip to next block'
  }
];
