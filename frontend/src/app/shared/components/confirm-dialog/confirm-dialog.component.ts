import { Component, input, output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';

/**
 * Reusable confirm-action modal (Section 14).
 * WHY: destructive or imperative confirmations share one pattern.
 * Renders inside an app-modal; emits `confirmed` / `dismissed`.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ModalComponent],
  template: `
    <app-modal [open]="open()" [title]="title()" [size]="'sm'" [dismissible]="false" [hasFooter]="false">
      <div class="confirm-dialog">
        <div class="confirm-dialog__icon" [class.confirm-dialog__icon--danger]="danger()">
          <i class="bi bi-shield-exclamation"></i>
        </div>
        <p class="confirm-dialog__message">{{ message() }}</p>
        <div class="confirm-dialog__actions">
          <button type="button" class="btn btn-outline-secondary" [disabled]="loading()" (click)="onCancel()">
            Cancel
          </button>
          <button
            type="button"
            class="btn"
            [class.btn-danger]="danger()"
            [class.btn-primary-gradient]="!danger()"
            [disabled]="loading()"
            (click)="onConfirm()"
          >
            @if (loading()) {
              <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            }
            @if (icon()) {
              <i [class]="'bi ' + icon() + ' me-1'"></i>
            }
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </app-modal>
  `,
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  readonly open = input<boolean>(false);
  readonly title = input<string>('Confirm');
  readonly message = input.required<string>();
  readonly confirmLabel = input<string>('Confirm');
  readonly danger = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly icon = input<string>('');

  readonly confirmed = output<void>();
  readonly dismissed = output<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    if (!this.loading()) {
      this.dismissed.emit();
    }
  }
}