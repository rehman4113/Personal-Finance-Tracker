import { Component, computed, inject, signal, input, model, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { TransactionService } from '../transaction/services/transaction.service';
import { WalletTypeDto, WalletTypeRequest } from '../transaction/dto/wallet.dto';
import { getFinanceValidationMessage } from '../../shared/validators/finance-validators';

@Component({
  selector: 'app-wallet-type-form',
  standalone: true,
  imports: [ModalComponent, ReactiveFormsModule],
  template: `
    <app-modal [(open)]="open" [title]="type() ? 'Edit Wallet Type' : 'Create Wallet Type'" size="sm">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label" for="name">Name</label>
            <input id="name" type="text" class="form-control form-control-lg-custom" formControlName="name"
                   placeholder="e.g. Savings" [class.is-invalid]="invalid('name')" />
            <small class="text-danger">{{ messageFor('name') }}</small>
          </div>
          <div class="col-12">
            <label class="form-label" for="code">Code</label>
            <input id="code" type="text" class="form-control form-control-lg-custom" formControlName="code"
                   placeholder="e.g. SAVINGS" [class.is-invalid]="invalid('code')" />
            <small class="text-muted">Uppercase short code, unique per user.</small>
            <small class="text-danger d-block">{{ messageFor('code') }}</small>
          </div>
          <div class="col-12">
            <label class="form-label" for="description">Description</label>
            <input id="description" type="text" class="form-control form-control-lg-custom" formControlName="description"
                   placeholder="Optional" />
          </div>
        </div>
        <div class="d-flex justify-content-end gap-2 mt-4">
          <button type="button" class="btn btn-outline-secondary" (click)="open.set(false)">Cancel</button>
          <button type="submit" class="btn btn-primary-gradient" [disabled]="submitting()">
            @if (submitting()) {
              <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
            }
            <i class="bi bi-check-lg me-1"></i>Save
          </button>
        </div>
      </form>
    </app-modal>
  `,
})
export class WalletTypeFormComponent {
  readonly type = input<WalletTypeDto | null>(null);
  readonly open = model(false);

  protected readonly service = inject(TransactionService);
  private readonly fb = inject(FormBuilder);

  readonly submitting = signal(false);
  form!: FormGroup;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)]],
      description: [''],
    });
    effect(() => {
      const t = this.type();
      if (t) {
        this.form.patchValue({ name: t.name, code: t.code, description: t.description ?? '' });
      } else {
        this.form.reset();
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

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    const request: WalletTypeRequest = {
      code: v.code as string,
      name: v.name as string,
      description: v.description || undefined,
    };
    this.submitting.set(true);
    const save = this.type()
      ? this.service.updateWalletType(this.type()!.id, request)
      : this.service.createWalletType(request);
    save.subscribe({
      next: () => {
        this.submitting.set(false);
        this.open.set(false);
      },
      error: () => this.submitting.set(false),
    });
  }
}