/**
 * COMMAND — /help
 * ───────────────────────────────────────────────────────────────────
 * Full command reference.
 * Uses HTML parse_mode for structured formatting.
 *
 * TIP: Keep /help up to date — it's the first thing users read
 * when something doesn't work.
 */

module.exports = async (ctx) => {
    await ctx.replyWithHTML(
        `<b>📖 LearnBot — Command Reference</b>\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>🧭 Navigation</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `/start — Welcome screen + main menu\n` +
        `/help  — This command list\n` +
        `/learn — Interactive concept browser (9 topics)\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>🛠 Utility Features</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `/weather &lt;city&gt; — Current weather, no API key needed\n` +
        `  Example: <code>/weather Mumbai</code>\n\n` +
        `/note &lt;text&gt;  — Save a note (demonstrates ctx.session)\n` +
        `  Example: <code>/note Read about webhooks</code>\n\n` +
        `/notes       — View all your saved notes\n` +
        `/clearnotes  — Delete all saved notes\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>🎮 Feature Demos</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `/quiz        — 6-question bot concepts quiz\n` +
        `              <i>Demos: inline keyboards + callback queries</i>\n\n` +
        `/form        — Multi-step registration form\n` +
        `              <i>Demos: WizardScene + ctx.wizard.state + sessions</i>\n\n` +
        `/sendphoto   — Bot sends an image\n` +
        `              <i>Demos: replyWithPhoto via URL + Buffer</i>\n\n` +
        `/senddoc     — Bot sends a generated text file\n` +
        `              <i>Demos: replyWithDocument via Buffer</i>\n\n` +
        `/whoami      — Your full Telegram user info\n` +
        `              <i>Demos: ctx.from, ctx.chat, profile photos</i>\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>🔍 Inline Mode</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `Works from <b>any chat</b> — type in the message box:\n` +
        `<code>@yourbotname weather &lt;city&gt;</code>\n` +
        `<code>@yourbotname joke</code>\n` +
        `<code>@yourbotname help</code>\n\n` +

        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>🔄 Auto-Handled</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `🎴 Stickers — bot reacts\n` +
        `💬 Plain text — bot acknowledges`
    );
};
