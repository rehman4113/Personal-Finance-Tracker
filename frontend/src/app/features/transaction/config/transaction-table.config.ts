import { TableColumn } from '../../../shared/components/data-table/data-table.component';
import { TransactionDto } from '../dto/transaction.dto';
import { TransactionService } from '../services/transaction.service';
import { TransactionMode } from '../models/transaction-mode.model';
import { formatAmount } from '../../../shared/utils/money.utils';

export type TransactionColumnKey =
  | 'date'
  | 'type'
  | 'purpose'
  | 'person'
  | 'wallet'
  | 'amount'
  | 'status';

export interface TransactionColumnSpec {
  key: TransactionColumnKey;
  label: string;
  sortable?: boolean;
}

/** Table column specs per mode (Section 11.2). */
export const TRANSACTION_COLUMN_SPECS: Record<TransactionMode, TransactionColumnSpec[]> = {
  INCOME: [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'purpose', label: 'Income Type' },
    { key: 'wallet', label: 'Wallet' },
    { key: 'amount', label: 'Amount', sortable: true },
    { key: 'status', label: 'Status' },
  ],
  EXPENSE: [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'purpose', label: 'Category' },
    { key: 'wallet', label: 'Wallet' },
    { key: 'amount', label: 'Amount', sortable: true },
    { key: 'status', label: 'Status' },
  ],
  LOAN: [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'person', label: 'Person' },
    { key: 'purpose', label: 'Direction' },
    { key: 'wallet', label: 'Wallet' },
    { key: 'amount', label: 'Amount', sortable: true },
    { key: 'status', label: 'Status' },
  ],
  TRANSFER: [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'wallet', label: 'From → To' },
    { key: 'amount', label: 'Amount', sortable: true },
    { key: 'status', label: 'Status' },
  ],
  ALL: [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'type', label: 'Type' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'person', label: 'Person' },
    { key: 'wallet', label: 'Wallet' },
    { key: 'amount', label: 'Amount', sortable: true },
    { key: 'status', label: 'Status' },
  ],
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge bg-warning-subtle text-warning-emphasis',
  COMPLETED: 'badge bg-success-subtle text-success',
  FAILED: 'badge bg-danger-subtle text-danger',
  REVERSED: 'badge bg-secondary-subtle text-secondary-emphasis',
};

const TYPE_BADGE: Record<string, string> = {
  EXPENSE: 'badge bg-danger-subtle text-danger',
  INCOME: 'badge bg-success-subtle text-success',
  LOAN: 'badge bg-info-subtle text-info-emphasis',
  TRANSFER: 'badge bg-secondary-subtle text-secondary-emphasis',
};

/** Badge renderer for the type column. */
function typeBadge(tx: TransactionDto): { text: string; cls: string } {
  return { text: tx.transactionTypeCode ?? '—', cls: TYPE_BADGE[tx.transactionTypeCode ?? ''] ?? TYPE_BADGE['TRANSFER'] };
}

/** Badge renderer for the status column. */
function statusBadge(tx: TransactionDto): { text: string; cls: string } {
  const code = tx.transactionStatusCode ?? '—';
  return { text: code, cls: STATUS_BADGE[tx.transactionStatusCode ?? ''] ?? STATUS_BADGE['REVERSED'] };
}

/** Sign prefix only — colors applied via cellClass (table renders plain text). */
export function signedAmountText(tx: TransactionDto): string {
  const amount = tx.totalAmount ?? 0;
  const base = formatAmount(Math.abs(amount));
  return isOutflowTransaction(tx) ? `-${base}` : `+${base}`;
}

/** Whether the transaction moves money OUT of the user's pockets. */
export function isOutflowTransaction(tx: TransactionDto): boolean {
  const direction = tx.subcategoryCode ?? tx.transactionTypeCode;
  return (
    tx.transactionTypeCode === 'EXPENSE' ||
    tx.transactionTypeCode === 'TRANSFER' ||
    (tx.transactionTypeCode === 'LOAN' && direction === 'RECEIVABLE')
  );
}

/** Amount cell class — green inflow, red outflow. */
export function amountCellClass(tx: TransactionDto): string {
  const direction = tx.subcategoryCode ?? tx.transactionTypeCode;
  if (tx.transactionTypeCode === 'TRANSFER') return '';
  return isOutflowTransaction(tx) ? 'text-danger fw-semibold' : 'text-success fw-semibold';
}

/** Amount text for neutral contexts (dashboard, drawers). */
export function formatSignedAmount(tx: TransactionDto): string {
  return signedAmountText(tx);
}

/** Purpose display — LOAN rows show "Given" / "Received" instead of a raw code. */
export function purposeDisplay(tx: TransactionDto, service: TransactionService): string {
  if (tx.transactionTypeCode === 'LOAN') {
    return tx.subcategoryCode === 'PAYABLE' ? 'Received (Loan)' : 'Given (Loan)';
  }
  if (tx.transactionPurposeCode) return service.purposeNameByCode(tx.transactionPurposeCode);
  return '—';
}

/** Person name for LOAN rows, else merchant. */
export function personDisplay(tx: TransactionDto): string {
  return tx.loanUserName || tx.personName || tx.merchant || '—';
}

/** Resolves a TransactionColumnKey to a configured TableColumn cell renderer. */
export function columnRenderer(
  key: TransactionColumnKey,
  service: TransactionService,
): TableColumn<TransactionDto>['cell'] {
  switch (key) {
    case 'date':
      return (tx) => (tx.transactionDate ?? '').slice(0, 10);
    case 'type':
      return (tx) => tx.transactionTypeCode ?? '—';
    case 'purpose':
      return (tx) => purposeDisplay(tx, service);
    case 'person':
      return (tx) => personDisplay(tx);
    case 'wallet':
      return (tx) => {
        if (tx.transactionTypeCode === 'TRANSFER') {
          const source = service.walletName(tx.sourceWalletId ?? tx.walletEntries?.[0]?.sourceWalletId);
          const dest = service.walletName(tx.destinationWalletId ?? tx.walletEntries?.[0]?.destinationWalletId);
          return `${source} → ${dest}`;
        }
        const walletId = tx.walletId ?? tx.walletEntries?.[0]?.walletId;
        return service.walletName(walletId);
      };
    case 'amount':
      return (tx) => {
        const amount = Math.abs(tx.totalAmount ?? 0);
        return isOutflowTransaction(tx) ? -amount : amount;
      };
    case 'status':
      return (tx) => tx.transactionStatusCode ?? '—';
    default:
      return () => '—';
  }
}

/** Builds TableColumn[] for a mode from the spec map. */
export function buildTransactionColumns(mode: TransactionMode, service: TransactionService): TableColumn<TransactionDto>[] {
  return TRANSACTION_COLUMN_SPECS[mode].map((spec) => ({
    key: spec.key,
    label: spec.label,
    sortable: spec.sortable,
    cell: columnRenderer(spec.key, service),
    cellClass: spec.key === 'amount' ? amountCellClass : undefined,
    numberFormat: spec.key === 'amount' ? 'amount' : undefined,
    badge: spec.key === 'type' ? typeBadge : spec.key === 'status' ? statusBadge : undefined,
  }));
}