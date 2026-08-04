import { Component, input, model } from '@angular/core';

export interface DateRange {
  from: string;
  to: string;
}

/**
 * From/to date picker (Section 14).
 * WHY: dashboard/report/table filters share one ranged date control.
 */
@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  template: `
    <div class="date-range d-inline-flex align-items-center gap-2">
      <div>
        <label class="form-label small mb-1 d-block">{{ fromLabel() }}</label>
        <input type="date" class="form-control form-control-sm" [value]="from()" (change)="onFrom($event)" />
      </div>
      <span class="text-muted mt-3 px-0">→</span>
      <div>
        <label class="form-label small mb-1 d-block">{{ toLabel() }}</label>
        <input type="date" class="form-control form-control-sm" [value]="to()" (change)="onTo($event)" />
      </div>
      @if (from() || to()) {
        <button type="button" class="btn btn-sm btn-link text-muted mt-3 p-0" (click)="clear()">
          Clear
        </button>
      }
    </div>
  `,
})
export class DateRangePickerComponent {
  readonly from = model<string>('');
  readonly to = model<string>('');
  readonly fromLabel = input<string>('From');
  readonly toLabel = input<string>('To');

  onFrom(event: Event): void {
    this.from.set((event.target as HTMLInputElement).value);
  }

  onTo(event: Event): void {
    this.to.set((event.target as HTMLInputElement).value);
  }

  clear(): void {
    this.from.set('');
    this.to.set('');
  }
}