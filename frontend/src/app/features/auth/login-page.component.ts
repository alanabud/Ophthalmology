import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { FirebaseAuthService } from '../../core/services/firebase-auth.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

export type AuthView = 'login' | 'forgot' | 'unauthorized' | 'pending' | 'expired';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  private readonly firebaseAuth = inject(FirebaseAuthService);
  private readonly authState = inject(AuthStateService);
  private readonly store = inject(EnterpriseStoreService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly authView = signal<AuthView>('login');
  protected readonly isSubmitting = signal(false);
  protected readonly feedback = signal('');
  protected readonly feedbackIsError = signal(false);
  protected readonly showPassword = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected readonly forgotEmailCtrl = new FormControl('', [Validators.required, Validators.email]);

  protected showLogin(): void {
    this.authView.set('login');
    this.clearFeedback();
  }

  protected showForgotPassword(): void {
    this.authView.set('forgot');
    this.clearFeedback();
  }

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  protected signInWithGoogle(): void {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.clearFeedback();

    this.firebaseAuth.signInWithGoogle().subscribe({
      next: () => void this.router.navigateByUrl('/command-center'),
      error: (err) => {
        this.isSubmitting.set(false);
        if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
          this.clearFeedback();
        } else if (err?.code === 'auth/unauthorized-domain') {
          this.setFeedback('This domain is not authorized. Contact your administrator.', true);
        } else {
          this.setFeedback(err?.message ?? 'Google sign-in failed. Please try again.', true);
        }
      }
    });
  }

  protected signInWithMicrosoft(): void {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.clearFeedback();

    this.firebaseAuth.signInWithMicrosoft().subscribe({
      next: () => void this.router.navigateByUrl('/command-center'),
      error: (err) => {
        this.isSubmitting.set(false);
        if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
          this.clearFeedback();
        } else {
          this.setFeedback(err?.message ?? 'Microsoft sign-in failed. Please try again.', true);
        }
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.clearFeedback();

    const { email, password } = this.form.getRawValue();

    this.firebaseAuth.signInWithEmail(email, password).subscribe({
      next: () => void this.router.navigateByUrl('/command-center'),
      error: (err) => {
        this.isSubmitting.set(false);
        const code = err?.code ?? '';
        if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          this.setFeedback('Incorrect email or password. Please try again.', true);
        } else if (code === 'auth/user-disabled') {
          this.setFeedback('This account has been disabled. Contact your administrator.', true);
        } else if (code === 'auth/too-many-requests') {
          this.setFeedback('Too many failed attempts. Please try again in a few minutes.', true);
        } else {
          this.setFeedback(err?.message ?? 'Sign-in failed. Please check your credentials.', true);
        }
      }
    });
  }

  protected submitForgot(): void {
    if (this.forgotEmailCtrl.invalid || this.isSubmitting()) {
      this.forgotEmailCtrl.markAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.clearFeedback();

    // In production: call Firebase sendPasswordResetEmail() or backend reset endpoint
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.setFeedback(
        'If that address is registered, reset instructions have been sent.',
        false
      );
    }, 1000);
  }

  protected openSandbox(): void {
    this.authState.saveSession(this.store.previewSession());
    void this.router.navigateByUrl('/command-center');
  }

  private setFeedback(message: string, isError: boolean): void {
    this.feedback.set(message);
    this.feedbackIsError.set(isError);
  }

  private clearFeedback(): void {
    this.feedback.set('');
    this.feedbackIsError.set(false);
  }
}
