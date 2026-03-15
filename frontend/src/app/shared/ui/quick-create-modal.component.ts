import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';

import { AppModalComponent } from './app-modal.component';

export type QuickCreateAction = 'new-patient';

@Component({
  selector: 'app-quick-create-modal',
  imports: [AppModalComponent],
  templateUrl: './quick-create-modal.component.html',
  styleUrl: './quick-create-modal.component.scss'
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

  protected navigate(route: string): void {
    void this.router.navigateByUrl(route);
    this.closed.emit();
  }
}
