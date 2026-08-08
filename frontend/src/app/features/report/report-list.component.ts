import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { SummaryTone } from '../../shared/components/summary-card/summary-card.component';
import { DateRangePickerComponent } from '../../shared/components/date-range-picker/date-range-picker.component';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { TransactionService } from '../transaction/services/transaction.service';
import { TransactionDto } from '../transaction/dto/transaction.dto';
import { WalletDto } from '../transaction/dto/wallet.dto';
import { formatAmount, formatCompact } from '../../shared/utils/money.utils';
import { exportToCsv } from '../../shared/utils/csv.utils';
import { staggerIn } from '../../shared/animations/stagger.animations';
import {
  CHART_ACCENT,
  CHART_CATEGORY_PALETTE,
  CHART_DANGER,
  CHART_SUCCESS,
  CHART_TEAL,
  barChartOptions,
  gradientFill,
  lineChartOptions,
} from '../../shared/charts/pfm-chart.theme';
import type { ChartData, ChartOptions, ScriptableContext } from 'chart.js';

/** One plotted point of the trend chart — day (YYYY-MM-DD) or month (YYYY-MM). */
interface TrendPoint {
  key: string;
  income: number;
  expense: number;
}

interface MonthlyRow {
  month: string;
  income: number;
  expense: number;
  net: number;
  max: number;
}

interface CategoryRow {
  purpose: string;
  amount: number;
  count: number;
  max: number;
}

interface BudgetRow {
  purposeName: string;
  monthlyLimit: number;
  totalSpent: number;
  usage: number;
  alertLevel: string;
}

/** Manual override of the trend chart granularity. auto keeps the historical
 *  adaptive rule (daily ≤ 62-day span, monthly otherwise); the rest force a
 *  fixed bucket size. */
type TrendPeriod = 'auto' | 'daily' | 'weekly' | 'monthly' | 'yearly';

