import {
  Component,
  input,
  signal,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { ValidationMessagesComponent } from '../../../../shared/components/validation-messages/validation-messages.component';
import {
  buildPasswordRequirements,
  computePasswordStrength,
  strengthLabel,
  strengthPercent,
} from '../../utils/password.utils';
import { PasswordRequirement } from '../../interfaces/password-requirement.interface';
import { PasswordStrength } from '../../config/password-rules.config';

@Component({
  selector: 'app-password-input',
  standalone: true,
  imports: [ReactiveFormsModule, ValidationMessagesComponent],
  templateUrl: './password-input.component.html',
  styleUrl: './password-input.component.scss',
})
export class PasswordInputComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  readonly label = input<string>('Password');
  readonly placeholder = input<string>('Enter password');
  readonly inputId = input<string>('password');
  readonly showStrength = input<boolean>(false);
  readonly showChecklist = input<boolean>(false);

  readonly visible = signal(false);
  readonly currentValue = signal('');
  readonly requirements = signal<PasswordRequirement[]>([]);
  readonly strength = signal<PasswordStrength>('weak');
  readonly strengthText = signal('Weak');
  readonly strengthWidth = signal(25);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  get validationControl(): AbstractControl {
    return this.ngControl?.control ?? new FormControl();
  }

  get hasValue(): boolean {
    return this.currentValue().length > 0;
  }

  writeValue(value: string): void {
    this.updateValueState(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cdr.markForCheck();
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateValueState(value);
    this.onChange(value);
  }

  private updateValueState(value: string): void {
    this.currentValue.set(value);
    this.requirements.set(buildPasswordRequirements(value));
    const s = computePasswordStrength(value);
    this.strength.set(s);
    this.strengthText.set(strengthLabel(s));
    this.strengthWidth.set(strengthPercent(s));
  }

  toggleVisibility(): void {
    this.visible.update((v) => !v);
  }

  onBlur(): void {
    this.onTouched();
    this.validationControl.markAsTouched();
    this.cdr.markForCheck();
  }
}
