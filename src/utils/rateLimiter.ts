/**
 * Rate Limiter Utility
 *
 * Provides rate limiting functionality for sensitive operations
 * like private key/mnemonic exports to prevent brute force attacks.
 */

import { GiwaSecurityError } from './errors';

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
  /** Maximum number of attempts allowed within the time window */
  maxAttempts: number;
  /** Time window in milliseconds for counting attempts */
  windowMs: number;
  /** Cooldown period in milliseconds after rate limit is exceeded */
  cooldownMs: number;
}

/**
 * Rate limiter for sensitive operations
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private cooldowns: Map<string, number> = new Map();

  /**
   * Check if an operation is allowed under the rate limit
   * @param key - Unique identifier for the operation type
   * @param config - Rate limit configuration
   * @throws GiwaSecurityError if rate limit is exceeded
   */
  async checkLimit(key: string, config: RateLimitConfig): Promise<void> {
    const now = Date.now();

    // Check if in cooldown period
    const cooldownEnd = this.cooldowns.get(key);
    if (cooldownEnd && now < cooldownEnd) {
      const remainingSeconds = Math.ceil((cooldownEnd - now) / 1000);
      throw new GiwaSecurityError(
        `Rate limit exceeded. Try again in ${remainingSeconds} seconds.`,
        'RATE_LIMIT_EXCEEDED',
        { remainingSeconds, cooldownEnd }
      );
    }

    // Get recent attempts within the time window
    const attemptTimestamps = this.attempts.get(key) || [];
    const recentAttempts = attemptTimestamps.filter(
      (timestamp) => now - timestamp < config.windowMs
    );

    // Check if max attempts exceeded
    if (recentAttempts.length >= config.maxAttempts) {
      // Enter cooldown period
      const cooldownEndTime = now + config.cooldownMs;
      this.cooldowns.set(key, cooldownEndTime);

      // Clear attempts for this key
      this.attempts.delete(key);

      const cooldownSeconds = Math.ceil(config.cooldownMs / 1000);
      throw new GiwaSecurityError(
        `Rate limit exceeded. Try again in ${cooldownSeconds} seconds.`,
        'RATE_LIMIT_EXCEEDED',
        { cooldownSeconds, cooldownEnd: cooldownEndTime }
      );
    }

    // Record this attempt
    this.attempts.set(key, [...recentAttempts, now]);
  }

  /**
   * Reset rate limit for a specific key
   * @param key - Unique identifier for the operation type
   */
  reset(key: string): void {
    this.attempts.delete(key);
    this.cooldowns.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.attempts.clear();
    this.cooldowns.clear();
  }

  /**
   * Get remaining attempts for a key
   * @param key - Unique identifier for the operation type
   * @param config - Rate limit configuration
   * @returns Number of remaining attempts, or 0 if in cooldown
   */
  getRemainingAttempts(key: string, config: RateLimitConfig): number {
    const now = Date.now();

    // Check if in cooldown
    const cooldownEnd = this.cooldowns.get(key);
    if (cooldownEnd && now < cooldownEnd) {
      return 0;
    }

    const attemptTimestamps = this.attempts.get(key) || [];
    const recentAttempts = attemptTimestamps.filter(
      (timestamp) => now - timestamp < config.windowMs
    );

    return Math.max(0, config.maxAttempts - recentAttempts.length);
  }

  /**
   * Check if currently in cooldown for a key
   * @param key - Unique identifier for the operation type
   * @returns Cooldown end timestamp if in cooldown, null otherwise
   */
  getCooldownEnd(key: string): number | null {
    const now = Date.now();
    const cooldownEnd = this.cooldowns.get(key);

    if (cooldownEnd && now < cooldownEnd) {
      return cooldownEnd;
    }

    // Clean up expired cooldown
    if (cooldownEnd) {
      this.cooldowns.delete(key);
    }

    return null;
  }
}

/**
 * Rate limit configuration for sensitive export operations
 * - 3 attempts allowed per minute
 * - 5 minute cooldown after exceeding limit
 */
export const EXPORT_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 3,
  windowMs: 60 * 1000, // 1 minute
  cooldownMs: 5 * 60 * 1000, // 5 minutes
};

/**
 * Rate limit configuration for wallet operations
 * - 5 attempts allowed per minute
 * - 2 minute cooldown after exceeding limit
 */
export const WALLET_OPERATION_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 60 * 1000, // 1 minute
  cooldownMs: 2 * 60 * 1000, // 2 minutes
};

/**
 * Global rate limiter instance for the SDK
 */
export const globalRateLimiter = new RateLimiter();
