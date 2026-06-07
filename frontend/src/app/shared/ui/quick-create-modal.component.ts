import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';

import { AppModalComponent } from './app-modal.component';

/** Actions emittable from the Quick Create menu (handled by shell modals) */
export type QuickCreateAction = 'new-patient' | 'new-appointment' | 'new-claim';

type QcTone = 'accent' | 'gold' | 'info' | 'critical' | 'blue';

interface QcItem {
  label: string;
  desc: string;
  icon: string;
  tone: QcTone;
  kind: 'modal' | 'route';
  target: string;
}

interface QcGroup {
  label: string;
  items: QcItem[];
}

@Component({
  selector: 'app-quick-create-modal',
  imports: [AppModalComponent],
  styleUrl: './quick-create-modal.component.scss',
  template: `
    <app-modal [open]="open()" title="Quick Create" (closed)="closed.emit()">
      <p class="qc-intro">Start a clinical or revenue workflow — every action opens its real screen.</p>
      <div class="qc-groups">
        @for (group of groups; track group.label) {
          <section class="qc-group">
            <p class="qc-group__label">{{ group.label }}</p>
            <div class="qc-group__items">
              @for (item of group.items; track item.label) {
                <button type="button" class="qc-item" (click)="run(item)">
                  <span class="qc-item__icon qc-item__icon--{{ item.tone }}">{{ item.icon }}</span>
                  <div class="qc-item__copy">
                    <strong>{{ item.label }}</strong>
                    <p>{{ item.desc }}</p>
                  </div>
                  <span class="qc-item__arrow">→</span>
                </button>
              }
            </div>
          </section>
        }
      </div>
    </app-modal>
  `
})
export class QuickCreateModalComponent {
  private readonly router = inject(Router);

  readonly open = input(false);
  readonly closed = output<void>();
  readonly actionSelected = output<QuickCreateAction>();

  protected readonly groups: QcGroup[] = [
    {
      label: 'Patient Care',
      items: [
        { label: 'New patient',    desc: 'Register a patient to the roster',     icon: 'PT', tone: 'accent', kind: 'modal', target: 'new-patient' },
        { label: 'Start encounter', desc: 'Open an exam or follow-up chart',      icon: 'EX', tone: 'info',   kind: 'route', target: '/encounters' },
      ],
    },
    {
      label: 'Scheduling',
      items: [
        { label: 'New appointment', desc: 'Book a visit for any patient',          icon: 'SC', tone: 'gold',  kind: 'modal', target: 'new-appointment' },
      ],
    },
    {
      label: 'Imaging & Testing',
      items: [
        { label: 'Order imaging',   desc: 'OCT, biometry or visual field study',   icon: 'IM', tone: 'blue',  kind: 'route', target: '/imaging' },
      ],
    },
    {
      label: 'Clinical Operations',
      items: [
        { label: 'Surgery case',    desc: 'Add a case to the surgical pipeline',    icon: 'SX', tone: 'accent', kind: 'route', target: '/surgery' },
      ],
    },
    {
      label: 'Billing & Claims',
      items: [
        { label: 'New claim',       desc: 'Begin a claim for a recent encounter',  icon: 'CL', tone: 'critical', kind: 'modal', target: 'new-claim' },
        { label: 'Collect payment', desc: 'Post a patient or payer payment',        icon: '$',  tone: 'gold',     kind: 'route', target: '/billing' },
      ],
    },
  ];

  protected run(item: QcItem): void {
    if (item.kind === 'modal') {
      this.actionSelected.emit(item.target as QuickCreateAction);
      this.closed.emit();
    } else {
      void this.router.navigateByUrl(item.target);
      this.closed.emit();
    }
  }
}
