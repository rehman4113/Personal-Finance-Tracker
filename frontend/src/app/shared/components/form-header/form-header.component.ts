import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-header',
  standalone: true,
  template: `
    <div class="form-header text-center mb-3">
      @if (icon()) {
        <div class="form-header__icon mb-2">
          <i [class]="'bi ' + icon()"></i>
        </div>
      }
      <h1 class="form-header__title h4 mb-1">{{ title() }}</h1>
      @if (subtitle()) {
        <p class="form-header__subtitle text-muted mb-0">{{ subtitle() }}</p>
      }
    </div>
  `,
  styleUrl: './form-header.component.scss',
})
export class FormHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly icon = input<string>('bi-shield-lock');
}
