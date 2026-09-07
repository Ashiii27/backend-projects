/**
 * UTILITY — KEYBOARD BUILDERS
 * ───────────────────────────────────────────────────────────────────
 * CONCEPT: Keyboard Types
 *
 * Telegram supports two keyboard types:
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ 1. INLINE KEYBOARD (InlineKeyboardMarkup)                       │
 * │    Attached below a specific message.                           │
 * │    Buttons send callback_data — handled by bot.action().        │
 * │    Buttons can also open URLs or trigger inline mode.           │
 * │                                                                 │
 * │    Markup.inlineKeyboard([[                                      │
 * │        Markup.button.callback('Label', 'callback-data'),        │
 * │        Markup.button.url('Visit', 'https://...'),               │
 * │    ]])                                                          │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ 2. REPLY KEYBOARD (ReplyKeyboardMarkup)                         │
 * │    Replaces the user's text input keyboard.                     │
 * │    When tapped, the button text is sent as a plain message.     │
 * │    Good for menus with fixed choices.                           │
 * │                                                                 │
 * │    Markup.keyboard([['Option A', 'Option B'], ['Option C']])    │
 * │          .resize()    ← auto-fit to screen width                │
 * │          .oneTime()   ← hides after first tap                   │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Rule of thumb:
 *   Use inline keyboards when the button acts on the current message.
 *   Use reply keyboards for persistent navigation menus.
 */

const { Markup } = require('telegraf');

// ─── Main navigation menu — shown on /start ───────────────────────────────────
const startMenuKeyboard = () => Markup.inlineKeyboard([
    [Markup.button.callback('📚 Learn Bot Concepts', 'menu:learn')],
    [
        Markup.button.callback('🌤 Weather',  'menu:weather'),
        Markup.button.callback('📝 Notes',    'menu:notes'),
    ],
    [
        Markup.button.callback('🧠 Take Quiz', 'menu:quiz'),
        Markup.button.callback('📋 Fill Form', 'menu:form'),
    ],
    [
        Markup.button.callback('📁 Media Demo', 'menu:media'),
        Markup.button.callback('❓ Help',        'menu:help'),
    ],
]);

// ─── Learning topic browser — shown by /learn ────────────────────────────────
const learnMenuKeyboard = () => Markup.inlineKeyboard([
    [Markup.button.callback('🤖 What is a Bot Token?',    'learn:token')],
    [Markup.button.callback('📡 Polling vs Webhook',      'learn:polling_webhook')],
    [Markup.button.callback('🔗 Middleware Pattern',      'learn:middleware')],
    [Markup.button.callback('💾 Sessions & State',         'learn:sessions')],
    [Markup.button.callback('🧙 Scenes & Wizards',         'learn:scenes')],
    [Markup.button.callback('🔍 Inline Mode',              'learn:inline')],
    [Markup.button.callback('⌨️ Keyboard Types',           'learn:keyboards')],
    [Markup.button.callback('🛡 Rate Limiting',            'learn:ratelimit')],
    [Markup.button.callback('🚨 Error Handling',           'learn:errorhandling')],
    [Markup.button.callback('🔙 Back to Menu',             'menu:back')],
]);

// ─── Quiz answer keyboard — dynamically built per question ───────────────────
// callback_data format: "quiz:answer:{questionIndex}:{answerIndex}"
const quizKeyboard = (options, questionIndex) =>
    Markup.inlineKeyboard(
        options.map((option, i) => [
            Markup.button.callback(option, `quiz:answer:${questionIndex}:${i}`)
        ])
    );

// ─── Back-to-topics button — appended to learn topic messages ────────────────
const backToTopicsKeyboard = () => Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back to Topics', 'menu:learn')],
]);

module.exports = {
    startMenuKeyboard,
    learnMenuKeyboard,
    quizKeyboard,
    backToTopicsKeyboard,
};
