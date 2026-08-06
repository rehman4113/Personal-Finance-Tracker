import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';
import { DeleteDialogComponent } from '../../shared/components/delete-dialog/delete-dialog.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { OtpInputComponent } from '../../shared/components/otp-input/otp-input.component';
import { ValidationMessagesComponent } from '../../shared/components/validation-messages/validation-messages.component';
import { AuthenticationService } from '../auth/services/authentication.service';
import { AUTH_ROUTES } from '../auth/constants/auth.constants';
import { CountryCodeDropdownComponent } from '../auth/components/country-code-dropdown/country-code-dropdown.component';
import { ForgotPasswordFlowComponent } from '../auth/components/forgot-password-flow/forgot-password-flow.component';
import { COUNTRY_CODES } from '../auth/config/country-codes.config';
import {
  emailValidator,
  firstNameValidator,
  lastNameValidator,
  otpValidator,
  phoneValidator,
} from '../auth/validators/auth.validators';
import { TransactionService } from '../transaction/services/transaction.service';
import { WalletTypeDto } from '../transaction/dto/wallet.dto';
import { LoanUserDto, LoanHistoryDto } from '../transaction/dto/loan.dto';
import { CountUpDirective } from '../../shared/directives/count-up.directive';
import { WalletTypeFormComponent } from './wallet-type-form.component';
import { LoanUserFormComponent } from './loan-user-form.component';

