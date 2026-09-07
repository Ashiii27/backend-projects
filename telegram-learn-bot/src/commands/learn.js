/**
 * COMMAND — /learn
 * ───────────────────────────────────────────────────────────────────
 * Sends the interactive topic browser keyboard.
 * The actual topic content lives in utils/constants.js (LEARN_TOPICS).
 * When a user taps a topic button, the callback data "learn:token" etc.
 * is handled in handlers/callbacks.js → handleLearn().
 */

const { learnMenuKeyboard } = require('../utils/keyboards');

module.exports = async (ctx) => {
    await ctx.replyWithHTML(
        `<b>📚 Telegram Bot Concepts</b>\n\n` +
        `Tap a topic to read an explanation + code examples:`,
        learnMenuKeyboard()
    );
};
