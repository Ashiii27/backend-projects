/**
 * HANDLERS — Callback Queries (bot.action handlers)
 * ───────────────────────────────────────────────────────────────────
 * CONCEPT: Inline Keyboard Callbacks
 *
 * When a user taps an inline keyboard button, Telegram sends a
 * callback_query update. In bot.js we intercept them with:
 *
 *   bot.action(pattern, handler)
 *
 * Pattern can be a string (exact match) or a regex.
 * We use regex prefixes so each namespace has its own handler:
 *
 *   bot.action(/^menu:/,        handleMenu)    ← main nav buttons
 *   bot.action(/^learn:/,       handleLearn)   ← topic buttons
 *   bot.action(/^quiz:answer:/, handleQuiz)    ← quiz answer buttons
 *
 * WHY bot.action() instead of bot.on('callback_query')?
 *   bot.action() only fires when callback_data matches the pattern.
 *   This keeps handlers focused and avoids interfering with scene-
 *   internal callbacks (form:level:*, form:confirm, etc.) which are
 *   handled by the WizardScene itself.
 *
 * Inside every action handler, ALWAYS call ctx.answerCbQuery().
 * It dismisses the loading spinner on the button. Omitting it leaves
 * the button in a spinning state for ~60s, which is bad UX.
 * Pass a string to show a toast notification to the user.
 *
 * ctx.editMessageText(text, extra) — edits the message the button is on.
 *   More efficient than sending a new message for simple navigation.
 */

const { LEARN_TOPICS, QUIZ_QUESTIONS } = require('../utils/constants');
const { startMenuKeyboard, learnMenuKeyboard, quizKeyboard, backToTopicsKeyboard } = require('../utils/keyboards');

// ─── handleMenu — Main navigation buttons (menu:*) ───────────────────────────
const handleMenu = async (ctx) => {
    await ctx.answerCbQuery();  // Always dismiss the button spinner first

    const action = ctx.callbackQuery.data.split(':')[1];

    switch (action) {
        case 'learn':
            await ctx.editMessageText(
                `<b>📚 Telegram Bot Concepts</b>\n\nTap a topic to learn:`,
                { parse_mode: 'HTML', ...learnMenuKeyboard() }
            );
            break;

        case 'weather':
            await ctx.editMessageText(
                `<b>🌤 Weather Feature</b>\n\n` +
                `Send a command to the bot:\n` +
                `<code>/weather &lt;city&gt;</code>\n\n` +
                `Example: <code>/weather Gorakhpur</code>\n\n` +
                `<i>Uses wttr.in — no API key needed.</i>`,
                { parse_mode: 'HTML' }
            );
            break;

        case 'notes':
            await ctx.editMessageText(
                `<b>📝 Notes — Session Demo</b>\n\n` +
                `<code>/note &lt;text&gt;</code>  — save a note\n` +
                `<code>/notes</code>         — view all notes\n` +
                `<code>/clearnotes</code>    — delete all notes\n\n` +
                `Notes are stored in <code>ctx.session.notes</code>.\n` +
                `They reset when the bot restarts (in-memory storage).`,
                { parse_mode: 'HTML' }
            );
            break;

        case 'quiz':
            await ctx.editMessageText(
                `<b>🧠 Bot Concepts Quiz</b>\n\n` +
                `6 questions covering: Polling, Webhooks, Middleware, Sessions, Scenes, and Inline Mode.\n\n` +
                `Type /quiz to start.`,
                { parse_mode: 'HTML' }
            );
            break;

        case 'form':
            await ctx.editMessageText(
                `<b>📋 WizardScene Form Demo</b>\n\n` +
                `A 4-step registration form that demonstrates:\n` +
                `• <code>Scenes.WizardScene</code> step-by-step flow\n` +
                `• <code>ctx.wizard.state</code> for collecting data\n` +
                `• Inline keyboards inside scenes\n` +
                `• <code>ctx.scene.leave()</code> and <code>reenter()</code>\n\n` +
                `Type /form to start.`,
                { parse_mode: 'HTML' }
            );
            break;

        case 'media':
            await ctx.editMessageText(
                `<b>📁 Media Demo Commands</b>\n\n` +
                `/sendphoto — image sent via URL\n` +
                `/senddoc   — text file generated as a Buffer\n` +
                `/whoami    — your user info + profile photo\n\n` +
                `<i>Demonstrates:</i> <code>replyWithPhoto</code>, <code>replyWithDocument</code>, ` +
                `<code>getUserProfilePhotos</code>, <code>ctx.from</code>, <code>ctx.chat</code>`,
                { parse_mode: 'HTML' }
            );
            break;

        case 'help':
            await ctx.editMessageText(
                `Use /help for the full command reference.`,
                { parse_mode: 'HTML' }
            );
            break;

        case 'back':
            await ctx.editMessageText(
                `👋 <b>Main Menu</b>\n\nWhat would you like to explore?`,
                { parse_mode: 'HTML', ...startMenuKeyboard() }
            );
            break;

        default:
            await ctx.answerCbQuery('Unknown menu item');
    }
};