/** Day span below which the trend chart plots daily points (else monthly). */
const DAILY_SPAN_LIMIT_DAYS = 62;

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [PageHeaderComponent, StatCardComponent, DateRangePickerComponent, DataTableComponent, ChartComponent, RouterLink],
  animations: [staggerIn],
  styleUrl: './report-list.component.scss',
  template: `
    <div class="container-fluid py-4">
      <app-page-header title="Reports" subtitle="Client-side analytics over your transactions" icon="bi-graph-up">
        <div class="d-flex align-items-center">
          <app-date-range-picker [(from)]="from" [(to)]="to" />
        </div>
      </app-page-header>

      @if (loading()) {
        <div class="row g-4" aria-hidden="true">
          @for (s of skeletonStatCards; track $index) {
            <div class="col-sm-6 col-xl-3">
              <div class="pfm-skeleton pfm-skeleton--card" style="height: 96px;"></div>
            </div>
          }
        </div>
        <div class="row g-4 mt-1">
          <div class="col-lg-7"><div class="pfm-skeleton pfm-skeleton--card" style="height: 380px;"></div></div>
          <div class="col-lg-5"><div class="pfm-skeleton pfm-skeleton--card" style="height: 380px;"></div></div>
        </div>
        <div class="mt-4"><div class="pfm-skeleton pfm-skeleton--card" style="height: 360px;"></div></div>
      } @else {
        <div class="row g-4" [@staggerIn]>
          @for (stat of statCards(); track stat.label) {
            <div class="col-sm-6 col-xl-3">
              <app-stat-card [label]="stat.label" [value]="stat.value" [numericValue]="stat.numericValue" [icon]="stat.icon" [tone]="stat.tone" [progress]="stat.progress" [progressLabel]="stat.progressLabel" />
            </div>
          }
        </div>

        <div class="row g-4 mt-1">
          <div class="col-lg-7">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-transparent pt-3 px-4 d-flex align-items-center justify-content-between">
                <h6 class="mb-0 fw-semibold">Income vs Expense Trend</h6>
                <div class="btn-group btn-group-sm" role="group" aria-label="Trend period">
                  @for (p of periodOptions; track p.value) {
                    <button
                      type="button"
                      class="btn"
                      [class.btn-primary]="trendPeriod() === p.value"
                      [class.btn-outline-secondary]="trendPeriod() !== p.value"
                      (click)="trendPeriod.set(p.value)"
                    >
                      {{ p.label }}
                    </button>
                  }
                </div>
              </div>
              <div class="card-body px-4">
                @if (trendPoints().length === 0) {
                  <p class="text-muted mb-0">No transactions in the selected range.</p>
                } @else {
                  <div class="pfm-chart-area">
                    <app-chart chartType="line" [data]="trendChartData()" [labels]="trendLabels()" [yFormat]="compactFormat" [showLegend]="true" [options]="trendOptions()" />
                  </div>
                  <button type="button" class="btn btn-sm btn-outline-primary mt-3" (click)="exportMonthly()">
                    <i class="bi bi-download me-1"></i>Export Monthly CSV
                  </button>
                }
              </div>
            </div>
          </div>

          <div class="col-lg-5">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-header bg-transparent pt-3 px-4">
                <h6 class="mb-0 fw-semibold">Expense by Category</h6>
              </div>
              <div class="card-body px-4">
                @if (categories().length === 0) {
                  <p class="text-muted mb-0">No expenses in the selected range.</p>
                } @else {
                  <div class="pfm-chart-area pfm-chart-area--donut">
                    <app-chart chartType="doughnut" [data]="categoryChartData()" [labels]="categoryLabels()" [yFormat]="amountFormat" [showLegend]="true" />
                  </div>
                  <button type="button" class="btn btn-sm btn-outline-primary mt-3" (click)="exportCategories()">
                    <i class="bi bi-download me-1"></i>Export Categories CSV
                  </button>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-sm mt-4">
          <div class="card-header bg-transparent pt-3 px-4">
            <h6 class="mb-0 fw-semibold">Budget vs Actual — {{ budgetMonth() }}</h6>
          </div>
          <div class="card-body px-4">
            @if (budgetRows().length === 0) {
              <p class="text-muted mb-0">No budgets for {{ budgetMonth() }}. <a routerLink="/budgets">Create one</a> to compare spending against limits.</p>
            } @else if (budgetBarLayout()) {
              <div class="pfm-chart-area pfm-chart-area--bar">
                <app-chart chartType="bar" [data]="budgetChartData()" [labels]="budgetLabels()" [yFormat]="compactFormat" [showLegend]="true" [options]="budgetOptions()" />
              </div>
            } @else {
              <ul class="budget-progress-list">
                @for (row of budgetRows(); track row.purposeName; let i = $index) {
                  <li class="budget-progress-item" [attr.title]="progressTooltip(row)">
                    <div class="budget-progress-row">
                      <span class="budget-progress-name">{{ row.purposeName }}</span>
                      <span class="budget-progress-pct" [class]="progressTone(row)">
                        <i class="bi me-1" [class]="progressIcon(row)"></i>{{ pctText(row) }}
                      </span>
                    </div>
                    <div class="budget-progress-track">
                      <div
                        class="budget-progress-fill"
                        [class]="progressTone(row)"
                        [style.width.%]="progressWidth(row)"
                        [style.animation-delay]="i * 90 + 'ms'"
                      ></div>
                    </div>
                    <div class="budget-progress-label">{{ amountLabel(row) }}</div>
                  </li>
                }
              </ul>
            }
          </div>
        </div>

        <div class="card border-0 shadow-sm mt-4">
          <div class="card-header bg-transparent pt-3 px-4">
            <h6 class="mb-0 fw-semibold">Wallet Balance Summary</h6>
          </div>
          <div class="card-body px-4">
            <app-data-table [columns]="walletColumns()" [rows]="wallets()" [loading]="false" exportName="wallet-balances" emptyMessage="No wallets yet" />
          </div>
        </div>
      }
    </div>
  `,
})
export class ReportListComponent implements OnInit {
  protected readonly service = inject(TransactionService);

  readonly from = signal<string>(yearStart());
  readonly to = signal<string>(today());
  readonly loading = signal(true);

  readonly skeletonStatCards = [1, 2, 3, 4];

  readonly ranged = computed(() =>
    (this.service.transactions() ?? []).filter((t) => inRange(t, this.from(), this.to())),
  );

