import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type ChartType,
  type ScriptableContext,
  type TooltipItem,
} from 'chart.js';
import { motionDuration } from '../utils/motion.utils';

/** Register only what we use — keeps the bundle tree-shakeable. */
Chart.register(
  LineController,
  BarController,
  DoughnutController,
  LineElement,
  PointElement,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
);

/* ----------------------------------------------------------------------
   Palette — mirrors the dark theme tokens from styles.scss (_variables)
   ---------------------------------------------------------------------- */
export const CHART_ACCENT = '#ffd166'; // --pfm-panel-accent (amber/gold)
export const CHART_TEAL = '#38bdf8'; // secondary series (sky blue)
export const CHART_SUCCESS = '#4ade80';
export const CHART_DANGER = '#f87171';
export const CHART_WARNING = '#fbbf24';
export const CHART_TEXT_MUTED = '#9fb0c9';
export const CHART_GRID = 'rgba(148, 163, 184, 0.12)';
export const CHART_TOOLTIP_BG = '#0f172a';
export const CHART_TOOLTIP_BORDER = 'rgba(255, 255, 255, 0.12)';

/** Category palette for donut/bar series. */
export const CHART_CATEGORY_PALETTE = [
  CHART_ACCENT,
  CHART_TEAL,
  CHART_SUCCESS,
  '#c084fc',
  '#fb7185',
  CHART_WARNING,
  '#34d399',
  '#a3a3f5',
  '#f59e0b',
  '#22d3ee',
];

/* ----------------------------------------------------------------------
   Shared style bits (tooltips, legend, grid) — dark-theme compliant
   ---------------------------------------------------------------------- */
const tooltipStyle = {
  backgroundColor: CHART_TOOLTIP_BG,
  titleColor: '#e6edf7',
  bodyColor: '#c9d6ea',
  borderColor: CHART_TOOLTIP_BORDER,
  borderWidth: 1,
  padding: 10,
  cornerRadius: 10,
  displayColors: true,
  boxPadding: 4,
  titleFont: { family: 'system-ui', size: 12, weight: 700 } as const,
  bodyFont: { family: 'system-ui', size: 12 } as const,
};

const gridStyle = { color: CHART_GRID, drawBorder: false };
const axisTicks = { color: CHART_TEXT_MUTED, font: { family: 'system-ui', size: 11 } as const };

/** Optional tooltip hooks a chart can inject (title/row/footer callbacks). */
export interface ChartTooltipHooks {
  /** Overrides the default tooltip title (e.g. prettier date formatting). */
  title?: (items: TooltipItem<'line'>[] | TooltipItem<'bar'>[]) => string | string[];
  /** Formats a single tooltip body row — receives the item for dataset index. */
  label?: (item: TooltipItem<'line'> | TooltipItem<'bar'>) => string;
  /** Extra footer rows (e.g. cumulative month totals). */
  footer?: (items: TooltipItem<'line'>[] | TooltipItem<'bar'>[]) => string | string[];
}

export interface LineChartExtra {
  yFormat?: (v: number) => string;
  heightRatio?: number;
  showLegend?: boolean;
  tooltipHooks?: ChartTooltipHooks;
  /** X-axis tick formatting — useful for dense daily labels (e.g. "4 Aug"). */
  xTickFormat?: (value: string, index: number) => string;
  /** Cap on visible x ticks to prevent label crowding on dense series. */
  xMaxTicks?: number;
}

/** Area/line chart options — gradient fill, animated left-to-right draw. */
export function lineChartOptions(
  labels: string[],
  opts?: LineChartExtra,
): ChartOptions<'line'> {
  const hooks = opts?.tooltipHooks;
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: motionDuration(1000),
      easing: 'easeOutQuart',
    },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: opts?.showLegend ?? true,
        labels: { color: CHART_TEXT_MUTED, usePointStyle: true, pointStyle: 'circle', boxWidth: 7, padding: 16 },
      },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          title: (items) => (hooks?.title ? hooks.title(items) : items.map((i) => i.label ?? '')),
          label: (item) => {
            if (hooks?.label) return hooks.label(item);
            const value = Number(item.parsed.y ?? 0);
            const text = opts?.yFormat ? opts.yFormat(value) : value.toLocaleString();
            return ` ${item.dataset.label ?? ''}: ${text}`;
          },
          footer: (items) => (hooks?.footer ? hooks.footer(items) : []),
        },
      },
    },
    scales: {
      x: {
        grid: { ...gridStyle, display: false },
        ticks: {
          ...axisTicks,
          ...(opts?.xTickFormat ? { callback: (value, index) => opts.xTickFormat!(String(value), index) } : {}),
          ...(opts?.xMaxTicks != null ? { maxTicksLimit: opts.xMaxTicks } : {}),
          maxRotation: 0,
          autoSkip: true,
        },
        border: { display: false },
      },
      y: {
        grid: gridStyle,
        ticks: {
          ...axisTicks,
          maxTicksLimit: 5,
          callback: (value) => (opts?.yFormat ? opts.yFormat(Number(value)) : value),
        },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };
}

