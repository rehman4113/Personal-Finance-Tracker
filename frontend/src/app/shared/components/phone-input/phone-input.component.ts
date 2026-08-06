import { Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { COUNTRY_CODES } from '../../../features/auth/config/country-codes.config';
import {
  SearchableDropdownComponent,
  SearchableOption,
} from '../searchable-dropdown';
import { ValidationMessagesComponent } from '../validation-messages/validation-messages.component';

/**
 * Unified country-code + phone-number field.
 * WHY: register (and later Settings) need one bordered group — a searchable
 * country prefix (flag + dialing code, ~96px) and the phone input share a
 * single box, single label and a whole-group error state. The countryCode
 * form value stays on its own control (backend contract: separate fields).
 *
 * - CVA (NgControl pattern): the parent control owns validators; digits-only
 *   text is enforced on the internal view control.
 * - [countryCodeControl] is the sibling FormControl holding the dialing code
 *   (e.g. '+92'): the dropdown writes to it and mirrors its value.
 */
@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    SearchableDropdownComponent,
    ValidationMessagesComponent,
  ],
  templateUrl: './phone-input.component.html',
  styleUrl: './phone-input.component.scss',
})
export class PhoneInputComponent implements ControlValueAccessor, OnInit {
  private readonly ngControl = inject(NgControl, { optional: true, self: true });
  private readonly destroyRef = inject(DestroyRef);

  readonly label = input<string>('Phone Number');
  readonly placeholder = input<string>('3001234567');
  readonly inputId = input<string>('phone');
  /** Sibling control holding the dialing code ('+92'); the prefix writes into it. */
  readonly countryCodeControl = input<AbstractControl<string | null> | null>(null);

  /** Internal view control — the parent form control (via NgControl) owns validators. */
  readonly control = new FormControl('');
  readonly selectedCode = signal<string | null>('+92');

  readonly countryOptions: SearchableOption<string>[] = COUNTRY_CODES.map((option) => ({
    // name doubles as the closed-box label (flag + code) and is searchable;
    // the country name lives in the subtitle so it matches the open list too.
    value: option.dialingCode,
    name: option.dialingCode ? `${option.flag} ${option.dialingCode}` : option.flag,
    subtitle: option.country,
  }));

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  get validationControl(): AbstractControl {
    return this.ngControl?.control ?? this.control;
  }

  constructor() {
    // NgControl pattern: register this component as the value accessor of the
    // parent FormControlName (avoids NG_VALUE_ACCESSOR circular dependency).
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
    this.control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      const digitsOnly = (value ?? '').replace(/\D/g, '');
      if (digitsOnly !== value) {
        this.control.setValue(digitsOnly, { emitEvent: false });
      }
      this.onChange(digitsOnly);
    });
  }

  ngOnInit(): void {
    const countryControl = this.countryCodeControl();
    if (!countryControl) return;
    this.selectedCode.set(countryControl.value ?? '+92');
    countryControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.selectedCode.set(value ?? '+92');
    });
  }

  onCountryChange(value: string | null): void {
    this.selectedCode.set(value);
    this.countryCodeControl()?.setValue(value ?? '');
    this.countryCodeControl()?.markAsTouched();
  }

  writeValue(value: string): void {
    this.control.setValue(value ?? '', { emitEvent: false });
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.control.disable({ emitEvent: false });
    } else {
      this.control.enable({ emitEvent: false });
    }
  }

  onBlur(): void {
    this.onTouched();
    this.validationControl.markAsTouched();
  }
}
