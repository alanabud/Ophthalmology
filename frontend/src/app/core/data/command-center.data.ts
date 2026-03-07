import {
  ActionQueueItem,
  AiInsight,
  DailyBriefing,
  ExecutiveMetric,
  LiveBoardCard,
} from '../models/enterprise.models';

export const EXECUTIVE_METRICS: Record<string, ExecutiveMetric[]> = {
  network: [
    {
      id: 'scheduled',
      label: 'Patients scheduled today',
      value: '286',
      delta: '+8.2%',
      detail: 'Across 4 clinics and 14 provider templates',
      tone: 'accent',
      spark: [6, 7, 8, 7, 9, 10, 11]
    },
    {
      id: 'flow',
      label: 'Arrivals / in exam / completed',
      value: '198 / 61 / 142',
      delta: '+12 ready',
      detail: 'Queue remains within regional wait target',
      tone: 'success',
      spark: [4, 5, 5, 6, 6, 7, 7]
    },
    {
      id: 'surgeries',
      label: 'Surgeries today',
      value: '14',
      delta: '2 cases at risk',
      detail: 'Lens readiness and clearance drive the risk count',
      tone: 'critical',
      spark: [2, 3, 3, 4, 4, 5, 5]
    },
    {
      id: 'claims',
      label: 'Claim submission volume',
      value: '52 drafts',
      delta: '12 flagged',
      detail: 'Modifier and authorization checks pending',
      tone: 'warning',
      spark: [5, 4, 6, 7, 8, 7, 9]
    },
    {
      id: 'balances',
      label: 'Outstanding balances',
      value: '$184.2K',
      delta: '-3.4%',
      detail: 'Collection velocity improved after recall outreach',
      tone: 'info',
      spark: [10, 9, 9, 8, 8, 7, 7]
    },
    {
      id: 'optical',
      label: 'Optical orders pending',
      value: '37',
      delta: '6 ready today',
      detail: 'Premium lens jobs drive most open order value',
      tone: 'accent',
      spark: [5, 6, 6, 7, 8, 9, 8]
    },
    {
      id: 'wait',
      label: 'Average wait time',
      value: '18 min',
      delta: '+3 min',
      detail: 'Clermont imaging throughput is the main contributor',
      tone: 'warning',
      spark: [2, 2, 3, 3, 4, 4, 5]
    },
    {
      id: 'utilization',
      label: 'Provider utilization',
      value: '92%',
      delta: '+4 pts',
      detail: 'Surgery and retina templates are fully loaded',
      tone: 'success',
      spark: [6, 7, 8, 8, 9, 9, 10]
    },
    {
      id: 'noshow',
      label: 'No-show prediction',
      value: '8.4%',
      delta: '-1.1 pts',
      detail: 'Reminder sequencing reduced risk in glaucoma follow-ups',
      tone: 'info',
      spark: [5, 5, 4, 4, 4, 3, 3]
    },
    {
      id: 'readiness',
      label: 'Readiness score',
      value: '94 / 100',
      delta: '+2 pts',
      detail: 'Audit, staffing, surgery, and device readiness blended',
      tone: 'accent',
      spark: [7, 7, 8, 8, 9, 9, 9]
    }
  ],
  'winter-park': [
    {
      id: 'scheduled',
      label: 'Patients scheduled today',
      value: '82',
      delta: '+6.0%',
      detail: 'Retina heavy day with 14 injection visits',
      tone: 'accent',
      spark: [5, 6, 6, 7, 7, 8, 9]
    },
    {
      id: 'flow',
      label: 'Arrivals / in exam / completed',
      value: '58 / 19 / 37',
      delta: 'On target',
      detail: 'Check-in and imaging turnover are balanced',
      tone: 'success',
      spark: [3, 4, 4, 5, 5, 6, 6]
    },
    {
      id: 'claims',
      label: 'Claims in review',
      value: '11',
      delta: '2 flagged',
      detail: 'Injection modifier review before submission',
      tone: 'warning',
      spark: [4, 4, 5, 5, 6, 6, 7]
    },
    {
      id: 'wait',
      label: 'Average wait time',
      value: '14 min',
      delta: '-2 min',
      detail: 'AI arrival staggering improved room flow',
      tone: 'success',
      spark: [4, 4, 3, 3, 3, 2, 2]
    },
    {
      id: 'readiness',
      label: 'Readiness score',
      value: '96 / 100',
      delta: '+1 pt',
      detail: 'Only pending issue is tomorrow transport-risk recall',
      tone: 'accent',
      spark: [7, 8, 8, 8, 9, 9, 10]
    }
  ],
  clermont: [
    {
      id: 'scheduled',
      label: 'Patients scheduled today',
      value: '74',
      delta: '+4.1%',
      detail: 'High cataract workup density before next week block',
      tone: 'accent',
      spark: [4, 5, 5, 6, 6, 7, 8]
    },
    {
      id: 'flow',
      label: 'Arrivals / in exam / completed',
      value: '51 / 17 / 29',
      delta: 'Imaging backlog',
      detail: 'OCT queue is extending technician handoff',
      tone: 'critical',
      spark: [6, 7, 8, 8, 9, 9, 10]
    },
    {
      id: 'surgeries',
      label: 'Cases this week',
      value: '9',
      delta: '1 at risk',
      detail: 'Biometry confirmation missing on one premium IOL case',
      tone: 'warning',
      spark: [2, 2, 3, 3, 4, 4, 5]
    },
    {
      id: 'wait',
      label: 'Average wait time',
      value: '26 min',
      delta: '+7 min',
      detail: 'Current outlier across the network',
      tone: 'critical',
      spark: [4, 5, 6, 7, 8, 8, 9]
    },
    {
      id: 'readiness',
      label: 'Readiness score',
      value: '89 / 100',
      delta: '-3 pts',
      detail: 'Imaging device maintenance window reduced capacity',
      tone: 'warning',
      spark: [9, 8, 8, 7, 7, 6, 6]
    }
  ],
  'lake-nona': [
    {
      id: 'scheduled',
      label: 'Patients scheduled today',
      value: '63',
      delta: '+5.9%',
      detail: 'Laser and glaucoma follow-up cadence is steady',
      tone: 'accent',
      spark: [4, 4, 5, 5, 6, 6, 7]
    },
    {
      id: 'flow',
      label: 'Arrivals / in exam / completed',
      value: '44 / 11 / 33',
      delta: 'Chart lag',
      detail: 'Two charts remain unsigned after laser lane',
      tone: 'warning',
      spark: [3, 4, 4, 5, 5, 6, 6]
    },
    {
      id: 'claims',
      label: 'Claims in review',
      value: '8',
      delta: '1 flagged',
      detail: 'Authorization linkage missing on one procedure',
      tone: 'warning',
      spark: [2, 3, 3, 4, 4, 5, 5]
    },
    {
      id: 'wait',
      label: 'Average wait time',
      value: '19 min',
      delta: '+1 min',
      detail: 'Still within operating target',
      tone: 'info',
      spark: [3, 3, 3, 4, 4, 4, 5]
    },
    {
      id: 'readiness',
      label: 'Readiness score',
      value: '92 / 100',
      delta: '+2 pts',
      detail: 'MFA completion and chart signing improved this week',
      tone: 'accent',
      spark: [6, 7, 7, 8, 8, 9, 9]
    }
  ],
  'tampa-asc': [
    {
      id: 'surgeries',
      label: 'Surgeries today',
      value: '14',
      delta: '3 readiness gaps',
      detail: 'Lens confirmation and pre-op clearance are holding cases',
      tone: 'critical',
      spark: [4, 4, 5, 5, 6, 6, 7]
    },
    {
      id: 'optical',
      label: 'Optical orders pending',
      value: '23',
      delta: '5 premium pickups',
      detail: 'Pickup notifications are staged for afternoon block',
      tone: 'accent',
      spark: [4, 5, 5, 6, 7, 8, 8]
    },
    {
      id: 'claims',
      label: 'Claims in review',
      value: '17',
      delta: '6 flagged',
      detail: 'ASC implants and anesthesia coding need scrub',
      tone: 'warning',
      spark: [5, 6, 7, 7, 8, 9, 9]
    },
    {
      id: 'wait',
      label: 'Turnover interval',
      value: '22 min',
      delta: '+4 min',
      detail: 'Case cart replenishment is extending turnover',
      tone: 'warning',
      spark: [4, 5, 5, 6, 6, 7, 8]
    },
    {
      id: 'readiness',
      label: 'Readiness score',
      value: '87 / 100',
      delta: '-2 pts',
      detail: 'Implant stock and final lens confirmations drive the gap',
      tone: 'critical',
      spark: [9, 8, 8, 7, 7, 6, 6]
    }
  ]
};

