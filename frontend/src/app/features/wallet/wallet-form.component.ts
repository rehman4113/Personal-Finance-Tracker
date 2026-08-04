import { Component, input, inject, signal, effect, model } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { CurrencyInputComponent } from '../../shared/components/currency-input/currency-input.component';
import {
  SearchableDropdownComponent,
  SearchableOption,
} from '../../shared/components/searchable-dropdown';
import { TransactionService } from '../transaction/services/transaction.service';
import { WalletDto, WalletRequest } from '../transaction/dto/wallet.dto';
import { getFinanceValidationMessage } from '../../shared/validators/finance-validators';

export interface WalletFormResult {
  id?: number;
  request: WalletRequest;
}

@Component({
  selector: 'app-wallet-form',
  standalone: true,
  imports: [ModalComponent, ReactiveFormsModule, CurrencyInputComponent, SearchableDropdownComponent],
  template: `
    <app-modal [(open)]="open" [title]="wallet() ? 'Edit Wallet' : 'Create Wallet'" size="lg">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="walletTypeId">Wallet Type</label>
            <app-searchable-dropdown
              formControlName="walletTypeId"
              [options]="walletTypeOptions()"
              placeholder="Select type"
              [invalid]="invalid('walletTypeId')"
              [allowCreate]="true"
              [allowDelete]="true"
              [createHandler]="walletTypeCreateHandler()"
              [deleteHandler]="walletTypeDeleteHandler()"
            />
            <small class="text-danger">{{ messageFor('walletTypeId') }}</small>
          </div>

          <div class="col-md-6">
            <label class="form-label" for="walletName">Wallet Name</label>
            <input
              id="walletName"
              type="text"
              class="form-control form-control-lg-custom"
              formControlName="walletName"
              placeholder="e.g. Main Cash"
              [class.is-invalid]="invalid('walletName')"
            />
            <small class="text-danger">{{ messageFor('walletName') }}</small>
          </div>

          <div class="col-md-4">
            <label class="form-label" for="currency">Currency</label>
            <app-searchable-dropdown
              formControlName="currency"
              [options]="currencyOptions()"
              placeholder="Select currency"
            />
          </div>

          @if (!wallet()) {
            <div class="col-md-4">
              <label class="form-label">Initial Balance</label>
              <app-currency-input formControlName="initialBalance" [invalid]="invalid('initialBalance')" />
              <small class="text-danger">{{ messageFor('initialBalance') }}</small>
            </div>
          }

          <div class="col-md-4">
            <label class="form-label" for="accountNumber">Account Number</label>
            <input
              id="accountNumber"
              type="text"
              class="form-control form-control-lg-custom"
              formControlName="accountNumber"
              placeholder="Optional"
            />
          </div>

          <div class="col-12">
            <label class="form-label" for="description">Description</label>
            <input
              id="description"
              type="text"
              class="form-control form-control-lg-custom"
              formControlName="description"
              placeholder="Optional note about this wallet"
            />
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-4">
          <button type="button" class="btn btn-outline-secondary" (click)="onCancel()">Cancel</button>
          <button type="submit" class="btn btn-primary-gradient" [disabled]="submitting()">
            @if (submitting()) {
              <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            }
            <i class="bi bi-check-lg me-1"></i>{{ wallet() ? 'Save Changes' : 'Create Wallet' }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class WalletFormComponent {
  readonly wallet = input<WalletDto | null>(null);
  readonly open = model(false);

  protected readonly service = inject(TransactionService);
  private readonly fb = inject(FormBuilder);

  readonly CURRENCIES = [
    { code: 'PKR', label: 'Pakistani Rupee' },
    { code: 'USD', label: 'US Dollar' },
    { code: 'EUR', label: 'Euro' },
    { code: 'GBP', label: 'British Pound' },
    { code: 'AED', label: 'UAE Dirham' },
    { code: 'SAR', label: 'Saudi Riyal' },
  ];

  readonly submitting = signal(false);

  form!: FormGroup;

  /** Wallet types: user-created ones are deletable (system defaults are not). */
  walletTypeOptions(): SearchableOption<number>[] {
    return (this.service.master()?.walletTypes ?? []).map((t) => ({
      value: t.id,
      name: t.name ?? t.code,
      deletable: t.userId != null,
    }));
  }

  currencyOptions(): SearchableOption<string>[] {
    return this.CURRENCIES.map((c) => ({ value: c.code, name: `${c.code} — ${c.label}` }));
  }

  /** Creates a wallet type from the typed label; code derived as SCREAMING_SNAKE. */
  walletTypeCreateHandler(): (term: string) => Observable<SearchableOption<number>> {
    return (term) => {
      const code = term
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      return this.service
        .createWalletType({ code, name: term })
        .pipe(map((t) => ({ value: t.id, name: t.name, deletable: true })));
    };
  }

  walletTypeDeleteHandler(): (option: SearchableOption<number>) => Observable<void> {
    return (option) => this.service.deleteWalletType(Number(option.value));
  }

  constructor() {
    this.form = this.fb.group({
      walletTypeId: [null, Validators.required],
      walletName: ['', Validators.required],
      currency: ['PKR', Validators.required],
      initialBalance: [null],
      accountNumber: [''],
      description: [''],
    });
    effect(() => {
      const wallet = this.wallet();
      const patchIfPristine = (name: string, value: unknown): void => {
        const control = this.form.get(name);
        if (control && control.pristine) control.setValue(value);
      };
      if (wallet) {
        patchIfPristine('walletName', wallet.walletName);
        patchIfPristine('currency', wallet.currency);
        patchIfPristine('accountNumber', wallet.accountNumber ?? '');
        patchIfPristine('description', wallet.description ?? '');
        const type = this.service.master()?.walletTypes.find((t) => t.code === wallet.walletTypeCode);
        const typeControl = this.form.get('walletTypeId');
        if (type && typeControl && (typeControl.pristine || typeControl.value == null)) {
          typeControl.setValue(type.id);
        }
      } else {
        this.form.reset({ currency: 'PKR', initialBalance: null });
      }
    });
  }

  invalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  messageFor(name: string): string | null {
    const control = this.form.get(name);
    if (!control || !this.invalid(name)) return null;
    return getFinanceValidationMessage(control.errors);
  }

  onCancel(): void {
    this.open.set(false);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    const request: WalletRequest = {
      walletTypeId: v.walletTypeId as number,
      walletName: v.walletName as string,
      currency: v.currency as string,
      initialBalance: v.initialBalance ?? 0,
      accountNumber: v.accountNumber || undefined,
      description: v.description || undefined,
    };
    this.submitting.set(true);
    const save = this.wallet() ? this.service.updateWallet(this.wallet()!.id, request) : this.service.createWallet(request);
    save.subscribe({
      next: () => {
        this.submitting.set(false);
        this.open.set(false);
      },
      error: () => this.submitting.set(false),
    });
  }
}