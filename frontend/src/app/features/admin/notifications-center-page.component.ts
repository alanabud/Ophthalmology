import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { NotificationRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

type Filter = 'all' | 'unread' | 'critical' | 'clinical' | 'billing' | 'compliance' | 'system';

@Component({
  selector: 'app-notifications-center-page',
  imports: [FormsModule],
  template: `
    <section class="workspace-page nc-page">
      <header class="nc-head">
        <div>
          <p class="nc-eyebrow">Command Center · Notifications</p>
          <h1 class="nc-title">Notification Center</h1>
          <p class="nc-sub">Clinic-scoped, Firestore-backed alerts. Acting on one marks it read and routes to the source. {{ unread() }} unread.</p>
        </div>
        <button class="nc-markall" type="button" [disabled]="unread() === 0" (click)="markAll()">Mark all read</button>
      </header>

      <div class="nc-toolbar">
        <div class="nc-filters">
          @for (f of filters; track f.id) {
            <button type="button" [class.on]="filter() === f.id" (click)="setFilter(f.id)">{{ f.label }}</button>
          }
        </div>
        <div class="nc-search">
          <input type="text" [(ngModel)]="query" placeholder="Search title, message, patient, claim…" />
        </div>
      </div>

      <div class="nc-list">
        @for (n of visible(); track n.id) {
          <article class="nc-item nc-item--{{ n.severity }}" [class.nc-item--unread]="n.status === 'unread'">
            <span class="nc-dot nc-dot--{{ n.severity }}"></span>
            <div class="nc-body">
              <div class="nc-row">
                <strong>{{ n.title }}</strong>
                <span class="nc-meta">{{ n.type.replace('_', ' ') }} · {{ n.clinicId }} · {{ timeAgo(n.createdAt) }}</span>
              </div>
              <p>{{ n.message }}</p>
              <div class="nc-actions">
                @if (n.actionRoute) { <button class="nc-act nc-act--primary" type="button" (click)="open(n)">{{ n.actionLabel || 'Open' }} →</button> }
                @if (n.status === 'unread') { <button class="nc-act" type="button" (click)="markRead(n.id)">Mark read</button> }
                <button class="nc-act" type="button" (click)="archive(n.id)">Archive</button>
              </div>
            </div>
            <span class="nc-sev nc-sev--{{ n.severity }}">{{ n.severity }}</span>
          </article>
        } @empty {
          <div class="nc-empty">
            <span>✓</span>
            <strong>{{ query || filter() !== 'all' ? 'No notifications match this view' : "You're all caught up" }}</strong>
            <p>{{ query || filter() !== 'all' ? 'Try a different filter or clear the search.' : 'New alerts will appear here as they are raised.' }}</p>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .nc-page { display: flex; flex-direction: column; gap: 16px; }
    .nc-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .nc-eyebrow { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #0F766E; margin: 0 0 4px; }
    .nc-title { font-size: 24px; font-weight: 800; color: #16242B; margin: 0 0 6px; }
    .nc-sub { font-size: 13px; color: #6B7A83; margin: 0; max-width: 680px; }
    .nc-markall { font-size: 13px; font-weight: 700; border: 1px solid rgba(15,118,110,0.3); background: rgba(15,118,110,0.08); color: #0F766E; border-radius: 10px; padding: 9px 16px; cursor: pointer;
      &:disabled { opacity: .5; cursor: default; } }
    .nc-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .nc-filters { display: flex; flex-wrap: wrap; gap: 6px;
      button { font-size: 12px; font-weight: 700; border: 1px solid rgba(22,36,43,0.12); background: #fff; color: #46555E; border-radius: 8px; padding: 6px 12px; cursor: pointer;
        &.on { background: rgba(15,118,110,0.10); color: #0F766E; border-color: rgba(15,118,110,0.30); } } }
    .nc-search input { font-size: 12.5px; padding: 8px 12px; border: 1px solid rgba(22,36,43,0.14); border-radius: 9px; min-width: 260px; background: #fff; color: #16242B; }
    .nc-list { display: flex; flex-direction: column; gap: 8px; }
    .nc-item { display: flex; gap: 12px; align-items: flex-start; background: #fff; border: 1px solid rgba(22,36,43,0.08); border-left: 4px solid #C7D0D6; border-radius: 12px; padding: 14px 16px; box-shadow: 0 1px 4px rgba(22,36,43,0.05); }
    .nc-item--info { border-left-color: #0F766E; } .nc-item--warning { border-left-color: #D97706; } .nc-item--critical { border-left-color: #DC2626; }
    .nc-item--unread { background: rgba(15,118,110,0.035); }
    .nc-dot { flex: none; width: 9px; height: 9px; border-radius: 50%; margin-top: 5px; background: #6B7A83; }
    .nc-dot--info { background: #0F766E; } .nc-dot--warning { background: #D97706; } .nc-dot--critical { background: #DC2626; }
    .nc-body { flex: 1; min-width: 0; }
    .nc-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; flex-wrap: wrap;
      strong { font-size: 13.5px; color: #16242B; } }
    .nc-meta { font-size: 11px; color: #97A4AB; text-transform: capitalize; }
    .nc-body p { font-size: 12.5px; color: #6B7A83; margin: 4px 0 0; line-height: 1.5; }
    .nc-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 9px; }
    .nc-act { font-size: 11.5px; font-weight: 700; border: none; background: none; color: #6B7A83; cursor: pointer; padding: 0; &:hover { color: #16242B; } }
    .nc-act--primary { color: #0F766E; }
    .nc-sev { flex: none; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; border-radius: 6px; padding: 3px 8px; height: fit-content;
      color: #46555E; background: rgba(22,36,43,0.07); }
    .nc-sev--info { color: #0F766E; background: rgba(15,118,110,0.10); }
    .nc-sev--warning { color: #B45309; background: rgba(217,119,6,0.12); }
    .nc-sev--critical { color: #B91C1C; background: rgba(220,38,38,0.12); }
    .nc-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 56px 20px; text-align: center;
      span { width: 48px; height: 48px; border-radius: 50%; background: rgba(46,139,87,0.12); color: #2E8B57; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; }
      strong { font-size: 15px; color: #16242B; } p { font-size: 12.5px; color: #6B7A83; margin: 0; } }
  `],
})
export class NotificationsCenterPageComponent {
  private readonly store = inject(EnterpriseStoreService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly filter = signal<Filter>('all');
  protected query = '';
  protected readonly filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' }, { id: 'unread', label: 'Unread' }, { id: 'critical', label: 'Critical' },
    { id: 'clinical', label: 'Clinical' }, { id: 'billing', label: 'Billing' },
    { id: 'compliance', label: 'Compliance' }, { id: 'system', label: 'System' },
  ];

