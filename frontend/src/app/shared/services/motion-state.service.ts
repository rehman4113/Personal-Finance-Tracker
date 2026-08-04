import { Injectable, signal } from '@angular/core';
import { isDesktopPointer, prefersReducedMotion } from '../utils/motion.utils';

/**
 * Reactive motion-state singleton — the single Angular-side source of truth
 * for prefers-reduced-motion and pointer fidelity, so every component guards
 * its animations from one place instead of per-component.
 */
@Injectable({ providedIn: 'root' })
export class MotionState {
  /** True when the OS requests reduced motion — disable Angular animations. */
  readonly reduced = signal(prefersReducedMotion());

  /** True on fine-pointer/hover devices (desktop) — enables parallax etc. */
  readonly desktopPointer = signal(isDesktopPointer());

  constructor() {
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedQuery.addEventListener('change', (e) => this.reduced.set(e.matches));

    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    pointerQuery.addEventListener('change', (e) => this.desktopPointer.set(e.matches));
  }
}
