import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, tap, map, catchError, throwError, finalize, forkJoin } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app.config';
import { ApiResponse } from '../../auth/dto/response/api-response.dto';
import { ToastService } from '../../../core/services/toast.service';
import { TRANSACTION_API } from '../api/transaction.api';
import { MasterDataDto, PurposeWithSubcategories, SimpleMasterItem } from '../dto/master-data.dto';
import { WalletDto, WalletRequest, WalletTypeDto, WalletTypeRequest } from '../dto/wallet.dto';
import { CreateTransactionRequest, TransactionDto } from '../dto/transaction.dto';
import { BudgetDto, BudgetRequest } from '../dto/budget.dto';
import { LedgerEntryDto, LoanHistoryDto, LoanHistoryFilter, LoanTotalsDto, LoanUserDto, LoanUserRequest } from '../dto/loan.dto';
import { PurposeCreatedItem, PurposeRequest, SubcategoryRequest } from '../dto/purpose.dto';
import { TransactionTypeCode } from '../models/transaction-mode.model';
import { COMPLETED_STATUS_CODE, PURPOSE_CODES_BY_TYPE, TRANSACTION_TYPE_CODES } from '../constants/transaction.constants';
import { PAGE_SIZE_ALL, PageResponse } from '../../../shared/dto/page-response.dto';

export interface ApiErrorShape {
  message: string;
  code: string | null;
  status: number;
}

/** Filter payload for the server-side transaction list (mirrors backend TransactionFilter). */
export interface TransactionListParams {
  page?: number;
  size?: number;
  type?: string;
  status?: string;
  purpose?: string;
  subcategory?: string;
  from?: string;
  to?: string;
  walletId?: number | null;
  search?: string;
}/**
 * THE single finance data service (Section 12).
 * WHY: master data, wallets, transactions, budgets and loan users are shared,
 * high-frequency state — one service exposes signals and all mutations; no
 * feature owns a duplicate data service.
 */
