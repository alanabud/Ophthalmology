import { ClaimRecord } from '../models/enterprise.models';

export const CLAIMS: ClaimRecord[] = [
  {
    clinicId: 'tampa-asc',
    claim: '88421-A',
    patient: 'Nia Patterson',
    payer: 'Medicare',
    amount: '$4,820.00',
    status: 'Modifier review',
    tone: 'warning',
    denialRisk: '72%',
    nextAction: 'Validate LT/RT and implant line detail'
  },
  {
    clinicId: 'winter-park',
    claim: '88414-C',
    patient: 'Dana Morales',
    payer: 'Aetna',
    amount: '$1,940.00',
    status: 'Authorization mismatch',
    tone: 'critical',
    denialRisk: '81%',
    nextAction: 'Correct auth span before submit'
  },
  {
    clinicId: 'lake-nona',
    claim: '88397-F',
    patient: 'Walter Briggs',
    payer: 'BCBS',
    amount: '$642.00',
    status: 'Ready to submit',
    tone: 'success',
    denialRisk: '14%',
    nextAction: 'Release in next batch'
  },
  {
    clinicId: 'clermont',
    claim: '88427-Q',
    patient: 'Robert Singh',
    payer: 'UHC',
    amount: '$1,280.00',
    status: 'Referral hold',
    tone: 'warning',
    denialRisk: '54%',
    nextAction: 'Attach referral and reopen claim draft'
  }
];
