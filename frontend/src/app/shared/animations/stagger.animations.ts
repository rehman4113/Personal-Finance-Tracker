import { animate, query, stagger, style, transition, trigger } from '@angular/animations';

/** Ease used everywhere — gentle "lift + settle" curve. */
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Staggered fade+slide entrance for lists/grids. Bind to the container that
 * holds the repeated items:
 *   <div [@staggerIn]> @for (item of items; track item.id) { … } </div>
 * WHY: queries `:enter` only, so it runs once per actual DOM entry (data
 * load, route enter) — never on plain change-detection cycles.
 */
export const staggerIn = trigger('staggerIn', [
  transition(':enter', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateY(14px)' }),
        stagger(70, animate(`420ms ${EASE}`, style({ opacity: 1, transform: 'translateY(0)' }))),
      ],
      { optional: true },
    ),
  ]),
]);

/** Single-group entrance (whole card/section fades in once). */
export const fadeSlideIn = trigger('fadeSlideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(16px) scale(0.985)' }),
    animate(`380ms ${EASE}`, style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
  ]),
]);
