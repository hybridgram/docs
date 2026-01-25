---
title: Webhook
description: Настройка работы бота через Webhook
---

Webhook — это режим, при котором Telegram отправляет обновления на ваш сервер через HTTP запросы. Это рекомендуемый способ для production окружений.

## Преимущества

- ✅ Мгновенная доставка обновлений
- ✅ Эффективное использование ресурсов
- ✅ Подходит для production
- ✅ Поддержка нескольких ботов

## Настройка

### 1. Конфигурация в config/hybridgram.php

```php
'bots' => [
    [
        'token' => env('BOT_TOKEN'),
        'bot_id' => 'main',
        'update_mode' => UpdateModeEnum::WEBHOOK,
        'webhook_url' => env('TELEGRAM_WEBHOOK_URL'),
        'secret_token' => env('TELEGRAM_SECRET_TOKEN'), // Рекомендуется
        'routes_file' => base_path('routes/telegram.php'),
    ],
],
```

### 2. Переменные окружения

```env
BOT_TOKEN=ваш_токен
BOT_ID=main
TELEGRAM_UPDATE_MODE=WEBHOOK
TELEGRAM_WEBHOOK_URL=https://ваш-домен.com/telegram/bot/webhook/main
TELEGRAM_SECRET_TOKEN=ваш_секретный_токен
```

### 3. Установка вебхука

#### Через команду Artisan

```bash
php artisan hybridgram:set-webhook main
```

Или с дополнительными параметрами:

```bash
php artisan hybridgram:set-webhook main \
    --url=https://ваш-домен.com/telegram/bot/webhook/main \
    --secret-token=ваш_секретный_токен \
    --drop-pending
```

#### Через код

```php
use HybridGram\Telegram\TelegramBotApi;

$telegram = app(TelegramBotApi::class, ['botId' => 'main']);
$telegram->setWebhook(
    url: 'https://ваш-домен.com/telegram/bot/webhook/main',
    secretToken: 'ваш_секретный_токен'
);
```

### 4. Роут для вебхука

Пакет автоматически регистрирует роут, но вы можете настроить свой:

```php
// routes/web.php или routes/api.php
Route::post('/telegram/bot/webhook/{botId}', 
    [\HybridGram\Http\Controllers\WebhookController::class, 'handle']
)->name('telegram.bot.webhook');
```

## Безопасность

### Secret Token

Рекомендуется использовать secret token для проверки подлинности запросов:

1. Сгенерируйте случайный токен:
   ```bash
   php artisan tinker
   >>> Str::random(32)
   ```

2. Установите в `.env`:
   ```env
   TELEGRAM_SECRET_TOKEN=ваш_сгенерированный_токен
   ```

3. Используйте при установке вебхука:
   ```bash
   php artisan hybridgram:set-webhook main --secret-token=ваш_сгенерированный_токен
   ```

Пакет автоматически проверяет secret token в заголовке `X-Telegram-Bot-Api-Secret-Token`.

### HTTPS

Telegram требует HTTPS для вебхуков. Используйте:
- SSL сертификат (Let's Encrypt, Cloudflare и т.д.)
- Локальный сертификат для разработки (не рекомендуется для production)

## SSL сертификат

Если у вас самоподписанный сертификат:

```bash
php artisan hybridgram:set-webhook main \
    --certificate=/path/to/certificate.pem
```

Или в конфиге:

```php
'certificate_path' => env('TELEGRAM_CERTIFICATE_PATH'),
```

## Проверка вебхука

### Получить информацию о вебхуке

```bash
php artisan hybridgram:get-webhook-info main
```

Или через код:

```php
$telegram = app(TelegramBotApi::class, ['botId' => 'main']);
$info = $telegram->getWebhookInfo();
```

### Удалить вебхук

```bash
php artisan hybridgram:delete-webhook main
```

## Разрешенные обновления

Вы можете ограничить типы обновлений, которые будет получать бот:

```php
'allowed_updates' => ['message', 'callback_query', 'inline_query'],
```

Или в `.env`:

```env
ALLOWED_TELEGRAM_UPDATES=message,callback_query
```

## Удаление ожидающих обновлений

При установке вебхука можно удалить все ожидающие обновления:

```bash
php artisan hybridgram:set-webhook main --drop-pending
```

Или в конфиге:

```php
'webhook_drop_pending_updates' => true,
```

## Go обработчик tgook (опционально)

Пакет поддерживает отдельный Go‑прокси `tgook` для максимальной производительности и асинхронной обработки обновлений.

```php
'webhook_port' => env('TELEGRAM_WEBHOOK_PORT', 9070),
```

В этом режиме Telegram шлёт запросы на Go‑сервис, который кладёт обновления в Redis очередь, а Laravel воркеры обрабатывают их в фоне.  
Подробная схема работы и инструкция по настройке — в разделе **«Go proxy tgook»** (`/advanced/go-proxy-tgook/`).

## Отладка

### Логирование

Включите логирование в `config/logging.php`:

```php
'channels' => [
    'telegram' => [
        'driver' => 'single',
        'path' => storage_path('logs/telegram.log'),
    ],
],
```

### Проверка запросов

Все входящие обновления логируются в таблицу `telegram_updates` (если миграция выполнена).

## Типичные проблемы

### 429 Too Many Requests

Если получаете ошибку 429:
- Проверьте rate limiting настройки
- Убедитесь, что используете queue режим
- Проверьте, нет ли дублирования запросов

### Вебхук не работает

1. Проверьте, что HTTPS настроен
2. Убедитесь, что URL доступен извне
3. Проверьте secret token
4. Проверьте логи сервера

### Задержка обновлений

- Проверьте настройки вебхука через `get-webhook-info`
- Убедитесь, что сервер не перегружен
- Проверьте размер очереди

## Production рекомендации

1. ✅ Используйте HTTPS с валидным сертификатом
2. ✅ Настройте secret token
3. ✅ Используйте queue режим для отправки
4. ✅ Настройте мониторинг и алерты
5. ✅ Регулярно проверяйте статус вебхука
6. ✅ Ограничьте `allowed_updates` только нужными типами

## Что дальше?

- **[Polling](/ru/modes/polling/)** — альтернативный режим получения обновлений
- **[Отправка сообщений](/ru/sending/telegram-bot-api/)** — работа с TelegramBotApi
