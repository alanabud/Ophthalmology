export interface LoginRequest {
  email: string;
  password: string;
  tenant_id: string | null;
  clinic_id: string | null;
}

export interface UserSummary {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  home_tenant_id: string | null;
}

export interface UserContextSnapshot {
  user: UserSummary;
  session_id: string;
  active_tenant_id: string | null;
  active_clinic_id: string | null;
  accessible_tenant_ids: string[];
  accessible_clinic_ids: string[];
  permissions: string[];
  role_codes: string[];
}

export interface TokenPairResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  context: UserContextSnapshot;
}

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  refreshExpiresAt: string;
  context: UserContextSnapshot;
}
