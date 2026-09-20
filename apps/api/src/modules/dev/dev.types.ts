export interface AuditLogDto {
  id: string;
  userId: string | null;
  userEmail: string;
  userName?: string;
  impersonatedBy: string | null;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface FeatureFlagDto {
  key: string;
  enabled: boolean;
  description: string | null;
  updatedAt: Date;
}

export interface SystemHealthDto {
  status: 'healthy' | 'degraded';
  database: {
    totalUsersCount: number;
    totalCoursesCount: number;
    totalOrdersCount: number;
    latencyMs: number;
  };
  system: {
    platform: string;
    arch: string;
    uptimeSeconds: number;
    freeMemoryBytes: number;
    totalMemoryBytes: number;
    cpuCores: number;
  };
}
