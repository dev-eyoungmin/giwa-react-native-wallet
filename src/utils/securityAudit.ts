/**
 * Security Audit Logging Utility
 *
 * Provides security event logging for sensitive wallet operations.
 * Logs are sanitized to never include sensitive data like private keys or mnemonics.
 */

/**
 * Security event types for audit logging
 */
export type SecurityEventType =
  | 'WALLET_CREATED'
  | 'WALLET_RECOVERED'
  | 'WALLET_IMPORTED'
  | 'WALLET_DELETED'
  | 'WALLET_CONNECTED'
  | 'WALLET_DISCONNECTED'
  | 'MNEMONIC_EXPORT_ATTEMPT'
  | 'MNEMONIC_EXPORT_SUCCESS'
  | 'MNEMONIC_EXPORT_FAILED'
  | 'PRIVATE_KEY_EXPORT_ATTEMPT'
  | 'PRIVATE_KEY_EXPORT_SUCCESS'
  | 'PRIVATE_KEY_EXPORT_FAILED'
  | 'TRANSACTION_SIGNED'
  | 'TRANSACTION_SENT'
  | 'BIOMETRIC_AUTH_ATTEMPT'
  | 'BIOMETRIC_AUTH_SUCCESS'
  | 'BIOMETRIC_AUTH_FAILED'
  | 'RATE_LIMIT_TRIGGERED'
  | 'SECURITY_VIOLATION';

/**
 * Security event log entry
 */
export interface SecurityLogEntry {
  /** Event type */
  type: SecurityEventType;
  /** ISO timestamp */
  timestamp: string;
  /** Sanitized event details (never includes sensitive data) */
  details?: Record<string, unknown>;
  /** Optional wallet address (partial for privacy) */
  walletAddressHint?: string;
}

/**
 * Security audit configuration
 */
export interface SecurityAuditConfig {
  /** Enable logging to console (development only) */
  enableConsoleLog?: boolean;
  /** Custom log handler for external logging systems */
  customLogHandler?: (entry: SecurityLogEntry) => void;
  /** Maximum number of entries to keep in memory */
  maxLogEntries?: number;
}

/**
 * Security Audit Logger
 *
 * Provides a centralized system for logging security-relevant events
 * in the wallet SDK. All logs are sanitized to prevent sensitive data exposure.
 */
export class SecurityAuditLogger {
  private config: SecurityAuditConfig;
  private logEntries: SecurityLogEntry[] = [];
  private static instance: SecurityAuditLogger | null = null;

  constructor(config: SecurityAuditConfig = {}) {
    this.config = {
      enableConsoleLog: __DEV__ || false,
      maxLogEntries: 100,
      ...config,
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: SecurityAuditConfig): SecurityAuditLogger {
    if (!SecurityAuditLogger.instance) {
      SecurityAuditLogger.instance = new SecurityAuditLogger(config);
    }
    return SecurityAuditLogger.instance;
  }

  /**
   * Reset singleton instance (for testing)
   */
  static resetInstance(): void {
    SecurityAuditLogger.instance = null;
  }

  /**
   * Log a security event
   * @param type - Event type
   * @param details - Optional sanitized details
   * @param walletAddress - Optional wallet address (will be partially masked)
   */
  log(
    type: SecurityEventType,
    details?: Record<string, unknown>,
    walletAddress?: string
  ): void {
    const entry: SecurityLogEntry = {
      type,
      timestamp: new Date().toISOString(),
      details: this.sanitizeDetails(details),
      walletAddressHint: walletAddress
        ? this.maskAddress(walletAddress)
        : undefined,
    };

    // Store in memory (with size limit)
    this.logEntries.push(entry);
    if (this.logEntries.length > (this.config.maxLogEntries || 100)) {
      this.logEntries.shift();
    }

    // Console logging (development only)
    if (this.config.enableConsoleLog) {
      console.log(`[SECURITY] ${type}`, entry);
    }

    // Custom handler
    if (this.config.customLogHandler) {
      try {
        this.config.customLogHandler(entry);
      } catch {
        // Silently fail - don't let logging errors break the app
      }
    }
  }

  /**
   * Log export attempt with rate limit tracking
   */
  logExportAttempt(
    exportType: 'mnemonic' | 'privateKey',
    options: {
      biometricRequested?: boolean;
      remainingAttempts?: number;
    } = {}
  ): void {
    const type =
      exportType === 'mnemonic'
        ? 'MNEMONIC_EXPORT_ATTEMPT'
        : 'PRIVATE_KEY_EXPORT_ATTEMPT';

    this.log(type, {
      biometricRequested: options.biometricRequested ?? false,
      remainingAttempts: options.remainingAttempts,
    });
  }

  /**
   * Log rate limit triggered event
   */
  logRateLimitTriggered(operation: string, cooldownSeconds: number): void {
    this.log('RATE_LIMIT_TRIGGERED', {
      operation,
      cooldownSeconds,
    });
  }

  /**
   * Log security violation
   */
  logSecurityViolation(reason: string, context?: Record<string, unknown>): void {
    this.log('SECURITY_VIOLATION', {
      reason,
      ...context,
    });
  }

  /**
   * Get recent log entries
   * @param count - Number of entries to retrieve
   */
  getRecentLogs(count: number = 10): SecurityLogEntry[] {
    return this.logEntries.slice(-count);
  }

  /**
   * Clear all log entries
   */
  clearLogs(): void {
    this.logEntries = [];
  }

  /**
   * Sanitize details to remove any potentially sensitive data
   */
  private sanitizeDetails(
    details?: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    if (!details) return undefined;

    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = [
      'privateKey',
      'mnemonic',
      'seed',
      'secret',
      'password',
      'key',
    ];

    for (const [key, value] of Object.entries(details)) {
      const lowerKey = key.toLowerCase();

      // Skip sensitive keys
      if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Sanitize string values that look like private keys or mnemonics
      if (typeof value === 'string') {
        if (this.looksLikePrivateKey(value)) {
          sanitized[key] = '[REDACTED_KEY]';
        } else if (this.looksLikeMnemonic(value)) {
          sanitized[key] = '[REDACTED_MNEMONIC]';
        } else {
          sanitized[key] = value;
        }
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Mask wallet address for privacy
   * Shows first 6 and last 4 characters: 0x1234...5678
   */
  private maskAddress(address: string): string {
    if (!address || address.length < 12) return '[INVALID_ADDRESS]';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Check if string looks like a private key
   */
  private looksLikePrivateKey(value: string): boolean {
    // 64 hex characters (with or without 0x prefix)
    const hexPattern = /^(0x)?[a-fA-F0-9]{64}$/;
    return hexPattern.test(value.trim());
  }

  /**
   * Check if string looks like a mnemonic phrase
   */
  private looksLikeMnemonic(value: string): boolean {
    // 12 or 24 space-separated words
    const words = value.trim().split(/\s+/);
    return words.length === 12 || words.length === 24;
  }
}

/**
 * Global security audit logger instance
 */
export const securityAudit = SecurityAuditLogger.getInstance();

/**
 * Convenience function for logging security events
 */
export function logSecurityEvent(
  type: SecurityEventType,
  details?: Record<string, unknown>,
  walletAddress?: string
): void {
  securityAudit.log(type, details, walletAddress);
}

// Declare __DEV__ for React Native environment
declare const __DEV__: boolean;
