import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthApiService } from '../../core/services/auth-api.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { EnterpriseStoreService } from '../../core/services/enterprise-store.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthStateService);
  private readonly store = inject(EnterpriseStoreService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly feedback = signal('Use preview mode now, or connect this form to the seeded backend when database auth is ready.');
  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['preview.operator@acuityeye.local', [Validators.required, Validators.email]],
    password: ['Preview!2026', [Validators.required, Validators.minLength(8)]],
    tenantId: [''],
    clinicId: ['']
  });

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.feedback.set('Attempting live sign-in...');

    const value = this.form.getRawValue();
    this.authApi
      .login({
        email: value.email,
        password: value.password,
        tenant_id: value.tenantId || null,
        clinic_id: value.clinicId || null
      })
      .subscribe({
        next: (response) => {
          this.authState.saveSession(response);
          this.feedback.set('Connected to live auth. Opening workspace...');
          void this.router.navigateByUrl('/command-center');
          this.isSubmitting.set(false);
        },
        error: (error: HttpErrorResponse) => {
          if (value.email === 'preview.operator@acuityeye.local' && value.password === 'Preview!2026') {
            this.launchPreview();
            return;
          }

          const message =
            error.status === 401
              ? 'Live credentials were rejected. Use preview mode or seed the backend account.'
              : error.error?.error?.message || 'Live authentication is not available in this environment.';
          this.feedback.set(message);
          this.isSubmitting.set(false);
        }
      });
  }

  protected launchPreview(): void {
    this.authState.saveSession(this.store.previewSession());
    this.feedback.set('Preview workspace activated. Opening command center...');
    this.isSubmitting.set(false);
    void this.router.navigateByUrl('/command-center');
  }
}
