import { Component, input, output } from '@angular/core';

/**
 * Beautiful empty state with illustration, message and optional CTA (Section 14).
 * WHY: every "no data" landing uses the same friendly prompt.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state">
      <div class="empty-state__art">
        <i [class]="'bi ' + icon()"></i>
      </div>
      <h3 class="empty-state__title">{{ title() }}</h3>
      @if (message()) {
        <p class="empty-state__message">{{ message() }}</p>
      }
      @if (ctaLabel()) {
        <button type="button" class="btn btn-primary-gradient empty-state__cta" (click)="cta.emit()">
          @if (ctaIcon()) {
            <i [class]="'bi ' + ctaIcon() + ' me-2'"></i>
          }
          {{ ctaLabel() }}
        </button>
      }
    </div>
  `,
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly message = input<string>('');
  readonly icon = input<string>('bi-inbox');
  readonly ctaLabel = input<string>('');
  readonly ctaIcon = input<string>('');

  readonly cta = output<void>();
}