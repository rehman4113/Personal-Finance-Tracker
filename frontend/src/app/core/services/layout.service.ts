import { Injectable, signal, computed } from '@angular/core';
import { STORAGE_KEYS } from '../constants/storage-keys.constants';

/**
 * App-shell layout state (Section 7 / §25).
 * WHY: Top navbar + sidebar + mobile drawer share collapse/open state. A single
 * signal-based service keeps the persisted collapsed preference in one place.
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  /** Desktop/tablet icon-only collapse — persisted to localStorage. */
  private readonly _collapsed = signal(localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true');
  /** Mobile off-canvas drawer state — never persisted. */
  private readonly _mobileOpen = signal(false);
  /** Whether the current viewport uses the mobile drawer layout. */
  private readonly _isMobile = signal(false);

  /**
   * Effective collapse. On mobile the drawer always renders full width — a
   * persisted desktop collapse must not shrink the off-canvas panel.
   */
  readonly collapsed = computed(() => (this._isMobile() ? false : this._collapsed()));
  readonly mobileOpen = this._mobileOpen.asReadonly();
  readonly isMobile = this._isMobile.asReadonly();

  setMobile(isMobile: boolean): void {
    this._isMobile.set(isMobile);
    if (!isMobile) {
      this._mobileOpen.set(false);
    }
  }

  toggleCollapsed(): void {
    this._collapsed.update((v) => {
      const next = !v;
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(next));
      return next;
    });
  }

  toggleMobile(): void {
    this._mobileOpen.update((v) => !v);
  }

  closeMobile(): void {
    this._mobileOpen.set(false);
  }

  /** Unified toggle — smart enough for whichever breakpoint is active. */
  toggle(): void {
    if (this._isMobile()) {
      this.toggleMobile();
    } else {
      this.toggleCollapsed();
    }
  }
}