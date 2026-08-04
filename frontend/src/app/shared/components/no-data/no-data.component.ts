import { Component, input } from '@angular/core';

/**
 * Compact "no rows" placeholder for tables.
 * WHY: smaller than empty-state; fits inside a table body.
 */
@Component({
  selector: 'app-no-data',
  standalone: true,
  template: `
    <div class="no-data">
      <i [class]="'bi ' + icon()"></i>
      <span>{{ message() }}</span>
    </div>
  `,
  styleUrl: './no-data.component.scss',
})
export class NoDataComponent {
  readonly message = input<string>('No records found');
  readonly icon = input<string>('bi-inbox');
}