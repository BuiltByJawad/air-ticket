import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - start;

      const user = (req as unknown as { user?: { sub?: string; agencyId?: string | null } }).user;

      const logEntry = {
        level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        userId: user?.sub ?? undefined,
        agencyId: user?.agencyId ?? undefined
      };

      const line = JSON.stringify(logEntry);

      if (res.statusCode >= 500) {
        process.stderr.write(line + '\n');
      } else {
        process.stdout.write(line + '\n');
      }
    });

    next();
  }
}
