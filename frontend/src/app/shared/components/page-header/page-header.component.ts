import { Component, input } from '@angular/core';

/**
 * Page header with icon, title, subtitle and an actions slot (Section 14).
 * WHY: every feature page opens with the same header pattern.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="page-header">
      @if (icon()) {
        <div class="page-header__icon">
          <i [class]="'bi ' + icon()"></i>
        </div>
      }
      <div class="page-header__text">
        <h1 class="page-header__title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="page-header__subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="page-header__actions">
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly icon = input<string>('');
}