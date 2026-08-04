import { Component, input } from '@angular/core';

@Component({
  selector: 'app-submit-button',
  standalone: true,
  template: `
    <button
      type="submit"
      class="btn btn-lg w-100"
      [class.btn-primary-gradient]="variant() === 'primary'"
      [class.btn-outline-primary]="variant() === 'outline'"
      [disabled]="disabled() || loading()"
    >
      @if (loading()) {
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      }
      @if (icon() && !loading()) {
        <i [class]="'bi ' + icon() + ' me-2'"></i>
      }
      {{ label() }}
    </button>
  `,
  styleUrl: './submit-button.component.scss',
})
export class SubmitButtonComponent {
  readonly label = input.required<string>();
  readonly loading = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly variant = input<'primary' | 'outline'>('primary');
  readonly icon = input<string>('');
}
