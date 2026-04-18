import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InventoryRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { AppModalComponent } from '../../shared/ui/app-modal.component';
import { NewInventoryModalComponent } from '../../shared/ui/new-inventory-modal.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';

@Component({
  selector: 'app-inventory-page',
  imports: [FormsModule, AppModalComponent, NewInventoryModalComponent, StatusChipComponent],
  templateUrl: './inventory-page.component.html',
  styleUrl: './inventory-page.component.scss'
})
export class InventoryPageComponent {
  protected readonly store = inject(EnterpriseStoreService);
  protected readonly allInventory = this.store.inventory;

  // Filters
  protected readonly searchQuery = signal('');
  protected readonly categoryFilter = signal('');
  protected readonly statusFilter = signal('');
  protected readonly locationFilter = signal('');

  // Sort
  protected sortField = signal('item');
  protected sortDir = signal<'asc' | 'desc'>('asc');

  // Modals
  protected readonly inventoryModalOpen = signal(false);
  protected readonly itemToEdit = signal<InventoryRecord | null>(null);
  protected readonly viewOpen = signal(false);
  protected readonly selectedItem = signal<InventoryRecord | null>(null);
  protected readonly orderOpen = signal(false);
  protected fOrderQty = '1';

  protected readonly categoryOptions = ['IOL / Implant', 'Pharmaceutical', 'Optical Material', 'Surgical Supply', 'Device / Equipment', 'Consumable', 'Diagnostic Supply', 'Kit / Pack', 'Other'];
  protected readonly statusOptions = ['Active', 'Low Stock', 'Critical', 'Out of Stock', 'On Order', 'Discontinued', 'Expired'];

  protected readonly criticalCount = computed(() => this.allInventory().filter(i => i.inventoryStatus === 'Critical' || i.tone === 'critical').length);
  protected readonly lowStockCount = computed(() => this.allInventory().filter(i => i.inventoryStatus === 'Low Stock' || (i.tone === 'warning' && i.inventoryStatus !== 'Critical')).length);
  protected readonly activeCount = computed(() => this.allInventory().filter(i => (i.inventoryStatus ?? 'Active') === 'Active').length);

  protected readonly filteredInventory = computed(() => {
    let list = this.allInventory();
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.categoryFilter();
    const status = this.statusFilter();
    const loc = this.locationFilter().toLowerCase().trim();

    if (q) list = list.filter(i =>
      (i.itemName ?? i.item).toLowerCase().includes(q) ||
      (i.sku ?? '').toLowerCase().includes(q) ||
      (i.lotNumber ?? '').toLowerCase().includes(q) ||
      (i.manufacturer ?? '').toLowerCase().includes(q)
    );
    if (cat) list = list.filter(i => i.category === cat);
    if (status) list = list.filter(i => (i.inventoryStatus ?? '') === status);
    if (loc) list = list.filter(i => i.location.toLowerCase().includes(loc));

    const field = this.sortField();
    const dir = this.sortDir();
    list = [...list].sort((a, b) => {
      const va = String((a as any)[field] ?? '').toLowerCase();
      const vb = String((b as any)[field] ?? '').toLowerCase();
      return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    return list;
  });

  protected toggleSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

  protected sortIcon(field: string): string {
    if (this.sortField() !== field) return '↕';
    return this.sortDir() === 'asc' ? '↑' : '↓';
  }

  protected openCreate(): void {
    this.itemToEdit.set(null);
    this.inventoryModalOpen.set(true);
  }

  protected openEdit(item: InventoryRecord): void {
    this.itemToEdit.set(item);
    this.inventoryModalOpen.set(true);
  }

  protected viewItem(item: InventoryRecord): void {
    this.selectedItem.set(item);
    this.viewOpen.set(true);
  }

  protected openOrder(item: InventoryRecord): void {
    this.selectedItem.set(item);
    this.fOrderQty = String(item.reorderQty ?? 1);
    this.orderOpen.set(true);
  }

  protected confirmOrder(): void {
    const item = this.selectedItem();
    if (item) {
      const qty = parseInt(this.fOrderQty, 10);
      if (qty > 0) {
        const currentOnHand = item.onHandQty ?? parseFloat(item.onHand) ?? 0;
        const newQty = currentOnHand + qty;
        this.store.updateInventoryItem({
          ...item,
          onHandQty: newQty,
          onHand: String(newQty),
          inventoryStatus: 'In stock',
          tone: 'success',
        });
      }
    }
    this.orderOpen.set(false);
    this.selectedItem.set(null);
  }

  protected closeView(): void { this.viewOpen.set(false); this.selectedItem.set(null); }
  protected closeOrder(): void { this.orderOpen.set(false); this.selectedItem.set(null); }
  protected closeInventoryModal(): void { this.inventoryModalOpen.set(false); this.itemToEdit.set(null); }

  protected formatCurrency(val: number | undefined): string {
    if (val == null) return '—';
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  protected stockPercent(item: InventoryRecord): number {
    const onHand = item.onHandQty ?? 0;
    const max = (item.maxLevel ?? item.parLevel ?? onHand) || 1;
    return Math.min(100, Math.round((onHand / max) * 100));
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.categoryFilter.set('');
    this.statusFilter.set('');
    this.locationFilter.set('');
  }

  protected get hasActiveFilters(): boolean {
    return !!(this.searchQuery() || this.categoryFilter() || this.statusFilter() || this.locationFilter());
  }

  protected statusToneClass(status: string | undefined): string {
    switch (status) {
      case 'Critical': return 'inv-status--critical';
      case 'Low Stock': return 'inv-status--warning';
      case 'Active': return 'inv-status--active';
      case 'Out of Stock': return 'inv-status--oos';
      case 'On Order': return 'inv-status--order';
      case 'Expired': return 'inv-status--expired';
      default: return 'inv-status--neutral';
    }
  }

  protected stockBarClass(item: InventoryRecord): string {
    const pct = this.stockPercent(item);
    if (pct <= 20) return 'stock-bar__fill--critical';
    if (pct <= 50) return 'stock-bar__fill--warning';
    return 'stock-bar__fill--ok';
  }
}
