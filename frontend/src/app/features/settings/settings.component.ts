import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DrawerComponent } from '../../shared/components/drawer/drawer.component';
import { DeleteDialogComponent } from '../../shared/components/delete-dialog/delete-dialog.component';
import { AuthenticationService } from '../auth/services/authentication.service';
import { AUTH_ROUTES } from '../auth/constants/auth.constants';
import { TransactionService } from '../transaction/services/transaction.service';
import { WalletTypeDto } from '../transaction/dto/wallet.dto';
import { LoanUserDto, LoanHistoryDto } from '../transaction/dto/loan.dto';
import { CountUpDirective } from '../../shared/directives/count-up.directive';
import { WalletTypeFormComponent } from './wallet-type-form.component';
import { LoanUserFormComponent } from './loan-user-form.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  styleUrl: './settings.component.scss',
  imports: [
    PageHeaderComponent,
    DrawerComponent,
    DeleteDialogComponent,
    WalletTypeFormComponent,
    LoanUserFormComponent,
    CountUpDirective,
  ],
  template: `
    <div class="container-fluid py-4">
      <app-page-header title="Settings" subtitle="Wallet types, loan users and your account" icon="bi-gear" />

      <div class="row g-4">
        <!-- Profile -->
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm">
            <div class="card-body text-center p-4">
              <div class="settings-avatar mx-auto mb-3">
                <i class="bi bi-person-fill"></i>
              </div>
              <h5 class="mb-1">{{ user()?.firstName }} {{ user()?.lastName }}</h5>
              <p class="text-muted mb-3">{{ user()?.email }}</p>
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
                <p class="text-muted mb-0">No loan users yet â€” add one to track loans with a person.</p>
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
      <app-drawer [open]="historyOpen()" (openChange)="historyOpen.set($event)" [title]="'Loan History â€” ' + historyUser()!.fullName" icon="bi-clock-history">
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
                    <span class="small text-muted">{{ h.previousStatus }} â†’ {{ h.currentStatus }}</span>
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
  private readonly authService = inject(AuthenticationService);
  protected readonly service = inject(TransactionService);

  readonly user = this.authService.currentUser;

  readonly walletTypes = computed(() => this.service.walletTypes() ?? []);
  readonly loanUsers = computed(() => this.service.loanUsers() ?? []);

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

  ngOnInit(): void {
    this.service.loadMasterData();
    this.service.loadWalletTypes().subscribe({ error: () => undefined });
    this.service.loadLoanUsers().subscribe({ error: () => undefined });
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