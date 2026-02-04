---
title: Polling
description: Setting up bot operation via Polling
---

Polling is a mode where your server periodically requests updates from Telegram. Suitable for development and testing.

## Advantages

- ✅ Does not require public URL
- ✅ Simple setup
- ✅ Suitable for development
- ✅ Can be used locally

## Disadvantages

- ❌ Delay in receiving updates
- ❌ Inefficient resource usage
- ❌ Not recommended for production with high load

## Setup

### 1. Configuration in config/hybridgram.php

```php
'bots' => [
    [
        'token' => env('BOT_TOKEN'),
        'bot_id' => 'main',
        'update_mode' => UpdateModeEnum::POLLING,
        'routes_file' => base_path('routes/telegram.php'),
        'polling_limit' => env('TELEGRAM_POLLING_LIMIT', 100),
        'polling_timeout' => env('TELEGRAM_POLLING_TIMEOUT', 0),
        'allowed_updates' => explode(',', env('ALLOWED_TELEGRAM_UPDATES', '')),
    ],
],
```

### 2. Environment Variables

```env
BOT_TOKEN=your_token
BOT_ID=main
TELEGRAM_UPDATE_MODE=POLLING
TELEGRAM_POLLING_LIMIT=100
TELEGRAM_POLLING_TIMEOUT=0
ALLOWED_TELEGRAM_UPDATES=message,callback_query
```

### 3. Starting Polling

#### Basic Run

```bash
php artisan hybridgram:polling main
```

#### With Hot-reload (for development)

```bash
php artisan hybridgram:polling main --hot-reload
```

Hot-reload automatically restarts command when code changes.

#### With Watch Settings

```bash
php artisan hybridgram:polling main \
    --hot-reload \
    --watch=app,routes,config,src \
    --watch-interval=1
```

Parameters:
- `--watch` — directories to watch (comma-separated)
- `--watch-interval` — check interval in seconds

#### Limiting Update Types

```bash
php artisan hybridgram:polling main --allowed-updates=message,callback_query
```

Or in config:

```php
'allowed_updates' => ['message', 'callback_query'],
```

#### hybridgram:polling command options

| Option | Short | Description |
|--------|-------|-------------|
| `--log-updates` | `-L`  | Print a one-line summary for every received update |
| `--full` | `-F`  | Print full update payload as pretty JSON (implies `--log-updates`) |
| `--hot-reload` | `-R`  | Auto-restart on code changes (for development) |
| `--watch=` | `-W=` | Comma-separated paths to watch (default: app,routes,config,src) |
| `--watch-interval=1` | `-I`  | Seconds between file scans in hot-reload mode |

Examples with short aliases:

```bash
php artisan hybridgram:polling main -L
php artisan hybridgram:polling main -F
php artisan hybridgram:polling main -R -W=app,routes -I 2
```

## Polling Parameters

### polling_limit

Maximum number of updates per request (1-100):

```php
'polling_limit' => 100, // Maximum
```

More updates = fewer requests, but more delay.

### polling_timeout

Request timeout in seconds (0 = short polling):

```php
'polling_timeout' => 0, // Short polling
```

For long polling:

```php
'polling_timeout' => 60, // Long polling (up to 60 seconds)
```

Long polling reduces number of requests but increases response delay to commands.

## Hot-reload in Development

Hot-reload automatically restarts command when files change:

```bash
php artisan hybridgram:polling main --hot-reload --watch=app,routes
```

This allows:
- Not restarting command manually
- Quickly seeing code changes
- Convenient local development

## Running via Supervisor (production)

For continuous operation in production:

```ini
[program:telegram-polling]
command=php /path/to/artisan hybridgram:polling main
directory=/path/to/project
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
redirect_stderr=true
stdout_logfile=/path/to/storage/logs/polling.log
```

## Limitations

### allowed_updates

Limit update types to reduce load:

```php
'allowed_updates' => [
    'message',
    'callback_query',
    // Only needed types
],
```

### One Process per Bot

Don't run multiple polling processes for the same bot simultaneously — this may lead to duplicate updates.

## Debugging

### Logging

To see received updates in the console, use `-L` (one-line summary per update) or `-F` (full JSON):

```bash
php artisan hybridgram:polling main -L
php artisan hybridgram:polling main -F
```

Example output with `-L`:

```
Processing update 12345...
Processing update 12346...
```

### Status Check

Check that polling is working:

```bash
ps aux | grep "hybridgram:polling"
```

## Transitioning from Polling to Webhook

When ready for production:

1. Set up webhook:
   ```bash
   php artisan hybridgram:set-webhook main
   ```

2. Stop polling:
   ```bash
   # Find and stop process
   pkill -f "hybridgram:polling"
   ```

3. Delete webhook (if need to return to polling):
   ```bash
   php artisan hybridgram:delete-webhook main
   ```

## Recommendations

### For Development

- ✅ Use hot-reload
- ✅ Limit `allowed_updates` to only needed types
- ✅ Use `polling_limit = 10-20` for fast response

### For Production

- ❌ Not recommended to use polling in production
- ✅ Use webhook instead of polling
- ✅ If necessary, use long polling with timeout

## When to Use Polling

Use polling when:
- Developing bot locally
- Testing functionality
- No ability to set up HTTPS
- Low load and no critical delays

Don't use polling when:
- Production environment
- High load
- Critical update delays
- Maximum performance needed

## What's Next?

- **[Webhook](/en/modes/webhook/)** — recommended mode for production
- **[Sending Messages](/en/sending/telegram-bot-api/)** — working with TelegramBotApi