  readonly statCards = computed(() => {
    const txs = this.ranged();
    const income = sumBy(txs, 'INCOME');
    const expense = sumBy(txs, 'EXPENSE');
    const total = income + expense;
    return [
      { label: 'Total Income', value: formatAmount(income), numericValue: income, icon: 'bi-graph-up-arrow', tone: 'success' as SummaryTone, progress: total > 0 ? (income / total) * 100 : 0, progressLabel: total > 0 ? `${Math.round((income / total) * 100)}% of flow` : '' },
      { label: 'Total Expense', value: formatAmount(expense), numericValue: expense, icon: 'bi-graph-down-arrow', tone: 'danger' as SummaryTone, progress: total > 0 ? (expense / total) * 100 : 0, progressLabel: total > 0 ? `${Math.round((expense / total) * 100)}% of flow` : '' },
      { label: 'Net', value: formatAmount(income - expense), numericValue: income - expense, icon: 'bi-calculator', tone: (income - expense < 0 ? 'danger' : 'info') as SummaryTone, progress: income > 0 ? ((income - expense) / income) * 100 : 0, progressLabel: income > 0 ? `${Math.round(((income - expense) / income) * 100)}% of income` : '' },
      { label: 'Transactions', value: String(txs.length), numericValue: txs.length, icon: 'bi-journal-text', tone: 'primary' as SummaryTone, progress: null, progressLabel: '' },
    ];
  });

  /* ------------------------------------------------------------------
     Income vs Expense Trend — adaptive granularity dual-line chart
     ------------------------------------------------------------------ */

