/**
 * COMMANDS — /note, /notes, /clearnotes
 * ───────────────────────────────────────────────────────────────────
 * CONCEPT: Sessions & State
 *
 * Notes are stored in ctx.session.notes — an array that persists
 * across multiple messages from the same user in the same chat.
 *
 * Because we use in-memory session storage (the default), notes
 * disappear when the bot restarts. For real persistence, swap in a
 * Redis or DB-backed session store.
 *
 * Session is scoped per (chat_id + user_id) by default:
 *   - Same user in two different chats → two separate sessions
 *   - Two different users in the same chat → two separate sessions
 *
 * ctx.session is populated by the session() middleware registered in bot.js.
 * If that middleware isn't set up, ctx.session will be undefined.
 */

// ─── /note <text> — Save a note ──────────────────────────────────────────────
const addNote = async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);

    if (args.length === 0) {
        return ctx.replyWithHTML(
            `📝 <b>Usage:</b> <code>/note &lt;text&gt;</code>\n\n` +
            `Example: <code>/note Learn about Telegraf Scenes</code>`
        );
    }

    // Initialize the notes array if this is the user's first note
    ctx.session.notes ??= [];

    const text      = args.join(' ');
    const id        = ctx.session.notes.length + 1;
    const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    ctx.session.notes.push({ id, text, timestamp });

    await ctx.replyWithHTML(
        `✅ <b>Note #${id} saved!</b>\n\n` +
        `<code>${text}</code>\n\n` +
        `You now have <b>${ctx.session.notes.length}</b> note(s). Use /notes to view all.\n\n` +
        `<i>💡 This is stored in <code>ctx.session.notes</code> — in-memory, resets on restart.</i>`
    );
};

// ─── /notes — View all saved notes ───────────────────────────────────────────
const viewNotes = async (ctx) => {
    const notes = ctx.session.notes;

    if (!notes || notes.length === 0) {
        return ctx.replyWithHTML(
            `📭 <b>No notes yet!</b>\n\n` +
            `Add one: <code>/note your text here</code>`
        );
    }

    const list = notes
        .map(n => `${n.id}. ${n.text} <i>(${n.timestamp})</i>`)
        .join('\n');

    await ctx.replyWithHTML(
        `📝 <b>Your Notes</b> (${notes.length} total)\n\n` +
        `${list}\n\n` +
        `Use /clearnotes to delete all.`
    );
};

// ─── /clearnotes — Delete all notes ──────────────────────────────────────────
const clearNotes = async (ctx) => {
    if (!ctx.session.notes || ctx.session.notes.length === 0) {
        return ctx.reply(`📭 No notes to clear.`);
    }

    const count = ctx.session.notes.length;
    ctx.session.notes = [];  // Reset the array — session object itself persists

    await ctx.replyWithHTML(
        `🗑 <b>${count} note(s) deleted.</b>\n\n` +
        `<i>💡 <code>ctx.session.notes</code> was set to <code>[]</code>.\n` +
        `The session itself still exists — only the notes were cleared.</i>`
    );
};

module.exports = { addNote, viewNotes, clearNotes };
