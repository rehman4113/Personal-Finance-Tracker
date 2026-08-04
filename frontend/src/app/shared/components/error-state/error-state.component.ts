import { Component, input, output } from '@angular/core';

/**
 * Error state with retry (Section 23).
 * WHY: API load failures show one shared, actionable pattern.
 */
@Component({
  selector: 'app-error-state',
  standalone: true,
  template: `
    <div class="error-state">
      <div class="error-state__art">
        <i class="bi bi-exclamation-triangle"></i>
      </div>
      <h3 class="error-state__title">{{ title() }}</h3>
      @if (message()) {
        <p class="error-state__message">{{ message() }}</p>
      }
      <button type="button" class="btn btn-outline-primary error-state__retry" (click)="retry.emit()">
        <i class="bi bi-arrow-clockwise me-2"></i>Try again
      </button>
    </div>
  `,
  styleUrl: './error-state.component.scss',
})
export class ErrorStateComponent {
  readonly title = input<string>('Something went wrong');
  readonly message = input<string>('');
  readonly retry = output<void>();
}