---
title: Programmatic Bot Registration
description: Adding bots at runtime as an alternative to config
---

Besides defining bots in `config/hybridgram.php`, you can register bots programmatically using `HybridGramBotManager`. This is useful when bot credentials or list come from a database, external API, or you want to build the manager in code.

## When to use

- Bots are stored in a database or loaded dynamically.
- You want to add bots in a service provider or custom command before starting polling.
- You need to mix config-based bots with runtime-added bots.

For static setup, the [config-based approach](/en/getting-started/configuration/) is simpler.

## HybridGramBotManager API

Resolve the manager from the container (it is registered as `HybridGramBotManager` and alias `hybridgram`):

```php
use HybridGram\Core\HybridGramBotManager;

$manager = app(HybridGramBotManager::class);
// or
$manager = app('hybridgram');
```

### Adding one bot: `withBot()`

```php
use HybridGram\Core\Config\BotConfig;
use HybridGram\Core\Config\PollingModeConfig;
use HybridGram\Core\UpdateMode\UpdateModeEnum;
use HybridGram\Core\HybridGramBotManager;

$manager = app(HybridGramBotManager::class);

$botConfig = new BotConfig(
    token: env('BOT_TOKEN'),
    botId: 'dynamic_bot',
    updateMode: UpdateModeEnum::POLLING,
    routesPath: base_path('routes/telegram.php'),
    pollingConfig: new PollingModeConfig(100, [], 0),
    webhookConfig: null,
    botName: 'My Bot'
);

$manager->withBot($botConfig);
```

`withBot(BotConfig $botConfig)` adds the bot if a bot with the same `bot_id` is not already registered. It returns the manager for chaining.

### Adding multiple bots: `withBots()`

```php
use HybridGram\Core\Config\BotConfig;
use HybridGram\Core\Config\PollingModeConfig;
use HybridGram\Core\UpdateMode\UpdateModeEnum;
use HybridGram\Core\HybridGramBotManager;

$manager = app(HybridGramBotManager::class);

$configs = [
    new BotConfig(/* ... */),
    new BotConfig(/* ... */),
];

$manager->withBots($configs);
```

`withBots(array $botConfigs)` adds each config (skipping duplicates by `bot_id`) and returns the manager.

### Chaining

```php
$manager
    ->withBot($mainBot)
    ->withBots([$supportBot, $adminBot]);
```

### Getting registered configs

```php
$configs = $manager->getBotConfigs();
// BotConfig[]
```

## How it works with `run()`

- When you call `run()` with no arguments (e.g. from `hybridgram:polling` without `botId`), the manager first loads all bots from `config('hybridgram.bots')` and then runs polling/webhook for every registered bot (including those added via `withBot` / `withBots`). Duplicates by `bot_id` are skipped.
- When you call `run($botId)` with a specific `botId`, only that bot is run and it is resolved via `BotConfig::getBotConfig($botId)` from **config**. Programmatically added bots are not used in this case, so that bot must exist in config.

So programmatic registration is meaningful when you use **`run()` with no argument** and want to add extra bots (or only programmatic bots) before that.

## Example: adding a bot in a service provider

```php
// app/Providers/TelegramBotServiceProvider.php
use HybridGram\Core\Config\BotConfig;
use HybridGram\Core\Config\PollingModeConfig;
use HybridGram\Core\HybridGramBotManager;
use HybridGram\Core\UpdateMode\UpdateModeEnum;

public function boot(): void
{
    $manager = $this->app->make(HybridGramBotManager::class);

    $dynamicBot = new BotConfig(
        token: config('services.telegram_dynamic.token'),
        botId: 'dynamic',
        updateMode: UpdateModeEnum::POLLING,
        routesPath: base_path('routes/telegram-dynamic.php'),
        pollingConfig: new PollingModeConfig(),
        webhookConfig: null,
        botName: 'Dynamic Bot'
    );

    $manager->withBot($dynamicBot);
}
```

Then running `php artisan hybridgram:polling` (no bot id) will run all bots from config plus the one added in the provider.

## Example: webhook mode

For webhook mode, pass a `WebhookModeConfig` and set `updateMode` to `UpdateModeEnum::WEBHOOK`:

```php
use HybridGram\Core\Config\BotConfig;
use HybridGram\Core\Config\WebhookModeConfig;
use HybridGram\Core\UpdateMode\UpdateModeEnum;

$webhookConfig = new WebhookModeConfig(
    url: 'https://your-domain.com/telegram/bot/webhook/dynamic',
    port: null,
    certificatePath: null,
    ipAddress: null,
    allowedUpdates: [],
    dropPendingUpdates: false,
    secretToken: env('TELEGRAM_WEBHOOK_SECRET')
);

$botConfig = new BotConfig(
    token: env('BOT_TOKEN'),
    botId: 'dynamic',
    updateMode: UpdateModeEnum::WEBHOOK,
    routesPath: base_path('routes/telegram.php'),
    pollingConfig: null,
    webhookConfig: $webhookConfig,
    botName: 'Webhook Bot'
);

app(HybridGramBotManager::class)->withBot($botConfig);
```

## Summary

| Method | Purpose |
|--------|--------|
| `withBot(BotConfig $botConfig)` | Add one bot; returns manager for chaining. |
| `withBots(array $botConfigs)` | Add multiple bots; returns manager. |
| `getBotConfigs()` | Return the list of registered `BotConfig` instances. |

Use programmatic registration when bots are not fixed in config; otherwise, [configuration](/en/getting-started/configuration/) and [Multiple Bots](/en/advanced/multiple-bots/) are enough.
