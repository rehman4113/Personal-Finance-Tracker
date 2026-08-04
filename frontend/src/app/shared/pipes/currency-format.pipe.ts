import { Pipe, PipeTransform } from '@angular/core';
import { DEFAULT_CURRENCY, formatAmount } from '../utils/money.utils';

/**
 * Formats a number as a money string, e.g. "Rs 12,500.00".
 */
@Pipe({
  name: 'pfmCurrency',
  standalone: true,
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, currency?: string | null, withSign = false): string {
    return formatAmount(value, currency ?? DEFAULT_CURRENCY, withSign);
  }
}