import api from './client';

export interface LoginPayload {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
  role: string;
  preferredLocale?: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: AuthUser;
  };
  mfaRequired?: boolean;
  mfaSetupRequired?: boolean;
  mfaTicket?: string;
  availableMethods?: string[];
  user?: AuthUser;
  code?: string;
  message?: string;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', payload);
  return data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<{ success: boolean; data?: AuthUser }> {
  const { data } = await api.get<{ success: boolean; data?: AuthUser }>('/auth/me');
  return data;
}

export async function refreshTokens(refreshToken: string): Promise<{ success: boolean; data?: { accessToken: string; refreshToken: string; expiresIn: number; user: AuthUser } }> {
  const { data } = await api.post<{ success: boolean; data?: { accessToken: string; refreshToken: string; expiresIn: number; user: AuthUser } }>('/auth/refresh', { refreshToken });
  return data;
}

// --- MFA (use mfaTicket in Authorization) ---
export async function mfaSetupStart(mfaTicket: string) {
  const { data } = await api.post<{ success: boolean; data?: { otpauthUrl: string; qrCodeSvg?: string; secretMasked: string } }>('/mfa/setup/start', {}, {
    headers: { Authorization: `Bearer ${mfaTicket}` },
  });
  return data;
}

export async function mfaSetupVerify(mfaTicket: string, body: { code: string; deviceId?: string; deviceName?: string; rememberDevice?: boolean }) {
  const { data } = await api.post<{
    success: boolean;
    data?: { accessToken: string; refreshToken: string; expiresIn: number; recoveryCodes: string[]; user?: AuthUser };
  }>('/mfa/setup/verify', body, {
    headers: { Authorization: `Bearer ${mfaTicket}` },
  });
  return data;
}

export async function mfaChallengeVerify(mfaTicket: string, body: { code: string; rememberDevice?: boolean; deviceId?: string; deviceName?: string }) {
  const { data } = await api.post<{
    success: boolean;
    data?: { accessToken: string; refreshToken: string; expiresIn: number; user?: AuthUser };
  }>('/mfa/challenge/verify', body, {
    headers: { Authorization: `Bearer ${mfaTicket}` },
  });
  return data;
}

export async function mfaChallengeRecovery(mfaTicket: string, body: { recoveryCode: string; rememberDevice?: boolean; deviceId?: string; deviceName?: string }) {
  const { data } = await api.post<{
    success: boolean;
    data?: { accessToken: string; refreshToken: string; expiresIn: number; user?: AuthUser };
  }>('/mfa/challenge/recovery', body, {
    headers: { Authorization: `Bearer ${mfaTicket}` },
  });
  return data;
}

// --- Security (requires access token) ---
export interface SecuritySummary {
  mfaEnabled: boolean;
  enrolledAt: string | null;
  lastUsedAt: string | null;
  recoveryCodesRemainingCount: number;
  devices: Array<{
    id: string;
    deviceId: string;
    deviceName: string | null;
    userAgent: string | null;
    ipFirst: string | null;
    ipLast: string | null;
    lastSeenAt: string | null;
    trustedUntil: string | null;
  }>;
  sessions: Array<{ id: string; deviceId: string | null; lastUsedAt: string | null; device: { deviceName: string | null } | null }>;
}

export async function getSecurityMe(): Promise<{ success: boolean; data?: SecuritySummary }> {
  const { data } = await api.get<{ success: boolean; data?: SecuritySummary }>('/security/me');
  return data;
}

export async function securityMfaReset(body: { code?: string; recoveryCode?: string }) {
  const { data } = await api.post<{ success: boolean }>('/security/mfa/reset', body);
  return data;
}

export async function securityRecoveryRegenerate(body: { code: string }) {
  const { data } = await api.post<{ success: boolean; data?: { recoveryCodes: string[] } }>('/security/recovery/regenerate', body);
  return data;
}

export async function securityRevokeDevice(deviceId: string) {
  const { data } = await api.post<{ success: boolean }>(`/security/devices/${deviceId}/revoke`);
  return data;
}

export async function securityRevokeAllDevices() {
  const { data } = await api.post<{ success: boolean }>('/security/devices/revoke-all');
  return data;
}
