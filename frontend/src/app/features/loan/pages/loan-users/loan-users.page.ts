import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SummaryCardComponent } from '../../../../shared/components/summary-card/summary-card.component';
import { DataTableComponent, TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { DrawerComponent } from '../../../../shared/components/drawer/drawer.component';
import { SearchableDropdownComponent } from '../../../../shared/components/searchable-dropdown/searchable-dropdown.component';
import { LoanUserFormComponent } from '../../../settings/loan-user-form.component';
import { TransactionService } from '../../../transaction/services/transaction.service';
import { LoanHistoryDto, LoanUserDto } from '../../../transaction/dto/loan.dto';
import { formatAmount } from '../../../../shared/utils/money.utils';
import { CountUpDirective } from '../../../../shared/directives/count-up.directive';
import { SearchableOption } from '../../../../shared/components/searchable-dropdown/searchable-option.model';
import { combineLatest, finalize } from 'rxjs';

type StatusFilter = 'ALL' | 'RECEIVABLE' | 'PAYABLE' | 'CLOSED';

/**
 * Loan Users â€” Section 6: per-person loan tracking with a combined history
 * (filterable by person(s), status and date range) and aggregate
 * receivable/payable exposure cards.
 */
@Component({
  selector: 'app-loan-users',
  standalone: true,
  imports: [
    FormsModule,
    PageHeaderComponent,
    SummaryCardComponent,
    DataTableComponent,
    DrawerComponent,
    SearchableDropdownComponent,
    LoanUserFormComponent,
    CountUpDirective,
  ],
  styleUrl: './loan-users.page.scss',
  template: `
    <div class="container-fluid py-4">
      <app-page-header title="Loan Users" subtitle="People you lend to or borrow from" icon="bi-people">
        <button type="button" class="btn btn-primary-gradient" (click)="openCreate()">
          <i class="bi bi-plus-lg me-1"></i>Add Loan User
        </button>
      </app-page-header>

      @if (loading()) {
        <div class="row g-4" aria-hidden="true">
          @for (s of [1, 2]; track $index) {
            <div class="col-sm-6 col-xl-3">
              <div class="pfm-skeleton pfm-skeleton--card" style="height: 132px;"></div>
            </div>
          }
        </div>
      } @else {
        <div class="row g-4">
          <div class="col-sm-6 col-xl-3">
            <app-summary-card
              label="Receivable"
              [value]="formatAmount(totals()?.totalReceivable ?? 0)"
              [numericValue]="totals()?.totalReceivable ?? 0"
              icon="bi-arrow-down-circle"
              tone="info"
              hint="Money people owe you"
            />
          </div>
          <div class="col-sm-6 col-xl-3">
            <app-summary-card
              label="Payable"
              [value]="formatAmount(totals()?.totalPayable ?? 0)"
              [numericValue]="totals()?.totalPayable ?? 0"
              icon="bi-arrow-up-circle"
              tone="warning"
              hint="Money you owe people"
            />
          </div>
          <div class="col-sm-6 col-xl-3">
            <app-summary-card
              label="Active People"
              [value]="activeCountLabel()"
              [numericValue]="activeCount()"
              icon="bi-people"
              tone="primary"
              hint="Receivable + Payable"
            />
          </div>
        </div>
      }

      <div class="row g-4 mt-1">
        <div class="col-lg-5">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-transparent pt-3 px-4 d-flex justify-content-between align-items-center">
              <h6 class="mb-0 fw-semibold">People</h6>
              <div class="btn-group btn-group-sm" role="group" aria-label="Filter by status">
                @for (tab of statusTabs; track tab.value) {
                  <button
                    type="button"
                    class="btn"
                    [class.btn-primary]="statusTab() === tab.value"
                    [class.btn-outline-secondary]="statusTab() !== tab.value"
                    (click)="statusTab.set(tab.value)"
                  >
                    {{ tab.label }}
                  </button>
                }
              </div>
            </div>
            <div class="card-body px-4">
              @if (filteredUsers().length === 0) {
                <div class="text-center text-muted py-5">
                  <i class="bi bi-person-x fs-1 d-block mb-2"></i>
                  No loan users match.
                </div>
              } @else {
                <div class="list-group">
                  @for (u of filteredUsers(); track u.id) {
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                      <div class="min-w-0">
                        <span class="fw-semibold">{{ u.fullName }}</span>
                        <span class="badge ms-2" [class]="statusBadge(u.loanStatus)">{{ statusLabel(u.loanStatus) }}</span>
                        <div class="small text-muted">
                          @if (u.contactNumber) {
                            <span class="me-2"><i class="bi bi-telephone me-1"></i>{{ u.contactNumber }}</span>
                          }
                          <span><i class="bi bi-cash-coin me-1"></i>
                            <span appCountUp [appCountUpValue]="u.currentAmount" appCountUpFormat="amount"></span>
                          </span>
                        </div>
                      </div>
                      <div class="d-flex gap-1">
                        <button type="button" class="btn btn-sm btn-icon text-info" title="History" (click)="openHistory(u)">
                          <i class="bi bi-clock-history"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-icon text-primary" title="Edit" (click)="openEdit(u)">
                          <i class="bi bi-pencil"></i>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <div class="col-lg-7">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-transparent pt-3 px-4">
              <h6 class="mb-0 fw-semibold">Loan History</h6>
            </div>
            <div class="card-body px-4">
              <div class="row g-3 mb-3">
                <div class="col-md-5">
                  <label class="form-label small mb-1">People</label>
                  <app-searchable-dropdown
                    [options]="personOptions()"
                    [multiple]="true"
                    [clearable]="true"
                    placeholder="All peopleâ€¦"
                    size="sm"
                    (ngModelChange)="onPersonFilter($event)"
                    [ngModel]="personFilter()"
                  />
                </div>
                <div class="col-md-3">
                  <label class="form-label small mb-1">Status</label>
                  <app-searchable-dropdown
                    [options]="statusOptions"
                    [clearable]="true"
                    placeholder="Any status"
                    size="sm"
                    (ngModelChange)="statusFilter.set($event)"
                    [ngModel]="statusFilter()"
                  />
                </div>
                <div class="col-md-2">
                  <label class="form-label small mb-1" for="historyFrom">From</label>
                  <input id="historyFrom" type="date" class="form-control form-control-sm" [value]="fromDate()" (input)="onFrom($event)" />
                </div>
                <div class="col-md-2">
                  <label class="form-label small mb-1" for="historyTo">To</label>
                  <input id="historyTo" type="date" class="form-control form-control-sm" [value]="toDate()" (input)="onTo($event)" />
                </div>
              </div>

              <app-data-table
                [columns]="historyColumns"
                [rows]="filteredHistory()"
                [loading]="historyLoading()"
                [exportable]="false"
                emptyMessage="No loan history matches the filters"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    @if (drawerUser()) {
      <app-drawer [open]="drawerOpen()" (openChange)="drawerOpen.set($event)" [title]="'Loan History â€” ' + drawerUser()!.fullName" icon="bi-clock-history">
        @if (userHistory().length === 0) {
          <div class="text-center text-muted py-5">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            No history recorded for this person.
          </div>
        } @else {
          <table class="table table-sm align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th class="text-end">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (h of userHistory(); track h.id) {
                <tr>
                  <td class="text-nowrap small">{{ (h.createdAt ?? '').slice(0, 10) }}</td>
                  <td class="text-end fw-semibold">
                    <span appCountUp [appCountUpValue]="h.amount" appCountUpFormat="amount"></span>
                  </td>
                  <td>
                    <span class="small text-muted">{{ statusLabel(h.previousStatus) }} â€“ {{ statusLabel(h.currentStatus) }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </app-drawer>
    }

    @if (formOpen()) {
      <app-loan-user-form [open]="formOpen()" [user]="editingUser()" (openChange)="formOpen.set($event)" (saved)="onSaved($event)" />
    }
  `,
})
export class LoanUsersPage implements OnInit {
  protected readonly service = inject(TransactionService);

  readonly loading = signal(true);
  readonly historyLoading = signal(false);

  readonly statusTab = signal<StatusFilter>('ALL');
  readonly personFilter = signal<(number | string)[]>([]);
  readonly statusFilter = signal<string | null>(null);
  readonly fromDate = signal('');
  readonly toDate = signal('');

  readonly formOpen = signal(false);
  readonly editingUser = signal<LoanUserDto | null>(null);

  readonly drawerOpen = signal(false);
  readonly drawerUser = signal<LoanUserDto | null>(null);
  readonly userHistory = signal<LoanHistoryDto[]>([]);

  readonly totals = signal<{ totalReceivable: number; totalPayable: number } | null>(null);
  readonly allHistory = signal<LoanHistoryDto[]>([]);

  readonly statusTabs: { value: StatusFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'RECEIVABLE', label: 'Receivable' },
    { value: 'PAYABLE', label: 'Payable' },
    { value: 'CLOSED', label: 'Closed' },
  ];

  readonly loanUsers = computed(() => this.service.loanUsers() ?? []);

  readonly activeCount = computed(
    () => this.loanUsers().filter((u) => u.loanStatus !== 'CLOSED').length,
  );

  readonly filteredUsers = computed(() => {
    const tab = this.statusTab();
    const users = this.loanUsers();
    if (tab === 'ALL') return users;
    return users.filter((u) => u.loanStatus === tab);
  });

  readonly personOptions = computed<SearchableOption<number>[]>(() =>
    this.loanUsers().map((u) => ({
      value: u.id,
      name: u.fullName,
      subtitle: `${this.statusLabel(u.loanStatus)} â€” ${formatAmount(u.currentAmount)}`,
    })),
  );

  readonly statusOptions: SearchableOption<string>[] = [
    { value: 'RECEIVABLE', name: 'Receivable' },
    { value: 'PAYABLE', name: 'Payable' },
    { value: 'CLOSED', name: 'Closed' },
  ];

  readonly filteredHistory = computed(() => {
    const selectedPeople = new Set(this.personFilter().map((v) => String(v)));
    const status = this.statusFilter();
    const from = this.fromDate();
    const to = this.toDate();
    return this.allHistory().filter((h) => {
      if (selectedPeople.size > 0 && !selectedPeople.has(String(h.loanUserId))) return false;
      if (status && h.currentStatus !== status) return false;
      const day = (h.createdAt ?? '').slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  });

  readonly historyColumns: TableColumn<LoanHistoryDto>[] = [
    { key: 'date', label: 'Date', cell: (h) => (h.createdAt ?? '').slice(0, 10) },
    { key: 'person', label: 'Person', cell: (h) => h.loanUserName ?? `#${h.loanUserId}` },
    { key: 'type', label: 'Type', cell: (h) => h.transactionType },
    {
      key: 'amount',
      label: 'Amount',
      cell: (h) => h.amount,
      align: 'end',
      numberFormat: 'amount',
    },
    {
      key: 'status',
      label: 'Status',
      cell: (h) => `${this.statusLabel(h.previousStatus)} â†’ ${this.statusLabel(h.currentStatus)}`,
      badge: (h) => ({ text: this.statusLabel(h.currentStatus), cls: this.statusBadge(h.currentStatus) }),
    },
  ];

  ngOnInit(): void {
    this.reloadHistory();
    // The summary cards wait for BOTH the users list and the totals endpoint —
    // previously `loading` never flipped, so the cards never appeared.
    combineLatest([this.service.loadLoanUsers(), this.service.loadLoanTotals()])
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ([, t]) => this.totals.set(t),
        error: () => undefined,
      });
  }

  reloadTotals(): void {
    this.service.loadLoanTotals().subscribe({
      next: (t) => this.totals.set(t),
      error: () => undefined,
    });
  }

  reloadHistory(): void {
    this.historyLoading.set(true);
    this.service
      .loadFilteredLoanHistory()
      .pipe(finalize(() => this.historyLoading.set(false)))
      .subscribe({
        next: (entries) => this.allHistory.set(entries ?? []),
        error: () => this.allHistory.set([]),
      });
  }

  onPersonFilter(value: (number | string)[] | null | undefined): void {
    this.personFilter.set(Array.isArray(value) ? value : []);
  }

  onFrom(event: Event): void {
    this.fromDate.set((event.target as HTMLInputElement).value);
  }

  onTo(event: Event): void {
    this.toDate.set((event.target as HTMLInputElement).value);
  }

  openCreate(): void {
    this.editingUser.set(null);
    this.formOpen.set(true);
  }

  openEdit(u: LoanUserDto): void {
    this.editingUser.set(u);
    this.formOpen.set(true);
  }

  onSaved(_dto: LoanUserDto): void {
    this.reloadTotals();
  }

  openHistory(user: LoanUserDto): void {
    this.drawerUser.set(user);
    this.userHistory.set([]);
    this.drawerOpen.set(true);
    this.service.loadLoanHistory(user.id).subscribe({
      next: (entries) => this.userHistory.set(entries ?? []),
      error: () => this.userHistory.set([]),
    });
  }

  statusLabel(status: string): string {
    return status === 'RECEIVABLE' ? 'Receivable' : status === 'PAYABLE' ? 'Payable' : 'Closed';
  }

  statusBadge(status: string): string {
    return status === 'RECEIVABLE'
      ? 'bg-info-subtle text-info-emphasis'
      : status === 'PAYABLE'
        ? 'bg-warning-subtle text-warning-emphasis'
        : 'bg-secondary-subtle text-secondary-emphasis';
  }

  formatAmount(value: number): string {
    return formatAmount(value);
  }

  activeCountLabel(): string {
    return String(this.activeCount());
  }
}
