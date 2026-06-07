import { AfterViewInit, Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { ImagingStudy, PatientFlowRecord } from '../../core/models/enterprise.models';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';
import { AppModalComponent } from '../../shared/ui/app-modal.component';
import { StatusChipComponent } from '../../shared/ui/status-chip.component';
import { WorkFilter, WorkItem, WorkQueueComponent, WorkTone } from '../../shared/ui/work-queue.component';

@Component({
  selector: 'app-imaging-page',
  imports: [FormsModule, AppModalComponent, StatusChipComponent, WorkQueueComponent],
  templateUrl: './imaging-page.component.html',
  styleUrl: './imaging-page.component.scss'
})
export class ImagingPageComponent implements AfterViewInit {
  protected readonly store = inject(EnterpriseStoreService);
  private readonly route = inject(ActivatedRoute);
  protected readonly studies = this.store.imagingStudies;

  // ── Patient imaging work queue (derived from real readiness data) ──────────
  private readonly workQueueRef = viewChild(WorkQueueComponent);
  protected readonly imgFilter = signal<string>('all');
  protected setImgFilter(f: string): void { this.imgFilter.set(f); }

  private readonly imagingRe = /imag|biometr|topograph|oct|field|scan|pachymetr|angiograph|fundus/i;

  private imgStatus(p: PatientFlowRecord): string {
    const ws = this.store.imagingWork()[p.id];
    if (ws?.status) return ws.status;
    return p.station === 'imaging' ? 'In progress' : 'Ordered';
  }
  private imgTone(status: string): WorkTone {
    switch (status) {
      case 'Interpreted':       return 'ok';
      case 'Ready for review':  return 'warning';
      case 'Repeat requested':  return 'critical';
      case 'In progress':
      case 'Captured':          return 'info';
      default:                  return 'neutral';
    }
  }

  /** All imaging work items derived from patient flow + persisted work state. */
  protected readonly imagingItemsAll = computed<WorkItem[]>(() =>
    this.store.patientFlow()
      .map(p => {
        const imgReadiness = p.readinessItems.filter(r => this.imagingRe.test(r.label));
        // Encounter imaging orders (Sprint 6) also place a patient in the queue.
        const imgOrders = (this.store.encounters()[p.id]?.orders ?? []).filter(o => o.type === 'imaging');
        const inQueue = imgReadiness.length > 0 || imgOrders.length > 0 || p.station === 'imaging' || p.station === 'dilating';
        if (!inQueue) return null;
        const ws = this.store.imagingWork()[p.id];
        const status = this.imgStatus(p);
        const tone = this.imgTone(status);
        const blockers = imgReadiness.filter(r => r.required && !r.done).map(r => r.label);
        const orderText = imgOrders.map(o => o.detail).join(', ');
        const testType = [imgReadiness.map(r => r.label).join(', '), orderText].filter(Boolean).join(' · ') || 'Imaging / testing';
        const urgent = p.urgent || p.tone === 'critical';
        // Clinical context from the EMR record (why the test was ordered).
        const cr = this.store.clinicalRecords()[p.id];
        const dx = (cr?.diagnosis ?? []).find(d => d.icd10);
        const va = cr ? `OD ${cr.visualAcuity.od ?? '—'} · OS ${cr.visualAcuity.os ?? '—'}` : '—';
        const iop = cr && (cr.iop.od != null || cr.iop.os != null) ? `OD ${cr.iop.od ?? '—'} · OS ${cr.iop.os ?? '—'}` : '—';
        return {
          id: p.id, name: p.name, mrn: p.mrn, line1: testType,
          status, statusTone: urgent && status !== 'Interpreted' ? 'critical' : tone,
          fields: [
            { k: 'Station',  v: this.stationLabel(p.station) },
            { k: 'Provider', v: p.provider },
            { k: 'Modality', v: testType },
            { k: 'Laterality', v: p.laterality ?? '—' },
            { k: 'Chief complaint', v: cr?.chiefComplaint || p.visitType },
            { k: 'Diagnosis', v: dx ? `${dx.icd10}${dx.description ? ' — ' + dx.description : ''}` : 'Not coded', tone: dx ? undefined : 'warning' },
            { k: 'Eye', v: dx?.eye ?? p.laterality ?? '—' },
            { k: 'Visual acuity', v: va },
            { k: 'IOP', v: iop },
            { k: 'Ocular history', v: cr?.ocularHistory?.length ? cr.ocularHistory.join(', ') : '—' },
            { k: 'Priority', v: urgent ? 'Urgent' : 'Routine', tone: urgent ? 'critical' : undefined },
          ],
          blockers,
          checklist: imgReadiness.map(r => ({ label: r.label, done: r.done, required: r.required })),
          notes: ws?.notes ?? [],
          audit: ws?.audit ?? [],
          actions: [
            { id: 'interpreted', label: 'Mark interpreted', tone: 'primary', disabled: status === 'Interpreted' },
            { id: 'captured', label: 'Image captured', disabled: status === 'Captured' || status === 'Interpreted' },
            { id: 'ready', label: 'Ready for review', disabled: status === 'Ready for review' || status === 'Interpreted' },
            { id: 'repeat', label: 'Request repeat', tone: 'danger' },
          ],
        } as WorkItem;
      })
      .filter((x): x is WorkItem => x !== null)
  );

  protected readonly imagingFilters = computed<WorkFilter[]>(() => {
    const all = this.imagingItemsAll();
    const count = (pred: (i: WorkItem) => boolean) => all.filter(pred).length;
    return [
      { id: 'all',          label: 'All',             count: all.length },
      { id: 'pending',      label: 'Pending',         count: count(i => ['Ordered', 'In progress', 'Captured'].includes(i.status)) },
      { id: 'ready-review', label: 'Ready for review', count: count(i => i.status === 'Ready for review') },
      { id: 'incomplete',   label: 'Incomplete',      count: count(i => i.blockers.length > 0) },
      { id: 'critical',     label: 'Critical',        count: count(i => i.statusTone === 'critical') },
      { id: 'completed',    label: 'Completed',       count: count(i => i.status === 'Interpreted') },
    ];
  });

  protected readonly imagingItems = computed<WorkItem[]>(() => {
    const f = this.imgFilter();
    const all = this.imagingItemsAll();
    switch (f) {
      case 'pending':      return all.filter(i => ['Ordered', 'In progress', 'Captured'].includes(i.status));
      case 'ready-review': return all.filter(i => i.status === 'Ready for review');
      case 'incomplete':   return all.filter(i => i.blockers.length > 0);
      case 'critical':     return all.filter(i => i.statusTone === 'critical');
      case 'completed':    return all.filter(i => i.status === 'Interpreted');
      default:             return all;
    }
  });

  protected onImagingAction(e: { itemId: string; actionId: string }): void {
    const status: Record<string, string> = {
      captured: 'Captured', ready: 'Ready for review', interpreted: 'Interpreted', repeat: 'Repeat requested',
    };
    const action: Record<string, string> = {
      captured: 'Image captured', ready: 'Marked ready for provider review',
      interpreted: 'Marked interpreted', repeat: 'Repeat imaging requested',
    };
    this.store.setImagingStatus(e.itemId, status[e.actionId], action[e.actionId]);
  }
  protected onImagingNote(e: { itemId: string; text: string }): void {
    this.store.addImagingNote(e.itemId, e.text);
  }

  private stationLabel(s: string): string {
    return ({
      'checked-in': 'Waiting room', 'tech-workup': 'Tech workup', imaging: 'Imaging',
      dilating: 'Dilating', ready: 'Ready for doctor', 'with-doctor': 'In exam', checkout: 'Checkout',
    } as Record<string, string>)[s] ?? s;
  }

  /** Deep-link from the Command Center: ?filter= and ?patient=MRN. */
  ngAfterViewInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const filter = qp.get('filter');
    if (filter) this.imgFilter.set(filter);
    const mrn = qp.get('patient');
    if (mrn) {
      const item = this.imagingItemsAll().find(i => i.mrn === mrn);
      if (item) setTimeout(() => this.workQueueRef()?.openId(item.id), 0);
    }
  }

  // Stats
  protected readonly orderedCount = computed(() => this.studies().filter(s => s.status === 'Ordered' || s.status === 'Queued').length);
  protected readonly readyCount = computed(() => this.studies().filter(s => s.status.toLowerCase().includes('review')).length);
  protected readonly interpretedCount = computed(() => this.studies().filter(s => s.status === 'Interpreted').length);
  protected readonly urgentCount = computed(() => this.studies().filter(s => (s.urgency ?? '') === 'Urgent' || (s.urgency ?? '') === 'Same day').length);

  // Filters
  protected readonly searchQuery = signal('');
  protected readonly modalityFilter = signal('');
  protected readonly statusFilter = signal('');

  protected readonly filteredStudies = computed(() => {
    let list = this.studies();
    const q = this.searchQuery().toLowerCase().trim();
    const m = this.modalityFilter();
    const s = this.statusFilter();
    if (q) list = list.filter(st =>
      st.patient.toLowerCase().includes(q) ||
      st.studyId.toLowerCase().includes(q) ||
      st.orderedBy.toLowerCase().includes(q) ||
      (st.clinicalIndication ?? '').toLowerCase().includes(q)
    );
    if (m) list = list.filter(st => st.modality === m);
    if (s) list = list.filter(st => st.status === s);
    return list;
  });

  // Modal state
  protected readonly selectedStudy = signal<ImagingStudy | null>(null);
  protected readonly viewOpen = signal(false);
  protected readonly reviewOpen = signal(false);
  protected readonly createOpen = signal(false);

  // Create form fields
  protected fPatient = '';
  protected fModality = '';
  protected fOrderedBy = '';
  protected fLaterality = '';
  protected fUrgency = '';
  protected fClinicalIndication = '';
  protected fProtocol = '';
  protected fCptCode = '';
  protected fStudyDate = '';

  // Review form fields
  protected fImpressionSummary = '';
  protected fReviewNotes = '';
  protected fQualityScore = '';

  readonly modalityOptions = ['OCT Macula', 'OCT Optic Nerve', 'OCT-A', 'Biometry', 'HVF 24-2', 'HVF 30-2', 'Fundus Photo', 'Fluorescein Angiography', 'ICG Angiography', 'B-scan Ultrasound', 'Corneal Topography', 'Corneal Pachymetry', 'Specular Microscopy'];
  readonly lateralityOptions = ['OD', 'OS', 'OU'];
  readonly urgencyOptions = ['Routine', 'Today', 'Same day', 'Urgent', 'STAT'];

  protected viewStudy(study: ImagingStudy): void {
    this.selectedStudy.set(study);
    this.viewOpen.set(true);
  }

  protected openReview(study: ImagingStudy): void {
    this.selectedStudy.set(study);
    this.fImpressionSummary = study.impressionSummary ?? '';
    this.fReviewNotes = '';
    this.fQualityScore = study.qualityScore ?? '';
    this.reviewOpen.set(true);
  }

  protected openCreate(): void {
    this.fPatient = '';
    this.fModality = '';
    this.fOrderedBy = '';
    this.fLaterality = '';
    this.fUrgency = 'Routine';
    this.fClinicalIndication = '';
    this.fProtocol = '';
    this.fCptCode = '';
    this.fStudyDate = '';
    this.createOpen.set(true);
  }

  protected saveStudy(): void {
    if (!this.fPatient.trim() || !this.fModality) return;
    const clinicId = this.store.activeClinicId() !== 'network' ? this.store.activeClinicId() : 'winter-park';
    this.store.createImagingStudy({
      clinicId,
      patient: this.fPatient.trim(),
      modality: this.fModality,
      studyId: `IMG-${String(Date.now()).slice(-5)}`,
      orderedBy: this.fOrderedBy.trim() || 'Attending',
      status: 'Ordered',
      tone: 'info',
      findings: 'Pending acquisition',
      aiSignal: 'Awaiting scan',
      studyDate: this.fStudyDate,
      laterality: this.fLaterality,
      clinicalIndication: this.fClinicalIndication.trim(),
      urgency: this.fUrgency,
      protocol: this.fProtocol.trim(),
      cptCode: this.fCptCode.trim(),
    });
    this.createOpen.set(false);
  }

  protected saveReview(): void {
    const study = this.selectedStudy();
    if (study) {
      this.store.updateImagingStudy({
        ...study,
        impressionSummary: this.fImpressionSummary.trim() || study.impressionSummary,
        findings: this.fReviewNotes.trim() || study.findings,
        qualityScore: this.fQualityScore || study.qualityScore,
        status: 'Interpreted',
        tone: 'success',
      });
    }
    this.reviewOpen.set(false);
    this.selectedStudy.set(null);
  }

  protected clearFilters(): void {
    this.searchQuery.set('');
    this.modalityFilter.set('');
    this.statusFilter.set('');
  }

  protected get hasActiveFilters(): boolean {
    return !!(this.searchQuery() || this.modalityFilter() || this.statusFilter());
  }

  protected closeView(): void { this.viewOpen.set(false); this.selectedStudy.set(null); }
  protected closeReview(): void { this.reviewOpen.set(false); this.selectedStudy.set(null); }
  protected closeCreate(): void { this.createOpen.set(false); }
}
