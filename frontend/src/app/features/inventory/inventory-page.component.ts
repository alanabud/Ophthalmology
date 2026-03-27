import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { InventoryRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { AppModalComponent } from '../../shared/ui/app-modal.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-inventory-page',
  imports: [FormsModule, AppModalComponent, StatusChipComponent],
  templateUrl: './inventory-page.component.html',
  styleUrl: './inventory-page.component.scss'
})
export class InventoryPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly inventory = this.store.inventory;

  // Modal state
  protected readonly selectedItem = signal<InventoryRecord | null>(null);
  protected readonly editingItem = signal<InventoryRecord | null>(null);
  protected readonly viewOpen = signal(false);
  protected readonly formOpen = signal(false);
  protected readonly orderOpen = signal(false);
  protected fOrderQty = '1';

  // Form fields
  protected fItem = '';
  protected fLocation = '';
  protected fOnHand = '';
  protected fNextOrder = '';

  protected viewItem(item: InventoryRecord): void {
    this.selectedItem.set(item);
    this.viewOpen.set(true);
  }

  protected openEdit(item: InventoryRecord): void {
    this.editingItem.set(item);
    this.fItem = item.item;
    this.fLocation = item.location;
    this.fOnHand = item.onHand;
    this.fNextOrder = item.nextOrder;
    this.formOpen.set(true);
  }

  protected openOrder(item: InventoryRecord): void {
    this.selectedItem.set(item);
    this.fOrderQty = '1';
    this.orderOpen.set(true);
  }

  protected openCreate(): void {
    this.editingItem.set(null);
    this.fItem = '';
    this.fLocation = '';
    this.fOnHand = '';
    this.fNextOrder = '';
    this.formOpen.set(true);
  }

  protected saveItem(): void {
    if (!this.fItem.trim()) return;
    const clinicId = this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park';
    if (this.editingItem()) {
      this.store.updateInventoryItem({
        ...this.editingItem()!,
        item: this.fItem.trim(),
        location: this.fLocation.trim(),
        onHand: this.fOnHand.trim(),
        nextOrder: this.fNextOrder.trim(),
      });
    } else {
      this.store.createInventoryItem({
        clinicId,
        item: this.fItem.trim(),
        location: this.fLocation.trim() || 'Main store',
        onHand: this.fOnHand.trim() || '0',
        daysRemaining: 'Unknown',
        tone: 'neutral',
        forecast: 'Baseline — monitoring required',
        nextOrder: this.fNextOrder.trim() || 'TBD',
      });
    }
    this.formOpen.set(false);
    this.editingItem.set(null);
  }

  protected confirmOrder(): void {
    // In a real app this would create a purchase order
    this.orderOpen.set(false);
    this.selectedItem.set(null);
  }

  protected closeView(): void { this.viewOpen.set(false); this.selectedItem.set(null); }
  protected closeForm(): void { this.formOpen.set(false); this.editingItem.set(null); }
  protected closeOrder(): void { this.orderOpen.set(false); this.selectedItem.set(null); }
}
