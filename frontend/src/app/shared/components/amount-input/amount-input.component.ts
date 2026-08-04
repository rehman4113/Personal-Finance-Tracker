import { Component, input, inject, signal } from '@angular/core';
import { NgControl, ControlValueAccessor } from '@angular/forms';
import { parseAmount } from '../../utils/money.utils';

/**
 * Plain numeric amount input (no currency suffix/prefix).
 * WHY: budgets warn thresholds, percentages and plain amounts reuse this.
 */
@Component({
  selector: 'app-amount-input',
  standalone: true,
  template: `
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
  `,
  styleUrl: './amount-input.component.scss',
})
export class AmountInputComponent implements ControlValueAccessor {
  readonly placeholder = input<string>('0');
  readonly invalid = input<boolean>(false);
  readonly suffix = input<string>('');

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
    // no-op — parent controls disabled state.
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
      this.modelValue === null ? '' : this.modelValue.toLocaleString('en-US', { maximumFractionDigits: 2 }),
    );
  }
}