import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AsyncTaskService {
  private readonly logger = new Logger(AsyncTaskService.name);

  async runWithRetry<T>(
    taskName: string,
    task: () => Promise<T>,
    options?: { retries?: number; baseDelayMs?: number }
  ): Promise<T> {
    const retries = options?.retries ?? 3;
    const baseDelayMs = options?.baseDelayMs ?? 250;

    let attempt = 0;
    while (true) {
      try {
        return await task();
      } catch (error) {
        attempt += 1;
        if (attempt > retries) {
          this.logger.error(
            `Task ${taskName} failed after ${retries} retries: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
        const delay = baseDelayMs * 2 ** (attempt - 1);
        this.logger.warn(`Task ${taskName} failed (attempt ${attempt}/${retries}), retrying in ${delay}ms`);
        await this.sleep(delay);
      }
    }
  }

  fireAndForget(taskName: string, task: () => Promise<void>, options?: { retries?: number; baseDelayMs?: number }): void {
    void this.runWithRetry(taskName, task, options).catch((error) => {
      this.logger.error(`Background task ${taskName} failed permanently: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
