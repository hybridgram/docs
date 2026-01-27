---
title: Конфигурация
description: Настройка пакета TGbot Laravel
---

Конфигурация пакета находится в файле `config/hybridgram.php`, который создается после публикации конфигурации.

## Конфигурация ботов

В массиве `bots` настраиваются ваши Telegram боты. Вы можете добавить несколько ботов:

```php
'bots' => [
    [
        'token' => env('BOT_TOKEN'),
        'bot_id' => env('BOT_ID', 'main'),
        'update_mode' => UpdateModeEnum::POLLING, // или WEBHOOK
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
    // Добавьте дополнительные боты здесь
],
```

### Параметры конфигурации бота

| Параметр | Описание | Обязательный |
|----------|----------|--------------|
| `token` | Токен бота от @BotFather | ✅ Да |
| `bot_id` | Уникальный идентификатор бота | Нет (по умолчанию 'main') |
| `update_mode` | Режим работы: `POLLING` или `WEBHOOK` | Да |
| `routes_file` | Путь к файлу с роутами | Да |
| `polling_limit` | Лимит обновлений за запрос (для Polling) | Нет |
| `polling_timeout` | Таймаут запроса в секундах (для Polling) | Нет |
| `allowed_updates` | Массив разрешенных типов обновлений | Нет |
| `secret_token` | Секретный токен для вебхука | Нет |
| `webhook_url` | URL для вебхука | Для WEBHOOK режима |
| `webhook_port` | Порт для Go обработчика | Нет |
| `certificate_path` | Путь к SSL сертификату | Нет |
| `webhook_drop_pending_updates` | Удалить ожидающие обновления | Нет |
| `bot_name` | Имя бота | Нет |

## Настройка отправки сообщений

Секция `sending` настраивает поведение при отправке сообщений:

```php
'sending' => [
    // Включить отправку через очереди
    'queue_enabled' => env('TELEGRAM_QUEUE_ENABLED', false),

    // Лимит запросов в минуту на бота (Telegram limit ~30/сек = 1800/мин)
    'rate_limit_per_minute' => (int) env('TELEGRAM_RATE_LIMIT_PER_MINUTE', 1800),

    // Резерв слотов для HIGH приоритета (ответы на входящие)
    'reserve_high_per_minute' => (int) env('TELEGRAM_RESERVE_HIGH_PER_MINUTE', 300),

    // Максимальное время ожидания в sync режиме (мс)
    'sync_max_wait_ms' => (int) env('TELEGRAM_SYNC_MAX_WAIT_MS', 2000),

    // Имена очередей для разных приоритетов
    'queues' => [
        'high' => env('TELEGRAM_QUEUE_HIGH', 'telegram-high'),
        'low' => env('TELEGRAM_QUEUE_LOW', 'telegram-low'),
    ],

    // Логировать ошибки при отправке
    'log_failures' => env('TELEGRAM_LOG_FAILURES', true),

    // Включать тело ответа в логи (может содержать детали запроса)
    'log_response_body' => env('TELEGRAM_LOG_RESPONSE_BODY', true),
],
```

### Режимы отправки

#### Sync режим (queue_enabled = false)
Все запросы отправляются синхронно без rate limiting. Подходит для разработки и небольших проектов.

#### Queue режим (queue_enabled = true)
Запросы ставятся в очереди Laravel с приоритетами:
- **HIGH** — ответы на входящие обновления (обрабатываются первыми)
- **LOW** — рассылки и фоновые задачи

Для работы очередей нужно запустить воркеры:

```bash
php artisan queue:work --queue=telegram-high,telegram-low
```

## Настройка авторизации

Секция `auth` настраивает авторизацию пользователей Telegram:

```php
'auth' => [
    // Имя guard для Telegram авторизации
    'guard' => 'hybridgram',

    // Модель пользователя
    'user_model' => env('TELEGRAM_USER_MODEL', 'App\\Models\\User'),

    // Колонка в БД для хранения Telegram user ID
    'telegram_id_column' => env('TELEGRAM_ID_COLUMN', 'telegram_id'),

    // Автоматически создавать пользователя, если не найден
    'auto_create_user' => env('TELEGRAM_AUTO_CREATE_USER', false),
],
```

## Базовый URL API

```php
'base_url' => env('TELEGRAM_BASE_URL', 'https://api.telegram.org/bot'),
```

Этот параметр можно изменить, если вы используете собственный прокси или локальный сервер Telegram API.

## Пример полной конфигурации

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

## Что дальше?

- **[Роутинг](/ru/basics/routing/)** — создание обработчиков для различных типов обновлений
- **[Отправка сообщений](/ru/sending/telegram-bot-api/)** — использование TelegramBotApi
