import { InventoryRecord } from '../models/enterprise.models';

export const INVENTORY: InventoryRecord[] = [
  {
    clinicId: 'tampa-asc',
    item: 'Clareon Toric 19.5D',
    location: 'ASC implant vault',
    onHand: '2 units',
    daysRemaining: '4 days',
    tone: 'critical',
    forecast: 'Demand spike from premium IOL conversions',
    nextOrder: 'Release today'
  },
  {
    clinicId: 'winter-park',
    item: 'Eylea HD',
    location: 'Retina medication refrigerator',
    onHand: '9 doses',
    daysRemaining: '9 days',
    tone: 'warning',
    forecast: 'Injection adherence ahead of plan',
    nextOrder: 'Release tomorrow'
  },
  {
    clinicId: 'tampa-asc',
    item: 'Premium progressive blank',
    location: 'Optical lab',
    onHand: '14 blanks',
    daysRemaining: '11 days',
    tone: 'accent',
    forecast: 'Retail pickup surge before weekend',
    nextOrder: 'No action yet'
  },
  {
    clinicId: 'clermont',
    item: 'Biometry printer cartridges',
    location: 'Imaging supply room',
    onHand: '1 set',
    daysRemaining: '3 days',
    tone: 'warning',
    forecast: 'Consult volume expansion this week',
    nextOrder: 'Reorder today'
  }
];
