import { Directive, ElementRef, EventEmitter, HostListener, inject, Output } from '@angular/core';

/**
 * Calls the bound output when a click lands outside the host element.
 * WHY: dropdowns and drawers need dismiss-on-outside-click.
 */
@Directive({
  selector: '[appClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  @Output() appClickOutside = new EventEmitter<void>();

  private readonly element = inject(ElementRef<HTMLElement>);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as Node | null;
    if (target && this.element.nativeElement.contains(target)) {
      return;
    }
    this.appClickOutside.emit();
  }
}