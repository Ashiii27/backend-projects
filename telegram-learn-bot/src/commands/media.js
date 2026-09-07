/**
 * COMMANDS — /sendphoto, /senddoc, /whoami
 * ───────────────────────────────────────────────────────────────────
 * CONCEPT: File & Media Handling
 *
 * Telegram supports sending media in three ways:
 *
 *   1. By URL      — Telegram downloads and caches it
 *                    { url: 'https://example.com/photo.jpg' }
 *
 *   2. By file_id  — Reuse a file already uploaded to Telegram
 *                    Fastest, most efficient, no re-upload
 *                    (you get the file_id from a previously sent file)
 *
 *   3. By Buffer   — Upload raw bytes from memory (generated content)
 *                    { source: Buffer.from(data), filename: 'name.txt' }
 *
 *   4. By path     — Upload a file from disk
 *                    { source: '/path/to/file.pdf' }
 *
 * Supported reply methods:
 *   ctx.replyWithPhoto(source, extra)
 *   ctx.replyWithDocument(source, extra)
 *   ctx.replyWithAudio(source, extra)
 *   ctx.replyWithVideo(source, extra)
 *   ctx.replyWithVoice(source, extra)
 *   ctx.replyWithAnimation(source, extra)
 *   ctx.replyWithSticker(source, extra)
 */

// ─── /sendphoto — Send an image ───────────────────────────────────────────────
const sendPhoto = async (ctx) => {
    // First send a text explanation
    await ctx.replyWithHTML(
        `<b>📸 Photo Sending Demo</b>\n\n` +
        `Bots can send photos three ways:\n` +
        `1. <b>URL</b> — Telegram fetches & caches it (shown below)\n` +
        `2. <b>file_id</b> — reuse a cached Telegram file (fastest)\n` +
        `3. <b>Buffer/Stream</b> — dynamically generated images\n\n` +
        `<code>ctx.replyWithPhoto(\n` +
        `  { url: 'https://...' },\n` +
        `  { caption: '...', parse_mode: 'HTML' }\n` +
        `);</code>`
    );

    // Send the actual photo
    await ctx.replyWithPhoto(
        { url: 'https://picsum.photos/800/500' },
        {
            caption:
                `📸 Sent via <b>URL</b> — Telegram caches it on their servers.\n\n` +
                `After sending, Telegram returns a <code>file_id</code> you can reuse ` +
                `to send the same file again without re-uploading.`,
            parse_mode: 'HTML',
        }
    );
};

// ─── /senddoc — Send a generated document ────────────────────────────────────
const sendDoc = async (ctx) => {
    /**
     * This document is generated entirely in memory as a Buffer.
     * No file is written to disk — the bytes go straight to Telegram.
     *
     * Use this pattern for:
     *   - Generated reports (CSV, TXT, JSON exports)
     *   - Dynamic PDFs (with pdfkit or puppeteer)
     *   - Config files, receipts, logs
     */
    const content = `
TELEGRAM BOT — QUICK REFERENCE CARD
=====================================

BOT LIFECYCLE:
--------------
1. Get token from @BotFather
2. require('dotenv').config()
3. const bot = new Telegraf(process.env.BOT_TOKEN)
4. Register middleware → commands → handlers
5. bot.launch()  OR  webhook setup

MIDDLEWARE CHAIN:
-----------------
bot.use(loggerMiddleware);
bot.use(rateLimiterMiddleware);
bot.use(session());
bot.use(stage.middleware());   // must come after session()

COMMAND HANDLER:
----------------
bot.command('hello', async (ctx) => {
  const name = ctx.from.first_name;
  await ctx.reply(\`Hello, \${name}!\`);
});

INLINE KEYBOARD:
----------------
ctx.reply('Choose:', Markup.inlineKeyboard([
  [Markup.button.callback('Option A', 'cb:a')],
  [Markup.button.url('Docs', 'https://telegraf.js.org')],
]));

bot.action('cb:a', async (ctx) => {
  await ctx.answerCbQuery('You chose A');
  await ctx.editMessageText('Choice confirmed!');
});

SESSION:
--------
bot.use(session());  // must come before commands
bot.command('count', (ctx) => {
  ctx.session.n = (ctx.session.n ?? 0) + 1;
  ctx.reply(\`Count: \${ctx.session.n}\`);
});

WIZARD SCENE:
-------------
const wizard = new Scenes.WizardScene('form',
  async (ctx) => { await ctx.reply('Name?'); return ctx.wizard.next(); },
  async (ctx) => {
    ctx.wizard.state.name = ctx.message.text;
    await ctx.reply(\`Hi \${ctx.wizard.state.name}!\`);
    return ctx.scene.leave();
  }
);
const stage = new Scenes.Stage([wizard]);
bot.use(stage.middleware());
bot.command('form', (ctx) => ctx.scene.enter('form'));

INLINE MODE:
------------
bot.on('inline_query', async (ctx) => {
  await ctx.answerInlineQuery([
    { type: 'article', id: '1', title: 'Result',
      input_message_content: { message_text: 'Hello!' } }
  ]);
});

ERROR HANDLING:
---------------
bot.catch((err, ctx) => {
  console.error(err);
  ctx.reply('Something went wrong.').catch(() => {});
});

WEBHOOK SETUP:
--------------
const app = express();
app.use(bot.webhookCallback('/hook'));
await bot.telegram.setWebhook('https://yourdomain.com/hook');
app.listen(3000);

GRACEFUL SHUTDOWN:
------------------
process.once('SIGINT',  () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

USEFUL LINKS:
-------------
Telegraf docs:       https://telegraf.js.org
Telegram Bot API:    https://core.telegram.org/bots/api
BotFather:           @BotFather on Telegram
wttr.in weather API: https://wttr.in/:help
JokeAPI:             https://v2.jokeapi.dev
`.trimStart();

    await ctx.replyWithHTML(
        `<b>📄 Document Sending Demo</b>\n\n` +
        `The file below was generated <b>in memory</b> as a Buffer — no disk I/O:\n\n` +
        `<code>ctx.replyWithDocument(\n` +
        `  {\n` +
        `    source: Buffer.from(content, 'utf-8'),\n` +
        `    filename: 'reference.txt',\n` +
        `  },\n` +
        `  { caption: '...', parse_mode: 'HTML' }\n` +
        `);</code>`
    );

    await ctx.replyWithDocument(
        {
            source:   Buffer.from(content, 'utf-8'),
            filename: 'telegram-bot-reference.txt',
        },
        {
            caption:
                `📄 <b>Telegram Bot Quick Reference</b>\n\n` +
                `Generated as a Buffer in memory — no file ever written to disk.`,
            parse_mode: 'HTML',
        }
    );
};

