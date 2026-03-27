import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InventoryRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

interface Tab { num: number; label: string; icon: string; }

const TABS: Tab[] = [
  { num: 1, label: 'Identity', icon: '🏷' },
  { num: 2, label: 'Stock Control', icon: '📦' },
  { num: 3, label: 'Location', icon: '📍' },
  { num: 4, label: 'Procurement', icon: '💰' },
  { num: 5, label: 'Compliance', icon: '🛡' },
  { num: 6, label: 'Lifecycle', icon: '⚙' },
  { num: 7, label: 'Notes', icon: '📝' },
];

@Component({
  selector: 'app-new-inventory-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './new-inventory-modal.component.html',
  styleUrl: './new-inventory-modal.component.scss'
})
export class NewInventoryModalComponent {
  private readonly store = inject(EnterpriseStoreService);

  readonly open = input(false);
  readonly itemToEdit = input<InventoryRecord | null>(null);
  readonly closed = output<void>();

  protected readonly isEditMode = signal(false);
  protected readonly currentTab = signal(1);
  protected readonly isSubmitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly tabs = TABS;

  // Tab 1: Identity
  protected fItemName = '';
  protected fCategory = '';
  protected fSubcategory = '';
  protected fBrand = '';
  protected fManufacturer = '';
  protected fModel = '';
  protected fSku = '';
  protected fMfrPartNumber = '';
  protected fLotNumber = '';
  protected fUdi = '';
  protected fDescription = '';
  protected fClinicalNotes = '';

  // Tab 2: Stock Control
  protected fOnHandQty: number | null = null;
  protected fAvailableQty: number | null = null;
  protected fReservedQty: number | null = null;
  protected fReorderPoint: number | null = null;
  protected fReorderQty: number | null = null;
  protected fParLevel: number | null = null;
  protected fMaxLevel: number | null = null;
  protected fUnitOfMeasure = '';
  protected fPackageSize = '';
  protected fUnitsPerCase: number | null = null;
  protected fAvgMonthlyUsage: number | null = null;
  protected fLeadTimeDays: number | null = null;
  protected fLastRestockedDate = '';
  protected fNextOrderDate = '';
  protected fInventoryStatus = 'Active';

  // Tab 3: Location
  protected fFacility = '';
  protected fDepartment = '';
  protected fRoom = '';
  protected fCabinetBin = '';
  protected fStorageCondition = '';
  protected fAssignedTeam = '';
  protected fPrimaryLocation = '';
  protected fSecondaryLocation = '';

  // Tab 4: Procurement
  protected fPreferredVendor = '';
  protected fSecondaryVendor = '';
  protected fUnitCost: number | null = null;
  protected fLastPurchaseCost: number | null = null;
  protected fContractPrice: number | null = null;
  protected fBudgetCategory = '';
  protected fPurchaseFrequency = '';
  protected fLastOrderDate = '';
  protected fLastReceivedDate = '';
  protected fInvoiceRef = '';
  protected fTaxable = false;

  // Tab 5: Compliance
  protected fExpirationDate = '';
  protected fRequiresTempControl = false;
  protected fSterile = false;
  protected fControlledItem = false;
  protected fRecallFlag = false;
  protected fRegulatoryCategory = '';
  protected fFdaCompliance = '';
  protected fAuditRequired = false;
  protected fCustodyNotes = '';

  // Tab 6: Lifecycle
  protected fUsageType = '';
  protected fServiceable = false;
  protected fCalibrationRequired = false;
  protected fMaintenanceRequired = false;
  protected fWarrantyExpiration = '';
  protected fUsefulLifeMonths: number | null = null;
  protected fRetirementCriteria = '';
  protected fDecommissioned = false;

  // Tab 7: Notes
  protected fInternalNotes = '';

