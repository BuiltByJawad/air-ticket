import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

vi.mock('../../../lib/auth/session', () => ({
  getSessionToken: vi.fn()
}));

vi.mock('../../../lib/api/api-client', () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  updateProfile: vi.fn()
}));

import { getSessionToken } from '../../../lib/auth/session';
import { updateProfile } from '../../../lib/api/api-client';

const mockGetSessionToken = vi.mocked(getSessionToken);
const mockUpdateProfile = vi.mocked(updateProfile);

async function runAction(formData: FormData) {
  const { updateProfileAction } = await import('./actions');
  return updateProfileAction(formData);
}

describe('updateProfileAction', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('should return error when not authenticated', async () => {
    mockGetSessionToken.mockResolvedValue(null);

    const fd = new FormData();
    fd.set('name', 'Test');
    const result = await runAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Not authenticated');
  });

  it('should return error when no changes provided', async () => {
    mockGetSessionToken.mockResolvedValue('token');

    const fd = new FormData();
    const result = await runAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('No changes to save');
  });

  it('should update name successfully', async () => {
    mockGetSessionToken.mockResolvedValue('token');
    mockUpdateProfile.mockResolvedValue({} as never);

    const fd = new FormData();
    fd.set('name', 'New Name');
    const result = await runAction(fd);

    expect(result.success).toBe(true);
    expect(mockUpdateProfile).toHaveBeenCalledWith('token', { name: 'New Name' });
  });

  it('should return error when changing password without currentPassword', async () => {
    mockGetSessionToken.mockResolvedValue('token');

    const fd = new FormData();
    fd.set('password', 'newpass123');
    fd.set('confirmPassword', 'newpass123');
    const result = await runAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Current password is required to set a new password');
  });

  it('should return error when password is too short', async () => {
    mockGetSessionToken.mockResolvedValue('token');

    const fd = new FormData();
    fd.set('currentPassword', 'oldpass');
    fd.set('password', 'short');
    fd.set('confirmPassword', 'short');
    const result = await runAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Password must be at least 8 characters');
  });

  it('should return error when passwords do not match', async () => {
    mockGetSessionToken.mockResolvedValue('token');

    const fd = new FormData();
    fd.set('currentPassword', 'oldpass');
    fd.set('password', 'newpass123');
    fd.set('confirmPassword', 'different123');
    const result = await runAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Passwords do not match');
  });

  it('should change password with currentPassword', async () => {
    mockGetSessionToken.mockResolvedValue('token');
    mockUpdateProfile.mockResolvedValue({} as never);

    const fd = new FormData();
    fd.set('currentPassword', 'oldpass');
    fd.set('password', 'newpass123');
    fd.set('confirmPassword', 'newpass123');
    const result = await runAction(fd);

    expect(result.success).toBe(true);
    expect(mockUpdateProfile).toHaveBeenCalledWith('token', {
      currentPassword: 'oldpass',
      password: 'newpass123'
    });
  });

  it('should return ApiError message on API failure', async () => {
    mockGetSessionToken.mockResolvedValue('token');
    const ApiError = (await import('../../../lib/api/api-client')).ApiError;
    mockUpdateProfile.mockRejectedValue(new ApiError('Unauthorized', 401));

    const fd = new FormData();
    fd.set('name', 'Test');
    const result = await runAction(fd);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Unauthorized');
  });
});
