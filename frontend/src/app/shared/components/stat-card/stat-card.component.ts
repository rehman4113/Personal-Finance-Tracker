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
}
