import { Component, forwardRef, input, signal } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from '@angular/forms';
import { COUNTRY_CODES } from '../../config/country-codes.config';
import {
  SearchableDropdownComponent,
  SearchableOption,
} from '../../../../shared/components/searchable-dropdown';

/**
 * Country code picker (Section: Auth forms) — now backed by the shared
 * searchable dropdown (type-to-filter, search + select only).
 * WHY: one combobox behavior app-wide; static enumeration → generic options.
 */
@Component({
  selector: 'app-country-code-dropdown',
  standalone: true,
  imports: [FormsModule, SearchableDropdownComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CountryCodeDropdownComponent),
      multi: true,
    },
  ],
  template: `
    <div class="country-code-dropdown">
      <label [for]="inputId()" class="form-label">{{ label() }}</label>
      <app-searchable-dropdown
        [options]="options()"
        placeholder="Select country code"
        [ngModel]="selectedCode()"
        (ngModelChange)="onSelect($event)"
      />
    </div>
  `,
})
export class CountryCodeDropdownComponent implements ControlValueAccessor {
  readonly label = input<string>('Country Code');
  readonly inputId = input<string>('countryCode');

  readonly selectedCode = signal('+92');

  private onChange: (value: string) => void = () => {};

  readonly options = signal<SearchableOption<string>[]>(
    COUNTRY_CODES.map((option) => ({
      value: option.dialingCode,
      name: option.dialingCode
        ? `${option.country} (${option.dialingCode})`
        : option.country,
    })),
  );

  writeValue(value: string): void {
    this.selectedCode.set(value || '+92');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(): void {
    // The shared dropdown marks the inner ngModel touched; the outer control
    // does not require touch tracking (value-only picker).
  }

  setDisabledState(): void {
    // handled via the shared dropdown's disabled input when needed
  }

  onSelect(value: string): void {
    this.selectedCode.set(value);
    this.onChange(value);
  }
}