  readonly categoryOptions = ['IOL / Implant', 'Pharmaceutical', 'Optical Material', 'Surgical Supply', 'Device / Equipment', 'Consumable', 'Diagnostic Supply', 'Kit / Pack', 'Other'];
  readonly statusOptions = ['Active', 'Low Stock', 'Critical', 'Out of Stock', 'On Order', 'Discontinued', 'Expired'];
  readonly uomOptions = ['Unit', 'Dose', 'Box', 'Case', 'Pack', 'Set', 'Vial', 'mL', 'g', 'mg'];
  readonly departmentOptions = ['Surgery / ASC', 'Retina', 'Optical Lab', 'Pharmacy', 'Imaging', 'Administration', 'OR / Recovery', 'Front Desk', 'Exam Room', 'Storeroom'];
  readonly storageOptions = ['Room temperature (15–25°C)', 'Controlled room temp (20–25°C)', 'Refrigerated (2–8°C)', 'Frozen (−20°C)', 'Cold chain required', 'Dry & dark', 'Sterile storage'];
  readonly budgetOptions = ['Implants', 'Pharmaceuticals', 'Optical Materials', 'Surgical Supplies', 'Capital Equipment', 'Diagnostics', 'Consumables', 'Other'];
  readonly frequencyOptions = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'As needed', 'Contract-based'];
  readonly regulatoryOptions = ['Class I', 'Class II', 'Class III', 'FDA Exempt', 'Pharmaceutical', 'Controlled Substance', '510(k)', 'PMA', 'Other'];
  readonly usageTypeOptions = ['Single-use consumable', 'Reusable', 'Implant', 'Durable device', 'Kit / Pack', 'Pharmaceutical', 'Calibration standard'];

  constructor() {
    effect(() => {
      const item = this.itemToEdit();
      if (item) {
        this.isEditMode.set(true);
        this.populateFromRecord(item);
      } else {
        this.isEditMode.set(false);
        this.clearForm();
      }
    });
  }

  private populateFromRecord(item: InventoryRecord): void {
    this.fItemName = item.itemName ?? item.item;
    this.fCategory = item.category ?? '';
    this.fSubcategory = item.subcategory ?? '';
    this.fBrand = item.brand ?? '';
    this.fManufacturer = item.manufacturer ?? '';
    this.fModel = item.model ?? '';
    this.fSku = item.sku ?? '';
    this.fMfrPartNumber = item.mfrPartNumber ?? '';
    this.fLotNumber = item.lotNumber ?? '';
    this.fUdi = item.udi ?? '';
    this.fDescription = item.description ?? '';
    this.fClinicalNotes = item.clinicalNotes ?? '';
    this.fOnHandQty = item.onHandQty ?? null;
    this.fAvailableQty = item.availableQty ?? null;
    this.fReservedQty = item.reservedQty ?? null;
    this.fReorderPoint = item.reorderPoint ?? null;
    this.fReorderQty = item.reorderQty ?? null;
    this.fParLevel = item.parLevel ?? null;
    this.fMaxLevel = item.maxLevel ?? null;
    this.fUnitOfMeasure = item.unitOfMeasure ?? '';
    this.fPackageSize = item.packageSize ?? '';
    this.fUnitsPerCase = item.unitsPerCase ?? null;
    this.fAvgMonthlyUsage = item.avgMonthlyUsage ?? null;
    this.fLeadTimeDays = item.leadTimeDays ?? null;
    this.fLastRestockedDate = item.lastRestockedDate ?? '';
    this.fNextOrderDate = item.nextOrderDate ?? item.nextOrder ?? '';
    this.fInventoryStatus = item.inventoryStatus ?? 'Active';
    this.fFacility = item.facility ?? '';
    this.fDepartment = item.department ?? '';
    this.fRoom = item.room ?? '';
    this.fCabinetBin = item.cabinetBin ?? '';
    this.fStorageCondition = item.storageCondition ?? '';
    this.fAssignedTeam = item.assignedTeam ?? '';
    this.fPrimaryLocation = item.location;
    this.fSecondaryLocation = item.secondaryLocation ?? '';
    this.fPreferredVendor = item.preferredVendor ?? '';
    this.fSecondaryVendor = item.secondaryVendor ?? '';
    this.fUnitCost = item.unitCost ?? null;
    this.fLastPurchaseCost = item.lastPurchaseCost ?? null;
    this.fContractPrice = item.contractPrice ?? null;
    this.fBudgetCategory = item.budgetCategory ?? '';
    this.fPurchaseFrequency = item.purchaseFrequency ?? '';
    this.fLastOrderDate = item.lastOrderDate ?? '';
    this.fLastReceivedDate = item.lastReceivedDate ?? '';
    this.fInvoiceRef = item.invoiceRef ?? '';
    this.fTaxable = item.taxable ?? false;
    this.fExpirationDate = item.expirationDate ?? '';
    this.fRequiresTempControl = item.requiresTempControl ?? false;
    this.fSterile = item.sterile ?? false;
    this.fControlledItem = item.controlledItem ?? false;
    this.fRecallFlag = item.recallFlag ?? false;
    this.fRegulatoryCategory = item.regulatoryCategory ?? '';
    this.fFdaCompliance = item.fdaCompliance ?? '';
    this.fAuditRequired = item.auditRequired ?? false;
    this.fCustodyNotes = item.custodyNotes ?? '';
    this.fUsageType = item.usageType ?? '';
    this.fServiceable = item.serviceable ?? false;
    this.fCalibrationRequired = item.calibrationRequired ?? false;
    this.fMaintenanceRequired = item.maintenanceRequired ?? false;
    this.fWarrantyExpiration = item.warrantyExpiration ?? '';
    this.fUsefulLifeMonths = item.usefulLifeMonths ?? null;
    this.fRetirementCriteria = item.retirementCriteria ?? '';
    this.fDecommissioned = item.decommissioned ?? false;
    this.fInternalNotes = item.internalNotes ?? '';
    this.currentTab.set(1);
  }

  private clearForm(): void {
    this.fItemName = ''; this.fCategory = ''; this.fSubcategory = '';
    this.fBrand = ''; this.fManufacturer = ''; this.fModel = '';
    this.fSku = ''; this.fMfrPartNumber = ''; this.fLotNumber = '';
    this.fUdi = ''; this.fDescription = ''; this.fClinicalNotes = '';
    this.fOnHandQty = null; this.fAvailableQty = null; this.fReservedQty = null;
    this.fReorderPoint = null; this.fReorderQty = null; this.fParLevel = null;
    this.fMaxLevel = null; this.fUnitOfMeasure = ''; this.fPackageSize = '';
    this.fUnitsPerCase = null; this.fAvgMonthlyUsage = null; this.fLeadTimeDays = null;
    this.fLastRestockedDate = ''; this.fNextOrderDate = ''; this.fInventoryStatus = 'Active';
    this.fFacility = ''; this.fDepartment = ''; this.fRoom = '';
    this.fCabinetBin = ''; this.fStorageCondition = ''; this.fAssignedTeam = '';
    this.fPrimaryLocation = ''; this.fSecondaryLocation = '';
    this.fPreferredVendor = ''; this.fSecondaryVendor = '';
    this.fUnitCost = null; this.fLastPurchaseCost = null; this.fContractPrice = null;
    this.fBudgetCategory = ''; this.fPurchaseFrequency = '';
    this.fLastOrderDate = ''; this.fLastReceivedDate = ''; this.fInvoiceRef = ''; this.fTaxable = false;
    this.fExpirationDate = ''; this.fRequiresTempControl = false; this.fSterile = false;
    this.fControlledItem = false; this.fRecallFlag = false; this.fRegulatoryCategory = '';
    this.fFdaCompliance = ''; this.fAuditRequired = false; this.fCustodyNotes = '';
    this.fUsageType = ''; this.fServiceable = false; this.fCalibrationRequired = false;
    this.fMaintenanceRequired = false; this.fWarrantyExpiration = '';
    this.fUsefulLifeMonths = null; this.fRetirementCriteria = ''; this.fDecommissioned = false;
    this.fInternalNotes = '';
  }

  protected get canSubmit(): boolean {
    return !!this.fItemName.trim() && !!this.fCategory;
  }

  protected get currentTabLabel(): string {
    return TABS.find(t => t.num === this.currentTab())?.label ?? '';
  }

  protected goTo(num: number): void { this.currentTab.set(num); }
  protected prev(): void { if (this.currentTab() > 1) this.currentTab.update(t => t - 1); }
  protected next(): void { if (this.currentTab() < 7) this.currentTab.update(t => t + 1); }

  protected submit(): void {
    if (!this.canSubmit || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    const clinicId = this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park';
    const now = new Date().toISOString();
    const onHandDisplay = this.fOnHandQty != null ? `${this.fOnHandQty} ${this.fUnitOfMeasure || 'units'}`.trim() : (this.itemToEdit()?.onHand ?? '0 units');
    const statusTone = this.fInventoryStatus === 'Critical' ? 'critical' : this.fInventoryStatus === 'Low Stock' ? 'warning' : this.fInventoryStatus === 'Active' ? 'success' : 'neutral';

    const record: InventoryRecord = {
      // Legacy compat
      clinicId,
      item: this.fItemName.trim(),
      location: this.fPrimaryLocation.trim() || `${this.fDepartment}${this.fRoom ? ' — ' + this.fRoom : ''}`.trim() || 'Main store',
      onHand: onHandDisplay,
      daysRemaining: this.fInventoryStatus,
      tone: statusTone as any,
      forecast: this.fDescription.trim() || 'No forecast notes',
      nextOrder: this.fNextOrderDate || 'TBD',
      // New fields
      id: this.itemToEdit()?.id ?? `inv-${Date.now()}`,
      itemName: this.fItemName.trim(),
      category: this.fCategory,
      subcategory: this.fSubcategory.trim(),
      brand: this.fBrand.trim(),
      manufacturer: this.fManufacturer.trim(),
      model: this.fModel.trim(),
      sku: this.fSku.trim(),
      mfrPartNumber: this.fMfrPartNumber.trim(),
      lotNumber: this.fLotNumber.trim(),
      udi: this.fUdi.trim(),
      description: this.fDescription.trim(),
      clinicalNotes: this.fClinicalNotes.trim(),
      onHandQty: this.fOnHandQty ?? undefined,
      availableQty: this.fAvailableQty ?? undefined,
      reservedQty: this.fReservedQty ?? undefined,
      reorderPoint: this.fReorderPoint ?? undefined,
      reorderQty: this.fReorderQty ?? undefined,
      parLevel: this.fParLevel ?? undefined,
      maxLevel: this.fMaxLevel ?? undefined,
      unitOfMeasure: this.fUnitOfMeasure,
      packageSize: this.fPackageSize.trim(),
      unitsPerCase: this.fUnitsPerCase ?? undefined,
      avgMonthlyUsage: this.fAvgMonthlyUsage ?? undefined,
      leadTimeDays: this.fLeadTimeDays ?? undefined,
      lastRestockedDate: this.fLastRestockedDate,
      nextOrderDate: this.fNextOrderDate,
      inventoryStatus: this.fInventoryStatus,
      facility: this.fFacility.trim(),
      department: this.fDepartment,
      room: this.fRoom.trim(),
      cabinetBin: this.fCabinetBin.trim(),
      storageCondition: this.fStorageCondition,
      assignedTeam: this.fAssignedTeam.trim(),
      secondaryLocation: this.fSecondaryLocation.trim(),
      preferredVendor: this.fPreferredVendor.trim(),
      secondaryVendor: this.fSecondaryVendor.trim(),
      unitCost: this.fUnitCost ?? undefined,
      lastPurchaseCost: this.fLastPurchaseCost ?? undefined,
      contractPrice: this.fContractPrice ?? undefined,
      budgetCategory: this.fBudgetCategory,
      purchaseFrequency: this.fPurchaseFrequency,
      lastOrderDate: this.fLastOrderDate,
      lastReceivedDate: this.fLastReceivedDate,
      invoiceRef: this.fInvoiceRef.trim(),
      taxable: this.fTaxable,
      expirationDate: this.fExpirationDate,
      requiresTempControl: this.fRequiresTempControl,
      sterile: this.fSterile,
      controlledItem: this.fControlledItem,
      recallFlag: this.fRecallFlag,
      regulatoryCategory: this.fRegulatoryCategory,
      fdaCompliance: this.fFdaCompliance.trim(),
      auditRequired: this.fAuditRequired,
      custodyNotes: this.fCustodyNotes.trim(),
      usageType: this.fUsageType,
      serviceable: this.fServiceable,
      calibrationRequired: this.fCalibrationRequired,
      maintenanceRequired: this.fMaintenanceRequired,
      warrantyExpiration: this.fWarrantyExpiration,
      usefulLifeMonths: this.fUsefulLifeMonths ?? undefined,
      retirementCriteria: this.fRetirementCriteria.trim(),
      decommissioned: this.fDecommissioned,
      internalNotes: this.fInternalNotes.trim(),
      createdBy: this.itemToEdit()?.createdBy ?? 'Current user',
      createdAt: this.itemToEdit()?.createdAt ?? now,
      updatedBy: 'Current user',
      updatedAt: now,
    };

    if (this.isEditMode() && this.itemToEdit()) {
      this.store.updateInventoryItem(record);
    } else {
      this.store.createInventoryItem(record);
    }

    this.isSubmitting.set(false);
    this.submitted.set(true);
    setTimeout(() => this.resetAndClose(), 1400);
  }

  protected cancel(): void { this.resetAndClose(); }

  private resetAndClose(): void {
    this.currentTab.set(1);
    this.submitted.set(false);
    this.isSubmitting.set(false);
    this.clearForm();
    this.closed.emit();
  }
}
