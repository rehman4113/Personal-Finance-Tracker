import { Component, input, model } from '@angular/core';

/**
 * Debounced text search input (Section 11).
 * WHY: client-side filtering over loaded lists; typing pauses 300 ms before
 * the page re-filters.
 */
@Component({
  selector: 'app-search-bar',
  standalone: true,
  template: `
    <div class="search-bar">
      <i class="bi bi-search search-bar__icon"></i>
      <input
        type="search"
        class="form-control"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="onInput($event)"
        autocomplete="off"
      />
      @if (value()) {
        <button type="button" class="search-bar__clear" aria-label="Clear search" (click)="clear()">
          <i class="bi bi-x-circle"></i>
        </button>
      }
    </div>
  `,
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent {
  readonly placeholder = input<string>('Search…');
  readonly value = model<string>('');

  private timer: ReturnType<typeof setTimeout> | null = null;

  onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.value.set(raw), 300);
  }

  clear(): void {
    if (this.timer) clearTimeout(this.timer);
    this.value.set('');
  }
}