/**
 * COMMAND — /weather <city>
 * ───────────────────────────────────────────────────────────────────
 * CONCEPT: External API Calls + Message Editing
 *
 * Demonstrates:
 *   1. Parsing command arguments from ctx.message.text
 *   2. Sending a "loading" message first, then editing it with the result
 *      → Better UX than making users wait with no feedback
 *   3. Making HTTP requests with axios inside a bot handler
 *   4. Graceful error handling for network failures and invalid inputs
 *
 * We use wttr.in — a free weather service that requires no API key.
 * JSON API: GET https://wttr.in/{city}?format=j1
 *
 * ctx.telegram.editMessageText(chatId, messageId, inlineMessageId, text, extra)
 *   Edits a previously sent message. We use this to replace the loading
 *   message with the actual result — avoids sending two separate messages.
 */

const axios = require('axios');

module.exports = async (ctx) => {
    // Parse arguments after the command
    // "/weather New York" → ['New', 'York'] → "New York"
    const args = ctx.message.text.split(' ').slice(1);

    if (args.length === 0) {
        return ctx.replyWithHTML(
            `🌤 <b>Usage:</b> <code>/weather &lt;city&gt;</code>\n\n` +
            `Examples:\n` +
            `  <code>/weather London</code>\n` +
            `  <code>/weather New York</code>\n` +
            `  <code>/weather Tokyo</code>`
        );
    }

    const city = args.join(' ');

    // Send a loading message immediately so the user has feedback
    const loadingMsg = await ctx.replyWithHTML(`🔍 Fetching weather for <b>${city}</b>...`);

    try {
        const response = await axios.get(
            `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
            { timeout: 6000 }
        );

        const current  = response.data.current_condition[0];
        const areaData = response.data.nearest_area[0];

        // Extract readable location info
        const locationName = areaData.areaName[0].value;
        const country      = areaData.country[0].value;

        // Current conditions
        const tempC       = current.temp_C;
        const tempF       = current.temp_F;
        const feelsLikeC  = current.FeelsLikeC;
        const humidity    = current.humidity;
        const windKmph    = current.windspeedKmph;
        const visibility  = current.visibility;
        const description = current.weatherDesc[0].value;
        const uvIndex     = current.uvIndex;

        const message =
            `${getWeatherEmoji(description)} <b>Weather in ${locationName}, ${country}</b>\n\n` +
            `🌡 <b>Temperature:</b> ${tempC}°C / ${tempF}°F\n` +
            `🤔 <b>Feels like:</b>  ${feelsLikeC}°C\n` +
            `📋 <b>Condition:</b>   ${description}\n` +
            `💧 <b>Humidity:</b>    ${humidity}%\n` +
            `💨 <b>Wind:</b>        ${windKmph} km/h\n` +
            `👁 <b>Visibility:</b>  ${visibility} km\n` +
            `☀️ <b>UV Index:</b>    ${uvIndex}\n\n` +
            `<i>Powered by <a href="https://wttr.in">wttr.in</a> — no API key required!</i>`;

        // Edit the loading message in-place with the real data
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            loadingMsg.message_id,
            undefined,  // inlineMessageId — null for regular messages
            message,
            { parse_mode: 'HTML' }
        );
    } catch (err) {
        const isNotFound =
            err.response?.status === 400 ||
            err.response?.status === 404 ||
            err.message?.includes('404');

        const errMessage = isNotFound
            ? `❌ City "<b>${city}</b>" not found.\n\nCheck spelling or try a nearby major city.`
            : err.code === 'ECONNABORTED'
            ? `⏱ Request timed out. Please try again.`
            : `🌐 Weather service is temporarily unavailable. Try again later.`;

        await ctx.telegram.editMessageText(
            ctx.chat.id,
            loadingMsg.message_id,
            undefined,
            errMessage,
            { parse_mode: 'HTML' }
        );
    }
};

// Maps weather description text to an emoji
function getWeatherEmoji(description) {
    const d = description.toLowerCase();
    if (d.includes('sunny') || d.includes('clear'))         return '☀️';
    if (d.includes('partly cloudy'))                        return '⛅';
    if (d.includes('cloudy') || d.includes('overcast'))     return '☁️';
    if (d.includes('thunder') || d.includes('storm'))       return '⛈';
    if (d.includes('snow') || d.includes('blizzard'))       return '❄️';
    if (d.includes('sleet') || d.includes('freezing'))      return '🌨';
    if (d.includes('rain') || d.includes('drizzle'))        return '🌧';
    if (d.includes('fog') || d.includes('mist'))            return '🌫';
    if (d.includes('wind') || d.includes('breezy'))         return '💨';
    return '🌡';
}
