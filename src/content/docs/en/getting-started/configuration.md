---
title: Configuration
description: Configuring the TGbot Laravel package
---

The package configuration is located in the `config/hybridgram.php` file, which is created after publishing the configuration.

## Bot Configuration

In the `bots` array, you configure your Telegram bots. You can add multiple bots:

```php
'bots' => [
    [
        'token' => env('BOT_TOKEN'),
        'bot_id' => env('BOT_ID', 'main'),
        'update_mode' => UpdateModeEnum::POLLING, // or WEBHOOK or WEBHOOK_ASYNC
        'routes_file' => base_path(env('TELEGRAM_ROUTES_FILE', 'routes/telegram.php')),
        'polling_limit' => env('TELEGRAM_POLLING_LIMIT', 100),
        'polling_timeout' => env('TELEGRAM_POLLING_TIMEOUT', 0),
        'allowed_updates' => explode(',', env('ALLOWED_TELEGRAM_UPDATES', '')),
        'secret_token' => env('TELEGRAM_SECRET_TOKEN'),
        'webhook_url' => env('TELEGRAM_WEBHOOK_URL'),
        'webhook_port' => env('TELEGRAM_WEBHOOK_PORT', 9070),
        'certificate_path' => env('TELEGRAM_CERTIFICATE_PATH'),
        'webhook_drop_pending_updates' => env('TELEGRAM_WEBHOOK_DROP_PENDING', false),
        'bot_name' => env('BOT_NAME', 'main'),
    ],
    // Add additional bots here
],
```

### Bot Configuration Parameters

| Parameter | Description                                                             | Required |
|-----------|-------------------------------------------------------------------------|----------|
| `token` | Bot token from @BotFather                                               | ✅ Yes |
| `bot_id` | Unique bot identifier                                                   | No (defaults to 'main') |
| `update_mode` | Operation mode: `POLLING` or `WEBHOOK` or `WEBHOOK_ASYNC` may be string | Yes |
| `routes_file` | Path to routes file                                                     | Yes |
| `polling_limit` | Updates limit per request (for Polling)                                 | No |
| `polling_timeout` | Request timeout in seconds (for Polling)                                | No |
| `allowed_updates` | Array of allowed update types                                           | No |
| `secret_token` | Secret token for webhook                                                | No |
| `webhook_url` | Webhook URL                                                             | For WEBHOOK mode |
| `webhook_port` | Port for Go handler                                                     | No |
| `certificate_path` | Path to SSL certificate                                                 | No |
| `webhook_drop_pending_updates` | Drop pending updates                                                    | No |
| `bot_name` | Bot name                                                                | No |

## Sending Configuration

The `sending` section configures message sending behavior:

```php
'sending' => [
    // Enable sending through queues
    'queue_enabled' => env('TELEGRAM_QUEUE_ENABLED', false),

    // Rate limit per minute per bot (Telegram limit ~30/sec = 1800/min)
    'rate_limit_per_minute' => (int) env('TELEGRAM_RATE_LIMIT_PER_MINUTE', 1800),

    // Reserve slots for HIGH priority (responses to incoming updates)
    'reserve_high_per_minute' => (int) env('TELEGRAM_RESERVE_HIGH_PER_MINUTE', 300),

    // Maximum wait time in sync mode (ms)
    'sync_max_wait_ms' => (int) env('TELEGRAM_SYNC_MAX_WAIT_MS', 2000),

    // Queue names for different priorities
    'queues' => [
        'high' => env('TELEGRAM_QUEUE_HIGH', 'telegram-high'),
        'low' => env('TELEGRAM_QUEUE_LOW', 'telegram-low'),
    ],

    // Log sending failures
    'log_failures' => env('TELEGRAM_LOG_FAILURES', true),

    // Include response body in logs (may contain request details)
    'log_response_body' => env('TELEGRAM_LOG_RESPONSE_BODY', true),
],
```

### Sending Modes

#### Sync Mode (queue_enabled = false)
All requests are sent synchronously without rate limiting. Suitable for development and small projects.

#### Queue Mode (queue_enabled = true)
Requests are placed in Laravel queues with priorities:
- **HIGH** — responses to incoming updates (processed first)
- **LOW** — broadcasts and background tasks

To run queues, you need to start workers:

```bash
php artisan queue:work --queue=telegram-high,telegram-low
```

## Authorization Configuration

The `auth` section configures Telegram user authorization:

```php
'auth' => [
    // Guard name for Telegram authorization
    'guard' => 'hybridgram',

    // User model
    'user_model' => env('TELEGRAM_USER_MODEL', 'App\\Models\\User'),

    // Database column for storing Telegram user ID
    'telegram_id_column' => env('TELEGRAM_ID_COLUMN', 'telegram_id'),

    // Automatically create user if not found
    'auto_create_user' => env('TELEGRAM_AUTO_CREATE_USER', false),
],
```

## Base API URL

```php
'base_url' => env('TELEGRAM_BASE_URL', 'https://api.telegram.org/bot'),
```

This parameter can be changed if you're using your own proxy or local Telegram API server.

## Full Configuration Example

```php
<?php

use HybridGram\Core\UpdateMode\UpdateModeEnum;

return [
    'bots' => [
        [
            'token' => env('BOT_TOKEN'),
            'bot_id' => 'main',
            'update_mode' => UpdateModeEnum::POLLING,
            'routes_file' => base_path('routes/telegram.php'),
        ],
        [
            'token' => env('BOT_TOKEN_2'),
            'bot_id' => 'second_bot',
            'update_mode' => UpdateModeEnum::WEBHOOK,
            'routes_file' => base_path('routes/telegram-bot-2.php'),
            'webhook_url' => env('TELEGRAM_WEBHOOK_URL_2'),
        ],
    ],
    'base_url' => env('TELEGRAM_BASE_URL', 'https://api.telegram.org/bot'),
    'sending' => [
        'queue_enabled' => env('TELEGRAM_QUEUE_ENABLED', false),
        'rate_limit_per_minute' => 1800,
        'reserve_high_per_minute' => 300,
        'queues' => [
            'high' => 'telegram-high',
            'low' => 'telegram-low',
        ],
    ],
    'auth' => [
        'guard' => 'hybridgram',
        'user_model' => 'App\\Models\\User',
        'telegram_id_column' => 'telegram_id',
        'auto_create_user' => false,
    ],
];
```

## What's Next?

- **[Routing](/en/basics/routing/)** — creating handlers for various update types
- **[Sending Messages](/en/sending/telegram-bot-api/)** — using TelegramBotApi
