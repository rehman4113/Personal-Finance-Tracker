import { Component, HostListener, input, signal } from '@angular/core';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

/**
 * Generic dropdown menu wrapper.
 * WHY: user menu, filter menus, and row action menus reuse one accessible pattern.
 * Usage:
 *   <app-dropdown [backdrop]="true">   <- backdrop = full-screen tap-outside layer
 *     <button pfmDropdownTrigger>…</button>
 *     <div pfmDropdownMenu class="…">…items…</div>
 *   </app-dropdown>
 */
@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [ClickOutsideDirective],
  template: `
    <div class="pfm-dropdown" (appClickOutside)="close()">
      <ng-content select="[pfmDropdownTrigger]" />
      <div class="pfm-dropdown__menu" [class.pfm-dropdown__menu--open]="open()" (click)="close()">
        <ng-content select="[pfmDropdownMenu]" />
      </div>
      @if (open() && backdrop()) {
        <div class="pfm-dropdown__backdrop" aria-hidden="true" (click)="close()"></div>
      }
    </div>
  `,
  styleUrl: './dropdown.component.scss',
})
export class DropdownComponent {
  /** When true, an open menu shows a full-screen semi-transparent layer
   *  behind it (tap it to close) — used by the mobile profile dropdown. */
  readonly backdrop = input(false);

  readonly open = signal(false);

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}