---
title: Приоритеты и очереди
description: Настройка очередей и приоритетов для отправки сообщений
---

Пакет поддерживает асинхронную отправку сообщений через очереди Laravel с системой приоритетов, что обеспечивает быструю обработку ответов на входящие обновления.

## Режимы работы

### Sync режим (по умолчанию)

В sync режиме все запросы отправляются синхронно:

```env
TELEGRAM_QUEUE_ENABLED=false
```

Запросы выполняются сразу, но без rate limiting. Подходит для разработки и небольших проектов.

### Queue режим

В queue режиме запросы ставятся в очереди:

```env
TELEGRAM_QUEUE_ENABLED=true
```

Для работы очередей нужно запустить воркеры:

```bash
# Обработка всех очередей
php artisan queue:work --queue=telegram-high,telegram-low

# Или отдельно по приоритетам
php artisan queue:work --queue=telegram-high
php artisan queue:work --queue=telegram-low
```

## Приоритеты

Пакет использует два уровня приоритета:

### HIGH (по умолчанию)

- Ответы на входящие обновления
- Критичные сообщения
- По умолчанию все запросы имеют этот приоритет

```php
use HybridGram\Telegram\Priority;

// Явное указание (не обязательно, это по умолчанию)
$telegram->withPriority(Priority::HIGH)
    ->sendMessage($chatId, 'Быстрый ответ');
```

### LOW

- Рассылки
- Фоновые задачи
- Не критичные сообщения

```php
$telegram->withPriority(Priority::LOW)
    ->sendMessage($chatId, 'Рассылка');
```

## Конфигурация

В файле `config/hybridgram.php`:

```php
'sending' => [
    'queue_enabled' => env('TELEGRAM_QUEUE_ENABLED', false),
    
    // Лимит запросов в минуту на бота (по умолчанию 1800 ≈ 30/сек)
    'rate_limit_per_minute' => env('TELEGRAM_RATE_LIMIT_PER_MINUTE', 1800),
    
    // Резерв слотов для HIGH приоритета
    'reserve_high_per_minute' => env('TELEGRAM_RESERVE_HIGH_PER_MINUTE', 300),
    
    // Имена очередей
    'queues' => [
        'high' => env('TELEGRAM_QUEUE_HIGH', 'telegram-high'),
        'low' => env('TELEGRAM_QUEUE_LOW', 'telegram-low'),
    ],
],
```

### Резерв для HIGH приоритета

Параметр `reserve_high_per_minute` гарантирует, что определенное количество слотов всегда доступно для HIGH приоритета. LOW приоритет не может использовать эти слоты.

**Пример:**
- `rate_limit_per_minute = 1800`
- `reserve_high_per_minute = 300`

Это означает:
- До 1800 запросов в минуту
- Минимум 300 слотов всегда доступны для HIGH
- LOW может использовать до 1500 слотов в минуту

## Использование

### В обработчиках роутов

В обработчиках роутов автоматически используется HIGH приоритет:

```php
TelegramRouter::onCommand('/start', function(CommandData $data) {
    $telegram = app(TelegramBotApi::class);
    
    // Автоматически HIGH приоритет
    $telegram->sendMessage($data->getChat()->id, 'Привет!');
});
```

### Для рассылок

Явно указывайте LOW приоритет для рассылок:

```php
// Рассылка всем пользователям
$users = User::all();

foreach ($users as $user) {
    $telegram->withPriority(Priority::LOW)
        ->sendMessage($user->telegram_id, 'Новость!');
}
```

### Смешанное использование

```php
use HybridGram\Core\Routing\RouteData\TextMessageData;

TelegramRouter::onTextMessage(function(TextMessageData $data) {
    $telegram = app(TelegramBotApi::class);
    
    // Высокоприоритетный ответ
    $telegram->sendMessage(
        $data->getChat()->id,
        'Ваше сообщение получено!'
    );
    
    // Низкоприоритетная задача (например, логирование)
    $telegram->withPriority(Priority::LOW)
        ->sendMessage(
            config('telegram.admin_chat_id'),
            "Новое сообщение от {$data->getUser()->id}"
        );
});
```

## Запуск воркеров

### Базовый запуск

```bash
php artisan queue:work --queue=telegram-high,telegram-low
```

### С настройками

```bash
php artisan queue:work \
    --queue=telegram-high,telegram-low \
    --tries=3 \
    --timeout=60 \
    --max-jobs=1000 \
    --max-time=3600
```

### Использование Supervisor (рекомендуется)

Создайте конфигурацию `/etc/supervisor/conf.d/telegram-worker.conf`:

```ini
[program:telegram-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/artisan queue:work --queue=telegram-high,telegram-low --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/path/to/storage/logs/worker.log
stopwaitsecs=3600
```

Затем:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start telegram-worker:*
```

## Rate Limiting в Queue режиме

В queue режиме rate limiting применяется на воркерах:

1. Job попадает в очередь
2. Воркер берет job из очереди
3. Проверяется rate limit
4. Если лимит превышен, job возвращается в очередь (`release()`)
5. Воркер не блокируется `sleep()`-ом, может обрабатывать другие jobs

Это обеспечивает:
- Не блокирующую обработку
- Эффективное использование ресурсов
- Соблюдение лимитов Telegram

## Мониторинг очередей

### Проверка размера очередей

```php
use Illuminate\Support\Facades\Queue;

$highQueueSize = Queue::size('telegram-high');
$lowQueueSize = Queue::size('telegram-low');
```

### Мониторинг через Laravel Horizon

Если используете Laravel Horizon:

```bash
php artisan horizon
```

В веб-интерфейсе будут видны очереди `telegram-high` и `telegram-low`.

## Важные замечания

1. **InputFile с resource** не поддерживаются в queue режиме. Используйте пути к файлам или base64.

2. **Служебные методы** (getUpdates, setWebhook, getMe) всегда выполняются синхронно.

3. **Приоритет по умолчанию**: В обработчиках роутов автоматически используется HIGH.

4. **Fallback**: Если queue не настроена, запросы выполняются синхронно.

## Что дальше?

- **[Rate Limiting](/ru/sending/rate-limiting/)** — детали работы rate limiting
- **[Режимы работы](/ru/modes/webhook/)** — настройка webhook и polling
