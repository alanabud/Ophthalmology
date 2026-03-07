import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

import { SurfaceTone } from '../../core/models/enterprise.models';

@Component({
  selector: 'app-status-chip',
  imports: [NgClass],
  template: `
    <span class="status-chip" [ngClass]="'status-chip--' + tone()">{{ label() }}</span>
  `
})
export class StatusChipComponent {
  readonly label = input.required<string>();
  readonly tone = input<SurfaceTone>('neutral');
}
