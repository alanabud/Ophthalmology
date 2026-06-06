import { Injectable, signal } from '@angular/core';

export type GlobalAction =
  | 'new-patient'
  | 'new-appointment'
  | 'new-claim'
  | 'start-exam'
  | 'surgery-case'
  | 'collect-payment'
  | 'order-imaging';

@Injectable({ providedIn: 'root' })
export class ActionService {
  // Incrementing id ensures the same action dispatched twice still triggers effects
  private _seq = 0;
  readonly trigger = signal<{ action: GlobalAction; id: number } | null>(null);

  dispatch(action: GlobalAction): void {
    this.trigger.set({ action, id: ++this._seq });
  }
}
