import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

import { AiInsight } from '../../core/models/enterprise.models';

@Component({
  selector: 'app-ai-insight-card',
  imports: [NgClass],
  template: `
    <article class="ai-card" [ngClass]="'ai-card--' + insight().tone">
      <div class="ai-card__eyebrow">
        <span>{{ insight().category }}</span>
        <strong>{{ insight().confidence }}</strong>
      </div>
      <h3>{{ insight().title }}</h3>
      <p>{{ insight().summary }}</p>
      <dl>
        <div>
          <dt>Why</dt>
          <dd>{{ insight().rationale }}</dd>
        </div>
        <div>
          <dt>Next step</dt>
          <dd>{{ insight().recommendation }}</dd>
        </div>
      </dl>
    </article>
  `
})
export class AiInsightCardComponent {
  readonly insight = input.required<AiInsight>();
}