@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  private readonly baseUrl = APP_CONFIG.apiBaseUrl;

  private readonly _masterData = signal<MasterDataDto | null>(null);
  private readonly _wallets = signal<WalletDto[]>([]);
  private readonly _transactions = signal<TransactionDto[]>([]);
  private readonly _transactionsPage = signal<PageResponse<TransactionDto> | null>(null);
  private readonly _budgets = signal<BudgetDto[]>([]);
  private readonly _budgetsMonth = signal<string>('');
  private readonly _loanUsers = signal<LoanUserDto[]>([]);
  private readonly _walletTypes = signal<WalletTypeDto[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _loadError = signal<string | null>(null);

  readonly masterData = this._masterData.asReadonly();
  readonly wallets = this._wallets.asReadonly();
  readonly transactions = this._transactions.asReadonly();
  readonly transactionsPage = this._transactionsPage.asReadonly();
  readonly budgets = this._budgets.asReadonly();
  readonly budgetsMonth = this._budgetsMonth.asReadonly();
  readonly loanUsers = this._loanUsers.asReadonly();
  readonly walletTypes = this._walletTypes.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly loadError = this._loadError.asReadonly();

  // ------------------------------------------------------------------
  // Master data
  // ------------------------------------------------------------------

  /** Loads master data once unless force=true (used to refresh after dropdown creates). */
  loadMasterData(force = false): void {
    if (!force && this._masterData()) return;
    this.http
      .get<ApiResponse<MasterDataDto>>(`${this.baseUrl}${TRANSACTION_API.MASTER}`)
      .pipe(
        tap((res) => {
          if (res.success && res.data) this._masterData.set(res.data);
        }),
        catchError((err) => this.handleError(err, 'Failed to load reference data')),
      )
      .subscribe();
  }

  master(): MasterDataDto | null {
    return this._masterData();
  }

  /** Resolves a transaction type id from master data by code — never hardcoded. */
  transactionTypeId(code: TransactionTypeCode): number | undefined {
    const item = this._masterData()?.transactionTypes.find((t) => t.code === code);
    return item?.id;
  }

  /** Resolves a status id by code (default COMPLETED). */
  statusId(code = COMPLETED_STATUS_CODE): number | undefined {
    return this._masterData()?.transactionStatuses.find((s) => s.code === code)?.id;
  }

  /**
   * Purposes for a transaction type, resolved via the backend-provided
   * transactionTypeId (includes user-created income types / expense categories).
   * Falls back to seed codes only when master data lacks the type link.
   */
  purposesForType(type: TransactionTypeCode): PurposeWithSubcategories[] {
    const master = this._masterData();
    const items = master?.transactionPurposes ?? [];
    const typeId = this.transactionTypeId(type);
    if (typeId != null) {
      const byType = items.filter((p) => p.transactionTypeId === typeId);
      if (byType.length > 0) return byType;
    }
    const allowed = PURPOSE_CODES_BY_TYPE[type] ?? [];
    return items.filter((p) => allowed.includes(p.code));
  }

  purposeById(id: number | null | undefined): SimpleMasterItem | undefined {
    if (id == null) return undefined;
    return (this._masterData()?.transactionPurposes ?? []).find((p) => p.id === id);
  }

  purposeNameByCode(code: string | null | undefined): string {
    if (!code) return '—';
    return this._masterData()?.transactionPurposes.find((p) => p.code === code)?.name ?? code;
  }

  /** Subcategories of one purpose (e.g. EXPENSE subcategories) by purpose id. */
  purposeSubcategories(id: number | null | undefined): SimpleMasterItem[] {
    if (id == null) return [];
    return this._masterData()?.transactionPurposes.find((p) => p.id === id)?.subcategories ?? [];
  }

  /** Subcategories (e.g. LOAN direction RECEIVABLE/PAYABLE) from the LOAN purpose. */
  loanDirections(): SimpleMasterItem[] {
    return (this._masterData()?.transactionPurposes ?? []).find((p) => p.code === 'LOAN')?.subcategories ?? [];
  }

  // ------------------------------------------------------------------
  // Wallets
  // ------------------------------------------------------------------

  loadWallets(): Observable<void> {
    return this.http
      .get<ApiResponse<PageResponse<WalletDto>>>(`${this.baseUrl}${TRANSACTION_API.WALLETS}`, listParams(0, PAGE_SIZE_ALL))
      .pipe(
        tap((res) => {
          if (res.success && res.data?.content) this._wallets.set(res.data.content);
        }),
        map(() => undefined),
        catchError((err) => this.handleError(err, 'Failed to load wallets')),
        finalize(() => this._isLoading.set(false)),
      );
  }

  createWallet(request: WalletRequest): Observable<WalletDto> {
    return this.http.post<ApiResponse<WalletDto>>(`${this.baseUrl}${TRANSACTION_API.WALLETS}`, request).pipe(
      map((res) => {
        if (res.success) {
          this.toast.success(res.message || 'Wallet created');
          this.refreshWallets();
        }
        return res.data!;
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  updateWallet(id: number, request: WalletRequest): Observable<WalletDto> {
    return this.http.put<ApiResponse<WalletDto>>(`${this.baseUrl}${TRANSACTION_API.wallet(id)}`, request).pipe(
      map((res) => {
        if (res.success) {
          this.toast.success(res.message || 'Wallet updated');
          this.refreshWallets();
        }
        return res.data!;
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  closeWallet(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}${TRANSACTION_API.wallet(id)}`).pipe(
      map((res) => {
        if (res.success) {
          this.toast.success(res.message || 'Wallet closed');
          this.refreshWallets();
        }
        return undefined;
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  walletName(id: number | null | undefined): string {
    if (id == null) return '—';
    return this._wallets().find((w) => w.id === id)?.walletName ?? `Wallet #${id}`;
  }

  walletById(id: number | null | undefined): WalletDto | undefined {
    if (id == null) return undefined;
    return this._wallets().find((w) => w.id === id);
  }

  private refreshWallets(): void {
    this.loadWallets().subscribe();
  }

  // ------------------------------------------------------------------
  // Wallet types
  // ------------------------------------------------------------------

  loadWalletTypes(): Observable<WalletTypeDto[]> {
    return this.http
      .get<ApiResponse<WalletTypeDto[]>>(`${this.baseUrl}${TRANSACTION_API.WALLET_TYPES}`)
      .pipe(
        map((res) => {
          if (res.success && Array.isArray(res.data)) {
            this._walletTypes.set(res.data);
            return res.data;
          }
          return [];
        }),
        catchError((err) => this.handleError(err, 'Failed to load wallet types')),
      );
  }

  createWalletType(request: WalletTypeRequest): Observable<WalletTypeDto> {
    return this.http
      .post<ApiResponse<WalletTypeDto>>(`${this.baseUrl}${TRANSACTION_API.WALLET_TYPES}`, request)
      .pipe(
        map((res) => {
          if (res.success && res.data) {
            this.toast.success(res.message || 'Wallet type created');
            this.refreshWalletTypes();
            const item = res.data!;
            this.updateMaster((m) => ({
              ...m,
              walletTypes: [...m.walletTypes, itemToMasterItem(item)],
            }));
          }
          return res.data!;
        }),
        catchError((err) => this.handleError(err)),
      );
  }

  updateWalletType(id: number, request: WalletTypeRequest): Observable<WalletTypeDto> {
    return this.http
      .put<ApiResponse<WalletTypeDto>>(`${this.baseUrl}${TRANSACTION_API.walletType(id)}`, request)
      .pipe(
        map((res) => {
          if (res.success && res.data) {
            this.toast.success(res.message || 'Wallet type updated');
            this.refreshWalletTypes();
            const item = res.data!;
            this.updateMaster((m) => ({
              ...m,
              walletTypes: m.walletTypes.map((t) => (t.id === item.id ? itemToMasterItem(item) : t)),
            }));
          }
          return res.data!;
        }),
        catchError((err) => this.handleError(err)),
      );
  }

  deleteWalletType(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}${TRANSACTION_API.walletType(id)}`).pipe(
      map((res) => {
        if (res.success) {
          this.toast.success(res.message || 'Wallet type deleted');
          this.refreshWalletTypes();
          this.updateMaster((m) => ({
            ...m,
            walletTypes: m.walletTypes.filter((t) => t.id !== id),
          }));
        }
        return undefined;
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  private refreshWalletTypes(): void {
    this.loadWalletTypes().subscribe();
  }

  // ------------------------------------------------------------------
  // Purposes & subcategories (creatable dropdowns)
  // ------------------------------------------------------------------

  /**
   * Creates a user-owned purpose (income type / expense category / budget
   * category) and adds it to master data in place — no full reload needed.
   */
  createPurpose(request: PurposeRequest): Observable<PurposeCreatedItem> {
    return this.http
      .post<ApiResponse<PurposeCreatedItem>>(`${this.baseUrl}${TRANSACTION_API.PURPOSES}`, request)
      .pipe(
        map((res) => {
          if (res.success && res.data) {
            this.toast.success(res.message || 'Purpose created');
            // Rule: after a create POST, fetch the GET list so the dropdown stays fresh.
            this.loadMasterData(true);
          }
          return res.data!;
        }),
        catchError((err) => this.handleError(err)),
      );
  }

  /** Soft-deletes a user purpose and refreshes master data in place. */
  deletePurpose(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}${TRANSACTION_API.purpose(id)}`).pipe(
      map((res) => {
        if (res.success) {
          this.toast.success(res.message || 'Purpose deleted');
          this.loadMasterData(true);
        }
        return undefined;
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  /**
   * Creates a user-owned subcategory under a purpose (expense sub-category)
   * and appends it to that purpose's subcategory list in place.
   */
  createSubcategory(purposeId: number, request: SubcategoryRequest): Observable<PurposeCreatedItem> {
    return this.http
      .post<ApiResponse<PurposeCreatedItem>>(
        `${this.baseUrl}${TRANSACTION_API.purposeSubcategories(purposeId)}`,
        request,
      )
      .pipe(
        map((res) => {
          if (res.success && res.data) {
            this.toast.success(res.message || 'Sub-category created');
            // Rule: after a create POST, fetch the GET list so the dropdown stays fresh.
            this.loadMasterData(true);
          }
          return res.data!;
        }),
        catchError((err) => this.handleError(err)),
      );
  }

  /** Soft-deletes a user subcategory and refreshes master data. */
  deleteSubcategory(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}${TRANSACTION_API.subcategory(id)}`)
      .pipe(
        map((res) => {
          if (res.success) {
            this.toast.success(res.message || 'Sub-category deleted');
            this.loadMasterData(true);
          }
          return undefined;
        }),
        catchError((err) => this.handleError(err)),
      );
  }

  /** Mutates the cached master data in place (immutable signal update). */
  private updateMaster(updater: (master: MasterDataDto) => MasterDataDto): void {
    const master = this._masterData();
    if (!master) return;
    this._masterData.set(updater(master));
  }  // ------------------------------------------------------------------
  // Transactions
  // ------------------------------------------------------------------

  loadTransactions(): Observable<void> {
    this._isLoading.set(true);
    this._loadError.set(null);
    return this.http
      .get<ApiResponse<PageResponse<TransactionDto>>>(`${this.baseUrl}${TRANSACTION_API.TRANSACTIONS}`, listParams(0, PAGE_SIZE_ALL))
      .pipe(
        tap((res) => {
          if (res.success && res.data?.content) this._transactions.set(res.data.content);
        }),
        map(() => undefined),
        catchError((err) => this.handleError(err, 'Failed to load transactions')),
        finalize(() => this._isLoading.set(false)),
      );
  }

  /** Loads one server-side page with the optional filters (transaction list page). */
  loadTransactionsPage(params: TransactionListParams = {}): Observable<PageResponse<TransactionDto>> {
    this._isLoading.set(true);
    this._loadError.set(null);
    const page = params.page ?? 0;
    const size = params.size ?? 20;
    const extras = {
      type: params.type ?? '',
      status: params.status ?? '',
      purpose: params.purpose ?? '',
      subcategory: params.subcategory ?? '',
      from: params.from ?? '',
      to: params.to ?? '',
      walletId: params.walletId ?? '',
      search: params.search ?? '',
    };
    return this.http
      .get<ApiResponse<PageResponse<TransactionDto>>>(`${this.baseUrl}${TRANSACTION_API.TRANSACTIONS}`, listParams(page, size, extras))
      .pipe(
        tap((res) => {
          if (res.success && res.data) this._transactionsPage.set(res.data);
        }),
        map((res) => res.data ?? emptyPage<TransactionDto>()),
        catchError((err) => this.handleError(err, 'Failed to load transactions')),
        finalize(() => this._isLoading.set(false)),
      );
  }

  /** Fetches ALL rows matching the current filters for CSV export (does not touch page state). */
  exportTransactionsPage(params: TransactionListParams = {}): Observable<TransactionDto[]> {
    const extras = {
      type: params.type ?? '',
      status: params.status ?? '',
      purpose: params.purpose ?? '',
      subcategory: params.subcategory ?? '',
      from: params.from ?? '',
      to: params.to ?? '',
      walletId: params.walletId ?? '',
      search: params.search ?? '',
    };
    return this.http
      .get<ApiResponse<PageResponse<TransactionDto>>>(`${this.baseUrl}${TRANSACTION_API.TRANSACTIONS}`, listParams(0, PAGE_SIZE_ALL, extras))
      .pipe(
        map((res) => res.data?.content ?? []),
        catchError((err) => this.handleError(err, 'Failed to export transactions')),
      );
  }

  loadTransaction(id: number): Observable<TransactionDto> {
    return this.http
      .get<ApiResponse<TransactionDto>>(`${this.baseUrl}${TRANSACTION_API.transaction(id)}`)
      .pipe(
        map((res) => res.data!),
        catchError((err) => this.handleError(err)),
      );
  }

  loadLedger(id: number): Observable<LedgerEntryDto[]> {
    return this.http
      .get<ApiResponse<LedgerEntryDto[]>>(`${this.baseUrl}${TRANSACTION_API.transactionLedger(id)}`)
      .pipe(
        map((res) => res.data ?? []),
        catchError((err) => this.handleError(err)),
      );
  }

  createTransaction(request: CreateTransactionRequest): Observable<TransactionDto> {
    return this.http
      .post<ApiResponse<TransactionDto>>(`${this.baseUrl}${TRANSACTION_API.TRANSACTIONS}`, request)
      .pipe(
        map((res) => {
          if (res.success) {
            this.toast.success(res.message || 'Transaction created');
            this.afterMutation();
          }
          return res.data!;
        }),
        catchError((err) => this.handleError(err)),
      );
  }

  // ------------------------------------------------------------------
  // Budgets
  // ------------------------------------------------------------------

  loadBudgets(month: string): Observable<void> {
    this._isLoading.set(true);
    this._budgetsMonth.set(month);
    return this.http
      .get<ApiResponse<PageResponse<BudgetDto>>>(`${this.baseUrl}${TRANSACTION_API.BUDGETS}`, listParams(0, PAGE_SIZE_ALL, { month }))
      .pipe(
        tap((res) => {
          if (res.success && res.data?.content) this._budgets.set(res.data.content);
        }),
        map(() => undefined),
        catchError((err) => this.handleError(err, 'Failed to load budgets')),
        finalize(() => this._isLoading.set(false)),
      );
  }

  createBudget(request: BudgetRequest): Observable<BudgetDto> {
    return this.http.post<ApiResponse<BudgetDto>>(`${this.baseUrl}${TRANSACTION_API.BUDGETS}`, request).pipe(
      map((res) => {
        if (res.success) {
          this.toast.success(res.message || 'Budget created');
          this.refreshBudgets();
        }
        return res.data!;
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  updateBudget(id: number, request: BudgetRequest): Observable<BudgetDto> {
    return this.http.put<ApiResponse<BudgetDto>>(`${this.baseUrl}${TRANSACTION_API.budget(id)}`, request).pipe(
      map((res) => {
        if (res.success) {
          this.toast.success(res.message || 'Budget updated');
          this.refreshBudgets();
        }
        return res.data!;
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  deleteBudget(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}${TRANSACTION_API.budget(id)}`).pipe(
      map((res) => {
        if (res.success) {
          this.toast.success(res.message || 'Budget deleted');
          this.refreshBudgets();
        }
        return undefined;
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  private refreshBudgets(): void {
    const month = this._budgetsMonth();
    if (month) this.loadBudgets(month).subscribe();
  }

  // ------------------------------------------------------------------
  // Loan users
  // ------------------------------------------------------------------

  loadLoanUsers(): Observable<void> {
    return this.http
      .get<ApiResponse<PageResponse<LoanUserDto>>>(`${this.baseUrl}${TRANSACTION_API.LOAN_USERS}`, listParams(0, PAGE_SIZE_ALL))
      .pipe(
        tap((res) => {
          if (res.success && res.data?.content) this._loanUsers.set(res.data.content);
        }),
        map(() => undefined),
        catchError((err) => this.handleError(err, 'Failed to load loan users')),
      );
  }

  createLoanUser(request: LoanUserRequest): Observable<LoanUserDto> {
    return this.http.post<ApiResponse<LoanUserDto>>(`${this.baseUrl}${TRANSACTION_API.LOAN_USERS}`, request).pipe(
      map((res) => {
        if (res.success) {
          this.toast.success(res.message || 'Loan user created');
          this.refreshLoanUsers();
        }
        return res.data!;
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  updateLoanUser(id: number, request: LoanUserRequest): Observable<LoanUserDto> {
    return this.http.put<ApiResponse<LoanUserDto>>(`${this.baseUrl}${TRANSACTION_API.loanUser(id)}`, request).pipe(
      map((res) => {
        if (res.success) {
          this.toast.success(res.message || 'Loan user updated');
          this.refreshLoanUsers();
        }
        return res.data!;
      }),
      catchError((err) => this.handleError(err)),
    );
  }

  loadLoanHistory(id: number): Observable<LoanHistoryDto[]> {
    return this.http
      .get<ApiResponse<PageResponse<LoanHistoryDto>>>(`${this.baseUrl}${TRANSACTION_API.loanUserHistory(id)}`, listParams(0, PAGE_SIZE_ALL))
      .pipe(
        map((res) => res.data?.content ?? []),
        catchError((err) => this.handleError(err)),
      );
  }

  /**
   * Combined loan history with optional per-user / status / date filters.
   * Returns the full matching set (client-side table pagination).
   */
  loadFilteredLoanHistory(filter: LoanHistoryFilter = {}): Observable<LoanHistoryDto[]> {
    const params = listParams(0, PAGE_SIZE_ALL, {
      loanUserId: filter.loanUserId ?? '',
      status: filter.status ?? '',
      from: filter.from ?? '',
      to: filter.to ?? '',
    });
    return this.http
      .get<ApiResponse<PageResponse<LoanHistoryDto>>>(`${this.baseUrl}${TRANSACTION_API.LOAN_HISTORY}`, params)
      .pipe(
        map((res) => res.data?.content ?? []),
        catchError((err) => this.handleError(err)),
      );
  }

  /** Aggregate receivable/payable exposure across all loan users. */
  loadLoanTotals(): Observable<LoanTotalsDto | null> {
    return this.http.get<ApiResponse<LoanTotalsDto>>(`${this.baseUrl}${TRANSACTION_API.LOAN_TOTALS}`).pipe(
      map((res) => (res.success && res.data ? res.data : null)),
      catchError((err) => this.handleError(err)),
    );
  }

  private refreshLoanUsers(): void {
    this.loadLoanUsers().subscribe();
  }

  // ------------------------------------------------------------------
  // Batch helpers
  // ------------------------------------------------------------------

  /** Loads everything the dashboard needs in one pass. */
  loadDashboardData(month: string): Observable<unknown> {
    this.loadMasterData();
    return forkJoin([this.loadWallets(), this.loadTransactions(), this.loadBudgets(month)]);
  }

  private afterMutation(): void {
    forkJoin([this.loadWallets(), this.loadTransactions()]).subscribe();
  }

  // ------------------------------------------------------------------
  // Error mapping (mirrors AuthenticationService pattern)
  // ------------------------------------------------------------------

  private handleError(error: unknown, fallback?: string): Observable<never> {
    let message = fallback ?? 'Something went wrong. Please try again.';
    let code: string | null = null;
    let status = 0;

    if (error instanceof HttpErrorResponse) {
      status = error.status;
      const body = error.error as Partial<ApiResponse<unknown>> | null;
      if (body?.message) message = body.message;
      if (body?.code) code = body.code;
      if (status === 0) message = 'Cannot reach server. Check your connection.';
    }

    this.toast.error(message);
    return throwError(() => ({ message, code, status } satisfies ApiErrorShape));
  }
}

/** Maps a WalletTypeDto to the master-data SimpleMasterItem shape. */
function itemToMasterItem(item: WalletTypeDto): SimpleMasterItem {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    description: item.description ?? undefined,
    active: item.active,
    userId: item.userId ?? null,
  };
}

/** Builds HttpParams for a list endpoint (page/size always sent, extras merged). */
function listParams(page: number | undefined, size: number | undefined, extra?: Record<string, string | number>): { params: HttpParams } {
  let params = new HttpParams();
  if (page != null) params = params.set('page', String(page));
  if (size != null) params = params.set('size', String(size));
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    }
  }
  return { params };
}

/** Fallback empty page so endpoints that temporarily fail don't break TS null checks. */
function emptyPage<T>(): PageResponse<T> {
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    pageNumber: 0,
    pageSize: 0,
    first: true,
    last: true,
    empty: true,
  };
}