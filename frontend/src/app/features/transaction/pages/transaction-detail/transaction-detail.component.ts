import { Component, input, output, inject, signal, effect } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { DrawerComponent } from '../../../../shared/components/drawer/drawer.component';
import { TransactionService } from '../../services/transaction.service';
import { TransactionDto, TransactionWalletEntryDto } from '../../dto/transaction.dto';
import { formatAmount } from '../../../../shared/utils/money.utils';
import { CountUpDirective } from '../../../../shared/directives/count-up.directive';
import { purposeDisplay, isOutflowTransaction } from '../../config/transaction-table.config';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [DrawerComponent, SlicePipe, CountUpDirective],
  template: `
    <app-drawer [(open)]="drawerOpen" title="Transaction Details" icon="bi-receipt" size="lg" [loading]="loading()">
      @if (tx(); as t) {
        <div class="detail">
          <div class="detail__head d-flex gap-2 mb-3">
            <span class="badge" [class]="typeBadgeClass(t)">
              <i class="bi me-1" [class]="typeIcon(t.transactionTypeCode)"></i>{{ t.transactionTypeCode }}
            </span>
            <span class="badge" [class]="statusBadgeClass(t.transactionStatusCode)">{{ t.transactionStatusCode }}</span>
          </div>

          <div class="detail__amount fw-bold fs-3 mb-1" [class]="amountClass(t)">
            <span appCountUp [appCountUpValue]="amountValue(t)" appCountUpFormat="amount" ></span>
          </div>
          <div class="text-muted mb-3">{{ purpose(t) }}</div>

          <div class="row g-3">
            <div class="col-sm-6">
              <div class="detail__label small text-muted">Date</div>
              <div class="detail__value">{{ t.transactionDate | slice:0:10 }}</div>
            </div>
            <div class="col-sm-6">
              <div class="detail__label small text-muted">Wallets</div>
              <div class="detail__value">{{ walletsLabel(t) }}</div>
            </div>
            @if (t.personName || t.loanUserName) {
              <div class="col-sm-6">
                <div class="detail__label small text-muted">Person</div>
                <div class="detail__value">{{ t.loanUserName || t.personName }}</div>
              </div>
            }
            @if (t.merchant) {
              <div class="col-sm-6">
                <div class="detail__label small text-muted">Merchant</div>
                <div class="detail__value">{{ t.merchant }}</div>
              </div>
            }
            @if (t.referenceNumber) {
              <div class="col-sm-6">
                <div class="detail__label small text-muted">Reference</div>
                <div class="detail__value">{{ t.referenceNumber }}</div>
              </div>
            }
            @if (t.description) {
              <div class="col-12">
                <div class="detail__label small text-muted">Description</div>
                <div class="detail__value">{{ t.description }}</div>
              </div>
            }
            @if (t.notes) {
              <div class="col-12">
                <div class="detail__label small text-muted">Notes</div>
                <div class="detail__value">{{ t.notes }}</div>
              </div>
            }
          </div>

          @if (t.walletEntries?.length) {
            <h6 class="mt-4 mb-2 text-uppercase small text-muted">Wallet Entries</h6>
            <div class="list-group">
              @for (entry of t.walletEntries ?? []; track $index) {
                <div class="list-group-item d-flex justify-content-between align-items-center">
                  <span>
                    <i class="bi bi-wallet2 me-2 text-muted"></i>
                    {{ entryName(entry) }}
                    @if (entry.merchant) {
                      <small class="text-muted ms-2">{{ entry.merchant }}</small>
                    }
                  </span>
                  <strong>
                    <span appCountUp [appCountUpValue]="num(entry.amount)" appCountUpFormat="amount" ></span>
                  </strong>
                </div>
              }
            </div>
          }
        </div>
      }
    </app-drawer>
  `,
})
export class TransactionDetailComponent {
  readonly transactionId = input.required<number>();
  readonly closed = output<void>();

  private readonly service = inject(TransactionService);
  readonly tx = signal<TransactionDto | null>(null);
  readonly loading = signal(true);
  readonly drawerOpen = signal(true);

  constructor() {
    let lastId: number | null = null;
    effect(() => {
      const id = this.transactionId();
      if (id !== lastId) {
        lastId = id;
        this.drawerOpen.set(true);
        this.load();
      }
    });
    effect(() => {
      if (!this.drawerOpen()) this.closed.emit();
    });
  }

  private load(): void {
    this.loading.set(true);
    this.service.loadTransaction(this.transactionId()).subscribe({
      next: (res) => {
        this.tx.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.tx.set(null);
        this.loading.set(false);
      },
    });
  }

  /** Signed numeric amount (outflows negative) — drives the count-up. */
  amountValue(t: TransactionDto): number {
    const amount = Math.abs(t.totalAmount ?? 0);
    return isOutflowTransaction(t) ? -amount : amount;
  }

  /** Coerces an API amount (number or numeric string) for the count-up. */
  num(v: number | string | null | undefined): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  amountClass(t: TransactionDto): string {
    return isOutflowTransaction(t) ? 'text-danger' : 'text-success';
  }

  purpose(t: TransactionDto): string {
    return purposeDisplay(t, this.service);
  }

  formatAmount(value: number): string {
    return formatAmount(value);
  }

  entryName(entry: TransactionWalletEntryDto): string {
    const name = entry.walletName ?? entry.sourceWalletName ?? entry.destinationWalletName;
    if (name) return name;
    const id = entry.walletId ?? entry.sourceWalletId ?? entry.destinationWalletId;
    return this.service.walletName(id);
  }

  walletsLabel(t: TransactionDto): string {
    const entries = t.walletEntries ?? [];
    const names = entries.map((e) => this.entryName(e));
    return [...new Set(names)].join(', ');
  }

  typeBadgeClass(t: TransactionDto): string {
    const code = t.transactionTypeCode;
    return code === 'EXPENSE'
      ? 'bg-danger-subtle text-danger'
      : code === 'INCOME'
        ? 'bg-success-subtle text-success'
        : code === 'LOAN'
          ? 'bg-info-subtle text-info-emphasis'
          : 'bg-secondary-subtle text-secondary-emphasis';
  }

  typeIcon(code: string): string {
    return code === 'EXPENSE'
      ? 'bi-arrow-up-circle'
      : code === 'INCOME'
        ? 'bi-arrow-down-circle'
        : code === 'LOAN'
          ? 'bi-cash-coin'
          : 'bi-arrow-left-right';
  }

  statusBadgeClass(code: string): string {
    return code === 'COMPLETED'
      ? 'bg-success-subtle text-success'
      : code === 'PENDING'
        ? 'bg-warning-subtle text-warning-emphasis'
        : code === 'FAILED'
          ? 'bg-danger-subtle text-danger'
          : 'bg-secondary-subtle text-secondary-emphasis';
  }
}