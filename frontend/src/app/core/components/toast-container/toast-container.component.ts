import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

/**
 * Renders the global signal-based toasts (Section 21).
 * WHY: Single mount point in the app shell — features only call ToastService.
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1080">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast show align-items-center border-0 mb-2"
          [class.text-bg-success]="toast.type === 'success'"
          [class.text-bg-danger]="toast.type === 'error'"
          [class.text-bg-info]="toast.type === 'info'"
          role="alert"
        >
          <div class="d-flex">
            <div class="toast-body">
              <i
                [class]="
                  toast.type === 'success' ? 'bi bi-check-circle me-2' : toast.type === 'error' ? 'bi bi-exclamation-triangle me-2' : 'bi bi-info-circle me-2'
                "
              ></i>
              {{ toast.message }}
            </div>
            <button
              type="button"
              class="btn-close btn-close-white me-2 m-auto"
              aria-label="Close"
              (click)="toastService.dismiss(toast.id)"
            ></button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
