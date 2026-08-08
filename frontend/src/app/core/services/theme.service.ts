import { Injectable, signal } from '@angular/core';
import { STORAGE_KEYS } from '../constants/storage-keys.constants';

export type AppTheme = 'dark' | 'light';

/**
 * Theme service — Section 9.
 * WHY: stores the active theme persisted to localStorage and reflects it on
 * the .app-shell element (data-theme attribute) so the SCSS token set picks
 * the dark or light variant. Defaults to dark (the app shell's design).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly theme = signal<AppTheme>(this.readInitial());
  readonly current = this.theme.asReadonly();

  private applied = false;

  constructor() {
    this.apply(this.theme());
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(next: AppTheme): void {
    this.theme.set(next);
    localStorage.setItem(STORAGE_KEYS.THEME, next);
    this.apply(next);
  }

  private readInitial(): AppTheme {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    return stored === 'light' ? 'light' : 'dark';
  }

  private apply(mode: AppTheme): void {
    const shell = document.querySelector('.app-shell');
    if (!shell) {
      // Shell mounts after login; retry on first real init.
      if (!this.applied) window.setTimeout(() => this.apply(this.theme()), 0);
      return;
    }
    this.applied = true;
    shell.setAttribute('data-theme', mode);
  }
}