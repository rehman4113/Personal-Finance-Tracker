import { animate, animateChild, query, style, transition, trigger } from '@angular/animations';

/**
 * Route transition: old view fades out, new view fades in with a slight
 * upward slide. Bind the trigger to the activated route (or a value that
 * changes on navigation) on a wrapper around <router-outlet>.
 */
export const routeTransition = trigger('routeTransition', [
  transition('* => *', [
    query(':enter', style({ opacity: 0, transform: 'translateY(14px)' }), { optional: true }),
    query(
      ':leave',
      [style({ opacity: 1 }), animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-8px)' }))],
      { optional: true },
    ),
    query(
      ':enter',
      [
        animate('360ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
        animateChild(),
      ],
      { optional: true },
    ),
  ]),
]);