/** Doughnut options — sweep-in entrance, rich tooltips. */
export function doughnutChartOptions(
  yFormat?: (v: number) => string,
): ChartOptions<'doughnut'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: motionDuration(900),
      easing: 'easeOutQuart',
      animateRotate: true,
      animateScale: true,
    },
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: CHART_TEXT_MUTED, usePointStyle: true, pointStyle: 'circle', boxWidth: 7, padding: 14 },
      },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (item) => {
            const total = item.dataset.data.reduce((a, b) => a + (b as number), 0) || 1;
            const value = Number(item.parsed ?? 0);
            const pct = Math.round((value / total) * 100);
            const text = yFormat ? yFormat(value) : value.toLocaleString();
            return ` ${item.label ?? ''}: ${text} (${pct}%)`;
          },
        },
      },
    },
  };
}

/** Grouped bar options — bars grow from baseline, staggered. */
export function barChartOptions(
  yFormat?: (v: number) => string,
  opts?: { tooltipHooks?: ChartTooltipHooks },
): ChartOptions<'bar'> {
  const hooks = opts?.tooltipHooks;
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: motionDuration(900),
      easing: 'easeOutQuart',
      delay: (ctx) => motionDuration(ctx.type === 'data' ? (ctx.dataIndex ?? 0) * 60 : 0),
    },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: { color: CHART_TEXT_MUTED, usePointStyle: true, pointStyle: 'circle', boxWidth: 7, padding: 16 },
      },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          title: (items) => (hooks?.title ? hooks.title(items) : items.map((i) => i.label ?? '')),
          label: (item) => {
            if (hooks?.label) return hooks.label(item);
            const value = Number(item.parsed.y ?? 0);
            const text = yFormat ? yFormat(value) : value.toLocaleString();
            return ` ${item.dataset.label ?? ''}: ${text}`;
          },
          footer: (items) => (hooks?.footer ? hooks.footer(items) : []),
        },
      },
    },
    scales: {
      x: {
        grid: { ...gridStyle, display: false },
        ticks: axisTicks,
        border: { display: false },
      },
      y: {
        grid: gridStyle,
        ticks: {
          ...axisTicks,
          maxTicksLimit: 5,
          callback: (value) => (yFormat ? yFormat(Number(value)) : value),
        },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };
}

/** Tiny axis-free sparkline for stat cards — gentle entrance, no tooltip chrome. */
export function sparklineOptions(): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: motionDuration(800), easing: 'easeOutQuart' },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipStyle,
        displayColors: false,
        callbacks: {
          title: (items) => String(items[0]?.label ?? ''),
          label: (item) => ` ${Number(item.parsed.y ?? 0).toLocaleString()}`,
        },
      },
    },
    scales: { x: { display: false }, y: { display: false } },
    elements: {
      point: { radius: 0, hoverRadius: 3, hitRadius: 6 },
      line: { tension: 0.42, borderWidth: 2 },
    },
  };
}

/** Vertical gradient under a line series — colors fade to transparent. */
export function gradientFill(
  ctx: ScriptableContext<'line'>,
  top: string,
  bottom = 'rgba(255,255,255,0)',
): string | CanvasGradient {
  const { chart } = ctx;
  const { ctx: canvas, chartArea } = chart;
  if (!chartArea) return `${top}22`;
  const g = canvas.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  return g;
}

/** Builds a single-series dataset with the accent color. */
export function accentLineDataset(label: string, data: number[]): ChartData<'line'>['datasets'][number] {
  return {
    label,
    data,
    borderColor: CHART_ACCENT,
    backgroundColor: (ctx: ScriptableContext<'line'>) => gradientFill(ctx, `${CHART_ACCENT}66`),
    fill: true,
    borderWidth: 2.5,
    pointRadius: 0,
    pointHoverRadius: 4,
    pointHoverBackgroundColor: CHART_ACCENT,
    pointHoverBorderColor: '#fff',
  };
}

export type { ChartData, ChartOptions, ChartType };
