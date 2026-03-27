import { NgClass } from '@angular/common';
import { Component, input, signal, computed, output } from '@angular/core';

@Component({
  selector: 'app-maintenance-list',
  imports: [NgClass],
  templateUrl: './maintenance-list.component.html',
  styleUrl: './maintenance-list.component.scss'
})
export class MaintenanceListComponent {
  readonly pageTitle    = input.required<string>();
  readonly eyebrow      = input<string>('');
  readonly description  = input<string>('');
  readonly columns      = input.required<MaintenanceColumn[]>();
  readonly rows         = input<any[]>([]);
  readonly canCreate    = input<boolean>(true);
  readonly canExport    = input<boolean>(true);
  readonly canImport    = input<boolean>(false);
  readonly loading      = input<boolean>(false);

  readonly newClicked    = output<void>();
  readonly editClicked   = output<any>();
  readonly deleteClicked = output<any>();
  readonly exportClicked = output<void>();
  readonly importClicked = output<void>();

  protected readonly search  = signal('');
  protected readonly sortKey = signal('');
  protected readonly sortDir = signal<'asc'|'desc'>('asc');

  /* ── New-record form state ── */
  protected readonly showForm   = signal(false);
  protected readonly editingRow = signal<any | null>(null);
  protected readonly formValues = signal<Record<string, string>>({});
  private readonly _added       = signal<any[]>([]);

  protected readonly entityName = computed(() => {
    const t = this.pageTitle();
    return t.endsWith('s') ? t.slice(0, -1) : t;
  });

  protected readonly allRows = computed(() => [...this.rows(), ...this._added()]);

  protected readonly filteredRows = computed(() => {
    const q = this.search().toLowerCase();
    let rows = this.allRows();
    if (q) {
      rows = rows.filter(row =>
        Object.values(row).some(v => String(v).toLowerCase().includes(q))
      );
    }
    if (this.sortKey()) {
      const key = this.sortKey();
      const dir = this.sortDir() === 'asc' ? 1 : -1;
      rows = [...rows].sort((a, b) => String(a[key]).localeCompare(String(b[key])) * dir);
    }
    return rows;
  });

  protected setSort(key: string): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  protected getCell(row: any, col: MaintenanceColumn): string {
    return String(row[col.key] ?? '—');
  }

  protected chipTone(value: string): string {
    if (!value) return 'neutral';
    const v = value.toLowerCase();
    if (v === 'active' || v === 'approved' || v === 'success') return 'success';
    if (v === 'inactive' || v === 'suspended' || v === 'rejected') return 'critical';
    if (v === 'pending' || v === 'warning' || v === 'pending_review') return 'warning';
    return 'neutral';
  }

  protected openNewForm(): void {
    const defaults: Record<string, string> = {};
    for (const col of this.columns()) {
      defaults[col.key] = col.chip && col.chipAuto ? 'active' : '';
    }
    this.formValues.set(defaults);
    this.editingRow.set(null);
    this.showForm.set(true);
    this.newClicked.emit();
  }

  protected openEditForm(row: any): void {
    const values: Record<string, string> = {};
    for (const col of this.columns()) {
      values[col.key] = String(row[col.key] ?? '');
    }
    this.formValues.set(values);
    this.editingRow.set(row);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editingRow.set(null);
  }

  protected setFormValue(key: string, value: string): void {
    this.formValues.update(v => ({ ...v, [key]: value }));
  }

  protected saveForm(): void {
    const record: Record<string, any> = {};
    for (const col of this.columns()) {
      const raw = this.formValues()[col.key] ?? '';
      record[col.key] = col.right ? (Number(raw) || 0) : raw;
    }

    const editing = this.editingRow();
    if (editing) {
      // update in-place: replace in _added or mark original as patched
      Object.assign(editing, record);
    } else {
      this._added.update(list => [...list, record]);
    }

    this.closeForm();
  }

  protected deactivateRow(row: any): void {
    const statusKey = this.columns().find(c => c.chipAuto)?.key;
    if (statusKey) {
      row[statusKey] = row[statusKey] === 'active' ? 'inactive' : 'active';
      // trigger change detection by re-setting _added if it contains this row
      this._added.update(list => [...list]);
    }
    this.deleteClicked.emit(row);
  }
}

export interface MaintenanceColumn {
  key:       string;
  header:    string;
  width?:    string;
  sortable?: boolean;
  chip?:     boolean;
  chipAuto?: boolean;
  right?:    boolean;
  mono?:     boolean;
}
