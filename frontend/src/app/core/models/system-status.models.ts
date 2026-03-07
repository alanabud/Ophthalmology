export interface HealthCheckResponse {
  status: string;
  service: string;
  checks: Record<string, string>;
}

export interface ServiceStatusCard {
  label: string;
  tone: 'healthy' | 'degraded' | 'inactive';
  summary: string;
  detail: string;
}