export const LIVE_BOARDS: Record<string, LiveBoardCard[]> = {
  network: [
    {
      id: 'throughput',
      title: 'Clinic throughput monitor',
      subtitle: 'Patients moving slower than target appear first',
      tone: 'accent',
      footer: 'Clermont is the only clinic outside target wait variance.',
      rows: [
        {
          label: 'Clermont Cataract Center',
          supporting: '74 scheduled • imaging backlog',
          value: '26 min wait',
          tone: 'critical',
          tags: ['Throughput down 12%', '4 escalations']
        },
        {
          label: 'Winter Park Retina',
          supporting: '82 scheduled • injection lane balanced',
          value: '14 min wait',
          tone: 'success',
          tags: ['On target', 'AI reminders stable']
        },
        {
          label: 'Lake Nona Glaucoma',
          supporting: '63 scheduled • two unsigned charts',
          value: '19 min wait',
          tone: 'warning',
          tags: ['Chart lag', 'MFA improved']
        },
        {
          label: 'Tampa ASC + Optical',
          supporting: '14 cases • 23 optical orders',
          value: '87 readiness',
          tone: 'critical',
          tags: ['3 lens gaps', 'Case turnover +4 min']
        }
      ]
    },
    {
      id: 'queue',
      title: 'Live appointment queue',
      subtitle: 'Front desk, technician, and provider status in one lane',
      tone: 'info',
      footer: 'Five patients are ready for rooming in the next 20 minutes.',
      rows: [
        {
          label: 'Mila Hart',
          supporting: '11:00 retina injection • Winter Park',
          value: 'Checked in',
          tone: 'accent',
          tags: ['Copay complete', 'AI transport note']
        },
        {
          label: 'Robert Singh',
          supporting: '11:10 cataract consult • Clermont',
          value: 'Needs imaging',
          tone: 'warning',
          tags: ['OCT queue 14 min', 'Translator requested']
        },
        {
          label: 'Dana Morales',
          supporting: '11:15 glaucoma follow-up • Lake Nona',
          value: 'In exam',
          tone: 'success',
          tags: ['VA complete', 'Pressure pending']
        },
        {
          label: 'Nia Patterson',
          supporting: '11:30 cataract surgery • Tampa ASC',
          value: 'Pre-op hold',
          tone: 'critical',
          tags: ['Lens confirm missing', 'Case cart open']
        }
      ]
    },
    {
      id: 'provider',
      title: 'Provider status board',
      subtitle: 'Utilization, delay, documentation, and room state',
      tone: 'accent',
      footer: 'One provider lane needs scribe relief this afternoon.',
      rows: [
        {
          label: 'Dr. Marcus Vale',
          supporting: 'Cataract / Cornea • Exam 5',
          value: '18 min late',
          tone: 'critical',
          tags: ['97% utilized', 'Imaging handoff issue']
        },
        {
          label: 'Dr. Alina Cho',
          supporting: 'Retina • Retina 3',
          value: 'On procedure',
          tone: 'accent',
          tags: ['94% utilized', '2 add-on slots']
        },
        {
          label: 'Dr. Evelyn Sato',
          supporting: 'Glaucoma • Laser 2',
          value: 'Chart lag',
          tone: 'warning',
          tags: ['84% utilized', '2 unsigned charts']
        }
      ]
    },
    {
      id: 'surgery',
      title: 'Surgery readiness board',
      subtitle: 'ASC preparation, lens, clearance, staffing, and turnover',
      tone: 'critical',
      footer: 'Three cases need intervention before afternoon block.',
      rows: [
        {
          label: 'Patterson / OD cataract',
          supporting: '12:10 with Dr. Pike',
          value: 'Lens gap',
          tone: 'critical',
          tags: ['Clareon Toric pending', 'Staffed']
        },
        {
          label: 'Mendez / OS cataract',
          supporting: '13:00 with Dr. Pike',
          value: 'Ready',
          tone: 'success',
          tags: ['IOL confirmed', 'Clearance closed']
        },
        {
          label: 'Walters / YAG follow-up',
          supporting: '14:20 with Dr. Pike',
          value: 'Auth pending',
          tone: 'warning',
          tags: ['Insurance callback', 'Case may slide']
        }
      ]
    },
    {
      id: 'billing',
      title: 'Billing exception queue',
      subtitle: 'Claims, charges, modifier review, and payer exceptions',
      tone: 'warning',
      footer: 'Revenue risk remains concentrated in ASC implant coding.',
      rows: [
        {
          label: 'Claim 88421-A',
          supporting: 'Medicare • cataract + premium IOL',
          value: 'Modifier review',
          tone: 'warning',
          tags: ['AI denial risk 72%', 'Need LT/RT validation']
        },
        {
          label: 'Claim 88414-C',
          supporting: 'Aetna • retina injection series',
          value: 'Auth mismatch',
          tone: 'critical',
          tags: ['Episode span off', 'Hold submission']
        },
        {
          label: 'Claim 88397-F',
          supporting: 'BCBS • glaucoma procedure',
          value: 'Ready to file',
          tone: 'success',
          tags: ['AI clean', 'Coder approved']
        }
      ]
    },
    {
      id: 'optical',
      title: 'Optical lab tracker',
      subtitle: 'Rx to lab to pickup with margin-aware visibility',
      tone: 'accent',
      footer: 'Premium progressive jobs drive the largest pickup opportunity today.',
      rows: [
        {
          label: 'Order OP-2941',
          supporting: 'Sophia Chen • Varilux XR',
          value: 'Ready for pickup',
          tone: 'success',
          tags: ['Text sent', 'Cross-sell sun clip']
        },
        {
          label: 'Order OP-2938',
          supporting: 'Terrence Hall • Transitions Xtractive',
          value: 'Lab delay',
          tone: 'warning',
          tags: ['ETA 16:30', 'Patient notified']
        },
        {
          label: 'Order OP-2931',
          supporting: 'Amina Cole • Pediatric blue light',
          value: 'Awaiting QA',
          tone: 'accent',
          tags: ['Frame fit check', 'Pickup tomorrow']
        }
      ]
    }
  ],
  'winter-park': [
    {
      id: 'throughput',
      title: 'Retina throughput monitor',
      subtitle: 'Injection, imaging, and physician lane balance',
      tone: 'accent',
      footer: 'Rooming stays on target if transport-risk recalls convert.',
      rows: [
        {
          label: 'Injection lane',
          supporting: '14 patients queued through 15:20',
          value: 'On target',
          tone: 'success',
          tags: ['2 add-ons', 'No staff gap']
        },
        {
          label: 'Imaging lane',
          supporting: 'OCT + FA studies before afternoon block',
          value: '8 min lag',
          tone: 'warning',
          tags: ['One device calibration', 'Queue controlled']
        }
      ]
    },
    {
      id: 'billing',
      title: 'Retina revenue watch',
      subtitle: 'Drug admin and authorization integrity',
      tone: 'warning',
      footer: 'Two high-dollar injections still need auth reconciliation.',
      rows: [
        {
          label: 'Lucentis series / Hart',
          supporting: 'Medicare secondary review',
          value: 'Auth verified',
          tone: 'success',
          tags: ['AI clean', 'Charge posted']
        },
        {
          label: 'Eylea HD / Morales',
          supporting: 'Commercial payer case',
          value: 'Verify auth span',
          tone: 'warning',
          tags: ['Potential denial', 'Submit after review']
        }
      ]
    }
  ],
  clermont: [
    {
      id: 'throughput',
      title: 'Cataract workup pressure points',
      subtitle: 'Identify where diagnostic prep is slowing consult volume',
      tone: 'critical',
      footer: 'OCT backlog is reducing consult start capacity by 3 slots.',
      rows: [
        {
          label: 'Biometry queue',
          supporting: '11 patients still to clear before 14:00',
          value: 'Backed up',
          tone: 'critical',
          tags: ['Tech relief needed', 'AI predicts spillover']
        },
        {
          label: 'Counseling lane',
          supporting: 'Premium lens conversions tracking',
          value: 'Healthy',
          tone: 'success',
          tags: ['42% premium mix', 'Docs complete']
        }
      ]
    },
    {
      id: 'surgery',
      title: 'Pre-op conversion watch',
      subtitle: 'Move consults cleanly into surgery scheduling',
      tone: 'warning',
      footer: 'One premium IOL consult needs financing follow-up today.',
      rows: [
        {
          label: 'Keller / premium IOL consult',
          supporting: 'Counseling complete',
          value: 'Awaiting financing',
          tone: 'warning',
          tags: ['Coordinator follow-up', 'Same week close possible']
        },
        {
          label: 'Singh / cataract consult',
          supporting: 'Imaging still pending',
          value: 'Not ready',
          tone: 'critical',
          tags: ['OCT queue', 'Case cannot schedule']
        }
      ]
    }
  ],
  'lake-nona': [
    {
      id: 'throughput',
      title: 'Glaucoma treatment board',
      subtitle: 'Laser sequencing, pressure checks, and chart sign-off',
      tone: 'accent',
      footer: 'Two unsigned laser charts remain the only operational friction.',
      rows: [
        {
          label: 'Laser lane',
          supporting: '4 SLT procedures through 15:00',
          value: 'On time',
          tone: 'success',
          tags: ['Room 2 ready', 'No staffing gap']
        },
        {
          label: 'Chart completion',
          supporting: 'Pressure and diagnosis complete',
          value: '2 unsigned',
          tone: 'warning',
          tags: ['Scribe follow-up', 'Close by noon']
        }
      ]
    }
  ],
  'tampa-asc': [
    {
      id: 'surgery',
      title: 'ASC command board',
      subtitle: 'Case readiness, implant inventory, room turnover',
      tone: 'critical',
      footer: 'Case 3 cannot clear until lens lot is confirmed in inventory.',
      rows: [
        {
          label: 'Patterson / OR 2',
          supporting: 'Toric lens missing final confirmation',
          value: 'Escalated',
          tone: 'critical',
          tags: ['Implant hold', 'Coordinator paged']
        },
        {
          label: 'Mendez / OR 1',
          supporting: 'Clearance, staffing, lens all verified',
          value: 'Ready',
          tone: 'success',
          tags: ['Case cart sealed', 'On schedule']
        }
      ]
    },
    {
      id: 'optical',
      title: 'Optical floor readiness',
      subtitle: 'Lab pickups, retail conversion, and patient pickup windows',
      tone: 'accent',
      footer: 'Afternoon pickup batch can drive same-day retail revenue.',
      rows: [
        {
          label: 'Premium progressive pickups',
          supporting: '5 orders ready before 17:00',
          value: 'High opportunity',
          tone: 'accent',
          tags: ['SMS sent', 'Upsell sunwear']
        },
        {
          label: 'Lab turnaround exceptions',
          supporting: '2 orders delayed by edging vendor',
          value: 'Watch',
          tone: 'warning',
          tags: ['ETA updated', 'Patients informed']
        }
      ]
    }
  ]
};

