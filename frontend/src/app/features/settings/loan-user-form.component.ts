import { Component, input, output, inject, signal, model, effect } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { TransactionService } from '../transaction/services/transaction.service';
import { LoanUserDto, LoanUserRequest } from '../transaction/dto/loan.dto';
import { getFinanceValidationMessage } from '../../shared/validators/finance-validators';

@Component({
  selector: 'app-loan-user-form',
  standalone: true,
  imports: [ModalComponent, ReactiveFormsModule],
  template: `
    <app-modal [(open)]="open" [title]="user() ? 'Edit Loan User' : 'Add Loan User'" size="md">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="row g-3">
          <div class="col-12">
            <label class="form-label" for="fullName">Full Name</label>
            <input id="fullName" type="text" class="form-control form-control-lg-custom" formControlName="fullName"
                   placeholder="e.g. Ahmed Raza" [class.is-invalid]="invalid('fullName')" />
            <small class="text-danger">{{ messageFor('fullName') }}</small>
          </div>
          <div class="col-12">
            <label class="form-label" for="contactNumber">Contact Number</label>
            <input id="contactNumber" type="tel" class="form-control form-control-lg-custom" formControlName="contactNumber"
                   placeholder="+92 3xx xxxxxxx" />
          </div>
          <div class="col-12">
            <label class="form-label" for="notes">Notes</label>
            <textarea id="notes" rows="2" class="form-control" formControlName="notes" placeholder="Optional"></textarea>
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
export class LoanUserFormComponent {
  readonly user = input<LoanUserDto | null>(null);
  readonly open = model(false);

  /** Pre-fills the form with a name (e.g. a term typed in a dropdown before creating). */
  readonly prefillName = input('');

  /** Emits the created/updated loan user after a successful save. */
  readonly saved = output<LoanUserDto>();

  protected readonly service = inject(TransactionService);
  private readonly fb = inject(FormBuilder);

  readonly submitting = signal(false);
  form!: FormGroup;

  constructor() {
    this.form = this.fb.group({
      fullName: ['', Validators.required],
      contactNumber: [''],
      notes: [''],
    });
    effect(() => {
      const u = this.user();
      const open = this.open();
      const prefill = this.prefillName();
      if (!open) return;
      if (u) {
        this.form.patchValue({
          fullName: u.fullName,
          contactNumber: u.contactNumber ?? '',
          notes: u.notes ?? '',
        });
      } else {
        this.form.reset({ fullName: prefill, contactNumber: '', notes: '' });
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
    const request: LoanUserRequest = {
      fullName: v.fullName as string,
      contactNumber: v.contactNumber || undefined,
      notes: v.notes || undefined,
    };
    this.submitting.set(true);
    const save = this.user() ? this.service.updateLoanUser(this.user()!.id, request) : this.service.createLoanUser(request);
    save.subscribe({
      next: (dto: LoanUserDto) => {
        this.submitting.set(false);
        this.open.set(false);
        this.saved.emit(dto);
      },
      error: () => this.submitting.set(false),
    });
  }
}