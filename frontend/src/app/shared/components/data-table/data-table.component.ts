import { Component, computed, input, model, output, signal, effect } from '@angular/core';
import { NoDataComponent } from '../no-data/no-data.component';
import { CountUpDirective, CountUpFormat } from '../../directives/count-up.directive';
import { exportToCsv } from '../../utils/csv.utils';

/** One configurable column: pure data access + optional badge/class. */
export interface TableColumn<R> {
  key: string;
  label: string;
  /** Returns the raw display value (number/string) for the row. */
  cell: (row: R) => string | number | null | undefined;
  /** Extra classes for the td (e.g. text-success). */
  cellClass?: (row: R) => string;
  /** When present, renders a badge instead of plain text. */
  badge?: (row: R) => { text: string; cls: string };
  /** Cell alignment. */
  align?: 'start' | 'center' | 'end';
  sortable?: boolean;
  /** When set and cell() returns a number, animates a count-up into place. */
  numberFormat?: CountUpFormat;
  /** Fraction digits for numberFormat = 'number'. */
  numberDecimals?: number;
}

/** A row action rendered as an icon button in the actions column. */
export interface TableAction<R> {
  key: string;
  label: string;
  icon: string;
  cls?: string;
  visible?: (row: R) => boolean;
}

export interface TableActionEvent<R> {
  action: string;
  row: R;
}