export const DAILY_BRIEFINGS: Record<string, DailyBriefing> = {
  network: {
    id: 'brief-network',
    headline: 'Regional operations are healthy, but ASC readiness and Clermont imaging are constraining same-day yield.',
    summary:
      'AI synthesis across scheduling, revenue cycle, surgery, and compliance shows one regional pattern: surgical volume is pacing above plan, while imaging throughput and ASC implant controls remain the main drag on patient flow and claim confidence.',
    bullets: [
      'Clermont wait time will remain above 24 minutes unless OCT queue drops by 3 patients before 13:00.',
      'Tampa ASC has 3 cataract cases with lens or clearance gaps; intervention in the next 45 minutes preserves the block.',
      '12 claims can be filed today if modifier review is completed before 16:00.',
      'Tomorrow retina block has 5 elevated no-show patients; staggered reminders can recover 2 to 3 visits.'
    ],
    tone: 'accent',
    updatedAt: 'Updated 10:42 AM'
  },
  'winter-park': {
    id: 'brief-wp',
    headline: 'Retina flow is steady; the highest leverage move is closing tomorrow no-show risk before noon.',
    summary:
      'Injection throughput is protected. The strongest opportunity is converting five transport-risk patients scheduled tomorrow through targeted outreach and ride-share coordination.',
    bullets: [
      'Rooming remains within target and add-on capacity is available.',
      'Two injection claims need auth span confirmation before release.',
      'One imaging device calibration window is the only throughput watch item.'
    ],
    tone: 'accent',
    updatedAt: 'Updated 10:45 AM'
  },
  clermont: {
    id: 'brief-clermont',
    headline: 'Clermont is underperforming because imaging capacity is suppressing cataract consult throughput.',
    summary:
      'OCT and biometry queues are driving patient wait, consult slippage, and downstream surgery scheduling delays. A technician reallocation for 90 minutes should recover the afternoon.',
    bullets: [
      'Biometry queue is the main bottleneck before surgical counseling.',
      'One premium IOL consult is likely to stall without financing follow-up.',
      'Current projected same-day completion is 6 patients below template.'
    ],
    tone: 'critical',
    updatedAt: 'Updated 10:38 AM'
  },
  'lake-nona': {
    id: 'brief-ln',
    headline: 'Lake Nona is operationally stable, with documentation completion as the only meaningful friction point.',
    summary:
      'Laser and glaucoma follow-up flow are meeting target. Two unsigned charts remain the only compliance-sensitive item on the board.',
    bullets: [
      'Pressure and diagnosis capture are on pace.',
      'Authorization risk is isolated to one procedure.',
      'MFA compliance improved after yesterday remediation.'
    ],
    tone: 'accent',
    updatedAt: 'Updated 10:31 AM'
  },
  'tampa-asc': {
    id: 'brief-ta',
    headline: 'Tampa ASC can still finish the block on plan if lens confirmation closes before 11:30.',
    summary:
      'ASC throughput is solid, but implant confirmation and turnover replenishment create the only serious risk to on-time case completion and downstream claims confidence.',
    bullets: [
      'Three cataract cases need final lens or clearance validation.',
      'Optical pickup batch at 16:00 can drive strong same-day retail revenue.',
      'ASC claims carry the highest AI denial risk due to implant and anesthesia coding.'
    ],
    tone: 'critical',
    updatedAt: 'Updated 10:47 AM'
  }
};

