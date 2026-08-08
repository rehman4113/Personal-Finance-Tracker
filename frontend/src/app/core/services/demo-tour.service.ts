import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { driver, type Driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { AuthenticationService } from '../../features/auth/services/authentication.service';
import { FINANCE_ROUTES } from '../constants/finance-routes.constants';

/**
 * Onboarding demo tour (driver.js spotlight): Wallets → New Transaction →
 * Wallet Transfers → Budgets → done.
 * WHY: runs automatically once for users whose `demo` flag is still false,
 * and can be re-triggered at any time from Settings ("Replay Tour"). Finishing
 * or skipping the tutorial flips the flag via the existing demo-complete API.
 */
@Injectable({ providedIn: 'root' })
export class DemoTourService {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthenticationService);

  private _driver: Driver | null = null;
  private _autoShown = false;

  /** Auto-runs only when the user has not finished the tour yet. */
  shouldAutoShow(): boolean {
    return !this._autoShown && this.authService.getCurrentUser()?.demo === false;
  }

  start(replay = false): void {
    if (this._driver?.isActive()) return;
    this._autoShown = true;

    const steps: DriveStep[] = [
      {
        element: '[data-tour="/wallets"]',
        popover: {
          title: 'Wallets',
          description: 'Your money lives in wallets — cash, bank, cards. Create one here; an opening balance is logged automatically.',
          side: 'right',
        },
      },
      {
        element: '[data-tour="/transactions/create"]',
        popover: {
          title: 'New Transaction',
          description: 'Record incomes, expenses, loans and transfers from one screen — just pick the type below.',
          side: 'right',
        },
      },
      {
        element: '[data-tour="new-tx-transfer"]',
        waitForElement: 3000,
        skipMissingElement: true,
        onHighlightStarted: () => {
          if (this.router.url !== FINANCE_ROUTES.CREATE_TRANSACTION) {
            void this.router.navigateByUrl(FINANCE_ROUTES.CREATE_TRANSACTION);
          }
        },
        popover: {
          title: 'Wallet Transfers',
          description: 'Moving money between your own wallets is a Wallet Transfer — no income or expense is recorded.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="/budgets"]',
        popover: {
          title: 'Budgets',
          description: 'Set a monthly budget per purpose and track your spending against the limit.',
          side: 'right',
        },
      },
    ];

    this._driver = driver({
      steps,
      animate: true,
      smoothScroll: true,
      showProgress: true,
      progressText: 'Step {{current}} of {{total}}',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Done',
      overlayColor: 'rgba(11, 17, 32, 0.85)',
      overlayOpacity: 0.85,
      popoverClass: 'pfm-tour-popover',
      onDestroyed: () => {
        this._driver = null;
        if (!replay) {
          this.authService.markDemoCompleted().subscribe({ error: () => undefined });
        }
      },
    });
    this._driver.drive();
  }

  destroy(): void {
    this._driver?.destroy();
    this._driver = null;
  }
}