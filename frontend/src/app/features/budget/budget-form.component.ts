import { Component, input, inject, signal, effect, model } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { CurrencyInputComponent } from '../../shared/components/currency-input/currency-input.component';
import {
  SearchableDropdownComponent,
  SearchableOption,
} from '../../shared/components/searchable-dropdown';
import { TransactionService } from '../transaction/services/transaction.service';
import { BudgetDto, BudgetRequest } from '../transaction/dto/budget.dto';
import { getFinanceValidationMessage } from '../../shared/validators/finance-validators';

@Component({
  selector: 'app-budget-form',
  standalone: true,
  imports: [ModalComponent, ReactiveFormsModule, CurrencyInputComponent, SearchableDropdownComponent],
  template: `
    <app-modal [(open)]="open" [title]="budget() ? 'Edit Budget' : 'Create Budget'" size="md">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label" for="transactionPurposeId">Expense Category</label>
            <app-searchable-dropdown
              formControlName="transactionPurposeId"
              [options]="purposeOptions()"
              placeholder="Select category"
              [invalid]="invalid('transactionPurposeId')"
              [allowCreate]="true"
              [allowDelete]="true"
              [createHandler]="purposeCreateHandler()"
              [deleteHandler]="purposeDeleteHandler()"
            />
            <small class="text-danger">{{ messageFor('transactionPurposeId') }}</small>
          </div>

          <div class="col-12">
            <label class="form-label">Monthly Limit</label>
            <app-currency-input formControlName="monthlyLimit" [invalid]="invalid('monthlyLimit')" />
            <small class="text-danger">{{ messageFor('monthlyLimit') }}</small>
          </div>

          <div class="col-12">
            <label class="form-label" for="warningThreshold">Warning Threshold (1–100%)</label>
            <input
              id="warningThreshold"
              type="number"
              min="1"
              max="100"
              class="form-control form-control-lg-custom"
              formControlName="warningThreshold"
            />
            <small class="text-muted">Alert when spending passes this % of the limit. Default 80.</small>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-4">
          <button type="button" class="btn btn-outline-secondary" (click)="onCancel()">Cancel</button>
          <button type="submit" class="btn btn-primary-gradient" [disabled]="submitting()">
            @if (submitting()) {
              <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            }
            <i class="bi bi-check-lg me-1"></i>{{ budget() ? 'Save Changes' : 'Create Budget' }}
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class BudgetFormComponent {
  readonly budget = input<BudgetDto | null>(null);
  readonly month = input<string>(currentMonth());
  readonly open = model(false);

  protected readonly service = inject(TransactionService);
  private readonly fb = inject(FormBuilder);

  readonly submitting = signal(false);

  form!: FormGroup;

  /** Expense categories from master data (user-created ones deletable). */
  purposeOptions(): SearchableOption<number>[] {
    return this.service.purposesForType('EXPENSE').map((p) => ({
      value: p.id,
      name: p.name ?? p.code,
      deletable: p.userId != null,
    }));
  }

  purposeCreateHandler(): (term: string) => Observable<SearchableOption<number>> {
    return (term) => {
      const typeId = this.service.transactionTypeId('EXPENSE') ?? 0;
      return this.service
        .createPurpose({ transactionTypeId: typeId, name: term })
        .pipe(map((p) => ({ value: p.id, name: p.name ?? p.code, deletable: true })));
    };
  }

  purposeDeleteHandler(): (option: SearchableOption<number>) => Observable<void> {
    return (option) => this.service.deletePurpose(Number(option.value));
  }

  constructor() {
    this.form = this.fb.group({
      transactionPurposeId: [null, Validators.required],
      monthlyLimit: [null, [Validators.required, positiveLimitValidator]],
      warningThreshold: [80, [Validators.required, Validators.min(1), Validators.max(100)]],
    });
    effect(() => {
      const b = this.budget();
      const patchIfPristine = (name: string, value: unknown): void => {
        const control = this.form.get(name);
        if (control && control.pristine) control.setValue(value);
      };
      if (b) {
        const purpose = this.service.purposesForType('EXPENSE').find((p) => p.code === b.purposeCode);
        const purposeControl = this.form.get('transactionPurposeId');
        if (purpose && purposeControl && (purposeControl.pristine || purposeControl.value == null)) {
          purposeControl.setValue(purpose.id);
        }
        patchIfPristine('monthlyLimit', b.monthlyLimit);
        patchIfPristine('warningThreshold', b.warningThreshold);
      } else {
        this.form.reset({ warningThreshold: 80 });
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
    const request: BudgetRequest = {
      transactionPurposeId: v.transactionPurposeId as number,
      monthlyLimit: v.monthlyLimit as number,
      month: this.month(),
      warningThreshold: (v.warningThreshold as number) ?? 80,
    };
    this.submitting.set(true);
    const save = this.budget() ? this.service.updateBudget(this.budget()!.id, request) : this.service.createBudget(request);
    save.subscribe({
      next: () => {
        this.submitting.set(false);
        this.open.set(false);
      },
      error: () => this.submitting.set(false),
    });
  }
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function positiveLimitValidator(control: AbstractControl): ValidationErrors | null {
  const value = Number(control.value);
  if (!value || value <= 0) return { invalidAmount: true };
  return null;
}