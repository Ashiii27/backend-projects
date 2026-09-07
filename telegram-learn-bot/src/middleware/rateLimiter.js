/**
 * MIDDLEWARE — RATE LIMITER
 * ───────────────────────────────────────────────────────────────────
 * CONCEPT: Rate Limiting
 *
 * Prevents a single user from spamming your bot with requests.
 * This implementation is in-memory: the counter resets when the bot restarts.
 *
 * For production, use Redis-backed counters so limits survive restarts
 * and work across multiple bot instances.
 *
 * The 'telegraf-ratelimit' npm package is a drop-in alternative:
 *   const rateLimit = require('telegraf-ratelimit');
 *   bot.use(rateLimit({ window: 1000, limit: 3, onLimitExceeded: ... }));
 *
 * Telegram's own rate limits:
 *   - 30 messages per second globally
 *   - 1 message per second to the same user
 *   - HTTP 429 (Too Many Requests) returned when exceeded
 */

// Map of userId → { count: number, resetAt: timestamp }
const userRequests = new Map();

const LIMIT  = 10;       // Max requests per window
const WINDOW = 60_000;   // Window size in milliseconds (60 seconds)

module.exports = async (ctx, next) => {
    const userId = ctx.from?.id;

    // Skip rate limiting if we can't identify the user (e.g., channel posts)
    if (!userId) return next();

    const now  = Date.now();
    const record = userRequests.get(userId) ?? { count: 0, resetAt: now + WINDOW };

    // Reset the window if it has expired
    if (now > record.resetAt) {
        record.count   = 0;
        record.resetAt = now + WINDOW;
    }

    record.count++;
    userRequests.set(userId, record);

    if (record.count > LIMIT) {
        const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
        // DON'T call next() — this stops the update from reaching any handler
        return ctx.reply(
            `⚠️ You're sending commands too fast.\n\nPlease wait ${waitSeconds}s before trying again.`
        );
    }

    return next();
};
