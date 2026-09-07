/**
 * CONSTANTS — LEARN TOPICS + QUIZ QUESTIONS
 * ───────────────────────────────────────────────────────────────────
 * Centralising content here keeps handlers clean and makes it easy
 * to add new topics or questions without touching business logic.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN TOPICS
// Each topic has a title and HTML-formatted content string.
// Keyed by the callback_data suffix after "learn:" — e.g. learn:token → 'token'
// ═══════════════════════════════════════════════════════════════════════════════
const LEARN_TOPICS = {
    token: {
        title: '🤖 Bot Token',
        content: `
<b>🤖 What is a Bot Token?</b>

A Bot Token is a unique secret string that authenticates your bot with the Telegram API.

<b>Format:</b>
<code>1234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw</code>
          ↑ BOT_ID    ↑ SECRET_KEY

<b>How to get one:</b>
1. Open Telegram → search <code>@BotFather</code>
2. Send /newbot
3. Choose a name (e.g. "My Learning Bot")
4. Choose a username ending in "bot" (e.g. "mylearn_bot")
5. BotFather replies with your token

<b>Security rules (critical!):</b>
• Never commit tokens to Git
• Store in <code>.env</code> files — add <code>.env</code> to <code>.gitignore</code>
• Use <code>process.env.BOT_TOKEN</code> in code, never hardcode
• If exposed: revoke immediately via BotFather → /revoke

<b>In code:</b>
<code>require('dotenv').config();
const bot = new Telegraf(process.env.BOT_TOKEN);</code>
`.trim(),
    },

    polling_webhook: {
        title: '📡 Polling vs Webhook',
        content: `
<b>📡 Two Ways to Receive Updates</b>

━━━━━━━━━━━━━━━━━━━━━
<b>LONG POLLING</b> — bot.launch()
━━━━━━━━━━━━━━━━━━━━━
Your bot <i>repeatedly asks</i> Telegram:
"Any new messages?" (every 1-2 seconds)

✅ No public URL needed
✅ Works on localhost
✅ Zero setup — just call bot.launch()
❌ Slightly more latency
❌ More API calls = less efficient

<b>Code:</b>
<code>await bot.launch();
// That's it. Telegraf handles polling internally.</code>

━━━━━━━━━━━━━━━━━━━━━
<b>WEBHOOK</b>
━━━━━━━━━━━━━━━━━━━━━
Telegram <i>pushes</i> updates to your HTTPS endpoint instantly.

✅ Real-time (zero polling delay)
✅ Fewer API calls — more scalable
✅ Works with serverless (Vercel, Railway, etc.)
❌ Requires a public HTTPS domain + SSL
❌ More setup

<b>Code:</b>
<code>const app = express();
app.use(bot.webhookCallback('/hook'));
await bot.telegram.setWebhook('https://yourdomain.com/hook');
app.listen(3000);</code>

<b>💡 Rule:</b> Polling in dev → Webhooks in production.
This bot supports both — set <code>WEBHOOK=true</code> in .env.
`.trim(),
    },

    middleware: {
        title: '🔗 Middleware Pattern',
        content: `
<b>🔗 Middleware Pattern</b>

Middleware is code that runs <i>between</i> receiving an update and your handler. Every update passes through the entire middleware stack.

<b>Structure:</b>
<code>bot.use(async (ctx, next) => {
  // Runs BEFORE downstream handlers
  console.log('Received:', ctx.updateType);

  await next(); // ← Pass to next layer

  // Runs AFTER all downstream handlers finish
  console.log('Done!');
});</code>

<b>The onion model:</b>
<code>
 ┌── Logger ────────────────────┐
 │  ┌── RateLimiter ──────────┐ │
 │  │  ┌── Session ─────────┐ │ │
 │  │  │   YourHandler      │ │ │
 │  │  └───────────────────-┘ │ │
 │  └───────────────────────── ┘ │
 └──────────────────────────────-┘</code>

Code before <code>next()</code> → runs on the way IN.
Code after <code>next()</code>  → runs on the way OUT.

<b>Practical use cases:</b>
• Logging (this bot!)
• Rate limiting (this bot!)
• Auth checks (block non-admins)
• Database connection injection
• Language detection + i18n
• Request timing/metrics

<b>Key:</b> NOT calling <code>next()</code> stops the chain — useful for blocking.
`.trim(),
    },

    sessions: {
        title: '💾 Sessions & State',
        content: `
<b>💾 Sessions & State</b>

Bots are <i>stateless</i> by default — every message is an isolated request. Sessions let you persist data between messages.

<b>Setup (must come before commands):</b>
<code>const { session } = require('telegraf');
bot.use(session());  // ← adds ctx.session to every update</code>

<b>Usage:</b>
<code>bot.command('start', (ctx) => {
  ctx.session.count = 0;     // write to session
  ctx.reply('Counter started!');
});

bot.command('click', (ctx) => {
  ctx.session.count ??= 0;   // read + default
  ctx.session.count++;
  ctx.reply(\`Count: \${ctx.session.count}\`);
});</code>

<b>Default storage:</b> In-memory Map — fast but resets on restart.

<b>Session scope:</b> Per (chat_id, user_id) pair by default.
Each user in each chat has their own isolated session.

<b>Production storage backends:</b>
• Redis (recommended — fast, persistent, scalable)
• MongoDB (<code>telegraf-session-mongodb</code>)
• PostgreSQL (<code>telegraf-session-postgres</code>)

Try it now → /note test message → /notes
`.trim(),
    },

    scenes: {
        title: '🧙 Scenes & Wizards',
        content: `
<b>🧙 Scenes & WizardScene</b>

A Scene is an isolated "room" — all updates from a user go into the scene until they leave. Perfect for multi-step flows.

<b>WizardScene</b> — step-by-step conversations:
<code>const { Scenes, session } = require('telegraf');

const wizard = new Scenes.WizardScene('signup',
  // Step 1: ask name
  async (ctx) => {
    await ctx.reply('What is your name?');
    return ctx.wizard.next();
  },
  // Step 2: ask age (receives name from step 1)
  async (ctx) => {
    ctx.wizard.state.name = ctx.message.text; // persist data!
    await ctx.reply('How old are you?');
    return ctx.wizard.next();
  },
  // Step 3: done
  async (ctx) => {
    const { name } = ctx.wizard.state;
    await ctx.reply(\`Hello \${name}, age \${ctx.message.text}!\`);
    return ctx.scene.leave(); // exit the scene
  }
);

const stage = new Scenes.Stage([wizard]);
bot.use(session());         // must come first
bot.use(stage.middleware());
bot.command('signup', (ctx) => ctx.scene.enter('signup'));</code>

<b>Key APIs:</b>
• <code>ctx.wizard.next()</code> — go to next step
• <code>ctx.wizard.state</code> — shared data across steps
• <code>ctx.scene.leave()</code> — exit scene
• <code>ctx.scene.reenter()</code> — restart from step 1
• <code>scene.command('cancel', ...)</code> — in-scene command handler

Try it → /form
`.trim(),
    },

    inline: {
        title: '🔍 Inline Mode',
        content: `
<b>🔍 Inline Mode</b>

Inline mode lets users trigger your bot from <i>any chat</i> without adding it, by typing <code>@botname query</code>.

<b>Enable it:</b>
@BotFather → /setinline → choose your bot → set a placeholder hint

<b>Handler:</b>
<code>bot.on('inline_query', async (ctx) => {
  const query = ctx.inlineQuery.query; // what user typed

  await ctx.answerInlineQuery([
    {
      type: 'article',          // text result
      id: 'unique-id',
      title: 'Result title',
      description: 'Subtitle',
      input_message_content: {
        message_text: 'Sent when user taps result',
        parse_mode: 'HTML',
      },
    },
    // Add more results...
  ], { cache_time: 30 }); // cache response for 30s
});</code>

<b>Result types:</b>
<code>article, photo, gif, video, audio, document, sticker, voice, location, venue, contact</code>

<b>Try it:</b>
Go to any chat and type:
• <code>@yourbotname weather London</code>
• <code>@yourbotname joke</code>
• <code>@yourbotname help</code>
`.trim(),
    },

    keyboards: {
        title: '⌨️ Keyboard Types',
        content: `
<b>⌨️ Two Keyboard Types</b>

━━━━━━━━━━━━━━━━━━━━━
<b>1. INLINE KEYBOARD</b>
━━━━━━━━━━━━━━━━━━━━━
Attached below a specific message. Stays visible until the message is deleted/edited.
Buttons carry <code>callback_data</code> — handled by <code>bot.action()</code>.

<code>ctx.reply('Choose:', Markup.inlineKeyboard([
  [
    Markup.button.callback('✅ Yes', 'choice:yes'),
    Markup.button.callback('❌ No',  'choice:no'),
  ],
  [Markup.button.url('Visit Docs', 'https://telegraf.js.org')],
]));

bot.action('choice:yes', async (ctx) => {
  await ctx.answerCbQuery('You chose Yes!'); // dismiss loading spinner
  await ctx.editMessageText('You chose ✅ Yes');
});</code>

━━━━━━━━━━━━━━━━━━━━━
<b>2. REPLY KEYBOARD</b>
━━━━━━━━━━━━━━━━━━━━━
Replaces the user's text input keyboard. Tapping sends the button text as a plain message.

<code>ctx.reply('Choose:', Markup.keyboard([
  ['🌤 Weather', '📝 Notes'],
  ['🧠 Quiz',    '❓ Help'],
])
.resize()    // fit to screen width
.oneTime()); // hide after first tap</code>

<b>Key difference:</b>
• Inline = acts on a message, sends callback_data (silent)
• Reply = sends a visible text message to the chat
`.trim(),
    },

    ratelimit: {
        title: '🛡 Rate Limiting',
        content: `
<b>🛡 Rate Limiting</b>

Prevents abuse by capping how many requests a user can make per time window.

<b>This bot's implementation:</b>
<code>const requests = new Map();
const LIMIT  = 10;      // max requests
const WINDOW = 60_000;  // per 60 seconds

bot.use(async (ctx, next) => {
  const id  = ctx.from.id;
  const now = Date.now();
  const rec = requests.get(id) ?? { count: 0, resetAt: now + WINDOW };

  if (now > rec.resetAt) { rec.count = 0; rec.resetAt = now + WINDOW; }
  rec.count++;
  requests.set(id, rec);

  if (rec.count > LIMIT) {
    const wait = Math.ceil((rec.resetAt - now) / 1000);
    return ctx.reply(\`Wait \${wait}s.\`);  // ← NOT calling next() blocks the chain
  }
  return next();
});</code>

<b>Limitations of in-memory rate limiting:</b>
• Resets when bot restarts
• Doesn't work across multiple bot instances

<b>Production approach:</b>
<code>// Redis-backed, survives restarts, scales horizontally
const client = new Redis();
const count  = await client.incr(\`rl:\${userId}\`);
await client.expire(\`rl:\${userId}\`, 60);</code>

<b>npm alternatives:</b>
• <code>telegraf-ratelimit</code>
• <code>bottleneck</code>
• <code>rate-limiter-flexible</code>
`.trim(),
    },

    errorhandling: {
        title: '🚨 Error Handling',
        content: `
<b>🚨 Error Handling</b>

An unhandled error crashes your bot. Always set up error handling.

<b>Global handler (catches everything):</b>
<code>bot.catch((err, ctx) => {
  console.error('Error:', err.message, err.stack);
  ctx.reply('Something went wrong.').catch(() => {});
});</code>

<b>Per-command try/catch (specific handling):</b>
<code>bot.command('weather', async (ctx) => {
  try {
    const data = await fetchWeather(city);
    ctx.reply(data);
  } catch (err) {
    if (err.response?.status === 404) {
      ctx.reply('City not found!');
    } else if (err.code === 'ETIMEDOUT') {
      ctx.reply('Service timed out, try again.');
    } else {
      throw err; // let bot.catch() handle unknown errors
    }
  }
});</code>

<b>Common Telegram API error codes:</b>
<code>400 — Bad Request     (invalid params, message too long)
401 — Unauthorized    (invalid or revoked token)
403 — Forbidden       (bot blocked, no group permission)
404 — Not Found       (chat/message doesn't exist)
429 — Too Many Reqs   (you're sending too fast)
502 — Bad Gateway     (Telegram server issue, retry)</code>

<b>Tip:</b> Log to a proper service (Sentry, Datadog) in production.
`.trim(),
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ QUESTIONS
// Each question has options[], a correct index (0-based), and an explanation
// shown after the user answers.
// ═══════════════════════════════════════════════════════════════════════════════
const QUIZ_QUESTIONS = [
    {
        question: 'What does bot.launch() use to receive updates from Telegram?',
        options: ['Webhooks', 'Long Polling', 'WebSockets', 'Server-Sent Events'],
        correct: 1,
        explanation:
            'bot.launch() uses Long Polling — your bot repeatedly asks Telegram for new updates at a regular interval.',
    },
    {
        question: 'What happens if you do NOT call next() in a middleware function?',
        options: [
            'The bot crashes',
            'next() is called automatically',
            'The update pipeline stops — downstream handlers don\'t run',
            'The update is sent back to Telegram',
        ],
        correct: 2,
        explanation:
            'Not calling next() halts the middleware chain. This is intentional for blocking (e.g. rate limiting, auth checks).',
    },
    {
        question: 'Where is ctx.session data stored by default in Telegraf?',
        options: ['Redis', 'SQLite', 'In-memory (RAM, resets on restart)', 'Telegram servers'],
        correct: 2,
        explanation:
            'Default session storage is an in-memory Map. Data is lost on restart. Use Redis or a DB for persistence.',
    },
    {
        question: 'What is Inline Mode used for?',
        options: [
            'Sending formatted messages faster',
            'Triggering the bot from any chat by typing @botname query',
            'Creating inline keyboards inside messages',
            'Sending media files without a caption',
        ],
        correct: 1,
        explanation:
            'Inline mode lets users invoke your bot from ANY chat without adding it, by typing @botname query. Requires enabling via BotFather.',
    },
    {
        question: 'Which deployment method is recommended for production?',
        options: ['Long Polling', 'Webhooks', 'Both are equal', 'Neither — bots can\'t go to production'],
        correct: 1,
        explanation:
            'Webhooks are preferred in production. Telegram pushes updates instantly to your server, reducing latency and API call count.',
    },
    {
        question: 'What does ctx.wizard.state do inside a WizardScene?',
        options: [
            'Returns the current wizard step number',
            'Stores persistent data accessible across all steps of the wizard',
            'Renders the scene as a state machine diagram',
            'Syncs data to the user\'s Telegram account',
        ],
        correct: 1,
        explanation:
            'ctx.wizard.state is a plain object shared across all steps of a WizardScene. Use it to collect form data step-by-step.',
    },
];

module.exports = { LEARN_TOPICS, QUIZ_QUESTIONS };
