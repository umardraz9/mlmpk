/**
 * Centralized Logger for Partnership Program
 * Replaces console.log statements to prevent sensitive data exposure
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logQueue: LogEntry[] = [];
  private maxQueueSize = 100;

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    
    if (typeof data === 'object') {
      const sanitized = { ...data };
      
      for (const field of sensitiveFields) {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      }
      
      // Sanitize nested objects
      for (const key in sanitized) {
        if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
          sanitized[key] = this.sanitizeData(sanitized[key]);
        }
      }
      
      return sanitized;
    }
    
    return data;
  }

  private log(level: LogLevel, message: string, data?: any, context?: string) {
    const entry: LogEntry = {
      level,
      message,
      data: this.sanitizeData(data),
      timestamp: new Date().toISOString(),
      context
    };

    // In development, log to console
    if (this.isDevelopment) {
      const color = {
        info: '\x1b[36m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
        debug: '\x1b[90m'
      }[level];
      
      const reset = '\x1b[0m';
      const prefix = context ? `[${context}]` : '';
      
      console.log(`${color}[${level.toUpperCase()}]${reset} ${prefix} ${message}`, data || '');
    }

    // Add to queue for production logging service
    this.logQueue.push(entry);
    
    if (this.logQueue.length > this.maxQueueSize) {
      this.flush();
    }
  }

  info(message: string, data?: any, context?: string) {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: any, context?: string) {
    this.log('warn', message, data, context);
  }

  error(message: string, error?: any, context?: string) {
    const errorData = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error;
    
    this.log('error', message, errorData, context);
    
    // In production, send to error tracking service
    if (!this.isDevelopment && typeof window === 'undefined') {
      // Server-side error tracking
      this.sendToErrorTracking(message, errorData);
    }
  }

  debug(message: string, data?: any, context?: string) {
    if (this.isDevelopment) {
      this.log('debug', message, data, context);
    }
  }

  private async sendToErrorTracking(message: string, error: any) {
    // TODO: Integrate with Sentry or similar service
    // For now, just ensure errors don't get lost
    try {
      // Example: await sentry.captureException(error);
    } catch (e) {
      // Fail silently to prevent error loops
    }
  }

  async flush() {
    if (this.logQueue.length === 0) return;
    
    const logsToSend = [...this.logQueue];
    this.logQueue = [];
    
    if (!this.isDevelopment) {
      // TODO: Send to logging service (e.g., CloudWatch, LogRocket)
      try {
        // await sendToLoggingService(logsToSend);
      } catch (e) {
        // Fail silently
      }
    }
  }

  // Utility method for performance tracking
  time(label: string) {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // Method to create a child logger with context
  child(context: string) {
    return {
      info: (message: string, data?: any) => this.info(message, data, context),
      warn: (message: string, data?: any) => this.warn(message, data, context),
      error: (message: string, error?: any) => this.error(message, error, context),
      debug: (message: string, data?: any) => this.debug(message, data, context),
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for specific contexts
export const apiLogger = logger.child('API');
export const authLogger = logger.child('AUTH');

// Graceful shutdown - only in Node.js environment, not Edge Runtime
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.on && !process.env.NEXT_RUNTIME) {
  try {
    process.on('beforeExit', () => {
      logger.flush();
    });
  } catch (error) {
    // Silently ignore errors in Edge Runtime
  }
}
