import { Directive, ElementRef, effect, input } from '@angular/core';
import { formatAmount, formatCompact } from '../utils/money.utils';
import { prefersReducedMotion } from '../utils/motion.utils';

export type CountUpFormat = 'amount' | 'compact' | 'number';

/**
 * Animates a numeric value counting up (or down) to its target whenever it
 * changes or first renders — ease-out curve, ~1s by default.
 * WHY: one tiny directive powers every prominent currency/number in the app;
 * it respects prefers-reduced-motion (instant jump) and only re-runs when the
 * target value actually changes (no re-trigger on change-detection cycles).
 *
 * Usage: <span appCountUp [appCountUpValue]="balance" appCountUpFormat="amount" />
 */
@Directive({
  selector: '[appCountUp]',
  standalone: true,
})
export class CountUpDirective {
  /** Target numeric value. */
  readonly target = input.required<number, number>({
    alias: 'appCountUpValue',
    transform: (v) => (Number.isFinite(v) ? v : 0),
  });
  readonly duration = input<number, number>(1000, {
    alias: 'appCountUpDuration',
    transform: (v) => Math.max(80, v || 1000),
  });
  readonly format = input<CountUpFormat, CountUpFormat>('number', {
    alias: 'appCountUpFormat',
    transform: (v) => v || 'number',
  });
  readonly decimals = input<number, number>(0, {
    alias: 'appCountUpDecimals',
    transform: (v) => Math.max(0, v ?? 0),
  });
  readonly prefix = input<string, string>('', { alias: 'appCountUpPrefix', transform: (v) => v ?? '' });
  readonly suffix = input<string, string>('', { alias: 'appCountUpSuffix', transform: (v) => v ?? '' });

  private previousTarget = Number.NaN;
  private rafId: number | null = null;

  constructor(private readonly el: ElementRef<HTMLElement>) {
    effect(() => {
      const target = this.target();
      const from = this.previousTarget;
      this.previousTarget = target;
      if (from === target) return;
      this.animate(Number.isNaN(from) ? 0 : from, target);
    });
  }

  private animate(from: number, to: number): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (prefersReducedMotion()) {
      this.write(to);
      return;
    }

    const duration = this.duration();
    const start = performance.now();

    const step = (now: number): void => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      this.write(from + (to - from) * eased);
      this.rafId = progress < 1 ? requestAnimationFrame(step) : null;
    };

    this.rafId = requestAnimationFrame(step);
  }

  private write(value: number): void {
    const text = this.prefix() + this.formatValue(value) + this.suffix();
    if (this.el.nativeElement.textContent !== text) {
      this.el.nativeElement.textContent = text;
    }
  }

  private formatValue(value: number): string {
    switch (this.format()) {
      case 'amount':
        return formatAmount(value);
      case 'compact':
        return formatCompact(value);
      default:
        return value.toLocaleString('en-US', {
          minimumFractionDigits: this.decimals(),
          maximumFractionDigits: this.decimals(),
        });
    }
  }
}
