import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="loading-spinner text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      @if (message()) {
        <p class="text-muted mt-2 mb-0">{{ message() }}</p>
      }
    </div>
  `,
})
export class LoadingSpinnerComponent {
  readonly message = input<string>('');
}
