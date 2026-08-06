import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SummaryCardComponent, SummaryTone } from '../../shared/components/summary-card/summary-card.component';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { TransactionService } from '../transaction/services/transaction.service';
import { WalletDto } from '../transaction/dto/wallet.dto';
import { TransactionDto } from '../transaction/dto/transaction.dto';
import { formatAmount, formatCompact } from '../../shared/utils/money.utils';
import {
  columnRenderer,
  amountCellClass,
  purposeDisplay,
} from '../transaction/config/transaction-table.config';
import { staggerIn } from '../../shared/animations/stagger.animations';
import { CountUpDirective } from '../../shared/directives/count-up.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [PageHeaderComponent, SummaryCardComponent, DataTableComponent, RouterLink, CountUpDirective],
  animations: [staggerIn],
  styleUrl: './dashboard.component.scss',
  template: `
    <div class="container-fluid py-4">
      <app-page-header title="Dashboard" subtitle="Your money at a glance — {{ month() }}" icon="bi-speedometer2">
        <button type="button" class="btn btn-primary-gradient" routerLink="/transactions/create">
          <i class="bi bi-plus-lg me-1"></i>New Transaction
        </button>
      </app-page-header>

      @if (loading()) {
        <div class="row g-4" aria-hidden="true">
          @for (s of skeletonStatCards; track $index) {
            <div class="col-sm-6 col-xl-3">
              <div class="pfm-skeleton pfm-skeleton--card" style="height: 132px;"></div>
            </div>
          }
        </div>
        <div class="row g-4 mt-1">
          <div class="col-lg-8"><div class="pfm-skeleton pfm-skeleton--card" style="height: 250px;"></div></div>
          <div class="col-lg-4"><div class="pfm-skeleton pfm-skeleton--card" style="height: 250px;"></div></div>
        </div>
        <div class="row g-4 mt-1">
          <div class="col-lg-7"><div class="pfm-skeleton pfm-skeleton--card" style="height: 320px;"></div></div>
          <div class="col-lg-5"><div class="pfm-skeleton pfm-skeleton--card" style="height: 320px;"></div></div>
        </div>
      } @else {
        <div class="row g-4" [@staggerIn]>
          @for (card of summaryCards(); track card.label) {
            <div class="col-sm-6 col-xl-3">
              <app-summary-card
                [label]="card.label"
                [value]="card.value"
                [numericValue]="card.numericValue"
                [icon]="card.icon"
                [tone]="card.tone"
                [hint]="card.hint"
                [trend]="card.trend"
                [trendLabels]="series().months"
              />
            </div>
          }
        </div>

        <div class="row g-4 mt-1">
          <div class="col-lg-8">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-transparent pt-4 px-4">
                <h6 class="mb-0 fw-semibold">Budget Status — {{ month() }}</h6>
              </div>
              <div class="card-body px-4">
                @if (budgets().length === 0) {
                  <p class="text-muted mb-0">No budgets for this month. <a routerLink="/budgets">Set one up</a>.</p>
                } @else {
                  @for (b of budgets(); track b.id) {
                    <div class="mb-3">
                      <div class="d-flex justify-content-between small mb-1">
                        <span class="fw-semibold">{{ b.purposeName }}</span>
                        <span class="text-muted">
                          <span appCountUp [appCountUpValue]="b.totalSpent" appCountUpFormat="amount" ></span>
                          /
                          <span appCountUp [appCountUpValue]="b.monthlyLimit" appCountUpFormat="amount" ></span>
                        </span>
                      </div>
                      <div class="progress" style="height: 8px;">
                        <div class="progress-bar" [class]="progressCls(b.alertLevel)" [style.width.%]="barWidth(b.usagePercentage)"></div>
                      </div>
                      <div class="d-flex justify-content-between small text-muted mt-1">
                        <span>
                          <span appCountUp [appCountUpValue]="b.usagePercentage ?? 0" [appCountUpDecimals]="0" appCountUpSuffix="%" ></span> used
                        </span>
                        <span class="badge" [class]="alertBadgeCls(b.alertLevel)">{{ b.alertLevel }}</span>
                      </div>
                    </div>
                  }
                }
              </div>
            </div>
          </div>

          <div class="col-lg-4">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-transparent pt-3 px-4">
                <h6 class="mb-0 fw-semibold">Wallet Balances</h6>
              </div>
              <div class="card-body px-4">
                @for (w of walletBars(); track w.wallet.id) {
                  <div class="mb-3">
                    <div class="d-flex justify-content-between small mb-1">
                      <span class="fw-semibold">{{ w.wallet.walletName }}</span>
                      <span class="text-muted">
                        <span appCountUp [appCountUpValue]="w.wallet.currentBalance" appCountUpFormat="compact" ></span>
                      </span>
                    </div>
                    <div class="progress" style="height: 8px;">
                      <div class="progress-bar bg-info" [style.width.%]="w.percent"></div>
                    </div>
                  </div>
                }
                @if (walletBars().length === 0) {
                  <p class="text-muted mb-0">No wallets yet.</p>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4 mt-1">
          <div class="col-lg-7">
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-transparent pt-3 px-4">
                <h6 class="mb-0 fw-semibold">Recent Transactions</h6>
              </div>
              <div class="card-body px-4">
                <app-data-table
                  [columns]="recentColumns()"
                  [rows]="recentTransactions()"
                  [loading]="false"
                  [exportable]="false"
                  emptyMessage="No transactions yet"
                />
              </div>
            </div>
          </div>

          <div class="col-lg-5">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-transparent pt-3 px-4">
                <h6 class="mb-0 fw-semibold">Monthly Trend</h6>
              </div>
              <div class="card-body px-4">
                @for (m of monthlyTrend(); track m.month) {
                  <div class="mb-3">
                    <div class="d-flex justify-content-between small text-muted mb-1">
                      <span class="fw-semibold text-body">{{ m.month }}</span>
                      <span>
                        <span class="text-success me-2">
                          +<span appCountUp [appCountUpValue]="m.income" appCountUpFormat="compact" ></span>
                        </span>
                        <span class="text-danger">
                          -<span appCountUp [appCountUpValue]="m.expense" appCountUpFormat="compact" ></span>
                        </span>
                      </span>
                    </div>
                    <div class="d-flex gap-2 align-items-end trend-bars">
                      <div class="trend-bar bg-success rounded" [style.height.percent]="m.incomePercent"></div>
                      <div class="trend-bar bg-danger rounded" [style.height.percent]="m.expensePercent"></div>
                    </div>
                  </div>
                }
                @if (monthlyTrend().length === 0) {
                  <p class="text-muted mb-0">No transactions recorded yet.</p>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  protected readonly service = inject(TransactionService);

  readonly month = signal(currentMonth());
  readonly loading = signal(true);

  readonly skeletonStatCards = [1, 2, 3, 4];

  /** Last 6 months (including current) of income/expense — feeds sparklines. */
  readonly series = computed(() => {
    const txs = this.service.transactions() ?? [];
    const buckets = new Map<string, { income: number; expense: number }>();
    for (const t of txs) {
      const key = (t.transactionDate ?? '').slice(0, 7);
      const bucket = buckets.get(key) ?? { income: 0, expense: 0 };
      const amount = Math.abs(t.totalAmount ?? 0);
      if (t.transactionTypeCode === 'INCOME') bucket.income += amount;
      else if (t.transactionTypeCode === 'EXPENSE') bucket.expense += amount;
      buckets.set(key, bucket);
    }
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const income = months.map((m) => buckets.get(m)?.income ?? 0);
    const expense = months.map((m) => buckets.get(m)?.expense ?? 0);
    const savings = income.map((v, i) => v - expense[i]);
    let running = 0;
    const balance = savings.map((v) => (running += v));
    return { months, income, expense, savings, balance };
  });

  readonly summaryCards = computed(() => {
    const wallets = this.service.wallets() ?? [];
    const active = wallets.filter((w) => w.status === 'ACTIVE');
    const balance = active.reduce((sum, w) => sum + (w.currentBalance ?? 0), 0);
    const income = monthTotal(this.service.transactions(), 'INCOME', this.month());
    const expense = monthTotal(this.service.transactions(), 'EXPENSE', this.month());
    const savings = income - expense;
    const s = this.series();

    return [
      {
        label: 'Current Balance',
        value: formatAmount(balance),
        numericValue: balance,
        icon: 'bi-wallet2',
        tone: 'primary' as SummaryTone,
        hint: `${active.length} active wallet${active.length === 1 ? '' : 's'}`,
        trend: s.balance,
      },
      {
        label: 'Income (this month)',
        value: formatAmount(income),
        numericValue: income,
        icon: 'bi-graph-up-arrow',
        tone: 'success' as SummaryTone,
        hint: this.month(),
        trend: s.income,
      },
      {
        label: 'Expense (this month)',
        value: formatAmount(expense),
        numericValue: expense,
        icon: 'bi-graph-down-arrow',
        tone: 'danger' as SummaryTone,
        hint: this.month(),
        trend: s.expense,
      },
      {
        label: 'Savings',
        value: formatAmount(savings),
        numericValue: savings,
        icon: 'bi-piggy-bank',
        tone: (savings < 0 ? 'danger' : 'info') as SummaryTone,
        hint: 'Income – Expense',
        trend: s.savings,
      },
    ];
  });

  readonly budgets = computed(() =>
    (this.service.budgets() ?? []).filter((b) => b.month === this.month()),
  );

  readonly recentTransactions = computed(() =>
    [...(this.service.transactions() ?? [])]
      .sort((a, b) => (b.transactionDate ?? '').localeCompare(a.transactionDate ?? ''))
      .slice(0, 8),
  );

  readonly recentColumns = computed<TableColumn<TransactionDto>[]>(() => {
    const svc = this.service;
    return [
      { key: 'date', label: 'Date', cell: columnRenderer('date', svc), sortable: true },
      { key: 'purpose', label: 'Purpose', cell: columnRenderer('purpose', svc) },
      { key: 'wallet', label: 'Wallet', cell: columnRenderer('wallet', svc) },
      { key: 'amount', label: 'Amount', cell: columnRenderer('amount', svc), cellClass: amountCellClass, align: 'end', numberFormat: 'amount' },
    ];
  });

  readonly walletBars = computed(() => {
    const wallets = (this.service.wallets() ?? []).filter((w) => w.status === 'ACTIVE');
    const max = Math.max(...wallets.map((w) => w.currentBalance ?? 0), 1);
    return wallets.map(
      (wallet): { wallet: WalletDto; percent: number } => ({
        wallet,
        percent: Math.max(4, Math.round(((wallet.currentBalance ?? 0) / max) * 100)),
      }),
    );
  });

  readonly monthlyTrend = computed(() => {
    const txs = this.service.transactions() ?? [];
    const buckets = new Map<string, { income: number; expense: number }>();
    for (const t of txs) {
      const key = (t.transactionDate ?? '').slice(0, 7);
      const bucket = buckets.get(key) ?? { income: 0, expense: 0 };
      const amount = Math.abs(t.totalAmount ?? 0);
      if (t.transactionTypeCode === 'INCOME') bucket.income += amount;
      else if (t.transactionTypeCode === 'EXPENSE') bucket.expense += amount;
      buckets.set(key, bucket);
    }
    const months = [...buckets.keys()].sort().slice(-6);
    const maxVal = Math.max(
      1,
      ...months.map((m) => {
        const d = buckets.get(m) ?? { income: 0, expense: 0 };
        return Math.max(d.income, d.expense);
      }),
    );
    return months.map((m) => {
      const d = buckets.get(m) ?? { income: 0, expense: 0 };
      return {
        month: m,
        income: d.income,
        expense: d.expense,
        incomePercent: Math.max(3, Math.round((d.income / maxVal) * 100)),
        expensePercent: Math.max(3, Math.round((d.expense / maxVal) * 100)),
      };
    });
  });

  ngOnInit(): void {
    this.month.set(currentMonth());
    this.service
      .loadDashboardData(this.month())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ error: () => undefined });
  }

  barWidth(usage: number | undefined): number {
    return Math.min(Math.max(usage ?? 0, 0), 100);
  }

  progressCls(level: string): string {
    return level === 'EXCEEDED' ? 'bg-danger' : level === 'WARNING' ? 'bg-warning' : 'bg-success';
  }

  alertBadgeCls(level: string): string {
    return level === 'EXCEEDED'
      ? 'bg-danger-subtle text-danger'
      : level === 'WARNING'
        ? 'bg-warning-subtle text-warning-emphasis'
        : 'bg-success-subtle text-success';
  }

  formatAmount(value: number): string {
    return formatAmount(value);
  }

  formatCompact(value: number): string {
    return formatCompact(value);
  }

  purpose(t: TransactionDto): string {
    return purposeDisplay(t, this.service);
  }
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthTotal(txs: TransactionDto[], code: 'INCOME' | 'EXPENSE', month: string): number {
  return (txs ?? [])
    .filter((t) => (t.transactionDate ?? '').startsWith(month) && t.transactionTypeCode === code)
    .reduce((sum, t) => sum + (t.totalAmount ?? 0), 0);
}
