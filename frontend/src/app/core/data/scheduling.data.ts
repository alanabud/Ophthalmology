import { ScheduleLane, WaitlistRecord } from '../models/enterprise.models';

export const SCHEDULE_LANES: ScheduleLane[] = [
  {
    clinicId: 'winter-park',
    provider: 'Dr. Alina Cho',
    specialty: 'Retina',
    utilization: '94%',
    lag: 'On target',
    blocks: [
      {
        time: '10:40',
        duration: '20m',
        patient: 'Mila Hart',
        visitType: 'Injection follow-up',
        status: 'Checked in',
        tone: 'accent',
        lane: 'Retina 3'
      },
      {
        time: '11:20',
        duration: '15m',
        patient: 'Ronald Price',
        visitType: 'Urgent retina add-on',
        status: 'Ready for rooming',
        tone: 'critical',
        lane: 'Retina 3'
      },
      {
        time: '11:40',
        duration: '20m',
        patient: 'Keisha Lane',
        visitType: 'Macular edema follow-up',
        status: 'Reminder confirmed',
        tone: 'success',
        lane: 'Retina 3'
      }
    ]
  },
  {
    clinicId: 'clermont',
    provider: 'Dr. Marcus Vale',
    specialty: 'Cataract / Cornea',
    utilization: '97%',
    lag: '18 min behind',
    blocks: [
      {
        time: '10:55',
        duration: '30m',
        patient: 'Robert Singh',
        visitType: 'Cataract consult',
        status: 'Imaging waiting',
        tone: 'warning',
        lane: 'Exam 5'
      },
      {
        time: '11:35',
        duration: '25m',
        patient: 'Heather Keller',
        visitType: 'Premium IOL counseling',
        status: 'In counseling',
        tone: 'accent',
        lane: 'Counsel 2'
      },
      {
        time: '12:05',
        duration: '20m',
        patient: 'Anita Cole',
        visitType: 'Referral pending consult',
        status: 'Blocked',
        tone: 'critical',
        lane: 'Exam 5'
      }
    ]
  },
  {
    clinicId: 'lake-nona',
    provider: 'Dr. Evelyn Sato',
    specialty: 'Glaucoma',
    utilization: '84%',
    lag: 'Chart closure lag',
    blocks: [
      {
        time: '11:05',
        duration: '20m',
        patient: 'Dana Morales',
        visitType: 'Pressure follow-up',
        status: 'In exam',
        tone: 'success',
        lane: 'Laser 2'
      },
      {
        time: '11:35',
        duration: '15m',
        patient: 'Walter Briggs',
        visitType: 'Recall add-on',
        status: 'Needs outreach',
        tone: 'warning',
        lane: 'Exam 2'
      }
    ]
  },
  {
    clinicId: 'tampa-asc',
    provider: 'Dr. Jordan Pike',
    specialty: 'ASC Cataract',
    utilization: '93%',
    lag: 'Turnover +4 min',
    blocks: [
      {
        time: '12:10',
        duration: '35m',
        patient: 'Nia Patterson',
        visitType: 'OD cataract',
        status: 'Pre-op hold',
        tone: 'critical',
        lane: 'OR 2'
      },
      {
        time: '13:00',
        duration: '30m',
        patient: 'Elena Mendez',
        visitType: 'OS cataract',
        status: 'Ready',
        tone: 'success',
        lane: 'OR 1'
      }
    ]
  }
];

export const WAITLIST: WaitlistRecord[] = [
  {
    clinicId: 'winter-park',
    patient: 'Lacey Morgan',
    request: 'Retina sooner follow-up',
    preferredWindow: 'Today 13:00 - 15:00',
    fitScore: '92%',
    tone: 'accent'
  },
  {
    clinicId: 'clermont',
    patient: 'Michael Dorsey',
    request: 'Cataract consult sooner slot',
    preferredWindow: 'Tomorrow morning',
    fitScore: '88%',
    tone: 'accent'
  },
  {
    clinicId: 'lake-nona',
    patient: 'Renee Phillips',
    request: 'Pressure check add-on',
    preferredWindow: 'Today after 15:00',
    fitScore: '74%',
    tone: 'warning'
  },
  {
    clinicId: 'tampa-asc',
    patient: 'George Walden',
    request: 'Post-op sooner visit',
    preferredWindow: 'Tomorrow afternoon',
    fitScore: '81%',
    tone: 'info'
  }
];
