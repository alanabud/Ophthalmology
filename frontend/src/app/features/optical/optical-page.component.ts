import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { OpticalOrder } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { AppModalComponent } from '../../shared/ui/app-modal.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-optical-page',
  imports: [FormsModule, AppModalComponent, StatusChipComponent],
  templateUrl: './optical-page.component.html',
  styleUrl: './optical-page.component.scss'
})
export class OpticalPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly orders = this.store.opticalOrders;

  // Modal state
  protected readonly selectedOrder = signal<OpticalOrder | null>(null);
  protected readonly editingOrder = signal<OpticalOrder | null>(null);
  protected readonly viewOpen = signal(false);
  protected readonly formOpen = signal(false);
  protected readonly trackOpen = signal(false);

  // Form fields
  protected fPatient = '';
  protected fLens = '';
  protected fFrame = '';
  protected fPickup = '';

  protected viewOrder(order: OpticalOrder): void {
    this.selectedOrder.set(order);
    this.viewOpen.set(true);
  }

  protected openEdit(order: OpticalOrder): void {
    this.editingOrder.set(order);
    this.fPatient = order.patient;
    this.fLens = order.lens;
    this.fFrame = order.frame;
    this.fPickup = order.pickup;
    this.formOpen.set(true);
  }

  protected openTrack(order: OpticalOrder): void {
    this.selectedOrder.set(order);
    this.trackOpen.set(true);
  }

  protected openCreate(): void {
    this.editingOrder.set(null);
    this.fPatient = '';
    this.fLens = '';
    this.fFrame = '';
    this.fPickup = '';
    this.formOpen.set(true);
  }

  protected saveOrder(): void {
    if (!this.fPatient.trim()) return;
    const clinicId = this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park';
    if (this.editingOrder()) {
      this.store.updateOpticalOrder({
        ...this.editingOrder()!,
        patient: this.fPatient.trim(),
        lens: this.fLens.trim(),
        frame: this.fFrame.trim(),
        pickup: this.fPickup.trim(),
      });
    } else {
      const orderId = `OPT-${String(Date.now()).slice(-6)}`;
      this.store.createOpticalOrder({
        clinicId,
        patient: this.fPatient.trim(),
        order: orderId,
        lens: this.fLens.trim() || 'TBD',
        frame: this.fFrame.trim() || 'TBD',
        status: 'Order placed',
        tone: 'info',
        pickup: this.fPickup.trim() || 'TBD',
        recommendation: 'New order — awaiting lab processing.',
      });
    }
    this.formOpen.set(false);
    this.editingOrder.set(null);
  }

  protected closeView(): void { this.viewOpen.set(false); this.selectedOrder.set(null); }
  protected closeForm(): void { this.formOpen.set(false); this.editingOrder.set(null); }
  protected closeTrack(): void { this.trackOpen.set(false); this.selectedOrder.set(null); }
}
