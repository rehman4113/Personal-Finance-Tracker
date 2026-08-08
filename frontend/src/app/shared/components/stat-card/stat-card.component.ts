import { Component, input } from '@angular/core';
import { CountUpDirective } from '../../directives/count-up.directive';
import { SummaryTone } from '../summary-card/summary-card.component';

/**
 * Compact statistic tile (budget usage, wallet count, loan totals).
 * WHY: smaller metric surfaces than a full summary card; numeric values
 * count up on render and the tile lifts gently on hover.
 */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CountUpDirective],
  template: `
    <div class="stat-card" [class]="'stat-card--' + tone()">
      <i [class]="'stat-card__icon bi ' + icon()"></i>
      <div class="stat-card__body">
        <div class="stat-card__value">
          @if (numericValue() !== null) {
            <span appCountUp [appCountUpValue]="numericValue()!" appCountUpFormat="number" ></span>
          } @else {
            {{ value() }}
          }
        </div>
        <div class="stat-card__label">{{ label() }}</div>
        @if (progress() !== null) {
          <div class="stat-card__progress">
            <div class="stat-card__progress-track">
              <div
                class="stat-card__progress-fill"
                [class]="'stat-card__progress-fill--' + tone()"
                [style.width.%]="clampedProgress()"
              ></div>
            </div>
            @if (progressLabel()) {
              <span class="stat-card__progress-label">{{ progressLabel() }}</span>
            }
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly numericValue = input<number | null>(null);
  readonly icon = input<string>('bi-circle');
  readonly tone = input<SummaryTone>('primary');
  /** Optional 0–100 fill ratio for the mini progress bar under the label. */
  readonly progress = input<number | null>(null);
  /** Small caption next to the bar (e.g. "38% of budget"). */
  readonly progressLabel = input<string>('');

  clampedProgress(): number {
    const value = this.progress();
    if (value === null || Number.isNaN(value)) return 0;
    return Math.min(100, Math.max(0, value));
  }
}
