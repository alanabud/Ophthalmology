import { NgClass } from '@angular/common';
import { Component, ElementRef, HostListener, computed, input, output, signal } from '@angular/core';

export interface EnterpriseSelectOption {
  value: string;
  label: string;
  meta?: string;
  tone?: 'accent' | 'success' | 'warning' | 'critical' | 'neutral' | 'info';
}

@Component({
  selector: 'app-enterprise-select',
  imports: [NgClass],
  templateUrl: './enterprise-select.component.html',
  styleUrl: './enterprise-select.component.scss'
})
export class EnterpriseSelectComponent {
  readonly options = input.required<EnterpriseSelectOption[]>();
  readonly value = input.required<string>();
  readonly ariaLabel = input.required<string>();
  readonly placeholder = input('Select option');
  readonly compact = input(false);
  readonly valueChange = output<string>();

  protected readonly open = signal(false);
  protected readonly selectedOption = computed(
    () => this.options().find((option) => option.value === this.value()) ?? null
  );

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Node && !this.elementRef.nativeElement.contains(target)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    this.open.set(false);
  }

  protected toggle(): void {
    this.open.update((current) => !current);
  }

  protected openMenu(): void {
    this.open.set(true);
  }

  protected selectOption(optionValue: string): void {
    this.valueChange.emit(optionValue);
    this.open.set(false);
  }
}