  constructor() {
    const f = this.route.snapshot.queryParamMap.get('filter');
    if (f && this.filters.some(x => x.id === f)) this.filter.set(f as Filter);
  }

  protected readonly unread = this.store.unreadNotificationCount;
  protected readonly visible = computed(() => {
    const f = this.filter();
    const q = this.query.trim().toLowerCase();
    return this.store.notificationFeed().filter((n) => {
      const passF =
        f === 'all' ? true :
        f === 'unread' ? n.status === 'unread' :
        f === 'critical' ? n.severity === 'critical' :
        f === 'clinical' ? n.type === 'clinical_alert' || n.type === 'imaging_result' || n.type === 'surgery_update' :
        f === 'billing' ? n.type === 'billing_alert' || n.type === 'claim_issue' :
        f === 'compliance' ? n.type === 'compliance' :
        f === 'system' ? n.type === 'system' || n.type === 'schedule_delay' : true;
      if (!passF) return false;
      if (!q) return true;
      return [n.title, n.message, n.entityId].filter(Boolean).some((s) => s!.toLowerCase().includes(q));
    });
  });

  protected setFilter(f: Filter): void { this.filter.set(f); }
  protected markRead(id: string): void { this.store.markNotificationRead(id); }
  protected markAll(): void { this.store.markAllNotificationsRead(); }
  protected archive(id: string): void { this.store.archiveNotification(id); }
  protected open(n: NotificationRecord): void {
    this.store.markNotificationRead(n.id);
    if (n.actionRoute) void this.router.navigateByUrl(n.actionRoute);
  }
  protected timeAgo(iso: string): string {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  }
}
