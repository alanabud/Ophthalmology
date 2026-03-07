import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { HealthCheckResponse, ServiceStatusCard } from '../models/system-status.models';

@Injectable({ providedIn: 'root' })
export class ApiHealthService {
  private readonly http = inject(HttpClient);

  getLiveness(): Observable<HealthCheckResponse> {
    return this.http.get<HealthCheckResponse>(`${API_BASE_URL}/health/liveness`);
  }

  getReadiness(): Observable<HealthCheckResponse> {
    return this.http.get<HealthCheckResponse>(`${API_BASE_URL}/health/readiness`);
  }

  getStatusCards(): Observable<ServiceStatusCard[]> {
    return this.getLiveness().pipe(
      map(
        (response): ServiceStatusCard[] => [
          {
            label: 'API Runtime',
            tone: response.status === 'ok' ? 'healthy' : 'degraded',
            summary: response.status === 'ok' ? 'Online' : 'Attention required',
            detail: 'FastAPI application is responding to requests.'
          }
        ]
      ),
      catchError(() =>
        of<ServiceStatusCard[]>([
          {
            label: 'API Runtime',
            tone: 'inactive',
            summary: 'Offline',
            detail: 'Frontend cannot currently reach the backend runtime.'
          }
        ])
      )
    );
  }
}