  readonly periodOptions: { value: TrendPeriod; label: string }[] = [
    { value: 'auto', label: 'Auto' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  readonly trendPeriod = signal<TrendPeriod>('auto');

  private readonly spanDays = computed(() => {
    const fromMs = Date.parse(this.from());
    const toMs = Date.parse(this.to());
    if (Number.isNaN(fromMs) || Number.isNaN(toMs)) return 0;
    return Math.max(0, Math.round((toMs - fromMs) / 86_400_000));
  });

  /** Effective bucket size after applying the manual override. */
  readonly granularity = computed<TrendPeriod>(() => {
    const period = this.trendPeriod();
    if (period !== 'auto') return period;
    return this.spanDays() <= DAILY_SPAN_LIMIT_DAYS ? 'daily' : 'monthly';
  });

  readonly granularityLabel = computed(() => {
    switch (this.granularity()) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      default:
        return 'Auto';
    }
  });

  /** Return <bucketKey> and the ISO slice length used to bucket a tx date. */
  private keyStrategy(g: TrendPeriod): { key: (date: string) => string; slice: number; keys: () => string[] } {
    switch (g) {
      case 'weekly':
        return {
          key: (date) => weekKey(date.slice(0, 10)),
          slice: 10,
          keys: () => eachWeek(this.from(), this.to()),
        };
      case 'yearly':
        return {
          key: (date) => date.slice(0, 4),
          slice: 4,
          keys: () => eachYear(this.from(), this.to()),
        };
      case 'daily':
        return {
          key: (date) => date.slice(0, 10),
          slice: 10,
          keys: () => eachDay(this.from(), this.to()),
        };
      default:
        return {
          key: (date) => date.slice(0, 7),
          slice: 7,
          keys: () => eachMonth(this.from(), this.to()),
        };
    }
  }

  /** True for period-independent month-start grouping (used by the footer). */
  private readonly isDaily = computed(() => this.granularity() === 'daily');

  /**
   * Continuous, zero-filled series over the selected range — every bucket in
   * the chosen granularity is a point, so inactive periods sit at 0 instead of
   * the line skipping them.
   */
  readonly trendPoints = computed<TrendPoint[]>(() => {
    const txs = this.ranged();
    const strategy = this.keyStrategy(this.granularity());
    const keys = strategy.keys();
    const buckets = new Map<string, { income: number; expense: number }>();
    for (const key of keys) buckets.set(key, { income: 0, expense: 0 });
    for (const t of txs) {
      const key = strategy.key(t.transactionDate ?? '');
      const amount = Math.abs(t.totalAmount ?? 0);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      if (t.transactionTypeCode === 'INCOME') bucket.income += amount;
      else if (t.transactionTypeCode === 'EXPENSE') bucket.expense += amount;
    }
    return keys.map((key) => ({ key, income: buckets.get(key)!.income, expense: buckets.get(key)!.expense }));
  });

  readonly trendLabels = computed(() => this.trendPoints().map((p) => p.key));

  readonly trendChartData = computed<ChartData<'line'>>(() => ({
    labels: this.trendLabels(),
    datasets: [
      {
        label: 'Income',
        data: this.trendPoints().map((p) => p.income),
        borderColor: CHART_ACCENT,
        backgroundColor: (ctx: ScriptableContext<'line'>) => gradientFill(ctx, `${CHART_ACCENT}26`),
        fill: true,
        borderWidth: 2.5,
        tension: 0.42,
        pointRadius: (ctx) => ((ctx.parsed.y ?? 0) > 0 ? 3 : 0),
        pointHoverRadius: 5,
        pointBackgroundColor: CHART_ACCENT,
        pointBorderColor: '#0f172a',
        pointBorderWidth: 1.5,
        pointHoverBorderColor: '#fff',
      },
      {
        label: 'Expense',
        data: this.trendPoints().map((p) => p.expense),
        borderColor: CHART_TEAL,
        backgroundColor: (ctx: ScriptableContext<'line'>) => gradientFill(ctx, `${CHART_TEAL}33`),
        fill: true,
        borderWidth: 2.5,
        tension: 0.42,
        pointRadius: (ctx) => ((ctx.parsed.y ?? 0) > 0 ? 3 : 0),
        pointHoverRadius: 5,
        pointBackgroundColor: CHART_TEAL,
        pointBorderColor: '#0f172a',
        pointBorderWidth: 1.5,
        pointHoverBorderColor: '#fff',
      },
    ],
  }));

  readonly trendOptions = computed<ChartOptions<'line'>>(() => {
    const g = this.granularity();
    return lineChartOptions(this.trendLabels(), {
      yFormat: this.compactFormat,
      showLegend: true,
      xTickFormat: (value) => tickLabel(g, value),
      xMaxTicks: g === 'daily' ? 10 : g === 'weekly' ? 16 : 12,
      tooltipHooks: {
        title: (items) => items.map((i) => titleLabel(g, String(i.label ?? ''))),
        footer: (items) => this.trendFooter(g, items[0]?.label),
      },
    });
  });

  /** Month-to-date running totals for the hovered point (daily mode only). */
  private trendFooter(g: TrendPeriod, label: string | undefined): string[] {
    if (g !== 'daily' || !label) return [];
    const month = label.slice(0, 7);
    let income = 0;
    let expense = 0;
    for (const p of this.trendPoints()) {
      if (p.key.slice(0, 7) !== month) continue;
      income += p.income;
      expense += p.expense;
    }
    return [
      `Month total — Income ${formatAmount(income)}`,
      `Month total — Expense ${formatAmount(expense)}`,
    ];
  }

  /** Monthly rows kept for the "Export Monthly CSV" (unchanged behaviour). */
  readonly monthly = computed<MonthlyRow[]>(() => {
    const txs = this.ranged();
    const buckets = new Map<string, { income: number; expense: number }>();
    for (const t of txs) {
      const key = (t.transactionDate ?? '').slice(0, 7);
      const b = buckets.get(key) ?? { income: 0, expense: 0 };
      const amount = Math.abs(t.totalAmount ?? 0);
      if (t.transactionTypeCode === 'INCOME') b.income += amount;
      else if (t.transactionTypeCode === 'EXPENSE') b.expense += amount;
      buckets.set(key, b);
    }
    const max = Math.max(1, ...[...buckets.values()].flatMap((x) => [x.income, x.expense]));
    return [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, d]) => ({ month, income: d.income, expense: d.expense, net: d.income - d.expense, max }));
  });

  readonly categories = computed<CategoryRow[]>(() => {
    const txs = this.ranged().filter((t) => t.transactionTypeCode === 'EXPENSE');
    const buckets = new Map<string, { amount: number; count: number }>();
    for (const t of txs) {
      const name = this.service.purposeNameByCode(t.transactionPurposeCode);
      const b = buckets.get(name) ?? { amount: 0, count: 0 };
      b.amount += Math.abs(t.totalAmount ?? 0);
      b.count += 1;
      buckets.set(name, b);
    }
    const max = Math.max(1, ...[...buckets.values()].map((b) => b.amount));
    return [...buckets.entries()]
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([name, b]) => ({ purpose: name, ...b, max }));
  });

  readonly categoryLabels = computed(() => this.categories().map((c) => c.purpose));

  readonly categoryChartData = computed<ChartData<'doughnut'>>(() => ({
    labels: this.categoryLabels(),
    datasets: [
      {
        data: this.categories().map((c) => c.amount),
        backgroundColor: CHART_CATEGORY_PALETTE,
        borderColor: 'rgba(11, 17, 32, 0.9)',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }));

  /* ------------------------------------------------------------------
     Budget vs Actual — grouped bars (≤5 categories) or progress list
     ------------------------------------------------------------------ */

  readonly budgetMonth = computed(() => currentMonth());

  /** Sorted most over-budget (or highest spend) first so problems surface on top. */
  readonly budgetRows = computed<BudgetRow[]>(() =>
    (this.service.budgets() ?? [])
      .filter((b) => b.month === this.budgetMonth())
      .map((b) => {
        const limit = Math.abs(b.monthlyLimit ?? 0);
        const spent = Math.abs(b.totalSpent ?? 0);
        const usage = limit > 0 ? (spent / limit) * 100 : spent > 0 ? 101 : 0;
        return {
          purposeName: b.purposeName,
          monthlyLimit: limit,
          totalSpent: spent,
          usage,
          alertLevel: b.alertLevel,
        };
      })
      .sort((a, b) => b.usage - a.usage || b.totalSpent - a.totalSpent),
  );

  readonly budgetLabels = computed(() => this.budgetRows().map((b) => b.purposeName));

  /** Grouped bars for few categories; the progress list scales better with many. */
  readonly budgetBarLayout = computed(() => this.budgetRows().length <= 5);

  readonly budgetChartData = computed<ChartData<'bar'>>(() => {
    const rows = this.budgetRows();
    const budgeted = rows.map((r) => r.monthlyLimit);
    const actual = rows.map((r) => r.totalSpent);
    const overBudget = (i: number): boolean => actual[i] > budgeted[i];
    return {
      labels: this.budgetLabels(),
      datasets: [
        {
          label: 'Budgeted',
          data: budgeted,
          backgroundColor: `${CHART_ACCENT}26`,
          borderColor: CHART_ACCENT,
          borderWidth: 1.5,
          borderRadius: 4,
          hoverBackgroundColor: `${CHART_ACCENT}40`,
        },
        {
          label: 'Actual Spent',
          data: actual,
          backgroundColor: (ctx: ScriptableContext<'bar'>) => (overBudget(ctx.dataIndex) ? CHART_DANGER : CHART_SUCCESS),
          borderColor: (ctx: ScriptableContext<'bar'>) => (overBudget(ctx.dataIndex) ? CHART_DANGER : CHART_SUCCESS),
          borderWidth: 1.5,
          borderRadius: 4,
        },
        {
          // Thin target marker (dash) at the budgeted amount for each category.
          label: 'Budget target',
          type: 'line' as const,
          data: budgeted,
          borderColor: 'rgba(255, 255, 255, 0.45)',
          borderWidth: 2,
          pointStyle: 'line' as const,
          pointRadius: 5,
          pointHoverRadius: 5,
          pointBorderWidth: 2,
          tension: 0,
          fill: false,
        } as unknown as ChartData<'bar'>['datasets'][number],
      ],
    };
  });

  readonly budgetOptions = computed<ChartOptions<'bar'>>(() => {
    const rows = this.budgetRows();
    const opts = barChartOptions(this.compactFormat, {
      tooltipHooks: {
        label: (item) => {
          const row = rows[item.dataIndex];
          if (!row) return '';
          if (item.datasetIndex === 0) return ` Budgeted: ${formatAmount(row.monthlyLimit)}`;
          if (item.datasetIndex === 1) return ` Actual: ${formatAmount(row.totalSpent)} (${Math.round(row.usage)}% used)`;
          return '';
        },
      },
    });
    // Exclude the target-marker dataset from the legend + tooltip.
    const legendLabels = opts.plugins?.legend?.labels as { filter?: (item: { text: string }) => boolean } | undefined;
    if (legendLabels) legendLabels.filter = (item) => item.text !== 'Budget target';
    opts.plugins!.tooltip = {
      ...opts.plugins!.tooltip,
      filter: (item: { datasetIndex: number }) => item.datasetIndex !== 2,
    };
    return opts;
  });

  /* --- Horizontal progress-list helpers (many budget categories) --- */

  progressWidth(row: BudgetRow): number {
    return Math.min(100, Math.max(0, row.usage));
  }

  progressTone(row: BudgetRow): string {
    if (row.usage >= 100) return 'is-over';
    if (row.usage >= 80) return 'is-warning';
    return 'is-healthy';
  }

  progressIcon(row: BudgetRow): string {
    if (row.usage >= 100) return 'bi-arrow-up-right';
    if (row.usage >= 80) return 'bi-exclamation-triangle';
    return 'bi-check-circle';
  }

  pctText(row: BudgetRow): string {
    return `${Math.round(row.usage)}% used`;
  }

  amountLabel(row: BudgetRow): string {
    return `${formatAmount(row.totalSpent)} spent of ${formatAmount(row.monthlyLimit)} budgeted`;
  }

  progressTooltip(row: BudgetRow): string {
    return `${row.purposeName}: ${formatAmount(row.totalSpent)} of ${formatAmount(row.monthlyLimit)} budgeted (${Math.round(row.usage)}% used)`;
  }

  readonly wallets = computed<WalletDto[]>(() => this.service.wallets() ?? []);

  readonly walletColumns = computed<TableColumn<WalletDto>[]>(() => [
    { key: 'name', label: 'Name', cell: (w) => w.walletName ?? '—' },
    { key: 'type', label: 'Type', cell: (w) => w.walletTypeCode ?? '—' },
    { key: 'status', label: 'Status', cell: (w) => w.status ?? '—' },
    {
      key: 'balance',
      label: 'Current Balance',
      cell: (w) => w.currentBalance ?? 0,
      cellClass: () => 'fw-semibold',
      align: 'end',
      sortable: true,
      numberFormat: 'amount',
    },
  ]);

  ngOnInit(): void {
    this.service.loadMasterData();
    this.service.loadBudgets(this.budgetMonth()).subscribe({ error: () => undefined });
    forkJoin([this.service.loadWallets(), this.service.loadTransactions()])
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ error: () => undefined });
  }

  readonly amountFormat = (v: number): string => formatAmount(v);
  readonly compactFormat = (v: number): string => formatCompact(v);

  exportMonthly(): void {
    exportToCsv(
      'monthly-report',
      [
        { header: 'Month', value: (r: unknown) => (r as MonthlyRow).month },
        { header: 'Income', value: (r: unknown) => (r as MonthlyRow).income },
        { header: 'Expense', value: (r: unknown) => (r as MonthlyRow).expense },
        { header: 'Net', value: (r: unknown) => (r as MonthlyRow).net },
      ],
      this.monthly(),
    );
  }

  exportCategories(): void {
    exportToCsv(
      'expense-by-category',
      [
        { header: 'Category', value: (r: unknown) => (r as CategoryRow).purpose },
        { header: 'Amount', value: (r: unknown) => (r as CategoryRow).amount },
        { header: 'Transactions', value: (r: unknown) => (r as CategoryRow).count },
      ],
      this.categories(),
    );
  }
}

