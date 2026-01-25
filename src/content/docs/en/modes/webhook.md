---
title: Webhook
description: Setting up bot operation via Webhook
---

Webhook is a mode where Telegram sends updates to your server via HTTP requests. This is the recommended method for production environments.

## Advantages

- ✅ Instant delivery of updates
- ✅ Efficient resource usage
- ✅ Suitable for production
- ✅ Support for multiple bots

## Setup

### 1. Configuration in config/hybridgram.php

```php
'bots' => [
    [
        'token' => env('BOT_TOKEN'),
        'bot_id' => 'main',
        'update_mode' => UpdateModeEnum::WEBHOOK,
        'webhook_url' => env('TELEGRAM_WEBHOOK_URL'),
        'secret_token' => env('TELEGRAM_SECRET_TOKEN'), // Recommended
        'routes_file' => base_path('routes/telegram.php'),
    ],
],
```

### 2. Environment Variables

```env
BOT_TOKEN=your_token
BOT_ID=main
TELEGRAM_UPDATE_MODE=WEBHOOK
TELEGRAM_WEBHOOK_URL=https://your-domain.com/telegram/bot/webhook/main
TELEGRAM_SECRET_TOKEN=your_secret_token
```

### 3. Setting Webhook

#### Via Artisan Command

```bash
php artisan hybridgram:set-webhook main
```

Or with additional parameters:

```bash
php artisan hybridgram:set-webhook main \
    --url=https://your-domain.com/telegram/bot/webhook/main \
    --secret-token=your_secret_token \
    --drop-pending
```

#### Via Code

```php
use HybridGram\Telegram\TelegramBotApi;

$telegram = app(TelegramBotApi::class, ['botId' => 'main']);
$telegram->setWebhook(
    url: 'https://your-domain.com/telegram/bot/webhook/main',
    secretToken: 'your_secret_token'
);
```

### 4. Webhook Route

The package automatically registers a route, but you can configure your own:

```php
// routes/web.php or routes/api.php
Route::post('/telegram/bot/webhook/{botId}', 
    [\HybridGram\Http\Controllers\WebhookController::class, 'handle']
)->name('telegram.bot.webhook');
```

## Security

### Secret Token

Using a secret token to verify request authenticity is recommended:

1. Generate a random token:
   ```bash
   php artisan tinker
   >>> Str::random(32)
   ```

2. Set in `.env`:
   ```env
   TELEGRAM_SECRET_TOKEN=your_generated_token
   ```

3. Use when setting webhook:
   ```bash
   php artisan hybridgram:set-webhook main --secret-token=your_generated_token
   ```

The package automatically verifies the secret token in the `X-Telegram-Bot-Api-Secret-Token` header.

### HTTPS

Telegram requires HTTPS for webhooks. Use:
- SSL certificate (Let's Encrypt, Cloudflare, etc.)
- Local certificate for development (not recommended for production)

## SSL Certificate

If you have a self-signed certificate:

```bash
php artisan hybridgram:set-webhook main \
    --certificate=/path/to/certificate.pem
```

Or in config:

```php
'certificate_path' => env('TELEGRAM_CERTIFICATE_PATH'),
```

## Webhook Verification

### Get Webhook Info

```bash
php artisan hybridgram:get-webhook-info main
```

Or via code:

```php
$telegram = app(TelegramBotApi::class, ['botId' => 'main']);
$info = $telegram->getWebhookInfo();
```

### Delete Webhook

```bash
php artisan hybridgram:delete-webhook main
```

## Allowed Updates

You can limit the types of updates the bot receives:

```php
'allowed_updates' => ['message', 'callback_query', 'inline_query'],
```

Or in `.env`:

```env
ALLOWED_TELEGRAM_UPDATES=message,callback_query
```

## Dropping Pending Updates

When setting webhook, you can drop all pending updates:

```bash
php artisan hybridgram:set-webhook main --drop-pending
```

Or in config:

```php
'webhook_drop_pending_updates' => true,
```

## Go Handler tgook (optional)

The package supports a separate Go proxy `tgook` for maximum performance and async update processing.

```php
'webhook_port' => env('TELEGRAM_WEBHOOK_PORT', 9070),
```

In this mode, Telegram sends requests to Go service, which puts updates in Redis queue, and Laravel workers process them in background.  
Detailed architecture and setup instructions — in section **"Go proxy tgook"** (`/en/advanced/go-proxy-tgook/`).

## Debugging

### Logging

Enable logging in `config/logging.php`:

```php
'channels' => [
    'telegram' => [
        'driver' => 'single',
        'path' => storage_path('logs/telegram.log'),
    ],
],
```

### Request Inspection

All incoming updates are logged in `telegram_updates` table (if migration is executed).

## Common Issues

### 429 Too Many Requests

If you get 429 error:
- Check rate limiting settings
- Make sure you're using queue mode
- Check for duplicate requests

### Webhook Not Working

1. Check that HTTPS is configured
2. Make sure URL is accessible externally
3. Check secret token
4. Check server logs

### Update Delays

- Check webhook settings via `get-webhook-info`
- Make sure server is not overloaded
- Check queue size

## Production Recommendations

1. ✅ Use HTTPS with valid certificate
2. ✅ Configure secret token
3. ✅ Use queue mode for sending
4. ✅ Set up monitoring and alerts
5. ✅ Regularly check webhook status
6. ✅ Limit `allowed_updates` to only needed types

## What's Next?

- **[Polling](/en/modes/polling/)** — alternative mode for receiving updates
- **[Sending Messages](/en/sending/telegram-bot-api/)** — working with TelegramBotApi