/**
 * Settings — profile section (display, edit + email-change verification,
 * reset password via the shared two-step flow, logout) alongside the existing
 * wallet-type and loan-user management.
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  styleUrl: './settings.component.scss',
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    DrawerComponent,
    DeleteDialogComponent,
    ModalComponent,
    OtpInputComponent,
    ValidationMessagesComponent,
    CountryCodeDropdownComponent,
    ForgotPasswordFlowComponent,
    WalletTypeFormComponent,
    LoanUserFormComponent,
    CountUpDirective,
  ],
  template: `
    <div class="container-fluid py-4">
      <app-page-header title="Settings" subtitle="Your profile, wallet types and loan users" icon="bi-gear" />

      <div class="row g-4">
        <!-- Profile -->
        <div class="col-lg-4">
          <div class="settings-profile">
            <div class="settings-profile__avatar">{{ initials() }}</div>
            <h5 class="settings-profile__name">{{ user()?.firstName }} {{ user()?.lastName }}</h5>
            <p class="settings-profile__email">{{ user()?.email }}</p>
            @if (displayContact()) {
              <p class="settings-profile__contact">
                <i class="bi bi-telephone me-1"></i>{{ displayContact() }}
              </p>
            }
            <span
              class="badge settings-profile__badge"
              [class.settings-profile__badge--verified]="user()?.emailVerified"
              [class.settings-profile__badge--unverified]="!user()?.emailVerified"
            >
              <i class="bi me-1"
                [class.bi-patch-check-fill]="user()?.emailVerified"
                [class.bi-patch-exclamation]="!user()?.emailVerified"
              ></i>
              {{ user()?.emailVerified ? 'Verified' : 'Unverified' }}
            </span>

            <div class="d-grid gap-2 mt-4">
              <button type="button" class="btn btn-primary-gradient" (click)="openEditProfile()">
                <i class="bi bi-pencil me-1"></i>Edit Profile
              </button>
              <button type="button" class="btn btn-outline-secondary" (click)="openResetPassword()">
                <i class="bi bi-key me-1"></i>Reset Password
              </button>
              <button type="button" class="btn btn-outline-danger" (click)="onLogout()">
                <i class="bi bi-box-arrow-right me-1"></i>Logout
              </button>
            </div>
          </div>
        </div>

        <!-- Wallet Types -->
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-transparent pt-3 px-4 d-flex justify-content-between align-items-center">
              <h6 class="mb-0 fw-semibold">Wallet Types</h6>
              <button type="button" class="btn btn-sm btn-primary-gradient" (click)="openTypeCreate()">
                <i class="bi bi-plus-lg me-1"></i>Add Type
              </button>
            </div>
            <div class="card-body px-4">
              @if (walletTypes().length === 0) {
                <p class="text-muted mb-0">No wallet types loaded.</p>
              } @else {
                <div class="list-group">
                  @for (t of walletTypes(); track t.id) {
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <span class="fw-semibold">{{ t.name }}</span>
                        <span class="badge bg-secondary-subtle text-secondary-emphasis ms-2">{{ t.code }}</span>
                        @if (t.systemDefault) {
                          <span class="badge bg-info-subtle text-info-emphasis ms-1">System</span>
                        }
                        @if (t.description) {
                          <div class="small text-muted">{{ t.description }}</div>
                        }
                      </div>
                      <div class="d-flex gap-1">
                        @if (!t.systemDefault) {
                          <button type="button" class="btn btn-sm btn-icon text-primary" title="Edit" (click)="openTypeEdit(t)">
                            <i class="bi bi-pencil"></i>
                          </button>
                          <button type="button" class="btn btn-sm btn-icon text-danger" title="Delete" (click)="openTypeDelete(t)">
                            <i class="bi bi-trash"></i>
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Loan Users -->
          <div class="card border-0 shadow-sm mt-4">
            <div class="card-header bg-transparent pt-3 px-4 d-flex justify-content-between align-items-center">
              <h6 class="mb-0 fw-semibold">Loan Users</h6>
              <button type="button" class="btn btn-sm btn-primary-gradient" (click)="openUserCreate()">
                <i class="bi bi-plus-lg me-1"></i>Add User
              </button>
            </div>
            <div class="card-body px-4">
              @if (loanUsers().length === 0) {
                <p class="text-muted mb-0">No loan users yet — add one to track loans with a person.</p>
              } @else {
                <div class="list-group">
                  @for (u of loanUsers(); track u.id) {
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <span class="fw-semibold">{{ u.fullName }}</span>
                        <span class="badge" [class]="loanStatusCls(u.loanStatus)">{{ u.loanStatus }}</span>
                        <div class="small text-muted">
                          @if (u.contactNumber) {
                            <span class="me-2"><i class="bi bi-telephone me-1"></i>{{ u.contactNumber }}</span>
                          }
                          <span appCountUp [appCountUpValue]="u.currentAmount" appCountUpFormat="amount" ></span>
                        </div>
                      </div>
                      <div class="d-flex gap-1">
                        <button type="button" class="btn btn-sm btn-icon text-info" title="History" (click)="openHistory(u)">
                          <i class="bi bi-clock-history"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-icon text-primary" title="Edit" (click)="openUserEdit(u)">
                          <i class="bi bi-pencil"></i>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Profile modal: form -> (email change) -> OTP verification -->
    <app-modal [open]="editOpen()" title="Edit Profile" size="md" (openChange)="closeEdit($event)">
      @if (editStep() === 'form') {
        <form [formGroup]="editForm" (ngSubmit)="onEditSubmit()" novalidate>
          @if (editApiError()) {
            <div class="alert alert-danger d-flex align-items-start py-2 px-3" role="alert">
              <i class="bi bi-exclamation-circle me-2 mt-1"></i>
              <div>{{ editApiError() }}</div>
            </div>
          }
          <div class="row g-3 mb-3">
            <div class="col-sm-6">
              <label class="form-label" for="editFirstName">First name</label>
              <input
                id="editFirstName"
                type="text"
                class="form-control"
                [class.is-invalid]="editForm.controls.firstName.invalid && (editForm.controls.firstName.dirty || editForm.controls.firstName.touched)"
                formControlName="firstName"
                placeholder="John"
              />
              <app-validation-messages [control]="editForm.controls.firstName" />
            </div>
            <div class="col-sm-6">
              <label class="form-label" for="editLastName">Last name</label>
              <input
                id="editLastName"
                type="text"
                class="form-control"
                [class.is-invalid]="editForm.controls.lastName.invalid && (editForm.controls.lastName.dirty || editForm.controls.lastName.touched)"
                formControlName="lastName"
                placeholder="Doe"
              />
              <app-validation-messages [control]="editForm.controls.lastName" />
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label" for="editEmail">Email address</label>
            <input
              id="editEmail"
              type="email"
              class="form-control"
              [class.is-invalid]="editForm.controls.email.invalid && (editForm.controls.email.dirty || editForm.controls.email.touched)"
              formControlName="email"
              placeholder="you@gmail.com"
            />
            <app-validation-messages [control]="editForm.controls.email" />
            @if (emailChanged()) {
              <div class="form-text text-warning-emphasis">
                <i class="bi bi-shield-exclamation me-1"></i>Changing your email requires verifying the new address.
              </div>
            }
          </div>

          <div class="row g-3 mb-4">
            <div class="col-sm-4">
              <app-country-code-dropdown formControlName="countryCode" inputId="editCountryCode" label="Country Code" />
            </div>
            <div class="col-sm-8">
              <label class="form-label" for="editPhone">Phone number</label>
              <input
                id="editPhone"
                type="tel"
                inputmode="numeric"
                class="form-control"
                [class.is-invalid]="editForm.controls.phone.invalid && (editForm.controls.phone.dirty || editForm.controls.phone.touched)"
                formControlName="phone"
                placeholder="3001234567"
              />
              <app-validation-messages [control]="editForm.controls.phone" />
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-secondary" (click)="closeEdit(false)">Cancel</button>
            <button type="submit" class="btn btn-primary-gradient" [disabled]="editForm.invalid || saving()">
              @if (saving()) {
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              }
              <i class="bi bi-check2 me-1"></i>Save Changes
            </button>
          </div>
        </form>
      } @else {
        <p class="text-muted mb-3">
          We sent a verification code to
          <strong class="settings-profile__email">{{ newEmail() }}</strong>. Enter it below to confirm your new address.
        </p>
        @if (editApiError()) {
          <div class="alert alert-danger d-flex align-items-start py-2 px-3" role="alert">
            <i class="bi bi-exclamation-circle me-2 mt-1"></i>
            <div>{{ editApiError() }}</div>
          </div>
        }
        <form [formGroup]="verifyForm" (ngSubmit)="onVerifyEditSubmit()" novalidate>
          <label class="form-label" for="editOtp">Verification code</label>
          <app-otp-input formControlName="otp" />
          <app-validation-messages [control]="verifyForm.controls.otp" />
          <div class="d-flex justify-content-end gap-2 mt-4">
            <button type="button" class="btn btn-outline-secondary" (click)="backToEditForm()">Back</button>
            <button type="submit" class="btn btn-primary-gradient" [disabled]="verifyForm.invalid || saving()">
              @if (saving()) {
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              }
              <i class="bi bi-check2-circle me-1"></i>Verify
            </button>
          </div>
        </form>
      }
    </app-modal>

    <!-- Reset Password modal — reuses the shared two-step flow, prefilled -->
    <app-modal [open]="resetOpen()" title="Reset Password" size="sm" (openChange)="resetOpen.set($event)">
      <p class="text-muted small mb-3">We'll email a reset code to {{ user()?.email }}.</p>
      <app-forgot-password-flow [initialEmail]="user()?.email ?? ''" />
    </app-modal>

    @if (typeFormOpen()) {
      <app-wallet-type-form [open]="typeFormOpen()" [type]="editingType()" (openChange)="typeFormOpen.set($event)" />
    }

    @if (userFormOpen()) {
      <app-loan-user-form [open]="userFormOpen()" [user]="editingUser()" (openChange)="userFormOpen.set($event)" />
    }

    @if (typeDeleting()) {
      <app-delete-dialog
        [open]="typeDeleting()"
        title="Delete Wallet Type"
        [message]="typeDeleteMessage()"
        [loading]="deletingLoading()"
        (confirmed)="onTypeDelete()"
        (dismissed)="typeDeleting.set(false)"
      />
    }

    @if (historyUser()) {
      <app-drawer [open]="historyOpen()" (openChange)="historyOpen.set($event)" [title]="'Loan History — ' + historyUser()!.fullName" icon="bi-clock-history">
        @if (historyEntries().length === 0) {
          <div class="text-center text-muted py-5">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            No history recorded for this person.
          </div>
        } @else {
          <table class="table table-sm align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th class="text-end">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (h of historyEntries(); track h.id) {
                <tr>
                  <td class="text-nowrap small">{{ (h.createdAt ?? '').slice(0, 10) }}</td>
                  <td class="text-end fw-semibold">
                    <span appCountUp [appCountUpValue]="h.amount" appCountUpFormat="amount" ></span>
                  </td>
                  <td>
                    <span class="small text-muted">{{ h.previousStatus }} – {{ h.currentStatus }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </app-drawer>
    }
  `,
})
export class SettingsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthenticationService);
  protected readonly service = inject(TransactionService);

  readonly user = this.authService.currentUser;

  readonly walletTypes = computed(() => this.service.walletTypes() ?? []);
  readonly loanUsers = computed(() => this.service.loanUsers() ?? []);

  readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
  });

  readonly typeFormOpen = signal(false);
  readonly editingType = signal<WalletTypeDto | null>(null);
  readonly typeDeleting = signal(false);
  readonly deletingType = signal<WalletTypeDto | null>(null);
  readonly deletingLoading = signal(false);

  readonly userFormOpen = signal(false);
  readonly editingUser = signal<LoanUserDto | null>(null);

  readonly historyUser = signal<LoanUserDto | null>(null);
  readonly historyOpen = signal(false);
  readonly historyEntries = signal<LoanHistoryDto[]>([]);

  readonly editOpen = signal(false);
  readonly editStep = signal<'form' | 'verify'>('form');
  readonly editApiError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly newEmail = signal('');
  readonly resetOpen = signal(false);

  readonly editForm = this.fb.nonNullable.group({
    firstName: ['', [firstNameValidator]],
    lastName: ['', [lastNameValidator]],
    email: ['', [emailValidator]],
    countryCode: ['+92'],
    phone: ['', [phoneValidator]],
  });

  readonly verifyForm = this.fb.nonNullable.group({
    otp: ['', [otpValidator]],
  });

  readonly emailChanged = computed(() => {
    const current = (this.user()?.email ?? '').toLowerCase();
    const next = this.editForm.controls.email.value.trim().toLowerCase();
    return next.length > 0 && current !== next;
  });

  ngOnInit(): void {
    this.service.loadMasterData();
    this.service.loadWalletTypes().subscribe({ error: () => undefined });
    this.service.loadLoanUsers().subscribe({ error: () => undefined });
  }

  /** Splits the stored digits-only contact into country code + phone. */
  private splitContact(contact: string | undefined): { countryCode: string; phone: string } {
    const digits = (contact ?? '').replace(/\D/g, '');
    if (!digits) return { countryCode: '+92', phone: '' };
    let best = '';
    for (const option of COUNTRY_CODES) {
      const code = (option.dialingCode ?? '').replace('+', '');
      if (code && digits.startsWith(code) && code.length > best.length) {
        best = code;
      }
    }
    if (best) return { countryCode: '+' + best, phone: digits.slice(best.length) };
    return { countryCode: '+92', phone: digits };
  }

  /** "+92 2143 4234 4" — formatted from the digits-only backend contact. */
  displayContact(): string {
    const parts = this.splitContact(this.user()?.contact);
    if (!parts.phone) return '';
    const grouped = parts.phone.replace(/(\d{4})(?=\d)/g, '$1 ');
    return `+${parts.countryCode.replace('+', '')} ${grouped}`;
  }

  openEditProfile(): void {
    const user = this.user();
    if (!user) return;
    const parts = this.splitContact(user.contact);
    this.editForm.patchValue({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      countryCode: parts.countryCode,
      phone: parts.phone,
    });
    this.editStep.set('form');
    this.editApiError.set(null);
    this.editOpen.set(true);
  }

  closeEdit(open: boolean): void {
    this.editOpen.set(open);
    if (!open) {
      this.editStep.set('form');
      this.editApiError.set(null);
    }
  }

  onEditSubmit(): void {
    this.editApiError.set(null);
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { firstName, lastName, email, countryCode, phone } = this.editForm.getRawValue();
    const emailChanged = this.emailChanged();
    this.saving.set(true);
    this.authService
      .updateProfile({
        firstName: firstName.trim(),
        lastName: lastName?.trim() || undefined,
        email: email.trim(),
        countryCode: (countryCode ?? '').replace('+', ''),
        phoneNumber: phone ?? '',
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          if (emailChanged) {
            this.newEmail.set(email.trim());
            this.editStep.set('verify');
          } else {
            this.editOpen.set(false);
          }
        },
        error: (err: { message?: string }) => {
          this.saving.set(false);
          this.editApiError.set(err.message ?? 'Could not update profile');
        },
      });
  }

  backToEditForm(): void {
    this.editStep.set('form');
    this.editApiError.set(null);
  }

  onVerifyEditSubmit(): void {
    this.editApiError.set(null);
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }
    const { otp } = this.verifyForm.getRawValue();
    this.saving.set(true);
    this.authService.verifyEmail({ email: this.newEmail(), otp }).subscribe({
      next: () => {
        this.saving.set(false);
        this.authService.markEmailVerified();
        this.editOpen.set(false);
        this.editStep.set('form');
      },
      error: (err: { message?: string }) => {
        this.saving.set(false);
        this.editApiError.set(err.message ?? 'Verification failed');
      },
    });
  }

  openResetPassword(): void {
    this.resetOpen.set(true);
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      complete: () => void this.router.navigateByUrl(AUTH_ROUTES.LOGIN),
      error: () => void this.router.navigateByUrl(AUTH_ROUTES.LOGIN),
    });
  }

  openTypeCreate(): void {
    this.editingType.set(null);
    this.typeFormOpen.set(true);
  }

  openTypeEdit(t: WalletTypeDto): void {
    this.editingType.set(t);
    this.typeFormOpen.set(true);
  }

  openTypeDelete(t: WalletTypeDto): void {
    this.deletingType.set(t);
    this.typeDeleting.set(true);
  }

  typeDeleteMessage(): string {
    return `Delete '${this.deletingType()?.name ?? ''}'?`;
  }

  onTypeDelete(): void {
    const type = this.deletingType();
    if (!type) return;
    this.deletingLoading.set(true);
    this.service.deleteWalletType(type.id).subscribe({
      next: () => {
        this.deletingLoading.set(false);
        this.typeDeleting.set(false);
      },
      error: () => this.deletingLoading.set(false),
    });
  }

  openUserCreate(): void {
    this.editingUser.set(null);
    this.userFormOpen.set(true);
  }

  openUserEdit(u: LoanUserDto): void {
    this.editingUser.set(u);
    this.userFormOpen.set(true);
  }

  openHistory(user: LoanUserDto): void {
    this.historyUser.set(user);
    this.historyEntries.set([]);
    this.historyOpen.set(true);
    this.service.loadLoanHistory(user.id).subscribe({
      next: (entries) => this.historyEntries.set(entries ?? []),
      error: () => this.historyEntries.set([]),
    });
  }

  closeHistory(): void {
    this.historyOpen.set(false);
    this.historyUser.set(null);
  }

  loanStatusCls(status: string): string {
    return status === 'RECEIVABLE'
      ? 'bg-info-subtle text-info-emphasis'
      : status === 'PAYABLE'
        ? 'bg-warning-subtle text-warning-emphasis'
        : 'bg-secondary-subtle text-secondary-emphasis';
  }
}
