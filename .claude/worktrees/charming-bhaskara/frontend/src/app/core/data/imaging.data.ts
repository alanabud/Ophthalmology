import { ImagingStudy } from '../models/enterprise.models';

export const IMAGING_STUDIES: ImagingStudy[] = [
  {
    clinicId: 'winter-park',
    patient: 'Mila Hart',
    modality: 'OCT Macula',
    studyId: 'IMG-24091',
    orderedBy: 'Dr. Alina Cho',
    status: 'Ready for physician review',
    tone: 'accent',
    findings: 'Stable intraretinal fluid with no new subretinal pockets.',
    aiSignal: 'No acute progression detected.'
  },
  {
    clinicId: 'clermont',
    patient: 'Robert Singh',
    modality: 'OCT + Biometry',
    studyId: 'IMG-24102',
    orderedBy: 'Dr. Marcus Vale',
    status: 'Queued',
    tone: 'warning',
    findings: 'Diagnostic prep pending technician capacity.',
    aiSignal: 'High throughput impact if delayed past noon.'
  },
  {
    clinicId: 'lake-nona',
    patient: 'Dana Morales',
    modality: 'HVF 24-2',
    studyId: 'IMG-24104',
    orderedBy: 'Dr. Evelyn Sato',
    status: 'Interpreted',
    tone: 'success',
    findings: 'Stable superior arcuate defect compared with prior.',
    aiSignal: 'Trend stable over 3 visits.'
  },
  {
    clinicId: 'tampa-asc',
    patient: 'Nia Patterson',
    modality: 'Biometry',
    studyId: 'IMG-24110',
    orderedBy: 'Dr. Jordan Pike',
    status: 'Verified, case hold remains',
    tone: 'critical',
    findings: 'Measurements are final; lens confirmation still outstanding.',
    aiSignal: 'Surgery risk driven by implant workflow, not imaging.'
  }
];
