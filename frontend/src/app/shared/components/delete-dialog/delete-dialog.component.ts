import { Component, input, output } from '@angular/core';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

/**
 * Danger variant of the confirm dialog for deletes (Section 14).
 * WHY: destructive deletes must be visually distinct from plain confirms.
 */
@Component({
  selector: 'app-delete-dialog',
  standalone: true,
  imports: [ConfirmDialogComponent],
  template: `
    <app-confirm-dialog
      [open]="open()"
      [title]="title()"
      [message]="message()"
      [confirmLabel]="confirmLabel()"
      [danger]="true"
      [loading]="loading()"
      [icon]="'bi-trash'"
      (confirmed)="confirmed.emit()"
      (dismissed)="dismissed.emit()"
    />
  `,
})
export class DeleteDialogComponent {
  readonly open = input<boolean>(false);
  readonly title = input<string>('Delete');
  readonly message = input.required<string>();
  readonly confirmLabel = input<string>('Delete');
  readonly loading = input<boolean>(false);

  readonly confirmed = output<void>();
  readonly dismissed = output<void>();
}