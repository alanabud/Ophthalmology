import { NgClass, TitleCasePipe } from '@angular/common';
import { Component, input } from '@angular/core';

import { ExecutiveMetric } from '../../core/models/enterprise.models';

@Component({
  selector: 'app-metric-card',
  imports: [NgClass, TitleCasePipe],
  template: `
    <article
      class="metric-card"
      [ngClass]="['metric-card--' + metric().tone, 'metric-card--' + (metric().kind ?? 'status')]"
    >
      <div class="metric-card__topline">
        <span class="metric-card__kind">{{ (metric().kind ?? 'status') | titlecase }}</span>
        <strong>{{ metric().delta }}</strong>
      </div>
      <div class="metric-card__label">{{ metric().label }}</div>
      <div class="metric-card__value">{{ metric().value }}</div>
      <p>{{ metric().detail }}</p>

      @if (metric().details?.length) {
        <div class="metric-card__details">
          @for (detail of metric().details; track detail.label) {
            <div class="metric-card__detail" [ngClass]="detail.tone ? 'metric-card__detail--' + detail.tone : ''">
              <span>{{ detail.label }}</span>
              <strong>{{ detail.value }}</strong>
            </div>
          }
        </div>
      }

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
