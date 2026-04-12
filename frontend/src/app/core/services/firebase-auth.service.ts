import { Injectable, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  GoogleAuthProvider,
  OAuthProvider,
  UserCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { firebaseAuth } from '../config/firebase.config';
import { UserContextSnapshot } from '../models/auth.models';
import { AuthStateService } from './auth-state.service';

/**
 * Maps a Firebase UserCredential to the platform's UserContextSnapshot.
 * In production this would call the backend to resolve tenant, clinic, role,
 * and permissions. For now we derive a minimal context from the Firebase profile
 * so the platform identity layer is real (not mocked).
 */
function contextFromCredential(credential: UserCredential): UserContextSnapshot {
  const user = credential.user;
  const [firstName = '', ...rest] = (user.displayName ?? user.email ?? 'User').split(' ');
  const lastName = rest.join(' ');

  return {
    user: {
      id: user.uid,
      email: user.email ?? '',
      first_name: firstName,
      last_name: lastName,
      display_name: user.displayName,
      is_active: true,
      is_superuser: false,
      home_tenant_id: null
    },
    session_id: user.uid,
    active_tenant_id: null,
    active_clinic_id: null,
    accessible_tenant_ids: [],
    accessible_clinic_ids: [],
    permissions: ['platform.view'],
    role_codes: ['authenticated_user']
  };
}

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  /**
   * Sign in with Google via Firebase popup.
   * Returns an Observable that emits when the session is saved.
   */
  signInWithGoogle(): Observable<void> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    return from(signInWithPopup(firebaseAuth, provider)).pipe(
      switchMap((credential) => from(credential.user.getIdToken()).pipe(
        map((idToken) => {
          const context = contextFromCredential(credential);
          this.authState.saveSession({
            access_token: idToken,
            refresh_token: '',
            token_type: 'bearer',
            access_token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            refresh_token_expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
            context
          });
        })
      ))
    );
  }

  /**
   * Sign in with Microsoft via Firebase popup.
   * Requires Microsoft provider to be enabled in the Firebase console.
   */
  signInWithMicrosoft(): Observable<void> {
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({ prompt: 'select_account' });

    return from(signInWithPopup(firebaseAuth, provider)).pipe(
      switchMap((credential) => from(credential.user.getIdToken()).pipe(
        map((idToken) => {
          const context = contextFromCredential(credential);
          this.authState.saveSession({
            access_token: idToken,
            refresh_token: '',
            token_type: 'bearer',
            access_token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            refresh_token_expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
            context
          });
        })
      ))
    );
  }

  /**
   * Sign in with email and password via Firebase.
   */
  signInWithEmail(email: string, password: string): Observable<void> {
    return from(signInWithEmailAndPassword(firebaseAuth, email, password)).pipe(
      switchMap((credential) => from(credential.user.getIdToken()).pipe(
        map((idToken) => {
          const context = contextFromCredential(credential);
          this.authState.saveSession({
            access_token: idToken,
            refresh_token: '',
            token_type: 'bearer',
            access_token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            refresh_token_expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
            context
          });
        })
      ))
    );
  }

  /**
   * Sign out from both Firebase and the platform session.
   */
  signOut(): Observable<void> {
    return from(signOut(firebaseAuth)).pipe(
      map(() => {
        this.authState.clearSession();
      })
    );
  }
}
