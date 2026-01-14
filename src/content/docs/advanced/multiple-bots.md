---
title: Работа с несколькими ботами
description: Настройка и использование нескольких Telegram ботов
---

Пакет поддерживает работу с несколькими ботами одновременно. Каждый бот имеет свою конфигурацию и маршруты.

## Конфигурация нескольких ботов

В файле `config/hybridgram.php`:

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

## Переменные окружения

```env
# Первый бот
BOT_TOKEN_1=токен_первого_бота
TELEGRAM_WEBHOOK_URL_1=https://ваш-домен.com/telegram/bot/webhook/main

# Второй бот
BOT_TOKEN_2=токен_второго_бота
TELEGRAM_WEBHOOK_URL_2=https://ваш-домен.com/telegram/bot/webhook/support

# Третий бот
BOT_TOKEN_3=токен_третьего_бота
```

## Роутинг для конкретного бота

### Использование forBot()

```php
// routes/telegram-main.php
use HybridGram\Facades\TelegramRouter;

TelegramRouter::forBot('main')->onCommand('/start', function(CommandData $data) {
    // Обработка только для бота 'main'
});

// routes/telegram-support.php
TelegramRouter::forBot('support')->onCommand('/start', function(CommandData $data) {
    // Обработка только для бота 'support'
});
```

### Общие роуты для всех ботов

```php
// Роут для всех ботов
TelegramRouter::onCommand('/help', function(CommandData $data) {
    // $data->botId содержит ID бота, для которого сработал роут
    $botId = $data->botId;
    
    // Разная логика в зависимости от бота
    match($botId) {
        'main' => $this->handleMainHelp($data),
        'support' => $this->handleSupportHelp($data),
        default => $this->handleDefaultHelp($data),
    };
});
```

## Получение экземпляра TelegramBotApi для конкретного бота

```php
// Для конкретного бота
$telegram = app(\HybridGram\Telegram\TelegramBotApi::class, ['botId' => 'main']);
$telegram->sendMessage($chatId, 'Сообщение от main бота');

$telegram = app(\HybridGram\Telegram\TelegramBotApi::class, ['botId' => 'support']);
$telegram->sendMessage($chatId, 'Сообщение от support бота');
```

## Группировка роутов по ботам

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

## Разные режимы работы

Каждый бот может работать в своем режиме:

```php
'bots' => [
    [
        'bot_id' => 'main',
        'update_mode' => UpdateModeEnum::WEBHOOK, // Production бот
    ],
    [
        'bot_id' => 'dev',
        'update_mode' => UpdateModeEnum::POLLING, // Dev бот
    ],
],
```

## Управление вебхуками

### Установка вебхука для конкретного бота

```bash
php artisan hybridgram:set-webhook main
php artisan hybridgram:set-webhook support
```

### Получение информации о вебхуке

```bash
php artisan hybridgram:get-webhook-info main
php artisan hybridgram:get-webhook-info support
```

## Запуск Polling для нескольких ботов

Запустите отдельный процесс для каждого бота:

```bash
# Терминал 1
php artisan hybridgram:polling main

# Терминал 2
php artisan hybridgram:polling support
```

Или используйте Supervisor:

```ini
[program:telegram-main]
command=php /path/to/artisan hybridgram:polling main

[program:telegram-support]
command=php /path/to/artisan hybridgram:polling support
```

## Изоляция данных

Каждый бот имеет:
- Свои роуты
- Свой rate limit (отдельный счетчик)
- Свои состояния (изолированные)
- Свой конфиг

## Общий код между ботами

Вы можете вынести общую логику в сервисы:

```php
// app/Telegram/Services/CommonService.php
class CommonService
{
    public function handleWelcome(CommandData $data, string $botId): void
    {
        $telegram = app(\HybridGram\Telegram\TelegramBotApi::class, ['botId' => $botId]);
        
        $message = match($botId) {
            'main' => 'Добро пожаловать в основной бот!',
            'support' => 'Добро пожаловать в поддержку!',
            default => 'Добро пожаловать!',
        };
        
        $telegram->sendMessage($data->getChat()->id, $message);
    }
}

// Использование
TelegramRouter::forBot('main')->onCommand('/start', function(CommandData $data) {
    app(CommonService::class)->handleWelcome($data, 'main');
});
```

## Пример: Многоязычный бот

```php
'bots' => [
    [
        'bot_id' => 'ru',
        'routes_file' => base_path('routes/telegram-ru.php'),
    ],
    [
        'bot_id' => 'en',
        'routes_file' => base_path('routes/telegram-en.php'),
    ],
],

// routes/telegram-ru.php
TelegramRouter::forBot('ru')->onCommand('/start', function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class, ['botId' => 'ru']);
    $telegram->sendMessage($data->getChat()->id, 'Привет!');
});

// routes/telegram-en.php
TelegramRouter::forBot('en')->onCommand('/start', function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class, ['botId' => 'en']);
    $telegram->sendMessage($data->getChat()->id, 'Hello!');
});
```

## Рекомендации

1. ✅ Используйте уникальные `bot_id` для каждого бота
2. ✅ Разделяйте роуты по файлам для лучшей организации
3. ✅ Используйте префиксы в именах переменных окружения
4. ✅ Документируйте назначение каждого бота
5. ✅ Мониторьте rate limits для каждого бота отдельно

## Что дальше?

- **[Конфигурация](/getting-started/configuration/)** — детальная настройка
- **[Webhook](/modes/webhook/)** — настройка вебхуков для нескольких ботов
