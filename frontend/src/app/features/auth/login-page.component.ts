import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthApiService } from '../../core/services/auth-api.service';
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
  private readonly formBuilder = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthStateService);
  private readonly store = inject(EnterpriseStoreService);
  private readonly router = inject(Router);

  protected readonly authView = signal<AuthView>('login');
  protected readonly isSubmitting = signal(false);
  protected readonly feedback = signal('');
  protected readonly feedbackIsError = signal(false);
  protected readonly showPassword = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  protected readonly forgotEmailCtrl = new FormControl('', [Validators.required, Validators.email]);

  protected showLogin(): void {
    this.authView.set('login');
    this.feedback.set('');
    this.feedbackIsError.set(false);
  }

  protected showForgotPassword(): void {
    this.authView.set('forgot');
    this.feedback.set('');
    this.feedbackIsError.set(false);
  }

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  protected signInWithMicrosoft(): void {
    this.isSubmitting.set(true);
    this.setFeedback('Redirecting to Microsoft sign-in…', false);

    // Production: integrate @azure/msal-angular and redirect to Microsoft identity platform.
    // The backend (/auth/microsoft/callback) exchanges the authorization code for a platform session.
    // For now, fall through to preview after simulated delay.
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.setFeedback(
        'Microsoft SSO requires backend integration. Use preview mode to evaluate the platform.',
        true
      );
    }, 1600);
  }

  protected signInWithGoogle(): void {
    this.isSubmitting.set(true);
    this.setFeedback('Redirecting to Google sign-in…', false);

    // Production: use Google Identity Services SDK, exchange ID token via /auth/google/callback.
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.setFeedback(
        'Google SSO requires backend integration. Use preview mode to evaluate the platform.',
        true
      );
    }, 1600);
  }

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.setFeedback('Signing in…', false);

    const value = this.form.getRawValue();

    // Check preview credentials first
    if (
      value.email === 'preview.operator@acuityeye.local' &&
      value.password === 'Preview!2026'
    ) {
      this.launchPreview();
      return;
    }

    this.authApi
      .login({
        email: value.email,
        password: value.password,
        tenant_id: null,
        clinic_id: null
      })
      .subscribe({
        next: (response) => {
          this.authState.saveSession(response);
          void this.router.navigateByUrl('/command-center');
        },
        error: (error: HttpErrorResponse) => {
          const message =
            error.status === 401
              ? 'Incorrect email or password. Please try again.'
              : error.error?.error?.message ||
                'Sign-in is unavailable in this environment. Use preview mode to evaluate the platform.';
          this.setFeedback(message, true);
          this.isSubmitting.set(false);
        }
      });
  }

  protected submitForgot(): void {
    if (this.forgotEmailCtrl.invalid || this.isSubmitting()) {
      this.forgotEmailCtrl.markAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.setFeedback('', false);

    // Simulate sending reset email
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.setFeedback(
        'If that address is registered, reset instructions have been sent.',
        false
      );
    }, 1200);
  }

  protected launchPreview(): void {
    this.authState.saveSession(this.store.previewSession());
    this.isSubmitting.set(false);
    void this.router.navigateByUrl('/command-center');
  }

  private setFeedback(message: string, isError: boolean): void {
    this.feedback.set(message);
    this.feedbackIsError.set(isError);
  }
}
