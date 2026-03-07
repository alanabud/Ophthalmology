import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

import { ExecutiveMetric } from '../../core/models/enterprise.models';

@Component({
  selector: 'app-metric-card',
  imports: [NgClass],
  template: `
    <article class="metric-card" [ngClass]="'metric-card--' + metric().tone">
      <div class="metric-card__topline">
        <span>{{ metric().label }}</span>
        <strong>{{ metric().delta }}</strong>
      </div>
      <div class="metric-card__value">{{ metric().value }}</div>
      <p>{{ metric().detail }}</p>
      <div class="metric-card__spark">
        @for (bar of metric().spark; track $index) {
          <span [style.height.%]="bar * 8"></span>
        }
      </div>
    </article>
  `
})
export class MetricCardComponent {
  readonly metric = input.required<ExecutiveMetric>();
}
