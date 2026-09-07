/**
 * COMMAND — /start
 * ───────────────────────────────────────────────────────────────────
 * The entry point for every new user.
 * Shows a welcome message + inline keyboard for exploring the bot.
 *
 * ctx.from   — the User object (id, first_name, username, language_code, ...)
 * ctx.chat   — the Chat object (id, type, title, ...)
 *
 * ctx.replyWithHTML(text, extra)
 *   Sends a message with parse_mode: 'HTML' pre-set.
 *   Supported tags: <b>, <i>, <u>, <s>, <code>, <pre>, <a href="...">, <tg-spoiler>
 *   Always escape < and > as &lt; &gt; when they're NOT part of a tag.
 */

const { startMenuKeyboard } = require('../utils/keyboards');

module.exports = async (ctx) => {
    const name = ctx.from.first_name ?? 'there';

    await ctx.replyWithHTML(
        `👋 <b>Welcome, ${name}!</b>\n\n` +
        `I'm <b>LearnBot</b> — a living demo that teaches Telegram bot development ` +
        `from basics to advanced, while also being genuinely useful.\n\n` +
        `<b>What's inside:</b>\n` +
        `📚 9 interactive concept guides\n` +
        `🌤 Real-time weather (no API key needed)\n` +
        `📝 Session-backed personal notes\n` +
        `🧠 6-question quiz with instant feedback\n` +
        `📋 Multi-step WizardScene form demo\n` +
        `📁 Photo + document sending demos\n` +
        `🔍 Inline mode — use me in any chat\n\n` +
        `<b>Pick something to explore:</b>`,
        startMenuKeyboard()
    );
};
