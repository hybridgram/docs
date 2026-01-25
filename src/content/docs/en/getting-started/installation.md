---
title: Installation
description: Installing the Laravel Async Telegram package
---

## Installation via Composer

Install the package in your Laravel project:

```bash
composer require hybridgram/tgbot-laravel
```

## Publish Configuration

Publish the package configuration file:

```bash
php artisan vendor:publish --provider="HybridGram\Providers\TelegramServiceProvider"
```

This will create the `config/hybridgram.php` file where you can configure your bots.

## Environment Variables Setup

Add the following variables to your `.env` file:

```env
# Your bot token from @BotFather
BOT_TOKEN=your_bot_token

# Bot ID (optional, defaults to 'main')
# If not specified, BOT_TOKEN will be used as the identifier
BOT_ID=main

# Update receiving mode: POLLING or WEBHOOK
TELEGRAM_UPDATE_MODE=POLLING

# Path to routes file (optional)
TELEGRAM_ROUTES_FILE=routes/telegram.php
```

### Additional Webhook Settings

If you're using Webhook mode, add:

```env
# Webhook URL
TELEGRAM_WEBHOOK_URL=https://your-domain.com/telegram/bot/webhook/main

# Secret token for security (optional)
TELEGRAM_SECRET_TOKEN=your_secret_token

# Port for webhook processing (if using Go handler)
TELEGRAM_WEBHOOK_PORT=9070

# Path to SSL certificate (if required)
TELEGRAM_CERTIFICATE_PATH=/path/to/certificate.pem

# Drop pending updates when setting webhook
TELEGRAM_WEBHOOK_DROP_PENDING=false
```

### Polling Settings

For Polling mode:

```env
# Updates limit per request (default 100)
TELEGRAM_POLLING_LIMIT=100

# Request timeout in seconds (default 0)
TELEGRAM_POLLING_TIMEOUT=0

# Allowed update types (comma-separated)
ALLOWED_TELEGRAM_UPDATES=message,callback_query
```

## Creating Routes File

Create a file to define your bot routes. By default, it's `routes/telegram.php`:

```php
<?php

use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\CommandData;

TelegramRouter::onCommand('/start', function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->sendMessage($data->chatId, 'Hello! 👋');
});
```

## Installation Verification

After installation, make sure that:

1. ✅ Package is installed via Composer
2. ✅ Configuration file is published
3. ✅ Environment variables are configured
4. ✅ Routes file is created

## What's Next?

- **[Configuration](/en/getting-started/configuration/)** — detailed package configuration
- **[Creating Your First Route](/en/basics/routing/)** — start creating handlers
