import { Component, computed, input } from '@angular/core';
import { CountUpDirective } from '../../directives/count-up.directive';
import { ChartComponent } from '../chart/chart.component';
import { accentLineDataset } from '../../charts/pfm-chart.theme';
import type { ChartData } from 'chart.js';

export type SummaryTone = 'primary' | 'success' | 'danger' | 'warning' | 'info';

/**
 * Big value summary card (current balance, income, expense, savings).
 * WHY: dashboard + wallet pages reuse the same premium card.
 * Presentation-only polish: numeric values count up on render, an optional
 * sparkline reflects the metric's 6-month trend, and the card gets a subtle
 * glassmorphism + hover lift.
 */
@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CountUpDirective, ChartComponent],
  template: `
    <div class="summary-card pfm-glass" [class]="'summary-card--' + tone()">
      <div class="summary-card__icon">
        <i [class]="'bi ' + icon()"></i>
      </div>
      <div class="summary-card__body">
        <div class="summary-card__label">{{ label() }}</div>
        <div class="summary-card__value">
          @if (numericValue() !== null) {
            <span appCountUp [appCountUpValue]="numericValue()!" appCountUpFormat="amount" ></span>
          } @else {
            {{ value() }}
          }
        </div>
        @if (hint()) {
          <div class="summary-card__hint">{{ hint() }}</div>
        }
      </div>
      @if (trend().length > 1) {
        <div class="summary-card__sparkline" [class]="'summary-card__sparkline--' + tone()">
          <app-chart chartType="line" [data]="trendData()" [sparkline]="true" [showLegend]="false" />
        </div>
      }
    </div>
  `,
  styleUrl: './summary-card.component.scss',
})
export class SummaryCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly numericValue = input<number | null>(null);
  readonly icon = input<string>('bi-wallet2');
  readonly tone = input<SummaryTone>('primary');
  readonly hint = input<string>('');
  /** Optional 6–12 month trend series rendered as a sparkline. */
  readonly trend = input<number[]>([]);
  readonly trendLabels = input<string[]>([]);

  readonly trendData = computed<ChartData<'line'>>(() => ({
    labels: this.trendLabels(),
    datasets: [accentLineDataset(this.label(), this.trend())],
  }));
}
