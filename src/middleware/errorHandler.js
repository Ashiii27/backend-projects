/**
 * MIDDLEWARE — GLOBAL ERROR HANDLER
 * ───────────────────────────────────────────────────────────────────
 * CONCEPT: Error Handling
 *
 * bot.catch((err, ctx) => { ... }) catches ALL unhandled errors thrown
 * from any command handler, middleware, or action handler.
 *
 * Without this, an unhandled async rejection crashes the bot process.
 *
 * Common Telegram API error codes:
 *   400 — Bad Request (invalid params, message too long, etc.)
 *   401 — Unauthorized (invalid token)
 *   403 — Forbidden (bot was blocked by user, or lacks permissions)
 *   404 — Not Found (chat doesn't exist)
 *   429 — Too Many Requests (you're sending too fast, respect Retry-After)
 *   502 — Bad Gateway (Telegram server issues — just retry later)
 *
 * Rule: ALWAYS log full details server-side, show sanitised messages to users.
 * Never expose stack traces or internal error messages in production.
 */

const errorHandler = (err, ctx) => {
    // Always log full error details on the server
    console.error(`[ERROR] Update ${ctx.update?.update_id}: ${err.message}`);
    console.error(err.stack);

    // Map known error conditions to user-friendly messages
    let userMessage;

    if (err.code === 403) {
        // User blocked the bot — we can't send them messages anyway, but log it
        console.log(`[BLOCKED] User ${ctx.from?.id} has blocked the bot.`);
        return;
    }

    if (err.code === 429) {
        userMessage = '⏳ Telegram rate limit hit. Please wait a moment and try again.';
    } else if (err.message?.includes('ETIMEDOUT') || err.message?.includes('ECONNREFUSED')) {
        userMessage = '🌐 Network error while contacting the server. Please try again.';
    } else if (err.message?.includes('message is not modified')) {
        // Harmless — trying to edit a message with the same content, just ignore
        return;
    } else {
        userMessage = '❌ Something went wrong. Please try again.';
    }

    // Wrap in try/catch so errors in the error handler don't cause infinite loops
    ctx.reply(userMessage).catch((e) => {
        console.error('[ERROR_HANDLER] Failed to send error message:', e.message);
    });
};

module.exports = { errorHandler };
