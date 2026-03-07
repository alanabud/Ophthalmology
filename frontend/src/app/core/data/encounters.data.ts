import { EncounterWorkspace } from '../models/enterprise.models';

export const ENCOUNTERS: EncounterWorkspace[] = [
  {
    clinicId: 'winter-park',
    patientName: 'Mila Hart',
    chartStatus: 'In progress',
    completionScore: '86%',
    visitReason: 'Wet AMD injection follow-up',
    flags: ['Anti-VEGF auth renews tomorrow', 'Transport support needed for next visit'],
    timeline: [
      {
        time: '10:02',
        title: 'Check-in completed',
        detail: 'Copay posted, medication list reconciled.',
        tone: 'success'
      },
      {
        time: '10:11',
        title: 'Visual acuity captured',
        detail: 'OD 20/40, OS 20/50 with correction.',
        tone: 'accent'
      },
      {
        time: '10:19',
        title: 'OCT reviewed',
        detail: 'Fluid burden stable compared with prior visit.',
        tone: 'info'
      }
    ],
    sections: [
      {
        title: 'Visual acuity',
        status: 'Completed',
        tone: 'success',
        detail: 'Captured by technician with correction documented.',
        values: [
          { label: 'OD', value: '20/40' },
          { label: 'OS', value: '20/50' },
          { label: 'PH', value: 'No improvement', tone: 'warning' }
        ]
      },
      {
        title: 'Refraction',
        status: 'Deferred',
        tone: 'info',
        detail: 'Not clinically indicated for injection follow-up.',
        values: [{ label: 'Reason', value: 'Retina protocol visit' }]
      },
      {
        title: 'Tonometry',
        status: 'Completed',
        tone: 'success',
        detail: 'Post-injection pressure check within expected range.',
        values: [
          { label: 'OD', value: '16 mmHg' },
          { label: 'OS', value: '15 mmHg' }
        ]
      },
      {
        title: 'Slit lamp and retina findings',
        status: 'Needs sign-off',
        tone: 'warning',
        detail: 'Exam drafted; physician interpretation pending final attestation.',
        values: [
          { label: 'Anterior segment', value: 'Quiet' },
          { label: 'Macula', value: 'Stable fluid burden' },
          { label: 'Diagnosis', value: 'Exudative AMD OU' }
        ]
      },
      {
        title: 'Follow-up plan',
        status: 'Drafted',
        tone: 'accent',
        detail: 'Next injection cycle and transport note prepared.',
        values: [
          { label: 'Return', value: '4 weeks' },
          { label: 'Orders', value: 'Repeat OCT, auth renewal' },
          { label: 'Patient instructions', value: 'Urgent symptoms reviewed' }
        ]
      }
    ],
    aiSummary: [
      {
        id: 'enc-ai-1',
        category: 'Clinical summary',
        title: 'AI chart summary highlights stable retinal fluid burden and confirms the current injection cadence remains appropriate.',
        summary: 'Prior imaging trend and today’s acuity support continuing the current therapy interval.',
        rationale: 'No new symptoms, OCT remains stable, and pressure readings are acceptable.',
        recommendation: 'Finalize note and renew anti-VEGF authorization before checkout.',
        confidence: '91% confidence',
        tone: 'accent'
      },
      {
        id: 'enc-ai-2',
        category: 'Coding assist',
        title: 'Coding assistant suggests validating laterality and injection drug episode linkage before charge release.',
        summary: 'This avoids one of the most common retina claim edits in the current payer mix.',
        rationale: 'Historical denial data shows elevated risk when laterality is implied but not explicit.',
        recommendation: 'Confirm diagnosis specificity and laterality in the final note.',
        confidence: '87% confidence',
        tone: 'warning'
      }
    ]
  }
];
