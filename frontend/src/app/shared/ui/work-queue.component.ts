import { Component, computed, input, output, signal } from '@angular/core';

import { ClinicalNote, WorkAudit } from '../../core/models/enterprise.models';

export type WorkTone = 'ok' | 'warning' | 'critical' | 'info' | 'neutral';

export interface WorkField { k: string; v: string; tone?: WorkTone; }
export interface WorkAction { id: string; label: string; tone?: 'primary' | 'danger' | 'default'; disabled?: boolean; }

export interface WorkItem {
  id: string;
  name: string;
  mrn: string;
  line1: string;            // test type / diagnosis summary
  status: string;
  statusTone: WorkTone;
  fields: WorkField[];
  blockers: string[];
  checklist: { label: string; done: boolean; required: boolean }[];
  notes: ClinicalNote[];
  audit: WorkAudit[];
  actions: WorkAction[];
}

export interface WorkFilter { id: string; label: string; count: number; }

/**
 * Reusable operational work queue with a detail drawer, note composer,
 * audit trail, and configurable action buttons. Pure presentational —
 * the parent owns data derivation, filtering and action handling.
 */
@Component({
  selector: 'app-work-queue',
  styleUrl: './work-queue.component.scss',
  template: `
    <section class="wq">
      <header class="wq__hd">
        <div>
          <h2 class="wq__title">{{ title() }}</h2>
          <p class="wq__sub">{{ subtitle() }}</p>
        </div>
      </header>

      <div class="wq__filters">
        @for (f of filters(); track f.id) {
          <button class="wqf" [class.wqf--on]="activeFilter() === f.id" type="button" (click)="filterChange.emit(f.id)">
            {{ f.label }} <span class="wqf__n">{{ f.count }}</span>
          </button>
        }
      </div>

      @if (items().length) {
        <div class="wq__list">
          @for (it of items(); track it.id) {
            <button class="wqi" [class.wqi--on]="selectedId() === it.id" type="button" (click)="open(it.id)">
              <span class="wqi__av wqi__av--{{ it.statusTone }}">{{ it.name.charAt(0) }}</span>
              <span class="wqi__main">
                <strong>{{ it.name }}</strong>
                <span class="wqi__line">{{ it.line1 }}</span>
              </span>
              <span class="wqi__right">
                <span class="wqi__status wqi__status--{{ it.statusTone }}">{{ it.status }}</span>
                @if (it.blockers.length) { <span class="wqi__blk">{{ it.blockers.length }} blocker{{ it.blockers.length > 1 ? 's' : '' }}</span> }
              </span>
            </button>
          }
        </div>
      } @else {
        <div class="wq__empty">
          <div class="wq__empty-ic">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <strong>Nothing in this view</strong>
          <p>No work items match the selected filter.</p>
        </div>
      }
    </section>

    <!-- Detail drawer -->
    @if (selected(); as it) {
      <div class="wqd-scrim" (click)="close()"></div>
      <aside class="wqd" role="dialog" [attr.aria-label]="it.name + ' detail'">
        <header class="wqd__hd">
          <div class="wqd__id">
            <span class="wqd__av wqd__av--{{ it.statusTone }}">{{ it.name.charAt(0) }}</span>
            <div>
              <h3>{{ it.name }}</h3>
              <p>MRN {{ it.mrn }}</p>
            </div>
          </div>
          <button class="wqd__x" type="button" (click)="close()" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </header>

        <div class="wqd__body">
          <div class="wqd__statusrow">
            <span class="wqi__status wqi__status--{{ it.statusTone }}">{{ it.status }}</span>
            <span class="wqd__line">{{ it.line1 }}</span>
          </div>

          @if (it.blockers.length) {
            <div class="wqd__sec">
              <span class="wqd__lbl">Blockers</span>
              <div class="wqd__blockers">
                @for (b of it.blockers; track b) { <span class="wqd__blocker">{{ b }}</span> }
              </div>
            </div>
          }

          <div class="wqd__grid">
            @for (f of it.fields; track f.k) {
              <div class="wqd__field">
                <span>{{ f.k }}</span>
                <strong [class.wqd__v--warning]="f.tone === 'warning'" [class.wqd__v--critical]="f.tone === 'critical'" [class.wqd__v--ok]="f.tone === 'ok'">{{ f.v }}</strong>
              </div>
            }
          </div>

          @if (it.checklist.length) {
            <div class="wqd__sec">
              <span class="wqd__lbl">Readiness checklist</span>
              @for (c of it.checklist; track c.label) {
                <div class="wqd__ck" [class.wqd__ck--done]="c.done">
                  <span class="wqd__ckbox">
                    @if (c.done) { <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg> }
                  </span>
                  {{ c.label }}
                  @if (c.required && !c.done) { <span class="wqd__req">Required</span> }
                </div>
              }
            </div>
          }

          <div class="wqd__sec">
            <span class="wqd__lbl">Notes</span>
            @if (it.notes.length) {
              <div class="wqd__notes">
                @for (n of it.notes; track $index) {
                  <div class="wqd__note">
                    <div class="wqd__note-hd"><strong>{{ n.author }}</strong><span>{{ n.at }}</span></div>
                    <p>{{ n.text }}</p>
                  </div>
                }
              </div>
            } @else { <p class="wqd__muted">No notes yet.</p> }
            <div class="wqd__compose">
              <textarea rows="2" placeholder="Add a note…" [value]="noteDraft()" (input)="noteDraft.set($any($event.target).value)"></textarea>
              <button type="button" [disabled]="!noteDraft().trim()" (click)="submitNote(it.id)">Add note</button>
            </div>
          </div>

          <div class="wqd__sec">
            <span class="wqd__lbl">Audit trail</span>
            @if (it.audit.length) {
              <ol class="wqd__audit">
                @for (a of it.audit; track $index) {
                  <li>
                    <span class="wqd__audot"></span>
                    <div>
                      <span class="wqd__act">{{ a.action }}</span>
                      <span class="wqd__at">{{ a.at }}@if (a.detail) { · {{ a.detail }} }</span>
                    </div>
                  </li>
                }
              </ol>
            } @else { <p class="wqd__muted">No actions recorded yet.</p> }
          </div>
        </div>

        <footer class="wqd__foot">
          @for (a of it.actions; track a.id) {
            <button class="wqa wqa--{{ a.tone ?? 'default' }}" type="button" [disabled]="a.disabled"
              (click)="action.emit({ itemId: it.id, actionId: a.id })">{{ a.label }}</button>
          }
        </footer>
      </aside>
    }
  `,
})
export class WorkQueueComponent {
  readonly title = input('Work Queue');
  readonly subtitle = input('');
  readonly items = input<WorkItem[]>([]);
  readonly filters = input<WorkFilter[]>([]);
  readonly activeFilter = input<string>('all');

  readonly filterChange = output<string>();
  readonly action = output<{ itemId: string; actionId: string }>();
  readonly addNote = output<{ itemId: string; text: string }>();

  protected readonly selectedId = signal<string | null>(null);
  protected readonly noteDraft = signal('');

  protected readonly selected = computed(() =>
    this.items().find((i) => i.id === this.selectedId()) ?? null
  );

  /** Open a specific item by id (also used by parent for deep-linking). */
  openId(id: string): void { this.selectedId.set(id); }
  protected open(id: string): void { this.selectedId.set(id); this.noteDraft.set(''); }
  protected close(): void { this.selectedId.set(null); }

  protected submitNote(id: string): void {
    const text = this.noteDraft().trim();
    if (!text) return;
    this.addNote.emit({ itemId: id, text });
    this.noteDraft.set('');
  }
}