// ─── /whoami — Show user and chat context ────────────────────────────────────
const whoami = async (ctx) => {
    /**
     * ctx.from — User object:
     *   id, first_name, last_name, username, language_code, is_bot, is_premium
     *
     * ctx.chat — Chat object:
     *   id, type ('private'|'group'|'supergroup'|'channel'), title, username
     *
     * Both are available on every message-based update.
     */
    const u = ctx.from;
    const c = ctx.chat;

    await ctx.replyWithHTML(
        `<b>👤 Your Telegram Context</b>\n\n` +

        `<b>ctx.from (User):</b>\n` +
        `  🆔 ID:         <code>${u.id}</code>\n` +
        `  👤 First name: ${u.first_name}\n` +
        `  👤 Last name:  ${u.last_name  ?? '<i>none</i>'}\n` +
        `  📛 Username:   ${u.username   ? '@' + u.username : '<i>none</i>'}\n` +
        `  🌐 Language:   ${u.language_code ?? '<i>unknown</i>'}\n` +
        `  ⭐ Premium:    ${u.is_premium ? 'Yes' : 'No'}\n` +
        `  🤖 Is bot:     ${u.is_bot     ? 'Yes' : 'No'}\n\n` +

        `<b>ctx.chat (Chat):</b>\n` +
        `  🆔 ID:   <code>${c.id}</code>\n` +
        `  💬 Type: ${c.type}\n\n` +

        `<i>💡 These objects are available in every ctx on message-based updates.\n` +
        `Use ctx.from.id to identify users, ctx.from.language_code for i18n,\n` +
        `and ctx.chat.id to send messages to a specific chat.</i>`
    );

    // Try to fetch and send the user's profile photo
    try {
        const photos = await ctx.telegram.getUserProfilePhotos(u.id, { limit: 1 });

        if (photos.total_count > 0) {
            const fileId = photos.photos[0][0].file_id;
            await ctx.replyWithPhoto(fileId, {
                caption:
                    `📸 Your profile photo, fetched via <code>getUserProfilePhotos()</code>.\n\n` +
                    `<b>file_id:</b> <code>${fileId}</code>\n\n` +
                    `<i>You can reuse this file_id to send the same photo again instantly, ` +
                    `without re-uploading.</i>`,
                parse_mode: 'HTML',
            });
        } else {
            await ctx.reply(`(No profile photo set — or privacy settings block access.)`);
        }
    } catch {
        // Profile photo access may be restricted by Telegram privacy settings
        await ctx.reply(`(Profile photo not accessible due to privacy settings.)`);
    }
};

module.exports = { sendPhoto, sendDoc, whoami };
