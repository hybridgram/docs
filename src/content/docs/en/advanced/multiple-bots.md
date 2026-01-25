---
title: Working with Multiple Bots
description: Setting up and using multiple Telegram bots
---

The package supports working with multiple bots simultaneously. Each bot has its own configuration and routes.

## Multiple Bot Configuration

In the `config/hybridgram.php` file:

```php
'bots' => [
    [
        'token' => env('BOT_TOKEN_1'),
        'bot_id' => 'main',
        'update_mode' => UpdateModeEnum::WEBHOOK,
        'webhook_url' => env('TELEGRAM_WEBHOOK_URL_1'),
        'routes_file' => base_path('routes/telegram-main.php'),
    ],
    [
        'token' => env('BOT_TOKEN_2'),
        'bot_id' => 'support',
        'update_mode' => UpdateModeEnum::WEBHOOK,
        'webhook_url' => env('TELEGRAM_WEBHOOK_URL_2'),
        'routes_file' => base_path('routes/telegram-support.php'),
    ],
    [
        'token' => env('BOT_TOKEN_3'),
        'bot_id' => 'admin',
        'update_mode' => UpdateModeEnum::POLLING,
        'routes_file' => base_path('routes/telegram-admin.php'),
    ],
],
```

## Environment Variables

```env
# First bot
BOT_TOKEN_1=first_bot_token
TELEGRAM_WEBHOOK_URL_1=https://your-domain.com/telegram/bot/webhook/main

# Second bot
BOT_TOKEN_2=second_bot_token
TELEGRAM_WEBHOOK_URL_2=https://your-domain.com/telegram/bot/webhook/support

# Third bot
BOT_TOKEN_3=third_bot_token
```

## Routing for Specific Bot

### Using forBot()

```php
// routes/telegram-main.php
use HybridGram\Facades\TelegramRouter;

TelegramRouter::forBot('main')->onCommand('/start', function(CommandData $data) {
    // Handle only for 'main' bot
});

// routes/telegram-support.php
TelegramRouter::forBot('support')->onCommand('/start', function(CommandData $data) {
    // Handle only for 'support' bot
});
```

### Common Routes for All Bots

```php
// Route for all bots
TelegramRouter::onCommand('/help', function(CommandData $data) {
    // $data->botId contains ID of the bot for which route triggered
    $botId = $data->botId;
    
    // Different logic depending on bot
    match($botId) {
        'main' => $this->handleMainHelp($data),
        'support' => $this->handleSupportHelp($data),
        default => $this->handleDefaultHelp($data),
    };
});
```

## Getting TelegramBotApi Instance for Specific Bot

```php
// For specific bot
$telegram = app(\HybridGram\Telegram\TelegramBotApi::class, ['botId' => 'main']);
$telegram->sendMessage($chatId, 'Message from main bot');

$telegram = app(\HybridGram\Telegram\TelegramBotApi::class, ['botId' => 'support']);
$telegram->sendMessage($chatId, 'Message from support bot');
```

## Grouping Routes by Bots

```php
TelegramRouter::group([
    'botId' => 'main',
], function($router) {
    $router->onCommand('/start', function(CommandData $data) {
        // ...
    });
    
    $router->onCommand('/menu', function(CommandData $data) {
        // ...
    });
});
```

## Different Operation Modes

Each bot can work in its own mode:

```php
'bots' => [
    [
        'bot_id' => 'main',
        'update_mode' => UpdateModeEnum::WEBHOOK, // Production bot
    ],
    [
        'bot_id' => 'dev',
        'update_mode' => UpdateModeEnum::POLLING, // Dev bot
    ],
],
```

## Webhook Management

### Setting Webhook for Specific Bot

```bash
php artisan hybridgram:set-webhook main
php artisan hybridgram:set-webhook support
```

### Getting Webhook Info

```bash
php artisan hybridgram:get-webhook-info main
php artisan hybridgram:get-webhook-info support
```

## Running Polling for Multiple Bots

Run separate process for each bot:

```bash
# Terminal 1
php artisan hybridgram:polling main

# Terminal 2
php artisan hybridgram:polling support
```

Or use Supervisor:

```ini
[program:telegram-main]
command=php /path/to/artisan hybridgram:polling main

[program:telegram-support]
command=php /path/to/artisan hybridgram:polling support
```

## Data Isolation

Each bot has:
- Its own routes
- Its own rate limit (separate counter)
- Its own states (isolated)
- Its own config

## Sharing Code Between Bots

You can extract common logic into services:

```php
// app/Telegram/Services/CommonService.php
class CommonService
{
    public function handleWelcome(CommandData $data, string $botId): void
    {
        $telegram = app(\HybridGram\Telegram\TelegramBotApi::class, ['botId' => $botId]);
        
        $message = match($botId) {
            'main' => 'Welcome to the main bot!',
            'support' => 'Welcome to support!',
            default => 'Welcome!',
        };
        
        $telegram->sendMessage($data->getChat()->id, $message);
    }
}

// Usage
TelegramRouter::forBot('main')->onCommand('/start', function(CommandData $data) {
    app(CommonService::class)->handleWelcome($data, 'main');
});
```

## Recommendations

1. ✅ Use unique `bot_id` for each bot
2. ✅ Separate routes into files for better organization
3. ✅ Use prefixes in environment variable names
4. ✅ Document the purpose of each bot
5. ✅ Monitor rate limits for each bot separately

## What's Next?

- **[Configuration](/en/getting-started/configuration/)** — detailed configuration
- **[Webhook](/en/modes/webhook/)** — setting up webhooks for multiple bots
