import {
  Component,
  forwardRef,
  input,
  signal,
  computed,
  ElementRef,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { SearchableOption } from './searchable-option.model';

/** Special row rendered first when "create" is available for the typed query. */
const CREATE_TOKEN = Symbol('create');

type AnyOption = SearchableOption<string | number>;
type Row = AnyOption | typeof CREATE_TOKEN;

/**
 * Reusable searchable + creatable combobox (ControlValueAccessor).
 * WHY: every data dropdown in the app (purpose, wallet, status filters,
 * wallet type, country code…) shares one behavior — type to filter, keyboard
 * navigation, optional inline create/delete — without duplicating inputs.
 *
 * - Filter-as-you-type over name (+ subtitle).
 * - ↑/↓ move the highlight, Enter selects (or creates), Esc closes.
 * - [allowCreate] shows a "+ Create '<term>'" row that calls the injected
 *   create handler and auto-selects the created option in place.
 * - [allowDelete] shows a ✕ per option (when deletable !== false) behind a
 *   confirm dialog; success removes the option in place and clears the form
 *   value if the deleted option was selected.
 * - Works with formControlName/formControl/ngModel (NG_VALUE_ACCESSOR).
 */
@Component({
  selector: 'app-searchable-dropdown',
  standalone: true,
  imports: [ClickOutsideDirective, ConfirmDialogComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableDropdownComponent),
      multi: true,
    },
  ],
  templateUrl: './searchable-dropdown.component.html',
  styleUrl: './searchable-dropdown.component.scss',
})
export class SearchableDropdownComponent<V extends string | number = number>
  implements ControlValueAccessor
{
  readonly options = input<SearchableOption<V>[]>([]);
  readonly placeholder = input<string>('Select…');
  readonly invalid = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly clearable = input<boolean>(false);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly allowCreate = input<boolean>(false);
  readonly allowDelete = input<boolean>(false);
  readonly createLabel = input<string>('Create');
  readonly createHandler = input<((term: string) => Observable<SearchableOption<V>>) | null>(null);
  readonly deleteHandler = input<((option: SearchableOption<V>) => Observable<void>) | null>(null);
  /** Multi-select mode: emits arrays of values and renders selected chips. */
  readonly multiple = input<boolean>(false);

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('filterInput');

  readonly open = signal(false);
  readonly query = signal('');
  readonly highlight = signal(-1);
  readonly creating = signal(false);
  readonly deleteOpen = signal(false);
  readonly deleteTarget = signal<AnyOption | null>(null);
  readonly deleting = signal(false);

  private readonly localOptions = signal<SearchableOption<V>[]>([]);
  readonly selected = signal<V | null>(null);
  readonly selectedMulti = signal<V[]>([]);

  private onChangeFn: (value: V | null | V[]) => void = () => {};
  private onTouchedFn: () => void = () => {};

  /** Row list rendered inside the open panel: optional create row + matches. */
  readonly rows = computed<Row[]>(() => {
    const term = this.query().trim().toLowerCase();
    const matches = term
      ? this.localOptions().filter((o) =>
          `${o.name} ${o.subtitle ?? ''}`.toLowerCase().includes(term),
        )
      : this.localOptions();
    return this.createVisible(term, matches)
      ? [CREATE_TOKEN, ...matches]
      : matches;
  });

  readonly selectedLabel = computed(() => {
    const value = this.selected();
    if (value === null || value === undefined || value === '') return '';
    const found = this.localOptions().find((o) => String(o.value) === String(value));
    return found?.name ?? '';
  });

  readonly isMulti = computed(() => this.multiple() && !this.disabled());

  readonly selectedLabels = computed(() => {
    if (!this.isMulti()) return [];
    const labels = this.selectedMulti()
      .map((v) => this.localOptions().find((o) => String(o.value) === String(v))?.name)
      .filter((n): n is string => !!n);
    return this.selectedMulti().map((v, i) => ({
      value: v,
      label: labels[i] ?? String(v),
    }));
  });

  // ------------------------------------------------------------------
  // ControlValueAccessor
  // ------------------------------------------------------------------

  writeValue(value: V | V[] | null | undefined): void {
    if (Array.isArray(value)) {
      this.selectedMulti.set(value);
      this.selected.set(null);
    } else {
      this.selected.set((value ?? null) as V | null);
      this.selectedMulti.set([]);
    }
    this.query.set('');
    this.highlight.set(-1);
  }

  registerOnChange(fn: (value: V | null | V[]) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) this.open.set(false);
  }

  // ------------------------------------------------------------------
  // Behavior
  // ------------------------------------------------------------------

  toggleBox(): void {
    if (this.disabled()) return;
    if (this.open()) {
      this.close();
    } else {
      this.syncLocalOptions();
      this.open.set(true);
      this.highlight.set(-1);
      setTimeout(() => this.inputEl()?.nativeElement.focus(), 0);
    }
  }

  close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.query.set('');
    this.highlight.set(-1);
    this.onTouchedFn();
  }

  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.highlight.set(-1);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlight.set(Math.min(this.highlight() + 1, this.rows().length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlight.set(Math.max(this.highlight() - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const row = this.rows()[this.highlight()];
      if (row === undefined) return;
      if (row === CREATE_TOKEN) {
        this.create();
      } else {
        this.select(row);
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  select(option: AnyOption): void {
    if (this.multiple()) {
      const value = option.value as V;
      const current = this.selectedMulti();
      const next = current.some((v) => String(v) === String(value))
        ? current.filter((v) => String(v) !== String(value))
        : [...current, value];
      this.selectedMulti.set(next);
      this.onChangeFn(next);
      this.query.set('');
      this.highlight.set(-1);
      this.onTouchedFn();
      return;
    }
    this.selected.set(option.value as V);
    this.onChangeFn(option.value as V);
    this.query.set('');
    this.highlight.set(-1);
    this.open.set(false);
    this.onTouchedFn();
  }

  removeChip(value: V, event: Event): void {
    event.stopPropagation();
    if (this.disabled()) return;
    const next = this.selectedMulti().filter((v) => String(v) !== String(value));
    this.selectedMulti.set(next);
    this.onChangeFn(next);
    if (next.length === 0) this.close();
  }

  clear(event?: Event): void {
    event?.stopPropagation();
    if (this.disabled()) return;
    if (this.multiple()) {
      this.selectedMulti.set([]);
      this.onChangeFn([]);
      this.query.set('');
      return;
    }
    this.selected.set(null);
    this.onChangeFn(null);
    this.query.set('');
  }

  create(): void {
    const handler = this.createHandler();
    const term = this.query().trim();
    if (!handler || !term || this.creating()) return;
    this.creating.set(true);
    handler(term).subscribe({
      next: (option) => {
        this.creating.set(false);
        // Add in place (the service also refreshes master data — merge, no dup).
        this.localOptions.update((list) =>
          list.some((o) => String(o.value) === String(option.value))
            ? list
            : [...list, option],
        );
        this.select(option);
      },
      error: () => {
        // Keep the dropdown open so the user can retry; the error was already
        // toasted by the feature service (existing toast pattern).
        this.creating.set(false);
      },
    });
  }

  requestDelete(option: AnyOption, event: Event): void {
    event.stopPropagation();
    if (!this.deleteHandler()) return;
    this.deleteTarget.set(option);
    this.deleteOpen.set(true);
  }

  confirmDelete(): void {
    const option = this.deleteTarget();
    const handler = this.deleteHandler();
    if (!option || !handler) return;
    this.deleting.set(true);
    handler(option as SearchableOption<V>).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteOpen.set(false);
        this.deleteTarget.set(null);
        this.localOptions.update((list) =>
          list.filter((o) => String(o.value) !== String(option.value)),
        );
        if (String(this.selected()) === String(option.value)) {
          this.selected.set(null);
          this.onChangeFn(null);
        }
        if (this.multiple()) {
          const next = this.selectedMulti().filter((v) => String(v) !== String(option.value));
          this.selectedMulti.set(next);
          this.onChangeFn(next);
        }
      },
      error: () => {
        // Option stays; the feature service toasted the backend message.
        this.deleting.set(false);
        this.deleteOpen.set(false);
        this.deleteTarget.set(null);
      },
    });
  }

  cancelDelete(): void {
    this.deleteOpen.set(false);
    this.deleteTarget.set(null);
  }

  deleteMessage(): string {
    const name = this.deleteTarget()?.name ?? '';
    return `Delete '${name}'? This action cannot be undone.`;
  }

  isCreateRow(row: Row): row is typeof CREATE_TOKEN {
    return row === CREATE_TOKEN;
  }

  isOptionRow(row: Row): row is AnyOption {
    return row !== CREATE_TOKEN;
  }

  isHighlighted(index: number): boolean {
    return this.highlight() === index;
  }

  /** Stable track key: delete buttons re-render only when the option changes. */
  trackRow(row: Row): string {
    return this.isCreateRow(row) ? `create:${this.query()}` : `opt:${row.value}`;
  }

  /** Multi-select: is a given option currently chosen? */
  isMultiSelected(value: string | number): boolean {
    return this.selectedMulti().some((v) => String(v) === String(value));
  }

  onTouched(): void {
    this.onTouchedFn();
  }

  str(value: string | number | null | undefined): string {
    return value == null ? '' : String(value);
  }

  private createVisible(term: string, matches: SearchableOption<V>[]): boolean {
    if (!this.allowCreate() || !this.createHandler() || !term) return false;
    const lower = term.toLowerCase();
    const exact = this.localOptions().some(
      (o) => o.name.toLowerCase() === lower || String(o.value).toLowerCase() === lower,
    );
    return !exact && !matches.some((o) => o.name.toLowerCase() === lower);
  }

  private syncLocalOptions(): void {
    const incoming = this.options();
    this.localOptions.update((current) => {
      if (current.length === 0 || current.length !== incoming.length) return incoming;
      const keyOf = (v: string | number) => String(v);
      const incomingKeys = new Set(incoming.map((o) => keyOf(o.value)));
      const currentKeys = new Set(current.map((o) => keyOf(o.value)));
      if (
        incomingKeys.size === currentKeys.size &&
        [...incomingKeys].every((k) => currentKeys.has(k))
      ) {
        return current;
      }
      return incoming;
    });
  }
}