/**
 * Configurable data table â€” sticky header, sorting, pagination, skeleton
 * loading, CSV export, no-data state (Section 11/14).
 * WHY: every feature's list is the same table; only columns/actions differ.
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NoDataComponent, CountUpDirective],
  template: `
    <div class="data-table">
      <div class="data-table__toolbar">
        <span class="data-table__meta">
          {{ rows().length }} record{{ rows().length === 1 ? '' : 's' }}
        </span>
        @if (exportable()) {
          <button type="button" class="btn btn-sm btn-outline-primary" (click)="onExport()">
            <i class="bi bi-download me-1"></i>Export CSV
          </button>
        }
      </div>

      <div class="data-table__wrap">
        <table class="table data-table__table align-middle mb-0">
          <thead>
            <tr>
              @for (col of columns(); track col.key) {
                <th
                  [class.data-table__th--sortable]="col.sortable"
                  [style.text-align]="col.align ?? 'start'"
                  (click)="col.sortable && sortBy(col)"
                >
                  {{ col.label }}
                  @if (col.sortable) {
                    <i
                      class="bi ms-1"
                      [class.bi-arrow-up]="sortKey() === col.key && sortDir() === 'asc'"
                      [class.bi-arrow-down]="sortKey() === col.key && sortDir() === 'desc'"
                      [class.bi-arrow-down-up]="sortKey() !== col.key"
                    ></i>
                  }
                </th>
              }
              @if (visibleActions().length) {
                <th class="text-end">Actions</th>
              }
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              @for (skeleton of skeletonRows; track $index) {
                <tr>
                  @for (col of columns(); track col.key) {
                    <td><span class="skeleton-line"></span></td>
                  }
                  @if (visibleActions().length) {
                    <td></td>
                  }
                </tr>
              }
            } @else if (sortedRows().length === 0) {
              <tr>
                <td [attr.colspan]="columns().length + (visibleActions().length ? 1 : 0)">
                  <app-no-data [message]="emptyMessage()" />
                </td>
              </tr>
            } @else {
              @for (row of visibleRows(); track $index) {
                <tr [style.--row-i]="$index">
                  @for (col of columns(); track col.key) {
                    <td [class]="col.cellClass?.(row)" [style.text-align]="col.align ?? 'start'">
                      @if (col.badge) {
                        <span class="badge" [class]="col.badge(row).cls">{{ col.badge(row).text }}</span>
                      } @else if (col.numberFormat) {
                        @if (cellNumeric(col, row); as num) {
                          <span
                            appCountUp
                            [appCountUpValue]="num"
                            [appCountUpFormat]="col.numberFormat"
                            [appCountUpDecimals]="col.numberDecimals ?? 0"
                          ></span>
                        } @else {
                          {{ cellText(col, row) }}
                        }
                      } @else {
                        {{ cellText(col, row) }}
                      }
                    </td>
                  }
                  @if (visibleActions().length) {
                    <td class="text-end" style="white-space: nowrap">
                      @for (action of visibleActions(); track action.key) {
                        @if (!action.visible || action.visible(row)) {
                          <button
                            type="button"
                            class="btn btn-sm btn-icon"
                            [title]="action.label"
                            [class]="action.cls ?? 'text-primary'"
                            (click)="onAction(action.key, row)"
                          >
                            <i [class]="'bi ' + action.icon"></i>
                          </button>
                        }
                      }
                    </td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <div class="data-table__footer">
        <div class="d-flex align-items-center gap-2">
          <label class="small text-muted mb-0">Rows</label>
          <select class="form-select form-select-sm data-table__size" (change)="onPageSize($event)">
            @for (size of pageSizes(); track size) {
              <option [value]="size" [selected]="size === pageSize()">{{ size }}</option>
            }
          </select>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="small text-muted">Page {{ page() }} of {{ totalPages() }}</span>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            [disabled]="page() <= 1"
            (click)="goToPage(page() - 1)"
          >
            <i class="bi bi-chevron-left"></i>
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            [disabled]="page() >= totalPages()"
            (click)="goToPage(page() + 1)"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<R> {
  readonly columns = input<TableColumn<R>[]>([]);
  readonly rows = input<R[]>([]);
  readonly loading = input<boolean>(false);
  readonly exportable = input<boolean>(true);
  readonly exportName = input<string>('export');
  readonly emptyMessage = input<string>('No records found');
  readonly pageSizes = input<number[]>([5, 10, 25, 50]);
  readonly actions = input<TableAction<R>[]>([]);

  readonly page = model<number>(1);
  readonly pageSize = model<number>(10);
  readonly action = output<TableActionEvent<R>>();

  sortKey = signal<string | null>(null);
  sortDir = signal<'asc' | 'desc'>('asc');

  readonly skeletonRows = Array.from({ length: 5 });

  constructor() {
    effect(() => {
      this.rows();
      const total = this.totalPages();
      if (this.page() > total) this.page.set(total);
    });
  }

  visibleActions(): TableAction<R>[] {
    return this.actions();
  }

  cellText(col: TableColumn<R>, row: R): string {
    const v = col.cell(row);
    return v === null || v === undefined ? 'â€”' : String(v);
  }

  cellNumeric(col: TableColumn<R>, row: R): number | null {
    const v = col.cell(row);
    return typeof v === 'number' ? v : null;
  }

  sortedRows(): R[] {
    const key = this.sortKey();
    const rows = [...this.rows()];
    if (!key) return rows;
    const col = this.columns().find((c) => c.key === key);
    if (!col) return rows;
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    const toNumber = (v: string | number | null | undefined): number | null => {
      if (v == null) return null;
      if (typeof v === 'number') return v;
      const cleaned = String(v).replace(/[^\d.-]/g, '');
      if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') return null;
      const n = Number(cleaned);
      return Number.isNaN(n) ? null : n;
    };
    return rows.sort((a, b) => {
      const va = col.cell(a);
      const vb = col.cell(b);
      const na = toNumber(va);
      const nb = toNumber(vb);
      if (na !== null && nb !== null) return (na - nb) * dir;
      return String(va ?? '').localeCompare(String(vb ?? '')) * dir;
    });
  }

  visibleRows(): R[] {
    const start = (this.page() - 1) * this.pageSize();
    return this.sortedRows().slice(start, start + this.pageSize());
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.rows().length / this.pageSize()));
  }

  sortBy(col: TableColumn<R>): void {
    if (this.sortKey() === col.key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(col.key);
      this.sortDir.set('asc');
    }
    this.page.set(1);
  }

  goToPage(target: number): void {
    const clamped = Math.min(Math.max(1, target), this.totalPages());
    this.page.set(clamped);
  }

  onPageSize(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
    this.page.set(1);
  }

  onAction(action: string, row: R): void {
    this.action.emit({ action, row });
  }

  /** Exports the CURRENT (filtered) row set â€” the full input, not just the page. */
  onExport(): void {
    const cols = this.columns();
    exportToCsv(this.exportName(), cols.map((c) => ({ header: c.label, value: (row) => c.cell(row as R) })), this.rows());
  }
}