export const AI_INSIGHTS: Record<string, AiInsight[]> = {
  network: [
    {
      id: 'ai-revenue',
      category: 'Revenue risk',
      title: 'AI denial prevention is flagging ASC implant and modifier patterns before claim release.',
      summary: '12 claims require modifier or authorization validation. Most are recoverable without coder escalation.',
      rationale: 'Current payer edit patterns match prior denials involving cataract bundles and retina authorization windows.',
      recommendation: 'Prioritize Medicare cataract drafts and commercial injection auth mismatches first.',
      confidence: '92% confidence',
      tone: 'warning'
    },
    {
      id: 'ai-schedule',
      category: 'Schedule optimization',
      title: 'Shift one imaging technician to Clermont for 90 minutes to recover afternoon consult capacity.',
      summary: 'Simulation shows this reduces projected wait by 7 minutes and protects 3 same-day consult completions.',
      rationale: 'Current OCT and biometry queues are the highest throughput friction point in the network.',
      recommendation: 'Pull float tech coverage from Winter Park after injection lane clears at 12:15.',
      confidence: '88% confidence',
      tone: 'accent'
    },
    {
      id: 'ai-documentation',
      category: 'Documentation completeness',
      title: 'Two laser encounters in Lake Nona are missing final sign-off and one diagnosis specificity update.',
      summary: 'Closing these charts before noon removes the largest compliance-sensitive gap outside surgery.',
      rationale: 'Unsigned charts correlate with increased billing lag and audit exceptions.',
      recommendation: 'Send focused scribe reminder and open physician completion queue.',
      confidence: '86% confidence',
      tone: 'warning'
    },
    {
      id: 'ai-followup',
      category: 'Patient follow-up risk',
      title: 'Seven postoperative cataract patients are overdue for 30-day visual outcome capture.',
      summary: 'Most delays trace back to one coordinator backlog and two unconfirmed transportation barriers.',
      rationale: 'Recall lag is concentrated in the Gulf Coast cohort after ASC volume expansion.',
      recommendation: 'Route follow-up calls to optical coordinators with spare afternoon capacity.',
      confidence: '81% confidence',
      tone: 'info'
    },
    {
      id: 'ai-surgery',
      category: 'Surgery bottleneck prediction',
      title: 'Case turnover in Tampa will exceed target by 6 minutes if inventory replenishment stays manual.',
      summary: 'The OR board suggests one case cart replenishment handoff is missing.',
      rationale: 'Room turnover expands whenever implant verification and consumable restock are not closed together.',
      recommendation: 'Pair implant validation with central supply runner before the 12:10 case.',
      confidence: '90% confidence',
      tone: 'critical'
    },
    {
      id: 'ai-inventory',
      category: 'Inventory forecasting',
      title: 'Toric lens and anti-VEGF stock will hit minimum safety threshold in 9 days.',
      summary: 'Forecast combines surgical demand, retina injection cadence, and supplier lead times.',
      rationale: 'The system is seeing stronger than planned premium lens conversion and retina series adherence.',
      recommendation: 'Release the reorder now to avoid quarter-end vendor compression.',
      confidence: '84% confidence',
      tone: 'critical'
    }
  ],
  'winter-park': [
    {
      id: 'ai-wp',
      category: 'No-show prevention',
      title: 'Tomorrow retina block can recover up to 3 visits with targeted outreach by noon.',
      summary: 'Transport-risk and reminder response patterns suggest five patients need non-standard follow-up.',
      rationale: 'Routine automated reminders are underperforming for this cohort.',
      recommendation: 'Trigger ride-share offer and technician callback now.',
      confidence: '89% confidence',
      tone: 'accent'
    }
  ],
  clermont: [
    {
      id: 'ai-clermont',
      category: 'Flow recovery',
      title: 'Temporary tech reallocation is the fastest way to restore cataract consult throughput.',
      summary: 'Clermont can recover 3 same-day consults if OCT and biometry queues are reduced before noon.',
      rationale: 'The bottleneck is diagnostic prep, not physician capacity.',
      recommendation: 'Shift one float tech for 90 minutes and delay low-priority scans.',
      confidence: '91% confidence',
      tone: 'critical'
    }
  ],
  'lake-nona': [
    {
      id: 'ai-ln',
      category: 'Compliance assist',
      title: 'Unsigned laser charts are the only material compliance gap in this clinic today.',
      summary: 'Documentation closure before lunch removes downstream billing and audit friction.',
      rationale: 'Clinical capture is already complete; sign-off is the remaining blocker.',
      recommendation: 'Route a completion prompt to the physician command bar.',
      confidence: '83% confidence',
      tone: 'warning'
    }
  ],
  'tampa-asc': [
    {
      id: 'ai-ta',
      category: 'Surgery readiness',
      title: 'Lens validation is the gating factor for the afternoon cataract block.',
      summary: 'Once three lens confirmations are closed, the ASC returns to on-plan execution.',
      rationale: 'Current staffing and room utilization are adequate; implant verification is not.',
      recommendation: 'Open implant lot confirmation and central supply reconciliation together.',
      confidence: '94% confidence',
      tone: 'critical'
    }
  ]
};

