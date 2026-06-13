/**
 * FirestoreService
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin, typed wrapper around the Firebase Firestore modular SDK (v9+).
 * All methods are fire-and-forget or return Promises so callers decide
 * whether to await or run in the background.
 *
 * Error handling: every public method catches Firestore errors and re-throws
 * them so the caller can decide whether to swallow or surface them.
 */

import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { firebaseDb, firebaseStorage } from '../config/firebase.config';

/** Function that extracts a stable string document-ID from a data record. */
export type DocIdFn<T> = (item: T) => string;

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private readonly db = firebaseDb;
  private readonly storage = firebaseStorage;

  // ── Storage (documents) ──────────────────────────────────────────────────────
  /** Upload a file to a deterministic, privacy-safe path. Returns the path. */
  async uploadFile(path: string, file: File): Promise<string> {
    await uploadBytes(ref(this.storage, path), file, { contentType: file.type });
    return path;
  }
  /** Resolve an authenticated, token-scoped download URL on demand (never stored). */
  async getFileUrl(path: string): Promise<string> {
    return getDownloadURL(ref(this.storage, path));
  }
  async deleteFile(path: string): Promise<void> {
    await deleteObject(ref(this.storage, path));
  }

  // ── Seeding ────────────────────────────────────────────────────────────────

  /**
   * Seeds `collectionName` with `items` only if the collection is currently
   * empty. Idempotent — safe to call on every app startup.
   */
  async seedIfEmpty<T extends DocumentData>(
    collectionName: string,
    items: T[],
    getDocId: DocIdFn<T>
  ): Promise<void> {
    const colRef = collection(this.db, collectionName);
    const probe  = await getDocs(query(colRef, limit(1)));
    if (!probe.empty) return; // Already has data

    // Firestore batches cap at 500 operations
    const BATCH_CAP = 499;
    for (let offset = 0; offset < items.length; offset += BATCH_CAP) {
      const batch = writeBatch(this.db);
      const slice = items.slice(offset, offset + BATCH_CAP);
      for (const item of slice) {
        batch.set(doc(colRef, getDocId(item)), item);
      }
      await batch.commit();
    }
  }

  // ── Reads ──────────────────────────────────────────────────────────────────

  /**
   * Fetch documents in a collection as typed objects.
   *
   * Pass `clinicId` to issue a clinic-filtered query. This is REQUIRED for
   * claim-scoped staff sessions: the Firestore rules deny unfiltered list
   * queries for clinic-claim sessions (they would leak other clinics), so an
   * unfiltered `getAll` returns permission-denied. A `where('clinicId','==',…)`
   * query is provable and allowed. Sandbox/anonymous and 'network' sessions
   * read unfiltered.
   */
  async getAll<T>(collectionName: string, clinicId?: string): Promise<T[]> {
    const colRef = collection(this.db, collectionName);
    const q = clinicId ? query(colRef, where('clinicId', '==', clinicId)) : colRef;
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as T);
  }

  // ── Writes ─────────────────────────────────────────────────────────────────

  /**
   * Create or fully overwrite a document.
   * Use `upsert` when the document may or may not already exist.
   */
  async upsert<T extends DocumentData>(
    collectionName: string,
    docId: string,
    data: T
  ): Promise<void> {
    await setDoc(doc(this.db, collectionName, docId), data, { merge: true });
  }

  /** Delete a document by ID. */
  async remove(collectionName: string, docId: string): Promise<void> {
    await deleteDoc(doc(this.db, collectionName, docId));
  }

  // ── Real-time ──────────────────────────────────────────────────────────────

  /**
   * Attach a real-time snapshot listener to an entire collection.
   * Returns an unsubscribe function — store it and call it on cleanup.
   *
   * @example
   *   const unsub = this.fs.subscribe<PatientFlowRecord>('patientFlow', docs => {
   *     this.patientFlowBase.set(docs);
   *   });
   */
  subscribe<T>(
    collectionName: string,
    onData: (items: T[]) => void,
    onError?: (err: Error) => void
  ): () => void {
    return onSnapshot(
      collection(this.db, collectionName),
      snapshot => onData(snapshot.docs.map(d => d.data() as T)),
      err => {
        const msg = `[Firestore] listener error on "${collectionName}": ${err.message}`;
        console.warn(msg);
        onError?.(err);
      }
    );
  }
}
