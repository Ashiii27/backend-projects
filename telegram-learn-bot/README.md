# Telegram Learn Bot

> A practical Telegram bot built with Node.js and Telegraf v4 — useful in its own right and designed as a hands-on guide to bot development.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Telegraf](https://img.shields.io/badge/Telegraf-v4-2CA5E0?style=flat-square&logo=telegram&logoColor=white)](https://telegraf.js.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

This project combines everyday bot utilities with focused examples of middleware, sessions, scenes, callback queries, inline mode, webhooks, and media handling.

## Contents

- [Features](#features)
- [Concepts covered](#concepts-covered)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Tech stack](#tech-stack)
- [Learn more](#learn-more)
- [License](#license)

## Features

### Utility commands

These commands provide useful bot functionality while demonstrating common Telegram bot patterns.

| Command | Description |
|---|---|
| `/weather <city>` | Real-time weather via [wttr.in](https://wttr.in) — no API key needed |
| `/note <text>` | Save a personal note (session-backed) |
| `/notes` | View all saved notes |
| `/clearnotes` | Delete all notes |
| `/whoami` | Your Telegram user info + profile photo |

### Concept demos

| Command | Demonstrates |
|---|---|
| `/learn` | Nine-topic interactive browser covering middleware, sessions, scenes, webhooks, and more |
| `/quiz` | Six-question quiz with inline keyboard answer selection |
| `/form` | Four-step `WizardScene` registration form |
| `/sendphoto` | Sending images via URL |
| `/senddoc` | Sending a file generated in memory as a `Buffer` |

### Inline mode

Use the bot from any Telegram chat without adding it first:

```text
@yourbotname weather Mumbai
@yourbotname joke
@yourbotname help
```

## Concepts covered

Every feature is deliberately chosen to teach a specific concept, and the source code is heavily commented.

| Concept | File |
|---|---|
| **Middleware pattern** (logger, rate limiter) | `src/middleware/` |
| **Rate limiting** — sliding window, in-memory | `src/middleware/rateLimiter.js` |
| **Sessions and state** across messages | `src/commands/notes.js` |
| **Inline keyboards and callback queries** | `src/commands/quiz.js`, `src/handlers/callbacks.js` |
| **WizardScene** — multi-step conversation flow | `src/scenes/formScene.js` |
| **External API calls** and loading-then-edit UX | `src/commands/weather.js` |
| **File and media handling** — URL, `Buffer`, `file_id` | `src/commands/media.js` |
| **Inline mode** — answer queries from any chat | `src/handlers/inline.js` |
| **Polling versus webhook** — both modes supported | `src/bot.js` |
| **Global error handling** — `bot.catch()` | `src/middleware/errorHandler.js` |

## Project structure

```text
src/
├── bot.js                    # Entry point — middleware chain, command registration, launcher
├── middleware/
│   ├── logger.js             # Logs every update with timing (onion model demo)
│   ├── rateLimiter.js        # 10 req/min per user — in-memory sliding window
│   └── errorHandler.js       # Global bot.catch() — classifies and sanitises errors
├── commands/
│   ├── start.js              # /start — welcome and inline navigation menu
│   ├── help.js               # /help — full command reference
│   ├── learn.js              # /learn — interactive nine-topic concept browser
│   ├── weather.js            # /weather — wttr.in, axios, message editing
│   ├── notes.js              # /note /notes /clearnotes — ctx.session demo
│   ├── quiz.js               # /quiz — initialises quiz state and first question
│   └── media.js              # /sendphoto /senddoc /whoami — media sending
├── scenes/
│   └── formScene.js          # WizardScene — five steps, wizard.state, in-scene /cancel
├── handlers/
│   ├── inline.js             # inline_query — weather/joke/help from any chat
│   └── callbacks.js          # bot.action() handlers — menu nav, learn topics, quiz scoring
└── utils/
    ├── keyboards.js          # Markup builder functions (inline and reply keyboards)
    └── constants.js          # Learn topic content and quiz questions
```

## Getting started

### Prerequisites

- Node.js 18 or higher
- A Telegram account
- A bot token from [@BotFather](https://t.me/botfather)

### 1. Clone the repository

```bash
git clone https://github.com/Ashiii27/backend-projects.git
cd backend-projects/telegram-learn-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set your token:

```env
BOT_TOKEN=your_bot_token_here
WEBHOOK=false
```

### 4. Start the bot

```bash
npm run dev      # Development — auto-restarts on file changes (nodemon)
npm start        # Production — plain node
```

You should see:

```text
Bot running via LONG POLLING
Ctrl+C to stop
```

Open Telegram, search for your bot, and send `/start`.

## Configuration

All configuration is managed through the `.env` file. Copy `.env.example` to get started.

| Variable | Default | Description |
|---|---|---|
| `BOT_TOKEN` | — | **Required.** Token from @BotFather |
| `WEBHOOK` | `false` | Set to `true` to use webhooks instead of polling |
| `WEBHOOK_URL` | — | Your public HTTPS domain (required when `WEBHOOK=true`) |
| `PORT` | `3000` | Express server port (webhook mode only) |

### Webhook mode

```bash
# In .env:
WEBHOOK=true
WEBHOOK_URL=https://yourdomain.com
PORT=3000

# Start:
npm run webhook
```

Webhook mode requires a public HTTPS domain with a valid SSL certificate. It works with Railway, Render, Fly.io, or any VPS with nginx and Let's Encrypt.

### Inline mode setup

1. Open [@BotFather](https://t.me/botfather) and send `/setinline`.
2. Select your bot.
3. Set a placeholder hint, such as `weather London`.

Then test it in any chat by typing `@yourbotname weather Delhi`.

## Tech stack

| Package | Purpose |
|---|---|
| [telegraf](https://telegraf.js.org) v4 | Telegram bot framework |
| [axios](https://axios-http.com) | HTTP client for external APIs |
| [express](https://expressjs.com) | HTTP server for webhook mode |
| [dotenv](https://github.com/motdotla/dotenv) | Environment variable management |
| [nodemon](https://nodemon.io) | Development auto-restart (`devDependency`) |

### External APIs

No API keys are required for the included integrations:

- [wttr.in](https://wttr.in/:help) — weather data
- [JokeAPI v2](https://v2.jokeapi.dev) — programming jokes in inline mode

## Learn more

- [Telegraf v4 documentation](https://telegraf.js.org)
- [Telegram Bot API reference](https://core.telegram.org/bots/api)
- [Telegram Bot FAQ](https://core.telegram.org/bots/faq)

## License

MIT — feel free to use this as a starting point for your own bots.

---

Built by [Ashiii27](https://github.com/Ashiii27) as part of the [backend-projects](https://github.com/Ashiii27/backend-projects) repository.
