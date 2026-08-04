import { Component, inject, input, ChangeDetectorRef } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { ValidationMessagesComponent } from '../../../../shared/components/validation-messages/validation-messages.component';

@Component({
  selector: 'app-phone-number-input',
  standalone: true,
  imports: [ReactiveFormsModule, ValidationMessagesComponent],
  template: `
    <div class="phone-number-input mb-2">
      <label [for]="inputId()" class="form-label">{{ label() }}</label>
      <div class="input-group">
        @if (countryCode()) {
          <span class="input-group-text phone-prefix">{{ countryCode() }}</span>
        }
        <input
          [id]="inputId()"
          type="tel"
          class="form-control form-control-lg-custom"
          [class.is-invalid]="validationControl.invalid && (validationControl.dirty || validationControl.touched)"
          [placeholder]="placeholder()"
          [formControl]="control"
          (blur)="onBlur()"
          inputmode="numeric"
          autocomplete="tel-national"
        />
      </div>
      <app-validation-messages [control]="validationControl" />
    </div>
  `,
  styleUrl: './phone-number-input.component.scss',
})
export class PhoneNumberInputComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  readonly label = input<string>('Phone Number');
  readonly placeholder = input<string>('Enter phone number');
  readonly inputId = input<string>('phone');
  readonly countryCode = input<string>('');

  /** Internal view control — the parent form control (via NgControl) owns validators. */
  readonly control = new FormControl('');

  get validationControl(): AbstractControl {
    return this.ngControl?.control ?? this.control;
  }

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // NgControl pattern: register this component as the value accessor of the
    // parent FormControlName (avoids NG_VALUE_ACCESSOR circular dependency).
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
    this.control.valueChanges.subscribe((value) => {
      const digitsOnly = (value ?? '').replace(/\D/g, '');
      if (digitsOnly !== value) {
        this.control.setValue(digitsOnly, { emitEvent: false });
      }
      this.onChange(digitsOnly);
    });
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
    this.cdr.markForCheck();
  }
}
