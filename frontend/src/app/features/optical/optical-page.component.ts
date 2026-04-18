import { Component, computed, inject, signal } from '@angular/core';
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

  // Stats
  protected readonly readyCount = computed(() => this.orders().filter(o => o.status === 'Ready for pickup').length);
  protected readonly delayCount = computed(() => this.orders().filter(o => o.status === 'Lab delay' || o.tone === 'warning').length);
  protected readonly inProgressCount = computed(() => this.orders().filter(o => o.status !== 'Ready for pickup' && o.tone !== 'warning').length);

  // Filters
  protected readonly searchQuery = signal('');

  protected readonly filteredOrders = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.orders();
    return this.orders().filter(o =>
      o.patient.toLowerCase().includes(q) ||
      o.order.toLowerCase().includes(q) ||
      o.lens.toLowerCase().includes(q) ||
      (o.labName ?? '').toLowerCase().includes(q) ||
      (o.prescribedBy ?? '').toLowerCase().includes(q)
    );
  });

  // Modal state
  protected readonly selectedOrder = signal<OpticalOrder | null>(null);
  protected readonly editingOrder = signal<OpticalOrder | null>(null);
  protected readonly viewOpen = signal(false);
  protected readonly formOpen = signal(false);
  protected readonly trackOpen = signal(false);

  // Basic fields
  protected fPatient = '';
  protected fLens = '';
  protected fFrame = '';
  protected fPickup = '';
  protected fPrescribedBy = '';
  protected fRxDate = '';
  protected fLabName = '';
  protected fLabOrderId = '';
  protected fDeliveryMethod = '';
  protected fCoating = '';
  protected fTint = '';

  // OD Rx
  protected fOdSphere = '';
  protected fOdCylinder = '';
  protected fOdAxis = '';
  protected fOdAdd = '';

  // OS Rx
  protected fOsSphere = '';
  protected fOsCylinder = '';
  protected fOsAxis = '';
  protected fOsAdd = '';

  // PD
  protected fPd = '';
  protected fNearPd = '';

  readonly lensOptions = ['Single vision clear', 'Single vision BlueProtect', 'Bifocal FT-28', 'Progressive standard', 'Progressive premium', 'Varilux XR progressive', 'Zeiss Individual 2 progressive', 'Transitions Gen 8', 'Transitions Xtractive', 'Drivewear polarized', 'Contact lenses (soft)', 'Contact lenses (rigid gas permeable)'];
  readonly deliveryOptions = ['In-store pickup', 'Ship to patient', 'Ship to clinic', 'Will call'];
  readonly labOptions = ['Essilor Rx Lab — Tampa', 'Hoya Vision Care — Orlando', 'Zeiss Vision Center Lab', 'Shamir Lab — South Florida', 'In-house edging lab'];

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
    this.fPrescribedBy = order.prescribedBy ?? '';
    this.fRxDate = order.rxDate ?? '';
    this.fLabName = order.labName ?? '';
    this.fLabOrderId = order.labOrderId ?? '';
    this.fDeliveryMethod = order.deliveryMethod ?? '';
    this.fCoating = order.coating ?? '';
    this.fTint = order.tint ?? '';
    this.fOdSphere = order.odSphere ?? '';
    this.fOdCylinder = order.odCylinder ?? '';
    this.fOdAxis = order.odAxis ?? '';
    this.fOdAdd = order.odAdd ?? '';
    this.fOsSphere = order.osSphere ?? '';
    this.fOsCylinder = order.osCylinder ?? '';
    this.fOsAxis = order.osAxis ?? '';
    this.fOsAdd = order.osAdd ?? '';
    this.fPd = order.pd ?? '';
    this.fNearPd = order.nearPd ?? '';
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
    this.fPrescribedBy = '';
    this.fRxDate = '';
    this.fLabName = '';
    this.fLabOrderId = '';
    this.fDeliveryMethod = '';
    this.fCoating = '';
    this.fTint = '';
    this.fOdSphere = '';
    this.fOdCylinder = '';
    this.fOdAxis = '';
    this.fOdAdd = '';
    this.fOsSphere = '';
    this.fOsCylinder = '';
    this.fOsAxis = '';
    this.fOsAdd = '';
    this.fPd = '';
    this.fNearPd = '';
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
        prescribedBy: this.fPrescribedBy.trim(),
        rxDate: this.fRxDate,
        labName: this.fLabName,
        labOrderId: this.fLabOrderId.trim(),
        deliveryMethod: this.fDeliveryMethod,
        coating: this.fCoating.trim(),
        tint: this.fTint.trim(),
        odSphere: this.fOdSphere, odCylinder: this.fOdCylinder, odAxis: this.fOdAxis, odAdd: this.fOdAdd,
        osSphere: this.fOsSphere, osCylinder: this.fOsCylinder, osAxis: this.fOsAxis, osAdd: this.fOsAdd,
        pd: this.fPd, nearPd: this.fNearPd,
      });
    } else {
      const orderId = `OPT-${String(Date.now()).slice(-6)}`;
      this.store.createOpticalOrder({
        clinicId,
        patient: this.fPatient.trim(),
        order: orderId,
        lens: this.fLens.trim() || 'TBD',
        frame: this.fFrame.trim() || 'TBD',
        status: 'On order',
        tone: 'info',
        pickup: this.fPickup.trim() || 'TBD',
        recommendation: 'New order — awaiting lab processing.',
        prescribedBy: this.fPrescribedBy.trim(),
        rxDate: this.fRxDate,
        labName: this.fLabName,
        labOrderId: this.fLabOrderId.trim(),
        deliveryMethod: this.fDeliveryMethod,
        coating: this.fCoating.trim(),
        tint: this.fTint.trim(),
        odSphere: this.fOdSphere, odCylinder: this.fOdCylinder, odAxis: this.fOdAxis, odAdd: this.fOdAdd,
        osSphere: this.fOsSphere, osCylinder: this.fOsCylinder, osAxis: this.fOsAxis, osAdd: this.fOsAdd,
        pd: this.fPd, nearPd: this.fNearPd,
      });
    }
    this.formOpen.set(false);
    this.editingOrder.set(null);
  }

  protected closeView(): void { this.viewOpen.set(false); this.selectedOrder.set(null); }
  protected closeForm(): void { this.formOpen.set(false); this.editingOrder.set(null); }
  protected closeTrack(): void { this.trackOpen.set(false); this.selectedOrder.set(null); }
}