// ─── handleLearn — Topic detail view (learn:*) ───────────────────────────────
const handleLearn = async (ctx) => {
    const topicKey = ctx.callbackQuery.data.split(':')[1];
    const topic    = LEARN_TOPICS[topicKey];

    if (!topic) {
        return ctx.answerCbQuery('Topic not found');
    }

    await ctx.answerCbQuery(`📖 ${topic.title}`);

    // Replace the topic menu with the topic content + a back button
    await ctx.editMessageText(
        topic.content,
        { parse_mode: 'HTML', ...backToTopicsKeyboard() }
    );
};

// ─── handleQuiz — Quiz answer processing (quiz:answer:*) ─────────────────────
const handleQuiz = async (ctx) => {
    // Callback data format: "quiz:answer:{questionIndex}:{answerIndex}"
    const parts         = ctx.callbackQuery.data.split(':');
    const questionIndex = parseInt(parts[2]);
    const answerIndex   = parseInt(parts[3]);
    const question      = QUIZ_QUESTIONS[questionIndex];

    if (!question) {
        return ctx.answerCbQuery('Invalid question');
    }

    const isCorrect = answerIndex === question.correct;

    // Initialize session state in case /quiz wasn't used to start
    ctx.session.quiz ??= { score: 0, total: QUIZ_QUESTIONS.length, current: 0 };
    if (isCorrect) ctx.session.quiz.score++;
    ctx.session.quiz.current = questionIndex + 1;

    // Toast notification on the button
    await ctx.answerCbQuery(isCorrect ? '✅ Correct!' : '❌ Wrong!');

    // Edit the question message to reveal the answer and explanation
    const resultLine = isCorrect
        ? `✅ <b>Correct!</b>`
        : `❌ <b>Wrong.</b> The correct answer was: <b>${question.options[question.correct]}</b>`;

    await ctx.editMessageText(
        `<b>Q${questionIndex + 1} / ${QUIZ_QUESTIONS.length}:</b> ${question.question}\n\n` +
        `${resultLine}\n\n` +
        `<i>📘 ${question.explanation}</i>`,
        { parse_mode: 'HTML' }
    );

    const nextIndex = questionIndex + 1;
    const isLast    = nextIndex >= QUIZ_QUESTIONS.length;

    if (isLast) {
        // ── Quiz complete — show final score ──────────────────────────────────
        const { score, total } = ctx.session.quiz;
        const pct   = Math.round((score / total) * 100);
        const grade = pct === 100 ? '🏆 Perfect!'
                    : pct >= 80   ? '🎯 Strong'
                    : pct >= 60   ? '📈 Getting there'
                    :               '📚 Keep studying';

        await ctx.replyWithHTML(
            `<b>🏁 Quiz Complete!</b>\n\n` +
            `<b>Score:</b> ${score} / ${total} (${pct}%)\n` +
            `<b>Grade:</b> ${grade}\n\n` +
            (score < total
                ? `Use /learn to review the topics you missed.\n`
                : `You know your stuff! 🎉\n`) +
            `\nUse /quiz to try again.`
        );

        ctx.session.quiz = null;  // Reset quiz state
    } else {
        // ── Send next question ────────────────────────────────────────────────
        const next = QUIZ_QUESTIONS[nextIndex];

        await ctx.replyWithHTML(
            `<b>Q${nextIndex + 1} / ${QUIZ_QUESTIONS.length}:</b>\n${next.question}`,
            quizKeyboard(next.options, nextIndex)
        );
    }
};

module.exports = { handleMenu, handleLearn, handleQuiz };
