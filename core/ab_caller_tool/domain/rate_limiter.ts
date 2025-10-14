/**
 * Rate Limiter
 * 
 * Implements rate limiting for A/B test calls using token bucket algorithm.
 * Supports per-CLI rate limiting and dynamic rate adjustment based on quality gates.
 */

export type RateLimitConfig = {
  max_calls_per_hour: number;
  burst_capacity: number;
  refill_rate: number; // calls per second
  downshift_factor: number; // factor to reduce rate when quality issues detected
};

export type RateLimitStatus = {
  allowed: boolean;
  remaining_tokens: number;
  reset_time: Date;
  rate_limit_key: string;
};

export type RateLimitStats = {
  total_requests: number;
  allowed_requests: number;
  blocked_requests: number;
  current_rate: number; // requests per minute
  average_rate: number; // requests per minute over time window
};

export class RateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private config: RateLimitConfig;
  private stats: Map<string, RateLimitStats> = new Map();

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(rateLimitKey: string): RateLimitStatus {
    const bucket = this.getOrCreateBucket(rateLimitKey);
    const now = new Date();
    
    // Refill tokens based on time passed
    this.refillBucket(bucket, now);
    
    // Check if we have enough tokens
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      bucket.lastRequest = now;
      this.updateStats(rateLimitKey, true);
      
      return {
        allowed: true,
        remaining_tokens: bucket.tokens,
        reset_time: new Date(now.getTime() + (bucket.capacity / bucket.refillRate) * 1000),
        rate_limit_key: rateLimitKey
      };
    }
    
    this.updateStats(rateLimitKey, false);
    
    return {
      allowed: false,
      remaining_tokens: bucket.tokens,
      reset_time: new Date(now.getTime() + (bucket.capacity / bucket.refillRate) * 1000),
      rate_limit_key: rateLimitKey
    };
  }

  /**
   * Apply downshift to rate limit
   */
  applyDownshift(rateLimitKey: string): void {
    const bucket = this.buckets.get(rateLimitKey);
    if (bucket) {
      bucket.refillRate *= this.config.downshift_factor;
      bucket.refillRate = Math.max(0.1, bucket.refillRate); // Minimum rate
    }
  }

  /**
   * Reset rate limit to original rate
   */
  resetRate(rateLimitKey: string): void {
    const bucket = this.buckets.get(rateLimitKey);
    if (bucket) {
      bucket.refillRate = this.config.refill_rate;
    }
  }

  /**
   * Get rate limit statistics
   */
  getStats(rateLimitKey?: string): RateLimitStats | Map<string, RateLimitStats> {
    if (rateLimitKey) {
      return this.stats.get(rateLimitKey) || {
        total_requests: 0,
        allowed_requests: 0,
        blocked_requests: 0,
        current_rate: 0,
        average_rate: 0
      };
    }
    
    return new Map(this.stats);
  }

  /**
   * Get or create token bucket for a key
   */
  private getOrCreateBucket(rateLimitKey: string): TokenBucket {
    if (!this.buckets.has(rateLimitKey)) {
      this.buckets.set(rateLimitKey, new TokenBucket(
        this.config.burst_capacity,
        this.config.refill_rate
      ));
    }
    
    return this.buckets.get(rateLimitKey)!;
  }

  /**
   * Refill bucket tokens based on time passed
   */
  private refillBucket(bucket: TokenBucket, now: Date): void {
    const timePassed = (now.getTime() - bucket.lastRefill.getTime()) / 1000;
    const tokensToAdd = timePassed * bucket.refillRate;
    
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  /**
   * Update statistics
   */
  private updateStats(rateLimitKey: string, allowed: boolean): void {
    const stats = this.stats.get(rateLimitKey) || {
      total_requests: 0,
      allowed_requests: 0,
      blocked_requests: 0,
      current_rate: 0,
      average_rate: 0
    };
    
    stats.total_requests++;
    if (allowed) {
      stats.allowed_requests++;
    } else {
      stats.blocked_requests++;
    }
    
    // Calculate current rate (requests per minute)
    const now = new Date();
    const timeWindow = 60 * 1000; // 1 minute
    const recentRequests = this.getRecentRequests(rateLimitKey, now, timeWindow);
    stats.current_rate = recentRequests;
    
    this.stats.set(rateLimitKey, stats);
  }

  /**
   * Get recent requests count
   */
  private getRecentRequests(rateLimitKey: string, now: Date, timeWindow: number): number {
    // This would typically query a database or cache
    // For now, return a mock value
    return 0;
  }

  /**
   * Clean up old buckets and stats
   */
  cleanup(): void {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [key, bucket] of this.buckets.entries()) {
      if (now.getTime() - bucket.lastRefill.getTime() > maxAge) {
        this.buckets.delete(key);
        this.stats.delete(key);
      }
    }
  }

  /**
   * Get rate limit configuration
   */
  getConfig(): RateLimitConfig {
    return { ...this.config };
  }

  /**
   * Update rate limit configuration
   */
  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Token Bucket
 * 
 * Implements token bucket algorithm for rate limiting.
 */
