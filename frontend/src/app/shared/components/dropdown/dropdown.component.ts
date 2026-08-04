import { Component, signal } from '@angular/core';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

/**
 * Generic dropdown menu wrapper.
 * WHY: user menu, filter menus, and row action menus reuse one accessible pattern.
 * Usage:
 *   <app-dropdown>
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
    </div>
  `,
  styleUrl: './dropdown.component.scss',
})
export class DropdownComponent {
  readonly open = signal(false);

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }
}