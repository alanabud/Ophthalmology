import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';

import { AppModalComponent } from './app-modal.component';

/** Actions emittable from the Quick Create menu */
export type QuickCreateAction = 'new-patient' | 'new-appointment' | 'new-claim';

@Component({
  selector: 'app-quick-create-modal',
  imports: [AppModalComponent],
  styleUrl: './quick-create-modal.component.scss',
  template: `
    <app-modal [open]="open()" title="Quick Create" (closed)="closed.emit()">
      <div class="qc-menu">
        <button type="button" class="qc-item" (click)="selectNewPatient()">
          <span class="qc-item__icon qc-item__icon--accent">PT</span>
          <div class="qc-item__copy">
            <strong>New patient</strong>
            <p>Register a new patient to the roster</p>
          </div>
          <span class="qc-item__arrow">→</span>
        </button>

        <button type="button" class="qc-item" (click)="selectAction('new-appointment')">
          <span class="qc-item__icon qc-item__icon--gold">SC</span>
          <div class="qc-item__copy">
            <strong>New appointment</strong>
            <p>Schedule a visit for any patient</p>
          </div>
          <span class="qc-item__arrow">→</span>
        </button>

        <button type="button" class="qc-item" (click)="navigate('/encounters')">
          <span class="qc-item__icon qc-item__icon--info">EX</span>
          <div class="qc-item__copy">
            <strong>New encounter</strong>
            <p>Start an exam or follow-up chart</p>
          </div>
          <span class="qc-item__arrow">→</span>
        </button>

        <button type="button" class="qc-item" (click)="selectAction('new-claim')">
          <span class="qc-item__icon qc-item__icon--critical">CL</span>
          <div class="qc-item__copy">
            <strong>New claim</strong>
            <p>Begin a billing claim for a recent encounter</p>
          </div>
          <span class="qc-item__arrow">→</span>
        </button>
      </div>
    </app-modal>
  `
})
export class QuickCreateModalComponent {
  private readonly router = inject(Router);

  readonly open = input(false);
  readonly closed = output<void>();
  readonly actionSelected = output<QuickCreateAction>();

  protected selectNewPatient(): void {
    this.actionSelected.emit('new-patient');
    this.closed.emit();
  }

  protected selectAction(action: QuickCreateAction): void {
    this.actionSelected.emit(action);
    this.closed.emit();
  }

  protected navigate(route: string): void {
    void this.router.navigateByUrl(route);
    this.closed.emit();
  }
}
