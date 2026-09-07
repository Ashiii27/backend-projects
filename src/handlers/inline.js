/**
 * HANDLER — Inline Query
 * ───────────────────────────────────────────────────────────────────
 * CONCEPT: Inline Mode
 *
 * Fired when any user types "@yourbotname <query>" in any Telegram chat.
 * The user sees a list of results to tap — tapping sends the result
 * as a message into that chat.
 *
 * Enable inline mode first: @BotFather → /setinline → set a hint text
 *
 * ctx.inlineQuery.query — the text after the bot username
 *
 * ctx.answerInlineQuery(results, options)
 *   results    — array of result objects (article, photo, gif, video, ...)
 *   cache_time — how long (seconds) Telegram caches the response
 *   is_personal — if true, results are cached per user (not globally)
 *
 * Each result MUST have a unique 'id' string within the array.
 *
 * Supported commands here:
 *   @botname              → usage hints
 *   @botname weather <city> → weather card
 *   @botname joke         → random programming joke
 *   @botname help         → inline usage guide
 */

const axios = require('axios');

module.exports = async (ctx) => {
    const query = ctx.inlineQuery.query.trim().toLowerCase();

    try {
        let results;

        if (!query) {
            results = buildHints();
        } else if (query.startsWith('weather ')) {
            const city = query.slice('weather '.length).trim();
            results = await handleWeather(city);
        } else if (query === 'joke') {
            results = await handleJoke();
        } else if (query === 'help') {
            results = [buildHelpArticle()];
        } else {
            results = [
                article(
                    'unknown',
                    '❓ Unknown command',
                    'Try: weather <city> · joke · help',
                    `❓ <b>Unknown query:</b> "${query}"\n\n` +
                    `Available:\n• weather &lt;city&gt;\n• joke\n• help`
                ),
            ];
        }

        await ctx.answerInlineQuery(results, {
            cache_time:  30,    // Cache for 30 seconds
            is_personal: true,  // Don't share cache between different users
        });
    } catch (err) {
        console.error('[inline] Error:', err.message);
        // Always return at least one result — empty array causes an API error
        await ctx.answerInlineQuery([
            article('error', '⚠️ Error', 'Something went wrong', '⚠️ An error occurred. Please try again.'),
        ]);
    }
};

// ─── Usage hints — shown when query is empty ──────────────────────────────────
function buildHints() {
    return [
        article('hint-weather', '🌤 weather <city>',  'Get current weather for any city',  'weather London'),
        article('hint-joke',    '😄 joke',             'Get a random programming joke',      'joke'),
        article('hint-help',    '❓ help',              'See all inline commands',            'help'),
    ];
}

// ─── Weather result ───────────────────────────────────────────────────────────
async function handleWeather(city) {
    try {
        const { data } = await axios.get(
            `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
            { timeout: 5000 }
        );

        const curr    = data.current_condition[0];
        const area    = data.nearest_area[0];
        const name    = area.areaName[0].value;
        const country = area.country[0].value;
        const tempC   = curr.temp_C;
        const tempF   = curr.temp_F;
        const desc    = curr.weatherDesc[0].value;
        const humid   = curr.humidity;

        const messageText =
            `🌤 <b>Weather in ${name}, ${country}</b>\n\n` +
            `🌡 Temp:     ${tempC}°C / ${tempF}°F\n` +
            `📋 Condition: ${desc}\n` +
            `💧 Humidity:  ${humid}%\n\n` +
            `<i>Via @learnbot (wttr.in)</i>`;

        return [
            article(
                `weather-${city}`,
                `🌤 ${name}, ${country}: ${tempC}°C`,
                desc,
                messageText
            ),
        ];
    } catch {
        return [
            article(
                'weather-err',
                `❌ City not found: ${city}`,
                'Check spelling and try again',
                `❌ Could not find weather for <b>${city}</b>. Check the spelling.`
            ),
        ];
    }
}

// ─── Joke result ──────────────────────────────────────────────────────────────
async function handleJoke() {
    try {
        const { data } = await axios.get(
            'https://v2.jokeapi.dev/joke/Programming?type=single&safe-mode',
            { timeout: 4000 }
        );
        const joke = data.joke ?? fallbackJoke();
        return [article('joke', '😄 Programming Joke', joke.slice(0, 60) + '...', `😄 ${joke}`)];
    } catch {
        const joke = fallbackJoke();
        return [article('joke-fallback', '😄 Programming Joke', joke.slice(0, 60) + '...', `😄 ${joke}`)];
    }
}

// ─── Help article ─────────────────────────────────────────────────────────────
function buildHelpArticle() {
    return article(
        'help',
        '📖 Inline Mode Guide',
        'How to use this bot from any chat',
        `<b>📡 Inline Mode — Usage</b>\n\n` +
        `Type in the message box of any chat:\n\n` +
        `🌤 <code>@botname weather &lt;city&gt;</code>\n` +
        `   → Current weather for any city\n\n` +
        `😄 <code>@botname joke</code>\n` +
        `   → A random programming joke\n\n` +
        `❓ <code>@botname help</code>\n` +
        `   → This guide\n\n` +
        `<i>No need to add the bot to the chat!</i>`
    );
}

// ─── Helper: Build an article result ─────────────────────────────────────────
function article(id, title, description, messageText) {
    return {
        type:        'article',
        id,
        title,
        description,
        input_message_content: {
            message_text: messageText,
            parse_mode:   'HTML',
        },
    };
}

// ─── Fallback joke (if JokeAPI is down) ──────────────────────────────────────
function fallbackJoke() {
    const jokes = [
        "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
        "A SQL query walks into a bar, walks up to two tables and asks... 'Can I join you?'",
        "Why did the developer go broke? Because he used up all his cache.",
        "There are 10 types of people: those who understand binary, and those who don't.",
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
}
