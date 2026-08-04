import { Directive, HostListener, inject } from '@angular/core';
import { DropdownComponent } from './dropdown.component';

/**
 * Marks projected content as a dropdown trigger (toggles the parent menu).
 * WHY: the trigger must communicate with its own DropdownComponent instance.
 */
@Directive({
  selector: '[pfmDropdownTrigger]',
  standalone: true,
})
export class DropdownTriggerDirective {
  private readonly dropdown = inject(DropdownComponent);

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    event.stopPropagation();
    this.dropdown.toggle();
  }
}