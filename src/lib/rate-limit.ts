/**
 * Simple in-memory rate limiter for API routes.
 * For production at scale, replace with Redis-based solution.
 */

interface RateLimitEntry {
    count: number
    resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup expired entries every 5 minutes
setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
        if (entry.resetAt <= now) store.delete(key)
    }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
    /** Max requests per window */
    limit: number
    /** Window size in seconds */
    windowSeconds: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
    limit: 60,
    windowSeconds: 60,
}

export interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetAt: number
}

/**
 * Check if a request should be allowed based on rate limiting.
 * @param key - Unique identifier (e.g., IP or userId)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed
 */
export function checkRateLimit(key: string, config: RateLimitConfig = DEFAULT_CONFIG): RateLimitResult {
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || entry.resetAt <= now) {
        // First request in window or window expired
        store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 })
        return { allowed: true, remaining: config.limit - 1, resetAt: now + config.windowSeconds * 1000 }
    }

    if (entry.count >= config.limit) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt }
    }

    entry.count++
    return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt }
}

/**
 * Create rate limit headers for API responses.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    }
}

/**
 * Create a 429 Too Many Requests response.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
    return new Response(
        JSON.stringify({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
                ...rateLimitHeaders(result),
            },
        }
    )
}