export const ACTION_QUEUE: Record<string, ActionQueueItem[]> = {
  network: [
    {
      id: 'action-1',
      title: 'Unsigned glaucoma charts',
      owner: 'Dr. Evelyn Sato',
      clinic: 'Lake Nona',
      due: 'Today 11:30',
      workflow: 'Encounters',
      nextStep: 'Open documentation completion queue',
      tone: 'warning',
      count: '2 charts'
    },
    {
      id: 'action-2',
      title: 'Lens confirmation hold',
      owner: 'ASC coordinator',
      clinic: 'Tampa ASC',
      due: 'Today 11:15',
      workflow: 'Surgery',
      nextStep: 'Validate implant lot and close case cart checklist',
      tone: 'critical',
      count: '3 cases'
    },
    {
      id: 'action-3',
      title: 'High-risk claim drafts',
      owner: 'Revenue integrity',
      clinic: 'Regional',
      due: 'Today 14:00',
      workflow: 'Billing',
      nextStep: 'Run AI denial scrub and coder sign-off',
      tone: 'warning',
      count: '12 claims'
    },
    {
      id: 'action-4',
      title: 'Tomorrow retina no-show risk',
      owner: 'Front desk lead',
      clinic: 'Winter Park',
      due: 'Today 12:00',
      workflow: 'Scheduling',
      nextStep: 'Trigger targeted outreach and transport support',
      tone: 'accent',
      count: '5 patients'
    },
    {
      id: 'action-5',
      title: 'Biometry queue relief',
      owner: 'Regional operations',
      clinic: 'Clermont',
      due: 'Today 11:45',
      workflow: 'Imaging',
      nextStep: 'Reallocate float technician to diagnostic prep',
      tone: 'critical',
      count: '11 patients'
    },
    {
      id: 'action-6',
      title: 'Expiring anti-VEGF authorization',
      owner: 'Authorization team',
      clinic: 'Winter Park',
      due: 'Tomorrow',
      workflow: 'Patients',
      nextStep: 'Renew prior auth before next injection cycle',
      tone: 'warning',
      count: '4 patients'
    }
  ],
  'winter-park': [
    {
      id: 'action-wp-1',
      title: 'Tomorrow retina no-show risk',
      owner: 'Front desk lead',
      clinic: 'Winter Park',
      due: 'Today 12:00',
      workflow: 'Scheduling',
      nextStep: 'Trigger targeted outreach and transport support',
      tone: 'accent',
      count: '5 patients'
    },
    {
      id: 'action-wp-2',
      title: 'Injection auth renewal',
      owner: 'Authorization team',
      clinic: 'Winter Park',
      due: 'Today 15:00',
      workflow: 'Billing',
      nextStep: 'Close auth span mismatch before charge release',
      tone: 'warning',
      count: '2 claims'
    }
  ],
  clermont: [
    {
      id: 'action-cl-1',
      title: 'Biometry queue relief',
      owner: 'Regional operations',
      clinic: 'Clermont',
      due: 'Today 11:45',
      workflow: 'Imaging',
      nextStep: 'Reallocate float technician to diagnostic prep',
      tone: 'critical',
      count: '11 patients'
    },
    {
      id: 'action-cl-2',
      title: 'Premium IOL financing follow-up',
      owner: 'Surgery coordinator',
      clinic: 'Clermont',
      due: 'Today 16:00',
      workflow: 'Surgery',
      nextStep: 'Contact patient and preserve next-week surgery slot',
      tone: 'warning',
      count: '1 patient'
    }
  ],
  'lake-nona': [
    {
      id: 'action-ln-1',
      title: 'Unsigned laser charts',
      owner: 'Dr. Evelyn Sato',
      clinic: 'Lake Nona',
      due: 'Today 11:30',
      workflow: 'Encounters',
      nextStep: 'Open documentation completion queue',
      tone: 'warning',
      count: '2 charts'
    }
  ],
  'tampa-asc': [
    {
      id: 'action-ta-1',
      title: 'Lens confirmation hold',
      owner: 'ASC coordinator',
      clinic: 'Tampa ASC',
      due: 'Today 11:15',
      workflow: 'Surgery',
      nextStep: 'Validate implant lot and close case cart checklist',
      tone: 'critical',
      count: '3 cases'
    },
    {
      id: 'action-ta-2',
      title: 'ASC implant coding scrub',
      owner: 'Revenue integrity',
      clinic: 'Tampa ASC',
      due: 'Today 15:30',
      workflow: 'Billing',
      nextStep: 'Review implant and anesthesia coding before submission',
      tone: 'warning',
      count: '6 claims'
    }
  ]
};
