/** Motion helpers — single source of truth for the prefers-reduced-motion
 *  guard so CSS, Angular animations, Chart.js and JS-driven effects all agree.
 *  WHY: accessibility first; every animation in the app defers to this flag. */
const REDUCED_QUERY = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Whether the OS asks for reduced motion. */
export function prefersReducedMotion(): boolean {
  return REDUCED_QUERY.matches;
}

/** Chart.js animation duration — 0 when reduced motion is requested. */
export function motionDuration(ms: number): number {
  return prefersReducedMotion() ? 0 : ms;
}

/** Whether the device has a fine pointer + hover (desktop-like). */
export function isDesktopPointer(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}
