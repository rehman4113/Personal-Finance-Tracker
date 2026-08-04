import { Component, input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartData, ChartOptions, ChartType } from 'chart.js';
import { lineChartOptions, doughnutChartOptions, barChartOptions, sparklineOptions } from '../../charts/pfm-chart.theme';

/** Union of chart presets this app uses (Chart.js via ng2-charts). */
export type PfmChartType = 'line' | 'doughnut' | 'bar';

/**
 * Thin presentation wrapper around ng2-charts' BaseChartDirective.
 * WHY: keeps the dark-theme option defaults + entrance animations in one
 * place so Dashboard/Reports charts stay consistent (no white defaults).
 */
@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `<canvas baseChart [type]="$any(chartType())" [data]="$any(data())" [options]="$any(optionsValue)" [legend]="false"></canvas>`,
  styleUrl: './chart.component.scss',
})
export class ChartComponent {
  readonly chartType = input<PfmChartType>('line');
  readonly data = input.required<ChartData<'line'> | ChartData<'doughnut'> | ChartData<'bar'>>();
  readonly labels = input<string[]>([]);
  readonly options = input<ChartOptions | null>(null);
  readonly yFormat = input<((v: number) => string) | null>(null);
  readonly sparkline = input<boolean>(false);
  readonly showLegend = input<boolean>(true);

  get optionsValue(): ChartOptions<'line'> | ChartOptions<'doughnut'> | ChartOptions<'bar'> {
    if (this.options()) return this.options() as ChartOptions<'line'> | ChartOptions<'doughnut'> | ChartOptions<'bar'>;
    const fmt = this.yFormat() ?? undefined;
    if (this.sparkline()) return sparklineOptions();
    if (this.chartType() === 'doughnut') return doughnutChartOptions(fmt);
    if (this.chartType() === 'bar') return barChartOptions(fmt);
    return lineChartOptions(this.labels(), { yFormat: fmt });
  }
}

export type { ChartType };
