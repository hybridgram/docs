---
title: Регистрация ботов в коде
description: Добавление ботов в рантайме как альтернатива конфигу
---

Кроме описания ботов в `config/hybridgram.php`, их можно регистрировать программно через `HybridGramBotManager`. Это удобно, когда токены или список ботов хранятся в БД, приходят из внешнего API или нужно собрать менеджер в коде.

## Когда использовать

- Боты хранятся в базе или подгружаются динамически.
- Нужно добавить ботов в сервис-провайдере или своей команде перед запуском polling.
- Нужно сочетать ботов из конфига и добавленных в рантайме.

Для статичной настройки проще [конфигурация](/ru/getting-started/configuration/).

## API HybridGramBotManager

Менеджер доступен из контейнера (регистрируется как `HybridGramBotManager` и алиас `hybridgram`):

```php
use HybridGram\Core\HybridGramBotManager;

$manager = app(HybridGramBotManager::class);
// или
$manager = app('hybridgram');
```

### Добавить одного бота: `withBot()`

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

`withBot(BotConfig $botConfig)` добавляет бота, если бот с таким `bot_id` ещё не зарегистрирован. Возвращает менеджер для цепочки вызовов.

### Добавить нескольких ботов: `withBots()`

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

`withBots(array $botConfigs)` добавляет каждый конфиг (дубликаты по `bot_id` пропускаются) и возвращает менеджер.

### Цепочка вызовов

```php
$manager
    ->withBot($mainBot)
    ->withBots([$supportBot, $adminBot]);
```

### Получить зарегистрированные конфиги

```php
$configs = $manager->getBotConfigs();
// BotConfig[]
```

## Как это сочетается с `run()`

- При вызове `run()` без аргументов (например, `hybridgram:polling` без `botId`) менеджер сначала подгружает всех ботов из `config('hybridgram.bots')`, затем запускает polling/webhook по каждому зарегистрированному боту, включая добавленных через `withBot` / `withBots`. Дубликаты по `bot_id` не добавляются.
- При вызове `run($botId)` с конкретным `botId` запускается только этот бот, и он берётся через `BotConfig::getBotConfig($botId)` из **конфига**. Программно добавленные боты в этом случае не используются — такой бот должен быть в конфиге.

Имеет смысл регистрировать ботов в коде, когда вы вызываете **`run()` без аргумента** и хотите добавить к ним ещё ботов (или использовать только программно добавленных).

## Пример: добавление бота в сервис-провайдере

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

Тогда запуск `php artisan hybridgram:polling` (без bot id) запустит всех ботов из конфига и бота, добавленного в провайдере.

## Пример: режим webhook

Для webhook передайте `WebhookModeConfig` и укажите `updateMode` как `UpdateModeEnum::WEBHOOK`:

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

## Кратко

| Метод | Назначение |
|--------|------------|
| `withBot(BotConfig $botConfig)` | Добавить одного бота; возвращает менеджер для цепочки. |
| `withBots(array $botConfigs)` | Добавить нескольких ботов; возвращает менеджер. |
| `getBotConfigs()` | Вернуть список зарегистрированных `BotConfig`. |

Используйте программную регистрацию, когда список ботов не фиксирован в конфиге; иначе достаточно [конфигурации](/ru/getting-started/configuration/) и раздела [Работа с несколькими ботами](/ru/advanced/multiple-bots/).
