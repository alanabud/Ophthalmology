import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { LoginRequest, TokenPairResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(payload: LoginRequest): Observable<TokenPairResponse> {
    return this.http.post<TokenPairResponse>(`${API_BASE_URL}/api/v1/auth/login`, payload);
  }
}
