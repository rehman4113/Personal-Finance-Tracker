import { Component, input, output, inject, signal, effect } from '@angular/core';
import { DrawerComponent } from '../../../../shared/components/drawer/drawer.component';
import { TransactionService } from '../../services/transaction.service';
import { LedgerEntryDto } from '../../dto/loan.dto';
import { CountUpDirective } from '../../../../shared/directives/count-up.directive';

@Component({
  selector: 'app-ledger-drawer',
  standalone: true,
  imports: [DrawerComponent, CountUpDirective],
  template: `
    <app-drawer [(open)]="drawerOpen" title="Wallet Ledger" icon="bi-journal-text" [loading]="loading()">
      @if (entries().length === 0 && !loading()) {
        <div class="text-center text-muted py-5">
          <i class="bi bi-inbox fs-1 d-block mb-2"></i>
          No ledger entries for this transaction.
        </div>
      }
      @if (entries().length) {
        <table class="table table-sm align-middle">
          <thead>
            <tr>
              <th>Date</th>
              <th>Wallet</th>
              <th class="text-end">Debit</th>
              <th class="text-end">Credit</th>
              <th class="text-end">Balance</th>
            </tr>
          </thead>
          <tbody>
            @for (entry of entries(); track entry.id) {
              <tr>
                <td class="text-nowrap small">{{ (entry.createdAt ?? '').slice(0, 10) }}</td>
                <td>{{ service.walletName(entry.walletId) }}</td>
                <td class="text-end text-danger">
                  @if (entry.debit) {
                    <span appCountUp [appCountUpValue]="entry.debit" appCountUpFormat="amount" ></span>
                  } @else {
                    â€”
                  }
                </td>
                <td class="text-end text-success">
                  @if (entry.credit) {
                    <span appCountUp [appCountUpValue]="entry.credit" appCountUpFormat="amount" ></span>
                  } @else {
                    â€”
                  }
                </td>
                <td class="text-end fw-semibold">
                  <span appCountUp [appCountUpValue]="entry.balanceAfter" appCountUpFormat="amount" ></span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </app-drawer>
  `,
})
export class LedgerDrawerComponent {
  readonly transactionId = input.required<number>();
  readonly closed = output<void>();

  protected readonly service = inject(TransactionService);
  readonly entries = signal<LedgerEntryDto[]>([]);
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
    this.service.loadLedger(this.transactionId()).subscribe({
      next: (res) => {
        this.entries.set(res ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.entries.set([]);
        this.loading.set(false);
      },
    });
  }
}