function yearStart(): string {
  return `${new Date().getFullYear()}-01-01`;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function inRange(tx: TransactionDto, from: string, to: string): boolean {
  const date = (tx.transactionDate ?? '').slice(0, 10);
  return date >= from && date <= to;
}

function sumBy(txs: TransactionDto[], code: 'INCOME' | 'EXPENSE'): number {
  return txs.filter((t) => t.transactionTypeCode === code).reduce((sum, t) => sum + Math.abs(t.totalAmount ?? 0), 0);
}

/** Every calendar day from → to inclusive (ISO keys, UTC-safe). */
function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  const start = Date.parse(from + 'T00:00:00Z');
  const end = Date.parse(to + 'T00:00:00Z');
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return out;
  const days = Math.round((end - start) / 86_400_000);
  for (let i = 0; i <= days; i++) out.push(new Date(start + i * 86_400_000).toISOString().slice(0, 10));
  return out;
}

/** Every month from → to inclusive (YYYY-MM keys). */
function eachMonth(from: string, to: string): string[] {
  const out: string[] = [];
  const [sy, sm] = from.slice(0, 7).split('-').map(Number);
  const [ey, em] = to.slice(0, 7).split('-').map(Number);
  if (!sy || !sm || !ey || !em || ey < sy || (ey === sy && em < sm)) return out;
  let y = sy;
  let m = sm;
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

/** Every year covering from → to (YYYY keys). */
function eachYear(from: string, to: string): string[] {
  const sy = Number(from.slice(0, 4));
  const ey = Number(to.slice(0, 4));
  if (!sy || !ey || ey < sy) return [];
  const out: string[] = [];
  for (let y = sy; y <= ey; y++) out.push(String(y));
  return out;
}

/** ISO-8601 week key (YYYY-Www) for a YYYY-MM-DD date — Monday week start. */
function weekKey(day: string): string {
  const ms = Date.parse(day + 'T00:00:00Z');
  if (Number.isNaN(ms)) return '';
  const date = new Date(ms);
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dowUTC = target.getUTCDay();
  const monday = new Date(target);
  monday.setUTCDate(target.getUTCDate() - ((dowUTC + 6) % 7));
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  const isoYear = thursday.getUTCFullYear();
  const jan1 = Date.UTC(isoYear, 0, 1);
  const dayOfYear = Math.floor((thursday.getTime() - jan1) / 86_400_000);
  const week = 1 + Math.floor((dayOfYear + Math.floor((new Date(jan1).getUTCDay() + 6) % 7)) / 7);
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

/** Every ISO week key starting from → to inclusive (Monday-anchored). */
function eachWeek(from: string, to: string): string[] {
  const out: string[] = [];
  const start = Date.parse(from.slice(0, 10) + 'T00:00:00Z');
  const end = Date.parse(to.slice(0, 10) + 'T00:00:00Z');
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return out;
  const date = new Date(start);
  const dow = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - ((dow + 6) % 7));
  const seen = new Set<string>();
  for (;;) {
    const key = weekKey(date.toISOString().slice(0, 10));
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
    date.setUTCDate(date.getUTCDate() + 7);
    if (date.getTime() > end) break;
  }
  return out;
}

/** Axes tick label for the chosen granularity. */
function tickLabel(g: TrendPeriod, value: string): string {
  if (g === 'daily') return shortDay(value);
  if (g === 'weekly') return shortDay(weekStartDay(value));
  if (g === 'yearly') return shortYear(value);
  return shortMonth(value);
}

/** Tooltip title label for the chosen granularity. */
function titleLabel(g: TrendPeriod, value: string): string {
  if (g === 'daily') return fullDay(value);
  if (g === 'weekly') return fullWeek(value);
  if (g === 'yearly') return `Year ${value}`;
  return fullMonth(value);
}

function shortDay(key: string): string {
  return new Date(key + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function fullDay(key: string): string {
  return new Date(key + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function shortMonth(key: string): string {
  return new Date(key + '-01T00:00:00Z').toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });
}

function fullMonth(key: string): string {
  return new Date(key + '-01T00:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function shortYear(key: string): string {
  return String(key);
}

function weekStartDay(key: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(key);
  if (!match) return key;
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dayOffset = ((jan1.getUTCDay() + 6) % 7);
  const ms = Date.UTC(year, 0, 1) + ((week - 1) * 7 - dayOffset) * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

function fullWeek(key: string): string {
  const day = weekStartDay(key);
  if (!day) return key;
  return `Week of ${new Date(day + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}`;
}

/** Axes tick label for the chosen granularity. */
