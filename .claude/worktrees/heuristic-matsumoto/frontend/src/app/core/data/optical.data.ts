import { OpticalOrder } from '../models/enterprise.models';

export const OPTICAL_ORDERS: OpticalOrder[] = [
  {
    clinicId: 'tampa-asc',
    patient: 'Sophia Chen',
    order: 'OP-2941',
    lens: 'Varilux XR progressive',
    frame: 'Tom Ford TF5918',
    status: 'Ready for pickup',
    tone: 'success',
    pickup: 'Today 16:15',
    recommendation: 'Offer polarized second pair and clip-on sunwear.'
  },
  {
    clinicId: 'winter-park',
    patient: 'Terrence Hall',
    order: 'OP-2938',
    lens: 'Transitions Xtractive',
    frame: 'Maui Jim titanium',
    status: 'Lab delay',
    tone: 'warning',
    pickup: 'Tomorrow 11:00 (ETA)',
    recommendation: 'Proactive retention call advised.'
  },
  {
    clinicId: 'tampa-asc',
    patient: 'Amina Cole',
    order: 'OP-2931',
    lens: 'BlueProtect single vision',
    frame: 'OVVO youth line',
    status: 'Awaiting QA',
    tone: 'accent',
    pickup: 'Tomorrow afternoon',
    recommendation: 'Bundle anti-fatigue lens conversation with pickup.'
  }
];
