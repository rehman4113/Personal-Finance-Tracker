import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DataTableComponent, TableAction, TableActionEvent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { TransactionService } from '../transaction/services/transaction.service';
import { WalletDto } from '../transaction/dto/wallet.dto';
import { WalletFormComponent } from './wallet-form.component';

@Component({
  selector: 'app-wallet-list',
  standalone: true,
  imports: [PageHeaderComponent, DataTableComponent, ConfirmDialogComponent, WalletFormComponent],
  template: `
    <div class="container-fluid py-4">
      <app-page-header title="Wallets" subtitle="Your accounts and cash sources" icon="bi-wallet2">
        <button type="button" class="btn btn-primary-gradient" (click)="openCreate()">
          <i class="bi bi-plus-lg me-1"></i>Add Wallet
        </button>
      </app-page-header>

      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <app-data-table
            [columns]="columns()"
            [rows]="service.wallets()"
            [loading]="loading()"
            [actions]="rowActions"
            exportName="wallets"
            emptyMessage="No wallets yet — add your first wallet"
            (action)="onAction($event)"
          />
        </div>
      </div>
    </div>

    @if (formOpen()) {
      <app-wallet-form [open]="formOpen()" [wallet]="editing()" (openChange)="formOpen.set($event)" />
    }

    @if (closing()) {
      <app-confirm-dialog
        [open]="closing()"
        title="Close Wallet"
        [message]="closeMessage()"
        confirmLabel="Close Wallet"
        [danger]="true"
        [loading]="closingLoading()"
        (confirmed)="onCloseConfirmed()"
        (dismissed)="closing.set(false)"
      />
    }
  `,
})
export class WalletListComponent implements OnInit {
  protected readonly service = inject(TransactionService);

  readonly loading = signal(true);
  readonly formOpen = signal(false);
  readonly editing = signal<WalletDto | null>(null);
  readonly closing = signal(false);
  readonly closingWallet = signal<WalletDto | null>(null);
  readonly closingLoading = signal(false);

  closeMessage(): string {
    return `Close '${this.closingWallet()?.walletName ?? ''}'? It will be soft-closed (status CLOSED) and hidden from balances.`;
  }

  readonly rowActions: TableAction<WalletDto>[] = [
    { key: 'edit', label: 'Edit', icon: 'bi-pencil', cls: 'text-primary' },
    { key: 'close', label: 'Close wallet', icon: 'bi-x-circle', cls: 'text-danger', visible: (w) => w.status === 'ACTIVE' },
  ];

  readonly columns = computed<TableColumn<WalletDto>[]>(() => [
    { key: 'name', label: 'Name', cell: (w) => w.walletName ?? '—', sortable: true },
    { key: 'type', label: 'Type', cell: (w) => w.walletTypeCode ?? '—' },
    { key: 'currency', label: 'Currency', cell: (w) => w.currency ?? '—' },
    {
      key: 'balance',
      label: 'Current Balance',
      cell: (w) => w.currentBalance ?? 0,
      cellClass: () => 'fw-semibold',
      align: 'end',
      sortable: true,
      numberFormat: 'amount',
    },
    { key: 'status', label: 'Status', cell: (w) => w.status ?? '—', badge: (w) => ({ text: w.status ?? '—', cls: w.status === 'ACTIVE' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary-emphasis' }) },
    { key: 'description', label: 'Description', cell: (w) => w.description ?? '—' },
  ]);

  ngOnInit(): void {
    this.service.loadMasterData();
    this.service
      .loadWallets()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ error: () => undefined });
  }

  openCreate(): void {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  onAction(event: TableActionEvent<WalletDto>): void {
    if (event.action === 'edit') {
      this.editing.set(event.row);
      this.formOpen.set(true);
    }
    if (event.action === 'close') {
      this.closingWallet.set(event.row);
      this.closing.set(true);
    }
  }

  onCloseConfirmed(): void {
    const wallet = this.closingWallet();
    if (!wallet) return;
    this.closingLoading.set(true);
    this.service.closeWallet(wallet.id).subscribe({
      next: () => {
        this.closingLoading.set(false);
        this.closing.set(false);
        this.closingWallet.set(null);
      },
      error: () => this.closingLoading.set(false),
    });
  }
}