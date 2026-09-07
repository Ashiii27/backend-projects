/**
 * SCENE — formScene (WizardScene: 'registration')
 * ───────────────────────────────────────────────────────────────────
 * CONCEPT: Scenes & WizardScene
 *
 * A WizardScene is an array of step functions. While a user is inside
 * the scene, ALL their updates (text, callbacks, commands) are routed
 * to the CURRENT step function, not to the global bot handlers.
 *
 * Step functions:
 *   - Receive ctx just like any normal handler
 *   - Call ctx.wizard.next() to advance to the next step
 *   - Call ctx.scene.leave() to exit the scene entirely
 *   - Call ctx.scene.reenter() to restart from step 0
 *
 * ctx.wizard.state — a plain object shared across ALL steps.
 *   Internally stored in ctx.session.__scenes.state.
 *   Use it to collect user inputs as you move through steps.
 *
 * scene.command('cancel', handler) — registers a command handler
 *   ONLY active when the user is inside this scene.
 *   Takes priority over step functions.
 *
 * Entering: bot.command('form', ctx => ctx.scene.enter('registration'))
 * in bot.js. The string 'registration' must match the first argument
 * to new Scenes.WizardScene('registration', ...).
 *
 * Lifecycle: enter → step0 → step1 → ... → stepN → leave
 */

const { Scenes, Markup } = require('telegraf');

const formScene = new Scenes.WizardScene(
    'registration',   // Scene ID — must match ctx.scene.enter('registration')

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 0 — Introduction + ask for name
    // This runs as soon as the user enters the scene via /form.
    // ═══════════════════════════════════════════════════════════════════════════
    async (ctx) => {
        await ctx.replyWithHTML(
            `<b>📋 Bot Developer Registration</b>\n\n` +
            `This is a <b>WizardScene</b> demo — a multi-step form built with ` +
            `<code>Scenes.WizardScene</code>.\n\n` +
            `<i>Step 1 of 4 — Type /cancel at any time to exit.</i>\n\n` +
            `What's your <b>name</b>?`
        );
        return ctx.wizard.next();  // Advance to step 1
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1 — Receive name, ask for experience level via inline keyboard
    // ═══════════════════════════════════════════════════════════════════════════
    async (ctx) => {
        // Guard: ignore non-text updates (photos, stickers, etc.)
        if (!ctx.message?.text) {
            return ctx.reply('👆 Please type your name as text.');
        }

        // Persist the name in wizard state — accessible in all future steps
        ctx.wizard.state.name = ctx.message.text.trim();

        await ctx.reply(
            `Hi ${ctx.wizard.state.name}! 👋\n\n` +
            `<i>Step 2 of 4</i>\n\nWhat's your <b>experience level</b> with programming?`,
            {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🌱 Beginner',      'form:level:Beginner')],
                    [Markup.button.callback('🌿 Intermediate',  'form:level:Intermediate')],
                    [Markup.button.callback('🌳 Advanced',      'form:level:Advanced')],
                ]),
            }
        );
        return ctx.wizard.next();  // Advance to step 2
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2 — Receive level (callback_query), ask for favourite language
    // ═══════════════════════════════════════════════════════════════════════════
    async (ctx) => {
        // This step expects a callback_query from the inline keyboard above
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery();  // Dismiss the loading spinner on the button

            // Callback data format: "form:level:Beginner"
            ctx.wizard.state.level = ctx.callbackQuery.data.split(':')[2];

            await ctx.replyWithHTML(
                `✅ Level set to: <b>${ctx.wizard.state.level}</b>\n\n` +
                `<i>Step 3 of 4</i>\n\nWhat's your <b>favourite programming language</b>?`
            );
            return ctx.wizard.next();
        }

        // User typed text instead of clicking a button — nudge them
        if (ctx.message?.text && !ctx.message.text.startsWith('/')) {
            return ctx.reply('⬆️ Please select your level using the buttons above.');
        }
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3 — Receive language, ask for their goal
    // ═══════════════════════════════════════════════════════════════════════════
    async (ctx) => {
        if (!ctx.message?.text) {
            return ctx.reply('👆 Please type your favourite language as text.');
        }

        ctx.wizard.state.language = ctx.message.text.trim();

        await ctx.replyWithHTML(
            `<i>Step 4 of 4 — almost done!</i>\n\n` +
            `What's your main <b>goal</b> for learning Telegram bot development?\n\n` +
            `<i>(e.g. automation, portfolio project, career, curiosity, fun)</i>`
        );
        return ctx.wizard.next();
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4 — Receive goal, show summary, ask for confirmation
    // ═══════════════════════════════════════════════════════════════════════════
    async (ctx) => {
        if (!ctx.message?.text) {
            return ctx.reply('👆 Please describe your goal as text.');
        }

        ctx.wizard.state.goal = ctx.message.text.trim();
        const s = ctx.wizard.state;

        await ctx.reply(
            `📊 Here's what you entered:\n\n` +
            `👤 Name:     ${s.name}\n` +
            `🎯 Level:    ${s.level}\n` +
            `💻 Language: ${s.language}\n` +
            `🚀 Goal:     ${s.goal}\n\n` +
            `Does this look correct?`,
            Markup.inlineKeyboard([
                [
                    Markup.button.callback('✅ Confirm',      'form:confirm'),
                    Markup.button.callback('🔄 Start Over',  'form:restart'),
                ],
            ])
        );
        return ctx.wizard.next();
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5 — Handle confirm or restart
    // ═══════════════════════════════════════════════════════════════════════════
    async (ctx) => {
        if (!ctx.callbackQuery) return;  // Ignore anything that isn't a button tap

        await ctx.answerCbQuery();
        const action = ctx.callbackQuery.data;

        if (action === 'form:restart') {
            await ctx.reply('🔄 Restarting the form from the beginning...');
            return ctx.scene.reenter();  // Go back to step 0, clear wizard.state
        }

        if (action === 'form:confirm') {
            const s = ctx.wizard.state;

            // Save the collected data into the long-lived session
            // ctx.wizard.state is cleared when the scene exits, but ctx.session persists
            ctx.session.profile = {
                name:     s.name,
                level:    s.level,
                language: s.language,
                goal:     s.goal,
            };

            await ctx.replyWithHTML(
                `🎉 <b>Registration complete!</b>\n\n` +
                `Welcome, <b>${s.name}</b>. Your profile has been saved to ` +
                `<code>ctx.session.profile</code>.\n\n` +
                `<b>What this demo covered:</b>\n` +
                `✅ <code>Scenes.WizardScene</code> — step-by-step flow\n` +
                `✅ <code>ctx.wizard.next()</code> — advancing steps\n` +
                `✅ <code>ctx.wizard.state</code> — sharing data across steps\n` +
                `✅ Inline keyboard inside a scene\n` +
                `✅ <code>ctx.scene.reenter()</code> — restarting\n` +
                `✅ <code>ctx.scene.leave()</code> — exiting\n` +
                `✅ Saving to <code>ctx.session</code> after leaving\n\n` +
                `In production, replace <code>ctx.session</code> with a real DB write here.`
            );

            return ctx.scene.leave();  // Exit — user returns to normal bot flow
        }
    }
);

// ─── In-scene /cancel command ─────────────────────────────────────────────────
// Registered at scene level — only active when the user is inside this scene.
// Runs before the current step function, so it always works regardless of step.
formScene.command('cancel', async (ctx) => {
    await ctx.reply('❌ Form cancelled. Use /form to start again.');
    return ctx.scene.leave();
});

module.exports = { formScene };
