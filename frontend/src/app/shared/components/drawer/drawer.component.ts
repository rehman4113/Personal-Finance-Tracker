import { Component, input, model } from '@angular/core';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

/**
 * Right-side slide-over drawer (transaction details, ledger, quick forms).
 * WHY: keeps context visible while inspecting/editing a record.
 * Two-way bind `open` or listen for (openChange).
 */
@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [LoadingSpinnerComponent],
  template: `
    @if (open()) {
      <div class="drawer" [class]="'drawer--' + size()">
        <div class="drawer__scrim" (click)="dismiss()"></div>
        <aside class="drawer__panel" role="dialog" aria-modal="true">
          <header class="drawer__header">
            <h3 class="drawer__title">
              @if (icon()) {
                <i [class]="'bi ' + icon() + ' me-2'"></i>
              }
              {{ title() }}
            </h3>
            <button type="button" class="drawer__close" aria-label="Close" (click)="dismiss()">
              <i class="bi bi-x-lg"></i>
            </button>
          </header>
          <div class="drawer__body">
            @if (loading()) {
              <app-loading-spinner message="Loading…" />
            } @else {
              <ng-content />
            }
          </div>
          @if (hasFooter()) {
            <footer class="drawer__footer">
              <ng-content select="[pfmDrawerFooter]" />
            </footer>
          }
        </aside>
      </div>
    }
  `,
  styleUrl: './drawer.component.scss',
})
export class DrawerComponent {
  readonly open = model(false);
  readonly title = input.required<string>();
  readonly icon = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly loading = input<boolean>(false);
  readonly hasFooter = input<boolean>(false);

  dismiss(): void {
    this.open.set(false);
  }
}