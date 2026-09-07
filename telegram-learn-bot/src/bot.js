/**
 * BOT ENTRY POINT
 * ───────────────────────────────────────────────────────────────────
 * This file wires everything together:
 *   1. Middleware (logger → rate limiter → session → scenes stage)
 *   2. Commands (/start, /weather, /quiz, etc.)
 *   3. Action handlers (inline keyboard callbacks via bot.action())
 *   4. Inline query handler
 *   5. Fallback handlers (stickers, plain text)
 *   6. Global error handler
 *   7. Launch — polling (dev) or webhook (production)
 *
 * KEY CONCEPT: Order matters!
 * Middleware runs top-to-bottom. session() must come before stage.middleware()
 * because Scenes use ctx.session internally to track which scene a user is in.
 */

require('dotenv').config();
const { Telegraf, session, Scenes } = require('telegraf');
const express = require('express');

// ─── Middleware ───────────────────────────────────────────────────────────────
const loggerMiddleware      = require('./middleware/logger');
const rateLimiterMiddleware = require('./middleware/rateLimiter');
const { errorHandler }      = require('./middleware/errorHandler');

// ─── Commands ─────────────────────────────────────────────────────────────────
const startCommand   = require('./commands/start');
const helpCommand    = require('./commands/help');
const learnCommand   = require('./commands/learn');
const weatherCommand = require('./commands/weather');
const notesCommand   = require('./commands/notes');
const quizCommand    = require('./commands/quiz');
const mediaCommand   = require('./commands/media');

// ─── Scenes ───────────────────────────────────────────────────────────────────
const { formScene } = require('./scenes/formScene');

// ─── Handlers ─────────────────────────────────────────────────────────────────
const inlineHandler                    = require('./handlers/inline');
const { handleMenu, handleLearn, handleQuiz } = require('./handlers/callbacks');

// ─── Bot Instance ─────────────────────────────────────────────────────────────
const bot = new Telegraf(process.env.BOT_TOKEN);

// ═══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE STACK
// Each bot.use() call adds a layer to the update processing pipeline.
// Think of it like Express middleware — every incoming update passes through all
// layers in order before reaching your command handler.
// ═══════════════════════════════════════════════════════════════════════════════

bot.use(loggerMiddleware);       // 1. Log every update + response time
bot.use(rateLimiterMiddleware);  // 2. Block if user exceeds 10 req/min
bot.use(session());              // 3. Attach ctx.session to every update

// 4. Scene stage — wraps ctx so scene-specific methods work (ctx.scene, ctx.wizard)
//    MUST come after session() because scenes store state in ctx.session
const stage = new Scenes.Stage([formScene]);
bot.use(stage.middleware());

// ═══════════════════════════════════════════════════════════════════════════════
// COMMANDS
// bot.command('name', handler) listens for /name messages.
// bot.start() is shorthand for bot.command('start').
// bot.help() is shorthand for bot.command('help').
// ═══════════════════════════════════════════════════════════════════════════════

bot.start(startCommand);
bot.help(helpCommand);

bot.command('learn',      learnCommand);
bot.command('weather',    weatherCommand);
bot.command('note',       notesCommand.addNote);
bot.command('notes',      notesCommand.viewNotes);
bot.command('clearnotes', notesCommand.clearNotes);
bot.command('quiz',       quizCommand);
bot.command('sendphoto',  mediaCommand.sendPhoto);
bot.command('senddoc',    mediaCommand.sendDoc);
bot.command('whoami',     mediaCommand.whoami);

// Enter the WizardScene when user runs /form
bot.command('form', (ctx) => ctx.scene.enter('registration'));

// ═══════════════════════════════════════════════════════════════════════════════
// INLINE QUERY HANDLER
// Fired when a user types "@yourbotname query" in any chat.
// Requires inline mode to be enabled via @BotFather → /setinline
// ═══════════════════════════════════════════════════════════════════════════════

bot.on('inline_query', inlineHandler);

// ═══════════════════════════════════════════════════════════════════════════════
// ACTION HANDLERS (Inline Keyboard Callbacks)
// bot.action(pattern, handler) fires when a user clicks an inline button whose
// callback_data matches the pattern.
//
// Using regex patterns instead of bot.on('callback_query') keeps handlers
// focused and avoids interfering with scene-internal callbacks (form:*, etc.)
// ═══════════════════════════════════════════════════════════════════════════════

bot.action(/^menu:/,        handleMenu);   // Main navigation menu buttons
bot.action(/^learn:/,       handleLearn);  // Learning topic buttons
bot.action(/^quiz:answer:/, handleQuiz);   // Quiz answer buttons

// ═══════════════════════════════════════════════════════════════════════════════
// FALLBACK HANDLERS
// These only fire when no command/action handler matched the update.
// ═══════════════════════════════════════════════════════════════════════════════

bot.on('sticker', (ctx) => ctx.reply('🎨 Nice sticker! Try /help to see what I can do.'));

bot.on('text', (ctx) => {
    // Only reply to non-commands (commands that don't match any handler)
    if (!ctx.message.text.startsWith('/')) {
        ctx.reply("💬 I got your message! I'm command-driven — use /help to see what I can do.");
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// bot.catch() catches ALL unhandled errors from any handler.
// Always use this — an unhandled async rejection will crash your bot.
// ═══════════════════════════════════════════════════════════════════════════════

bot.catch(errorHandler);

// ═══════════════════════════════════════════════════════════════════════════════
// LAUNCH — POLLING vs WEBHOOK
// See /learn → "Polling vs Webhook" for a full explanation.
// ═══════════════════════════════════════════════════════════════════════════════

async function launch() {
    if (!process.env.BOT_TOKEN) {
        throw new Error('BOT_TOKEN is missing. Copy .env.example to .env and add your token.');
    }

    const useWebhook = process.env.WEBHOOK === 'true';

    if (useWebhook) {
        // ── WEBHOOK MODE ──────────────────────────────────────────────────────
        // Telegram pushes updates to your HTTPS server instantly.
        // Requires: a public domain + valid SSL certificate.
        // Run with: npm run webhook
        const app = express();
        const port = parseInt(process.env.PORT) || 3000;
        const webhookUrl = process.env.WEBHOOK_URL;

        if (!webhookUrl) throw new Error('WEBHOOK_URL is required when WEBHOOK=true');

        // bot.webhookCallback() returns an Express-compatible middleware
        // that validates the update and routes it through the bot's middleware stack
        app.use(bot.webhookCallback('/webhook'));

        // Tell Telegram where to POST updates
        await bot.telegram.setWebhook(`${webhookUrl}/webhook`);

        app.listen(port, () => {
            console.log(`🌐 Webhook server running on port ${port}`);
            console.log(`✅ Bot live via WEBHOOK → ${webhookUrl}/webhook`);
        });
    } else {
        // ── LONG POLLING MODE ────────────────────────────────────────────────
        // Your bot periodically asks Telegram: "Any new updates?"
        // Works without a public URL — great for development.
        // Run with: npm start  or  npm run dev
        await bot.launch();
        console.log('✅ Bot running via LONG POLLING');
        console.log('   Ctrl+C to stop\n');
    }

    // Graceful shutdown — let Telegraf finish pending updates before exiting
    process.once('SIGINT',  () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

launch().catch(console.error);
