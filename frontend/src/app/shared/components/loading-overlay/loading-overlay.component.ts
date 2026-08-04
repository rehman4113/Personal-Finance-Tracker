import { Component, input } from '@angular/core';

/**
 * Full-content spinner overlay (Section 23).
 * WHY: blocks interaction while a long load runs; reused by every feature.
 */
@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  template: `
    <div class="loading-overlay">
      <div class="loading-overlay__inner">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        @if (message()) {
          <p class="loading-overlay__message">{{ message() }}</p>
        }
      </div>
    </div>
  `,
  styleUrl: './loading-overlay.component.scss',
})
export class LoadingOverlayComponent {
  readonly message = input<string>('Loading…');
}