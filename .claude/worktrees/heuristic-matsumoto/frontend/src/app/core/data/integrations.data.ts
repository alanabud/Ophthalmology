import { IntegrationFeedItem } from '../models/enterprise.models';

export const INTEGRATIONS: IntegrationFeedItem[] = [
  {
    name: 'Clearinghouse gateway',
    status: 'Delayed acknowledgements',
    tone: 'warning',
    lastSync: '3 minutes ago',
    detail: 'Commercial payer responses lagging for cataract claim files.'
  },
  {
    name: 'OCT device interface',
    status: 'Healthy',
    tone: 'success',
    lastSync: '42 seconds ago',
    detail: 'Studies flowing directly into imaging queue with metadata.'
  },
  {
    name: 'ASC implant inventory bridge',
    status: 'Needs verification',
    tone: 'critical',
    lastSync: '11 minutes ago',
    detail: 'Lot confirmation did not post on the last case cart update.'
  },
  {
    name: 'Patient messaging service',
    status: 'Healthy',
    tone: 'success',
    lastSync: '19 seconds ago',
    detail: 'Reminder and pickup outreach running inside SLA.'
  }
];
