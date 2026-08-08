import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { FilterPanelComponent, FilterField, FilterValues } from '../../../../shared/components/filter-panel/filter-panel.component';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { DataTableComponent, TableAction, TableActionEvent } from '../../../../shared/components/data-table/data-table.component';
import { TransactionService } from '../../services/transaction.service';
import { TransactionDto } from '../../dto/transaction.dto';
import { TransactionMode, TransactionTypeCode } from '../../models/transaction-mode.model';
import { TRANSACTION_TYPES, CREATEABLE_TYPE_CODES } from '../../config/transaction-types.config';
import { FINANCE_ROUTES } from '../../../../core/constants/finance-routes.constants';
import { buildTransactionColumns } from '../../config/transaction-table.config';
import { TransactionDetailComponent } from '../transaction-detail/transaction-detail.component';
import { LedgerDrawerComponent } from '../ledger-drawer/ledger-drawer.component';
import { exportToCsv } from '../../../../shared/utils/csv.utils';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    PageHeaderComponent,
    FilterPanelComponent,
    SearchBarComponent,
    DataTableComponent,
    TransactionDetailComponent,
    LedgerDrawerComponent,
  ],
  template: `
    <div class="container-fluid py-4">
      <app-page-header [title]="config().title" [subtitle]="config().subtitle" [icon]="config().pageHeaderIcon">
        <button type="button" class="btn btn-primary-gradient" (click)="goCreate()">
          <i class="bi bi-plus-lg me-1"></i>{{ config().createLabel }}
        </button>
      </app-page-header>

      <div class="card shadow-sm">
        <div class="card-body">
          <app-filter-panel [fields]="filterFields()" (filtersChange)="onFilters($event)" />
          <div class="mb-3">
            <app-search-bar [placeholder]="'Search ' + config().title + '…'" [(value)]="search" />
          </div>
          <app-data-table
            [columns]="columns()"
            [rows]="pageRows()"
            [loading]="tableLoading()"
            [actions]="rowActions"
            [exportName]="exportName()"
            [emptyMessage]="'No ' + config().title.toLowerCase() + ' found'"
            [serverMode]="true"
            [totalElements]="totalElements()"
            [(page)]="page"
            [(pageSize)]="pageSize"
            (action)="onAction($event)"
            (exportRequest)="onExportAll()"
          />
        </div>
      </div>

      @if (selectedId()) {
        <app-transaction-detail [transactionId]="selectedId()!" (closed)="closeDetail()" />
      }
      @if (ledgerId()) {
        <app-ledger-drawer [transactionId]="ledgerId()!" (closed)="closeLedger()" />
      }
    </div>
  `,
})
export class TransactionListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly service = inject(TransactionService);

  readonly mode = signal<TransactionMode>('ALL');
  readonly config = computed(() => TRANSACTION_TYPES[this.mode()]);
  readonly columns = computed(() => buildTransactionColumns(this.mode(), this.service));
  readonly search = signal('');
  readonly filters = signal<FilterValues>({});
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly tableLoading = signal(true);
  readonly selectedId = signal<number | null>(null);
  readonly ledgerId = signal<number | null>(null);

  readonly pageRows = computed(() => this.service.transactionsPage()?.content ?? []);
  readonly totalElements = computed(() => this.service.transactionsPage()?.totalElements ?? 0);

  readonly rowActions: TableAction<TransactionDto>[] = [
    { key: 'view', label: 'View details', icon: 'bi-eye', cls: 'text-primary' },
    { key: 'ledger', label: 'Wallet ledger', icon: 'bi-journal-text', cls: 'text-info' },
  ];

  readonly exportName = computed(() => `${this.mode().toLowerCase()}-transactions`);

  filterFields = computed<FilterField[]>(() => {
    const walletOptions = (this.service.wallets() ?? []).map((w) => ({ value: w.id, label: w.walletName ?? 'Wallet' }));
    const statusOptions = (this.service.master()?.transactionStatuses ?? []).map((s) => ({
      value: s.code,
      label: s.name ?? s.code,
    }));
    const typeOptions = CREATEABLE_TYPE_CODES.map((code) => ({
      value: code,
      label: TRANSACTION_TYPES[code].title,
    }));

    const selectedType = String(this.filters()['type'] ?? '') as TransactionTypeCode | '';
    const purposes = selectedType
      ? this.service.purposesForType(selectedType)
      : this.service.master()?.transactionPurposes ?? [];
    const purposeOptions = purposes.map((p) => ({ value: p.code, label: p.name ?? p.code }));

    const fields: FilterField[] = [
      { key: 'from', label: 'From', type: 'date' },
      { key: 'to', label: 'To', type: 'date' },
      { key: 'type', label: 'Type', type: 'select', options: typeOptions },
      { key: 'purposeId', label: 'Purpose', type: 'select', options: purposeOptions, dependsOn: 'type' },
    ];

    if (selectedType === 'EXPENSE') {
      const selectedPurpose = purposes.find((p) => p.code === String(this.filters()['purposeId'] ?? ''));
      fields.push({
        key: 'subcategoryId',
        label: 'Sub-Category',
        type: 'select',
        options: (selectedPurpose?.subcategories ?? []).map((s) => ({
          value: s.code,
          label: s.name ?? s.code,
        })),
        dependsOn: 'purposeId',
      });
    }

    fields.push({ key: 'walletId', label: 'Wallet', type: 'select', options: walletOptions });
    if (statusOptions.length) fields.push({ key: 'status', label: 'Status', type: 'select', options: statusOptions });
    return fields;
  });

  constructor() {
    // Page token resets to 1 whenever a NEW search term lands (SearchBar debounces).
    effect(() => {
      const term = this.search();
      if (term !== this.lastSearchTerm) {
        this.lastSearchTerm = term;
        if (this.page() !== 1) this.page.set(1);
      }
    });
    // Server reload — fire once started AND whenever filters, search, mode, page or pageSize change.
    effect(() => {
      this.filters();
      this.search();
      this.mode();
      this.page();
      this.pageSize();
      if (!this.started()) return;
      this.reload();
    });
  }

  private readonly started = signal(false);
  private lastSearchTerm = '';

  ngOnInit(): void {
    this.route.data.subscribe((data) => this.mode.set((data['mode'] as TransactionMode) ?? 'ALL'));
    this.service.loadMasterData();
    this.started.set(true);
  }

  private buildQueryParams() {
    const f = this.filters();
    const fromPanel = String(f['type'] ?? '');
    const type = fromPanel || (this.mode() !== 'ALL' ? this.mode() : undefined);
    return {
      page: this.page() - 1,
      size: this.pageSize(),
      type,
      status: String(f['status'] ?? '') || undefined,
      purpose: String(f['purposeId'] ?? '') || undefined,
      subcategory: String(f['subcategoryId'] ?? '') || undefined,
      walletId: f['walletId'] != null ? Number(f['walletId']) : undefined,
      from: String(f['from'] ?? '') || undefined,
      to: String(f['to'] ?? '') || undefined,
      search: this.search().trim() || undefined,
    };
  }

  private reload(): void {
    this.tableLoading.set(true);
    this.service
      .loadTransactionsPage(this.buildQueryParams())
      .pipe(finalize(() => this.tableLoading.set(false)))
      .subscribe({ error: () => undefined });
  }

  onFilters(values: FilterValues): void {
    this.filters.set(values);
    this.page.set(1);
  }

  onExportAll(): void {
    this.service.exportTransactionsPage(this.buildQueryParams()).subscribe({
      next: (rows) => {
        const cols = this.columns();
        exportToCsv(this.exportName(), cols.map((c) => ({ header: c.label, value: (row) => c.cell(row as TransactionDto) })), rows);
      },
      error: () => undefined,
    });
  }

  goCreate(): void {
    void this.router.navigate([FINANCE_ROUTES.CREATE_TRANSACTION]);
  }

  onAction(event: TableActionEvent<TransactionDto>): void {
    if (event.action === 'view') this.selectedId.set(event.row.id);
    if (event.action === 'ledger') this.ledgerId.set(event.row.id);
  }

  closeDetail(): void {
    this.selectedId.set(null);
  }

  closeLedger(): void {
    this.ledgerId.set(null);
  }
}
