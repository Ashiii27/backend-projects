/**
 * COMMAND — /quiz
 * ───────────────────────────────────────────────────────────────────
 * CONCEPT: Inline Keyboards + Callback Queries
 *
 * Starts a 6-question quiz on bot development concepts.
 * Each question is sent with an inline keyboard where each button is
 * one answer option.
 *
 * How callbacks work:
 *   1. Bot sends a message with Markup.inlineKeyboard([...])
 *   2. User taps a button → Telegram sends a callback_query update
 *   3. ctx.callbackQuery.data contains the string from Markup.button.callback()
 *   4. bot.action(/^quiz:answer:/, handler) in bot.js intercepts it
 *   5. Handler in handlers/callbacks.js processes the answer, edits the message,
 *      and sends the next question
 *
 * Callback data format used here:
 *   "quiz:answer:{questionIndex}:{answerIndex}"
 *
 * Why store quiz state in ctx.session?
 *   When the user clicks answer buttons, only the callback_data arrives.
 *   We need to know the score and current progress — session carries that.
 */

const { QUIZ_QUESTIONS } = require('../utils/constants');
const { quizKeyboard }   = require('../utils/keyboards');

module.exports = async (ctx) => {
    // Initialize (or reset) quiz state in the user's session
    ctx.session.quiz = {
        score:   0,
        total:   QUIZ_QUESTIONS.length,
        current: 0,
    };

    const firstQuestion = QUIZ_QUESTIONS[0];

    await ctx.replyWithHTML(
        `<b>🧠 Telegram Bot Concepts Quiz</b>\n\n` +
        `${QUIZ_QUESTIONS.length} questions · tap an answer to continue\n\n` +
        `<b>Q1 / ${QUIZ_QUESTIONS.length}:</b>\n` +
        `${firstQuestion.question}`,
        quizKeyboard(firstQuestion.options, 0)
    );
};
