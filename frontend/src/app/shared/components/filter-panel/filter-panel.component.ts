import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SearchableDropdownComponent, SearchableOption } from '../searchable-dropdown';

/** One configurable filter control rendered by the panel. */
export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date';
  placeholder?: string;
  options?: { value: string | number | null; label: string }[];
  /**
   * Key of another field this one cascades from: whenever the dependency
   * changes, this field's value is reset (e.g. Sub-Category → Purpose → Type).
   */
  dependsOn?: string;
}

/** Values map: key → raw filter value (null means no filter). */
export type FilterValues = Record<string, string | number | null>;

/**
 * Configurable filter bar (Section 11/14).
 * WHY: transactions, wallets, budgets and reports reuse the same filter UI —
 * fields are declared in config, never duplicated in templates.
 * Select filters render the shared searchable dropdown (search + pick only;
 * no create/delete on filters).
 */
@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [FormsModule, SearchableDropdownComponent],
  template: `
    <div class="filter-panel">
      <div class="filter-panel__fields">
        @for (field of fields(); track field.key) {
          <div class="filter-panel__field">
            @switch (field.type) {
              @case ('select') {
                <label class="form-label small mb-1">{{ field.label }}</label>
                <app-searchable-dropdown
                  size="sm"
                  [options]="searchableOptions(field)"
                  [placeholder]="'All ' + field.label"
                  [clearable]="true"
                  [ngModel]="stringify(values()[field.key])"
                  (ngModelChange)="onSelect(field.key, $event)"
                />
              }
              @case ('date') {
                <label class="form-label small mb-1">{{ field.label }}</label>
                <input
                  type="date"
                  class="form-control form-control-sm"
                  [value]="stringify(values()[field.key])"
                  (change)="onText(field.key, $event)"
                />
              }
              @default {
                <label class="form-label small mb-1">{{ field.label }}</label>
                <input
                  type="text"
                  class="form-control form-control-sm"
                  [value]="stringify(values()[field.key])"
                  (input)="onText(field.key, $event)"
                />
              }
            }
          </div>
        }
        <div class="filter-panel__actions">
          <button type="button" class="btn btn-sm btn-outline-secondary" (click)="reset()">
            <i class="bi bi-x-circle me-1"></i>Reset
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './filter-panel.component.scss',
})
export class FilterPanelComponent {
  readonly fields = input<FilterField[]>([]);

  private readonly _values = signal<FilterValues>({});
  /** Emits on every change; null means "no filter". */
  readonly filtersChange = output<FilterValues>();

  constructor() {
    // Drop values whose field disappeared from the config (cascading filters
    // hide dependent fields when their parent select is empty).
    effect(() => {
      const keys = new Set(this.fields().map((f) => f.key));
      this._values.update((v) => {
        const stale = Object.keys(v).filter((k) => !keys.has(k));
        if (!stale.length) return v;
        const next = { ...v };
        for (const k of stale) delete next[k];
        return next;
      });
    });
  }

  values(): FilterValues {
    return this._values();
  }

  /** Select field options as generic searchable options (string values). */
  searchableOptions(field: FilterField): SearchableOption<string>[] {
    const all: SearchableOption<string> = { value: '', name: `All ${field.label}` };
    const items =
      (field.options ?? []).map((o) => ({
        value: o.value == null ? '' : String(o.value),
        name: o.label,
      }));
    return [all, ...items];
  }

  stringify(value: string | number | null | undefined): string {
    return value == null ? '' : String(value);
  }

  onSelect(key: string, raw: string): void {
    const parsed: string | null = raw === '' ? null : raw;
    this._values.update((v) => {
      const next = { ...v, [key]: parsed };
      for (const field of this.fields()) {
        if (field.dependsOn === key && field.key !== key) delete next[field.key];
      }
      return next;
    });
    this.filtersChange.emit(this._values());
  }

  onText(key: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this._values.update((v) => ({ ...v, [key]: value }));
    this.filtersChange.emit(this._values());
  }

  reset(): void {
    this._values.set({});
    this.filtersChange.emit({});
  }
}