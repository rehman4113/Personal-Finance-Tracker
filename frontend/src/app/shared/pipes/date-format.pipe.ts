import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats ISO/local date strings as "03 Aug 2026".
 * WHY: backend sends LocalDateTime; one pipe keeps date display consistent.
 */
@Pipe({
  name: 'pfmDate',
  standalone: true,
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, includeTime = false): string {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const opts: Intl.DateTimeFormatOptions = includeTime
      ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: 'short', year: 'numeric' };
    return new Intl.DateTimeFormat('en-GB', opts).format(date);
  }
}