import {
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { ElementRef } from '@angular/core';
import { AbstractControl, ControlValueAccessor, FormControl, NgControl } from '@angular/forms';

/**
 * Segmented OTP input (shared auth/verification primitive).
 * 6 individual digit boxes with auto-advance focus, backspace rollback,
 * arrow-key navigation and full-code paste support. Plugs into reactive
 * forms as a ControlValueAccessor (NgControl self-injection pattern,
 * same as PasswordInputComponent).
 */
@Component({
  selector: 'app-otp-input',
  standalone: true,
  template: `
    <div
      class="pfm-otp"
      [class.pfm-otp--invalid]="isInvalid()"
      (paste)="onPaste($event)"
      role="group"
      aria-label="Verification code"
    >
      @for (i of indices(); track i) {
        <input
          #box
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="1"
          class="pfm-otp__box"
          [disabled]="disabled()"
          [value]="boxes()[i]"
          (input)="onInput(i, $event)"
          (keydown)="onKeydown(i, $event)"
          (blur)="onBlur()"
          [attr.aria-label]="'Digit ' + (i + 1) + ' of ' + length()"
        />
      }
    </div>
  `,
  styleUrl: './otp-input.component.scss',
})
export class OtpInputComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  readonly length = input<number>(6);

  readonly boxes = signal<string[]>([]);
  readonly disabled = signal(false);
  private readonly boxEls = viewChildren<ElementRef<HTMLInputElement>>('box');

  readonly indices = computed(() => Array.from({ length: this.length() }, (_, i) => i));

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
    this.boxes.set(new Array(this.length()).fill(''));
  }

  get validationControl(): AbstractControl {
    return this.ngControl?.control ?? new FormControl();
  }

  writeValue(value: string | null): void {
    const digits = String(value ?? '').replace(/\D/g, '');
    const arr = new Array(this.length()).fill('');
    [...digits].slice(0, this.length()).forEach((d, i) => {
      arr[i] = d;
    });
    this.boxes.set(arr);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    this.cdr.markForCheck();
  }

  onInput(i: number, event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const digit = /\d/.test(raw) ? raw.slice(-1) : '';
    const arr = [...this.boxes()];
    arr[i] = digit;
    this.boxes.set(arr);
    (event.target as HTMLInputElement).value = arr[i];
    if (digit && i < this.length() - 1) {
      this.focusBox(i + 1);
    }
    this.emit();
  }

  onKeydown(i: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const arr = [...this.boxes()];
      if (arr[i]) {
        arr[i] = '';
        this.boxes.set(arr);
        this.emit();
      }
      if (i > 0) {
        this.focusBox(i - 1);
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (i > 0) this.focusBox(i - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (i < this.length() - 1) this.focusBox(i + 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') ?? '';
    const digits = text.replace(/\D/g, '').slice(0, this.length());
    const arr = new Array(this.length()).fill('');
    [...digits].forEach((d, i) => {
      arr[i] = d;
    });
    this.boxes.set(arr);
    this.focusBox(Math.min(digits.length, this.length() - 1));
    this.emit();
  }

  onBlur(): void {
    this.onTouched();
    this.validationControl.markAsTouched();
    this.cdr.markForCheck();
  }

  isInvalid(): boolean {
    const ctrl = this.validationControl;
    return !!(ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  private focusBox(i: number): void {
    const el = this.boxEls()[i];
    el?.nativeElement.focus();
  }

  private emit(): void {
    this.onChange(this.boxes().join(''));
  }
}
