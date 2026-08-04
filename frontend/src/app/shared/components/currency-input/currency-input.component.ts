import { Component, input, inject, signal } from '@angular/core';
import { NgControl, ControlValueAccessor } from '@angular/forms';
import { currencySymbol, parseAmount } from '../../utils/money.utils';

/**
 * Money input: digits + thousand separators, 2 decimals, currency prefix.
 * WHY: amounts are numeric values in the model, formatted only on display.
 */
@Component({
  selector: 'app-currency-input',
  standalone: true,
  imports: [],
  template: `
    <div class="input-group">
      <span class="input-group-text">{{ symbol() }}</span>
      <input
        type="text"
        class="form-control form-control-lg-custom"
        [class.is-invalid]="invalid()"
        [placeholder]="placeholder()"
        inputmode="decimal"
        autocomplete="off"
        [value]="displayValue()"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
      />
    </div>
  `,
  styleUrl: './currency-input.component.scss',
})
export class CurrencyInputComponent implements ControlValueAccessor {
  readonly currency = input<string | null>('PKR');
  readonly placeholder = input<string>('0.00');
  readonly invalid = input<boolean>(false);

  private readonly ngControl = inject(NgControl, { optional: true, self: true });
  private modelValue: number | null = null;
  private editing = false;
  private editingValue = '';
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  readonly displayValue = signal('');

  constructor() {
    // Register this component as the value accessor of the parent form control.
    if (this.ngControl) this.ngControl.valueAccessor = this;
  }

  symbol(): string {
    return currencySymbol(this.currency());
  }

  writeValue(value: number | null | undefined): void {
    this.modelValue = value ?? null;
    this.refreshDisplay();
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {
    // Disabled state is managed by the parent form's disabled flag; the control
    // value is still bound. Kept as a no-op to satisfy the ControlValueAccessor.
  }

  onFocus(): void {
    this.editing = true;
    this.editingValue = this.modelValue === null ? '' : String(this.modelValue);
    this.refreshDisplay();
  }

  onBlur(): void {
    this.editing = false;
    this.onTouched();
    this.refreshDisplay();
  }

  onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.editingValue = this.sanitize(raw);
    const parsed = this.editingValue ? parseAmount(this.editingValue) : null;
    this.modelValue = parsed;
    this.onChange(parsed);
    this.refreshDisplay();
  }

  private sanitize(raw: string): string {
    let value = raw.replace(/[^\d.]/g, '');
    const firstDot = value.indexOf('.');
    if (firstDot !== -1) {
      value = value.slice(0, firstDot + 1) + value.slice(firstDot + 1).replace(/\./g, '');
      value = value.slice(0, firstDot + 3);
    }
    return value;
  }

  private refreshDisplay(): void {
    if (this.editing) {
      this.displayValue.set(this.editingValue);
      return;
    }
    this.displayValue.set(
      this.modelValue === null
        ? ''
        : this.modelValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    );
  }
}