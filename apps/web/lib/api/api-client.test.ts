import { describe, it, expect } from 'vitest';
import { ApiError, RateLimitError } from './api-client';

describe('ApiError', () => {
  it('stores message and status', () => {
    const err = new ApiError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.status).toBe(404);
  });

  it('is instance of Error', () => {
    const err = new ApiError('fail', 500);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
  });
});

describe('RateLimitError', () => {
  it('creates user-friendly message with retryAfter', () => {
    const err = new RateLimitError(30);
    expect(err.message).toBe('Too many requests. Please try again in 30 seconds.');
    expect(err.status).toBe(429);
    expect(err.retryAfter).toBe(30);
  });

  it('creates user-friendly message without retryAfter', () => {
    const err = new RateLimitError(null);
    expect(err.message).toBe('Too many requests. Please wait a moment and try again.');
    expect(err.status).toBe(429);
    expect(err.retryAfter).toBeNull();
  });

  it('is instance of ApiError and Error', () => {
    const err = new RateLimitError(10);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toBeInstanceOf(RateLimitError);
  });
});
