import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DeleteDialogComponent } from '../../shared/components/delete-dialog/delete-dialog.component';
import { TransactionService } from '../transaction/services/transaction.service';
import { BudgetDto } from '../transaction/dto/budget.dto';
import { BudgetFormComponent } from './budget-form.component';
import { staggerIn } from '../../shared/animations/stagger.animations';
import { CountUpDirective } from '../../shared/directives/count-up.directive';

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [PageHeaderComponent, DeleteDialogComponent, BudgetFormComponent, CountUpDirective],
  animations: [staggerIn],
  template: `
    <div class="container-fluid py-4">
      <app-page-header title="Budgets" subtitle="Monthly spending limits per category" icon="bi-pie-chart">
        <button type="button" class="btn btn-primary-gradient" (click)="openCreate()">
          <i class="bi bi-plus-lg me-1"></i>New Budget
        </button>
      </app-page-header>

      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <div class="d-flex flex-wrap align-items-end gap-3 mb-4">
            <div class="budget-month">
              <label class="form-label small mb-1">Month</label>
              <input
                type="month"
                class="form-control form-control-lg-custom"
                [value]="month()"
                (change)="onMonthChange($event)"
              />
            </div>
            @if (invalidMonth()) {
              <small class="text-danger"><i class="bi bi-exclamation-circle me-1"></i>Use the YYYY-MM format</small>
            }
          </div>

          @if (loading()) {
            <div class="row g-3" aria-hidden="true">
              @for (s of skeletonCards; track $index) {
                <div class="col-md-6 col-xl-4">
                  <div class="pfm-skeleton pfm-skeleton--card" style="height: 190px;"></div>
                </div>
              }
            </div>
          } @else if (budgets().length === 0) {
            <div class="text-center text-muted py-5">
              <i class="bi bi-clipboard-x fs-1 d-block mb-2 pfm-float d-inline-block"></i>
              No budgets for {{ month() }}. Create one to start tracking.
            </div>
          } @else {
            <div class="row g-3" [@staggerIn]>
              @for (b of budgets(); track b.id) {
                <div class="col-md-6 col-xl-4">
                  <div class="card border-0 shadow-sm budget-card h-100">
                    <div class="card-body">
                      <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 class="mb-0 fw-semibold">{{ b.purposeName }}</h6>
                          <small class="text-muted">{{ month() }}</small>
                        </div>
                        <span class="badge" [class]="alertCls(b.alertLevel)">{{ b.alertLevel }}</span>
                      </div>
                      <div class="d-flex justify-content-between align-items-baseline mb-2">
                        <span class="fs-5 fw-bold">
                          <span appCountUp [appCountUpValue]="b.totalSpent" appCountUpFormat="amount" ></span>
                        </span>
                        <span class="text-muted small">
                          of <span appCountUp [appCountUpValue]="b.monthlyLimit" appCountUpFormat="amount" ></span>
                        </span>
                      </div>
                      <div class="progress mb-1" style="height: 8px;">
                        <div class="progress-bar" [class]="progressCls(b.alertLevel)" [style.width.%]="barWidth(b.usagePercentage)"></div>
                      </div>
                      <div class="d-flex justify-content-between small text-muted">
                        <span>
                          <span appCountUp [appCountUpValue]="b.usagePercentage ?? 0" [appCountUpDecimals]="1" appCountUpSuffix="%" ></span> used
                        </span>
                        <span class="text-success">
                          <span appCountUp [appCountUpValue]="b.remaining" appCountUpFormat="amount" ></span> left
                        </span>
                      </div>
                      <div class="d-flex justify-content-end gap-2 mt-3">
                        <button type="button" class="btn btn-sm btn-outline-primary" (click)="openEdit(b)">
                          <i class="bi bi-pencil me-1"></i>Edit
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger" (click)="openDelete(b)">
                          <i class="bi bi-trash me-1"></i>Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>

    @if (formOpen()) {
      <app-budget-form [open]="formOpen()" [budget]="editing()" [month]="month()" (openChange)="formOpen.set($event)" />
    }

    @if (deleting()) {
      <app-delete-dialog
        [open]="deleting()"
        title="Delete Budget"
        [message]="'Delete the ' + (deletingBudget()?.purposeName ?? '') + ' budget for ' + month() + '?'"
        [loading]="deletingLoading()"
        (confirmed)="onDeleteConfirmed()"
        (dismissed)="deleting.set(false)"
      />
    }
  `,
})
export class BudgetListComponent implements OnInit {
  protected readonly service = inject(TransactionService);

  readonly month = signal(currentMonth());
  readonly invalidMonth = signal(false);
  readonly loading = signal(true);
  readonly formOpen = signal(false);
  readonly editing = signal<BudgetDto | null>(null);
  readonly deleting = signal(false);
  readonly deletingBudget = signal<BudgetDto | null>(null);
  readonly deletingLoading = signal(false);

  readonly skeletonCards = [1, 2, 3];

  readonly budgets = computed(() => this.service.budgets() ?? []);

  ngOnInit(): void {
    this.service.loadMasterData();
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service
      .loadBudgets(this.month())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ error: () => undefined });
  }

  onMonthChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
      this.invalidMonth.set(true);
      return;
    }
    this.invalidMonth.set(false);
    this.month.set(value);
    this.load();
  }

  openCreate(): void {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  openEdit(budget: BudgetDto): void {
    this.editing.set(budget);
    this.formOpen.set(true);
  }

  openDelete(budget: BudgetDto): void {
    this.deletingBudget.set(budget);
    this.deleting.set(true);
  }

  onDeleteConfirmed(): void {
    const budget = this.deletingBudget();
    if (!budget) return;
    this.deletingLoading.set(true);
    this.service.deleteBudget(budget.id).subscribe({
      next: () => {
        this.deletingLoading.set(false);
        this.deleting.set(false);
      },
      error: () => this.deletingLoading.set(false),
    });
  }

  barWidth(usage: number | undefined): number {
    return Math.min(Math.max(usage ?? 0, 0), 100);
  }

  progressCls(level: string): string {
    return level === 'EXCEEDED' ? 'bg-danger' : level === 'WARNING' ? 'bg-warning' : 'bg-success';
  }

  alertCls(level: string): string {
    return level === 'EXCEEDED'
      ? 'bg-danger-subtle text-danger'
      : level === 'WARNING'
        ? 'bg-warning-subtle text-warning-emphasis'
        : 'bg-success-subtle text-success';
  }
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}