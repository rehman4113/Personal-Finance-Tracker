import { Component, input } from '@angular/core';

/**
 * Full-content loading overlay (Section 23).
 * WHY: blocks interaction while a long load runs; renders themed card-shaped
 * shimmer skeletons (not a spinner) so nothing pops in abruptly.
 */
@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  template: `
    <div class="loading-overlay" role="status" aria-live="polite">
      <div class="loading-overlay__inner">
        <div class="loading-overlay__skeleton">
          <div class="pfm-skeleton pfm-skeleton--card" style="height: 10rem;"></div>
          <div class="pfm-skeleton pfm-skeleton--card" style="height: 7rem; margin-top: 0.9rem;"></div>
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