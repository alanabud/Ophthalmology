import { computed, effect, Injectable, signal } from '@angular/core';

import { StoredSession, TokenPairResponse } from '../models/auth.models';

const STORAGE_KEY = 'ophthalmology.enterprise.session';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly sessionState = signal<StoredSession | null>(this.readSession());

  readonly session = computed(() => this.sessionState());
  readonly context = computed(() => this.sessionState()?.context ?? null);
  readonly isAuthenticated = computed(() => Boolean(this.sessionState()?.accessToken));
  readonly displayName = computed(() => {
    const context = this.context();
    return context?.user.display_name || context?.user.first_name || 'Guest';
  });

  constructor() {
    effect(() => {
      const session = this.sessionState();
      if (session) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    });
  }

  saveSession(tokenPair: TokenPairResponse): void {
    this.sessionState.set({
      accessToken: tokenPair.access_token,
      refreshToken: tokenPair.refresh_token,
      expiresAt: tokenPair.access_token_expires_at,
      refreshExpiresAt: tokenPair.refresh_token_expires_at,
      context: tokenPair.context
    });
  }

  clearSession(): void {
    this.sessionState.set(null);
  }

  private readSession(): StoredSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as StoredSession;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
}
