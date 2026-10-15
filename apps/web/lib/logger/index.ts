type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    digest?: string;
  };
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: Record<string, any>, error?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error: error ? {
        message: error.message || String(error),
        stack: error.stack,
        digest: error.digest,
      } : undefined,
    };
  }

  private print(entry: LogEntry) {
    const output = JSON.stringify(entry);
    switch (entry.level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.print(this.formatLog('info', message, context));
  }

  warn(message: string, context?: Record<string, any>) {
    this.print(this.formatLog('warn', message, context));
  }

  error(message: string, error?: any, context?: Record<string, any>) {
    this.print(this.formatLog('error', message, context, error));
  }

  debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV !== 'production') {
      this.print(this.formatLog('debug', message, context));
    }
  }
}

export const logger = new Logger();
