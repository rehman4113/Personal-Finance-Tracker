import { Component, input, model } from '@angular/core';

/**
 * Generic centered modal wrapper (Section 14).
 * WHY: confirm/delete dialogs and quick forms share one accessible shell.
 * Two-way bind `open` via [(open)] or listen for (openChange).
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    @if (open()) {
      <div class="modal-overlay">
        <div class="modal-overlay__backdrop" (click)="dismiss()"></div>
        <div class="modal-dialog__wrap">
          <div class="modal-box" [class]="'modal-box--' + size()" role="dialog" aria-modal="true">
            <div class="modal-box__header">
              <h3 class="modal-box__title">{{ title() }}</h3>
              @if (dismissible()) {
                <button type="button" class="modal-box__close" aria-label="Close" (click)="dismiss()">
                  <i class="bi bi-x-lg"></i>
                </button>
              }
            </div>
            <div class="modal-box__body">
              <ng-content />
            </div>
            @if (hasFooter()) {
              <div class="modal-box__footer">
                <ng-content select="[pfmModalFooter]" />
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  readonly open = model(false);
  readonly title = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly dismissible = input(true);
  readonly hasFooter = input<boolean>(false);

  dismiss(): void {
    if (this.dismissible()) {
      this.open.set(false);
    }
  }
}