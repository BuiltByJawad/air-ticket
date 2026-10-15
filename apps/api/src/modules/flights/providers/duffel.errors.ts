export class DuffelApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'DuffelApiError';
  }
}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export function parseDuffelError(error: unknown): DuffelApiError {
  if (error instanceof DuffelApiError) {
    return error;
  }

  if (error instanceof Error && error.message.startsWith('Duffel API ')) {
    const match = error.message.match(/^Duffel API (\d+):\s*(.*)$/);
    if (match) {
      const status = parseInt(match[1]!, 10);
      return new DuffelApiError(match[2]!, status, undefined, isRetryableStatus(status));
    }
  }

  return new DuffelApiError(
    error instanceof Error ? error.message : String(error),
    0,
    undefined,
    false
  );
}
