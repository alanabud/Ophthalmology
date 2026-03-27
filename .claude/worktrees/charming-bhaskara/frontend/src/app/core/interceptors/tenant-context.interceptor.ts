import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthStateService } from '../services/auth-state.service';

export const tenantContextInterceptor: HttpInterceptorFn = (request, next) => {
  const authState = inject(AuthStateService);
  const context = authState.context();

  const headers: Record<string, string> = {};
  if (context?.active_tenant_id) {
    headers['X-Tenant-ID'] = context.active_tenant_id;
  }
  if (context?.active_clinic_id) {
    headers['X-Clinic-ID'] = context.active_clinic_id;
  }

  if (Object.keys(headers).length === 0) {
    return next(request);
  }

  return next(request.clone({ setHeaders: headers }));
};
