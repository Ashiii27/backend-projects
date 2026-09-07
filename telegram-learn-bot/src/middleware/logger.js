/**
 * MIDDLEWARE — LOGGER
 * ───────────────────────────────────────────────────────────────────
 * CONCEPT: Middleware Pattern
 *
 * A Telegraf middleware is a function with the signature:
 *   async (ctx, next) => { ... }
 *
 * ctx  — the context object for this update (message, user, chat, etc.)
 * next — a function that passes control to the NEXT middleware/handler
 *
 * The pipeline works like this:
 *   Logger → RateLimiter → Session → Stage → YourCommandHandler
 *
 * If you DON'T call next(), the chain stops here.
 * If you DO call next(), control passes to the next layer.
 * Code AFTER await next() runs after all downstream handlers finish.
 * This is called the "onion model" — you wrap the rest of the stack.
 */

module.exports = async (ctx, next) => {
    const start = Date.now();

    // Build a readable label for who sent this update
    const user = ctx.from
        ? `${ctx.from.first_name}${ctx.from.username ? ' (@' + ctx.from.username + ')' : ''} [${ctx.from.id}]`
        : 'Unknown user';

    // Determine what kind of update this is and what it contains
    const updateType = ctx.updateType;  // 'message', 'callback_query', 'inline_query', etc.
    const content    = ctx.message?.text
        ?? ctx.callbackQuery?.data
        ?? ctx.inlineQuery?.query
        ?? '(no text)';

    console.log(`[${new Date().toISOString()}] ↓ ${updateType} | ${user} | ${content}`);

    await next(); // Hand off to the next middleware layer

    // This line runs AFTER all handlers below us have finished
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ↑ Handled in ${ms}ms`);
};