class TokenBucket {
  public capacity: number;
  public tokens: number;
  public refillRate: number; // tokens per second
  public lastRefill: Date;
  public lastRequest: Date;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.lastRefill = new Date();
    this.lastRequest = new Date();
  }

  /**
   * Check if tokens are available
   */
  hasTokens(required: number = 1): boolean {
    return this.tokens >= required;
  }

  /**
   * Consume tokens
   */
  consume(tokens: number = 1): boolean {
    if (this.hasTokens(tokens)) {
      this.tokens -= tokens;
      this.lastRequest = new Date();
      return true;
    }
    return false;
  }

  /**
   * Get remaining tokens
   */
  getRemainingTokens(): number {
    return this.tokens;
  }

  /**
   * Get time until next token is available
   */
  getTimeUntilNextToken(): number {
    if (this.tokens >= 1) {
      return 0;
    }
    
    const tokensNeeded = 1 - this.tokens;
    return (tokensNeeded / this.refillRate) * 1000; // milliseconds
  }
}

/**
 * Multi-level Rate Limiter
 * 
 * Implements rate limiting at multiple levels (global, per-CLI, per-test).
 */
export class MultiLevelRateLimiter {
  private limiters: Map<string, RateLimiter> = new Map();
  private globalLimiter: RateLimiter;

  constructor(globalConfig: RateLimitConfig) {
    this.globalLimiter = new RateLimiter(globalConfig);
  }

  /**
   * Check if request is allowed at all levels
   */
  isAllowed(keys: {
    global?: string;
    cli?: string;
    test?: string;
  }): {
    allowed: boolean;
    blocking_level?: string;
    status: Record<string, RateLimitStatus>;
  } {
    const status: Record<string, RateLimitStatus> = {};
    let allowed = true;
    let blockingLevel: string | undefined;

    // Check global rate limit
    if (keys.global) {
      const globalStatus = this.globalLimiter.isAllowed(keys.global);
      status.global = globalStatus;
      
      if (!globalStatus.allowed) {
        allowed = false;
        blockingLevel = 'global';
      }
    }

    // Check CLI rate limit
    if (keys.cli && allowed) {
      const cliLimiter = this.getOrCreateLimiter('cli', keys.cli);
      const cliStatus = cliLimiter.isAllowed(keys.cli);
      status.cli = cliStatus;
      
      if (!cliStatus.allowed) {
        allowed = false;
        blockingLevel = 'cli';
      }
    }

    // Check test rate limit
    if (keys.test && allowed) {
      const testLimiter = this.getOrCreateLimiter('test', keys.test);
      const testStatus = testLimiter.isAllowed(keys.test);
      status.test = testStatus;
      
      if (!testStatus.allowed) {
        allowed = false;
        blockingLevel = 'test';
      }
    }

    return {
      allowed,
      blocking_level: blockingLevel,
      status
    };
  }

  /**
   * Get or create rate limiter for a specific level
   */
  private getOrCreateLimiter(level: string, key: string): RateLimiter {
    const limiterKey = `${level}_${key}`;
    
    if (!this.limiters.has(limiterKey)) {
      // Create limiter with level-specific config
      const config = this.getConfigForLevel(level);
      this.limiters.set(limiterKey, new RateLimiter(config));
    }
    
    return this.limiters.get(limiterKey)!;
  }

  /**
   * Get configuration for a specific level
   */
  private getConfigForLevel(level: string): RateLimitConfig {
    const baseConfig: RateLimitConfig = {
      max_calls_per_hour: 100,
      burst_capacity: 10,
      refill_rate: 1,
      downshift_factor: 0.5
    };

    switch (level) {
      case 'cli':
        return {
          ...baseConfig,
          max_calls_per_hour: 50,
          burst_capacity: 5
        };
      case 'test':
        return {
          ...baseConfig,
          max_calls_per_hour: 200,
          burst_capacity: 20
        };
      default:
        return baseConfig;
    }
  }

  /**
   * Apply downshift to all levels
   */
  applyDownshift(keys: { cli?: string; test?: string }): void {
    if (keys.cli) {
      const cliLimiter = this.limiters.get(`cli_${keys.cli}`);
      cliLimiter?.applyDownshift(keys.cli);
    }
    
    if (keys.test) {
      const testLimiter = this.limiters.get(`test_${keys.test}`);
      testLimiter?.applyDownshift(keys.test);
    }
  }

  /**
   * Get statistics for all levels
   */
  getAllStats(): Record<string, RateLimitStats> {
    const allStats: Record<string, RateLimitStats> = {};
    
    for (const [key, limiter] of this.limiters.entries()) {
      allStats[key] = limiter.getStats();
    }
    
    return allStats;
  }
}


