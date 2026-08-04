import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ValidatorFn } from '@angular/forms';
import { Observable, finalize, map, throwError } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CurrencyInputComponent } from '../../../../shared/components/currency-input/currency-input.component';
import {
  SearchableDropdownComponent,
  SearchableOption,
} from '../../../../shared/components/searchable-dropdown';
import { TransactionService } from '../../services/transaction.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CreateTransactionRequest } from '../../dto/transaction.dto';
import { TransactionMode, TransactionTypeCode } from '../../models/transaction-mode.model';
import { TRANSACTION_TYPES, CREATEABLE_TYPE_CODES } from '../../config/transaction-types.config';
import { TRANSACTION_FORM_FIELDS } from '../../config/transaction-form.config';
import { positiveAmountValidator, getFinanceValidationMessage } from '../../../../shared/validators/finance-validators';
import { formatAmount } from '../../../../shared/utils/money.utils';

interface TransactionFormValue {
  purposeId: number | null;
  subcategoryId: number | null;
  directionId: number | null;
  amount: number | null;
  walletId: number | null;
  sourceWalletId: number | null;
  destinationWalletId: number | null;
  merchant: string;
  personName: string;
  transactionDate: string;
  description: string;
  notes: string;
}

const EMPTY_VALUE: TransactionFormValue = {
  purposeId: null,
  subcategoryId: null,
  directionId: null,
  amount: null,
  walletId: null,
  sourceWalletId: null,
  destinationWalletId: null,
  merchant: '',
  personName: '',
  transactionDate: todayStr(),
  description: '',
  notes: '',
};

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    CurrencyInputComponent,
    SearchableDropdownComponent,
  ],
  template: `
    <div class="container-fluid py-4">
      <app-page-header
        [title]="pageTitle()"
        [subtitle]="activeConfig().subtitle"
        [icon]="activeConfig().pageHeaderIcon"
      >
        <button type="button" class="btn btn-outline-secondary" (click)="cancel()">
          <i class="bi bi-arrow-left me-1"></i>Back
        </button>
      </app-page-header>

      <div class="card shadow-sm">
        <div class="card-body p-4">
          @if (mode() === 'ALL') {
            <div class="mb-4">
              <label class="form-label fw-semibold">Transaction Type</label>
              <div class="d-flex flex-wrap gap-2">
                @for (type of CREATABLE_TYPE_CODES; track type) {
                  <button
                    type="button"
                    class="btn btn-sm"
                    [class.btn-primary]="activeType() === type"
                    [class.btn-outline-secondary]="activeType() !== type"
                    (click)="changeType(type)"
                  >
                    <i class="bi me-1" [class]="typeIcon(type)"></i>{{ typeLabel(type) }}
                  </button>
                }
              </div>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <div class="row g-4">
              @for (field of fields(); track field.name) {
                @switch (field.controlType) {
                  @case ('purpose') {
                    <div class="col-md-6">
                      <label class="form-label">{{ field.label }}</label>
                      <app-searchable-dropdown
                        formControlName="purposeId"
                        [options]="purposeOptions()"
                        [placeholder]="'Select ' + field.label"
                        [invalid]="invalid('purposeId')"
                        [allowCreate]="includePurposeCreate()"
                        [allowDelete]="includePurposeCreate()"
                        [createHandler]="purposeCreateHandler()"
                        [deleteHandler]="purposeDeleteHandler()"
                      />
                      <small class="text-danger">{{ messageFor('purposeId') }}</small>
                    </div>
                  }
                  @case ('wallet') {
                    <div class="col-md-6">
                      <label class="form-label">{{ field.label }}</label>
                      <app-searchable-dropdown
                        [formControlName]="field.name"
                        [options]="walletOptions()"
                        [placeholder]="'Select ' + field.label"
                        [invalid]="invalid(field.name)"
                      />
                      <small class="text-danger">{{ messageFor(field.name) }}</small>
                    </div>
                  }
                  @case ('currency') {
                    <div class="col-md-6">
                      <label class="form-label">Amount</label>
                      <app-currency-input formControlName="amount" [invalid]="invalid('amount')" />
                      <small class="text-danger">{{ messageFor('amount') }}</small>
                      @if (lowBalanceHint()) {
                        <small class="text-warning d-block mt-1">
                          <i class="bi bi-exclamation-triangle me-1"></i>{{ lowBalanceHint() }}
                        </small>
                      }
                    </div>
                  }
                  @case ('date') {
                    <div class="col-md-6">
                      <label class="form-label" for="transactionDate">{{ field.label }}</label>
                      <input
                        id="transactionDate"
                        type="date"
                        class="form-control form-control-lg-custom"
                        formControlName="transactionDate"
                        [class.is-invalid]="invalid('transactionDate')"
                      />
                      <small class="text-danger">{{ messageFor('transactionDate') }}</small>
                    </div>
                  }
                  @case ('select') {
                    <div class="col-md-6">
                      <label class="form-label" [for]="field.name">{{ field.label }}</label>
                      @if (field.optionsSource === 'loanDirections') {
                        <app-searchable-dropdown
                          formControlName="directionId"
                          [options]="directionOptions()"
                          [placeholder]="'Select ' + field.label"
                          [invalid]="invalid(field.name)"
                        />
                      } @else {
                        <app-searchable-dropdown
                          formControlName="subcategoryId"
                          [options]="subcategoryOptions()"
                          [placeholder]="'Select ' + field.label"
                          [invalid]="invalid(field.name)"
                          [allowCreate]="subcategoryCreateEnabled()"
                          [allowDelete]="subcategoryCreateEnabled()"
                          [createHandler]="subcategoryCreateHandler()"
                          [deleteHandler]="subcategoryDeleteHandler()"
                        />
                      }
                      <small class="text-danger">{{ messageFor(field.name) }}</small>
                    </div>
                  }
                  @case ('textarea') {
                    <div class="col-12">
                      <label class="form-label" [for]="field.name">{{ field.label }}</label>
                      <textarea
                        [id]="field.name"
                        class="form-control"
                        rows="2"
                        [formControlName]="field.name"
                        [placeholder]="field.placeholder ?? ''"
                      ></textarea>
                    </div>
                  }
                  @default {
                    <div class="col-md-6">
                      <label class="form-label" [for]="field.name">{{ field.label }}</label>
                      <input
                        [id]="field.name"
                        type="text"
                        class="form-control form-control-lg-custom"
                        [formControlName]="field.name"
                        [placeholder]="field.placeholder ?? ''"
                        [class.is-invalid]="invalid(field.name)"
                      />
                      <small class="text-danger">{{ messageFor(field.name) }}</small>
                    </div>
                  }
                }
              }
            </div>

            <div class="d-flex justify-content-end gap-2 mt-4">
              <button type="button" class="btn btn-outline-secondary" (click)="cancel()">Cancel</button>
              <button type="submit" class="btn btn-primary-gradient" [disabled]="submitting()">
                @if (submitting()) {
                  <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
                }
                <i class="bi bi-check-lg me-1"></i>Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class TransactionFormComponent implements OnInit {
  readonly CREATABLE_TYPE_CODES = CREATEABLE_TYPE_CODES;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  protected readonly service = inject(TransactionService);

  readonly mode = signal<TransactionMode>('ALL');
  readonly activeType = signal<TransactionTypeCode>('INCOME');
  readonly submitting = signal(false);

  readonly activeConfig = computed(() =>
    this.mode() === 'ALL'
      ? TRANSACTION_TYPES[this.activeType()]
      : TRANSACTION_TYPES[this.mode()],
  );

  readonly fields = computed(() => TRANSACTION_FORM_FIELDS[this.activeType()].fields);

  readonly pageTitle = computed(
    () => `New ${this.mode() === 'ALL' ? 'Transaction' : this.activeConfig().title}`,
  );

  form!: FormGroup;

  typeLabel(type: TransactionTypeCode): string {
    return TRANSACTION_TYPES[type].title;
  }

  typeIcon(type: TransactionTypeCode): string {
    return TRANSACTION_TYPES[type].pageHeaderIcon;
  }

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      const mode = (data['mode'] as TransactionMode) ?? 'ALL';
      this.mode.set(mode);
      const typeCode = TRANSACTION_TYPES[mode].transactionTypeCode;
      if (typeCode) this.activeType.set(typeCode);
    });
    this.service.loadMasterData();
    this.service.loadWallets().subscribe();
    this.buildForm();
  }

  changeType(type: TransactionTypeCode): void {
    this.activeType.set(type);
    this.buildForm();
  }

  buildForm(): void {
    const isLoan = this.activeType() === 'LOAN';
    const isTransfer = this.activeType() === 'TRANSFER';

    this.form = this.fb.group(
      { ...EMPTY_VALUE, transactionDate: todayStr() },
      { validators: isTransfer ? [differentWalletsValidator()] : [] },
    );
    this.applyValidators(isLoan, isTransfer);
    this.form.get('purposeId')?.valueChanges.subscribe(() => this.form.get('subcategoryId')?.setValue(null));
  }

  /** Options for the purpose dropdown — LOAN uses its direction subcategories there too. */
  purposeOptions(): SearchableOption<number>[] {
    const items = this.activeType() === 'LOAN' ? this.service.loanDirections() : this.service.purposesForType(this.activeType());
    return items.map((p) => ({ value: p.id, name: p.name ?? p.code, deletable: p.userId != null }));
  }

  /** Options for the wallet dropdown (active wallets only, balance as subtitle). */
  walletOptions(): SearchableOption<number>[] {
    return (this.service.wallets() ?? [])
      .filter((w) => w.status === 'ACTIVE')
      .map((w) => ({
        value: w.id,
        name: w.walletName,
        subtitle: formatAmount(w.currentBalance ?? 0, w.currency),
        deletable: false,
      }));
  }

  /** LOAN direction (system subcategories) — search/select only. */
  directionOptions(): SearchableOption<number>[] {
    return this.service.loanDirections().map((d) => ({
      value: d.id,
      name: d.name ?? d.code,
      deletable: d.userId != null,
    }));
  }

  /** Expense sub-categories of the currently selected purpose. */
  subcategoryOptions(): SearchableOption<number>[] {
    const purposeId = (this.form?.get('purposeId')?.value as number | null) ?? null;
    return this.service.purposeSubcategories(purposeId).map((s) => ({
      value: s.id,
      name: s.name ?? s.code,
      deletable: s.userId != null,
    }));
  }

  /** Only Income Type and Expense Category are creatable (LOAN uses system directions). */
  includePurposeCreate(): boolean {
    return this.activeType() === 'INCOME' || this.activeType() === 'EXPENSE';
  }

  /** Expense sub-category is creatable once a purpose is selected. */
  subcategoryCreateEnabled(): boolean {
    return (
      this.activeType() === 'EXPENSE' &&
      (this.form?.get('purposeId')?.value as number | null) != null
    );
  }

  purposeCreateHandler(): (term: string) => Observable<SearchableOption<number>> {
    return (term) => {
      const typeId = this.service.transactionTypeId(this.activeType()) ?? 0;
      return this.service
        .createPurpose({ transactionTypeId: typeId, name: term })
        .pipe(map((p) => ({ value: p.id, name: p.name ?? p.code, deletable: true })));
    };
  }

  purposeDeleteHandler(): (option: SearchableOption<number>) => Observable<void> {
    return (option) => this.service.deletePurpose(Number(option.value));
  }

  subcategoryCreateHandler(): (term: string) => Observable<SearchableOption<number>> {
    return (term) => {
      const purposeId = (this.form?.get('purposeId')?.value as number | null) ?? null;
      if (purposeId == null) {
        this.toast.error('Select an expense category first');
        return throwError(() => new Error('No purpose selected'));
      }
      return this.service
        .createSubcategory(purposeId, { name: term })
        .pipe(map((s) => ({ value: s.id, name: s.name ?? s.code, deletable: true })));
    };
  }

  subcategoryDeleteHandler(): (option: SearchableOption<number>) => Observable<void> {
    return (option) => this.service.deleteSubcategory(Number(option.value));
  }

  private applyValidators(isLoan: boolean, isTransfer: boolean): void {
    const set = (name: string, validators: ValidatorFn | ValidatorFn[] | null): void => {
      const control = this.form.get(name);
      if (!control) return;
      control.setValidators(validators);
      control.updateValueAndValidity({ emitEvent: false });
    };

    set('purposeId', this.fields().some((f) => f.name === 'purposeId') ? [Validators.required] : null);
    set('directionId', isLoan ? [Validators.required] : null);
    set('personName', isLoan ? [Validators.required] : null);
    set('walletId', !isTransfer ? [Validators.required] : null);
    set('sourceWalletId', isTransfer ? [Validators.required] : null);
    set('destinationWalletId', isTransfer ? [Validators.required] : null);
    set('amount', [Validators.required, positiveAmountValidator]);
  }

  /** Expense hint: warn when the amount exceeds the selected wallet balance. */
  lowBalanceHint(): string | null {
    if (this.activeType() !== 'EXPENSE') return null;
    const walletId = (this.form?.get('walletId')?.value as number | null) ?? null;
    const amount = (this.form?.get('amount')?.value as number | null) ?? null;
    if (!walletId || !amount) return null;
    const wallet = this.service.walletById(walletId);
    if (!wallet || wallet.currentBalance >= amount) return null;
    return `Amount exceeds ${wallet.walletName} balance (${wallet.currentBalance}).`;
  }

  invalid(name: string): boolean {
    const control = this.form?.get(name);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  messageFor(name: string): string | null {
    const control = this.form?.get(name);
    if (!control || !this.invalid(name)) return null;
    return getFinanceValidationMessage(control.errors);
  }

  cancel(): void {
    void this.router.navigate([listPath(this.mode())]);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const type = this.activeType();
    const v = this.form.value;
    this.submitting.set(true);

    const isLoan = type === 'LOAN';
    const isTransfer = type === 'TRANSFER';

    const request: CreateTransactionRequest = {
      transactionTypeId: this.service.transactionTypeId(type) ?? 0,
      transactionPurposeId: isLoan
        ? (this.service.master()?.transactionPurposes.find((p) => p.code === 'LOAN')?.id ?? 0)
        : isTransfer
          ? (this.service.master()?.transactionPurposes.find((p) => p.code === 'WALLET_TRANSFER')?.id ?? 0)
          : (v.purposeId ?? 0),
      transactionSubcategoryId: isLoan ? (v.directionId ?? undefined) : (v.subcategoryId ?? undefined),
      transactionStatusId: this.service.statusId('COMPLETED') ?? 0,
      totalAmount: v.amount ?? 0,
      transactionDate: `${v.transactionDate}T00:00:00`,
      description: v.description || undefined,
      notes: v.notes || undefined,
      personName: isLoan ? v.personName : undefined,
      walletEntries: isTransfer
        ? [
            {
              sourceWalletId: v.sourceWalletId ?? undefined,
              destinationWalletId: v.destinationWalletId ?? undefined,
              amount: v.amount ?? 0,
            },
          ]
        : [
            {
              walletId: v.walletId ?? undefined,
              amount: v.amount ?? 0,
              merchant: v.merchant || undefined,
            },
          ],
    };

    this.service
      .createTransaction(request)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => void this.router.navigate([listPath(this.mode())]),
        error: () => undefined,
      });
  }
}

function listPath(mode: TransactionMode): string {
  return mode === 'ALL' ? '/transactions' : `/${mode.toLowerCase()}`;
}

/** Transfer rule: From and To must differ. */
function differentWalletsValidator(): ValidatorFn {
  return (group) => {
    const src = group.get('sourceWalletId')?.value;
    const dst = group.get('destinationWalletId')?.value;
    if (src != null && src === dst) return { transferWalletMismatch: true };
    return null;
  };
}