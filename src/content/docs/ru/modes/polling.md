---
title: Polling
description: Настройка работы бота через Polling
---

Polling — это режим, при котором ваш сервер периодически запрашивает обновления у Telegram. Подходит для разработки и тестирования.

## Преимущества

- ✅ Не требует публичного URL
- ✅ Простая настройка
- ✅ Подходит для разработки
- ✅ Можно использовать локально

## Недостатки

- ❌ Задержка получения обновлений
- ❌ Неэффективное использование ресурсов
- ❌ Не рекомендуется для production с высокой нагрузкой

## Настройка

### 1. Конфигурация в config/hybridgram.php

```php
'bots' => [
    [
        'token' => env('BOT_TOKEN'),
        'bot_id' => 'main',
        'update_mode' => UpdateModeEnum::POLLING,
        'routes_file' => base_path('routes/telegram.php'),
        'polling_limit' => env('TELEGRAM_POLLING_LIMIT', 100),
        'polling_timeout' => env('TELEGRAM_POLLING_TIMEOUT', 0),
        'allowed_updates' => explode(',', env('ALLOWED_TELEGRAM_UPDATES', '')),
    ],
],
```

### 2. Переменные окружения

```env
BOT_TOKEN=ваш_токен
BOT_ID=main
TELEGRAM_UPDATE_MODE=POLLING
TELEGRAM_POLLING_LIMIT=100
TELEGRAM_POLLING_TIMEOUT=0
ALLOWED_TELEGRAM_UPDATES=message,callback_query
```

### 3. Запуск polling

#### Базовый запуск

```bash
php artisan hybridgram:polling main
```

#### С hot-reload (для разработки)

```bash
php artisan hybridgram:polling main --hot-reload
```

Hot-reload автоматически перезапускает команду при изменении кода.

#### С настройками watch

```bash
php artisan hybridgram:polling main \
    --hot-reload \
    --watch=app,routes,config,src \
    --watch-interval=1
```

Параметры:
- `--watch` — директории для отслеживания (через запятую)
- `--watch-interval` — интервал проверки в секундах

#### Ограничение типов обновлений

```bash
php artisan hybridgram:polling main --allowed-updates=message,callback_query
```

Или в конфиге:

```php
'allowed_updates' => ['message', 'callback_query'],
```

#### Опции команды hybridgram:polling

| Опция | Короткая | Описание |
|-------|----------|----------|
| `--log-updates` | `-L`     | Выводить краткую строку по каждому полученному апдейту |
| `--full` | `-F`     | Выводить полный JSON апдейта (подразумевает `--log-updates`) |
| `--hot-reload` | `-R`     | Автоперезапуск при изменении кода (для разработки) |
| `--watch=` | `-W=`    | Пути для отслеживания через запятую (по умолчанию: app,routes,config,src) |
| `--watch-interval=1` | `-I`     | Интервал проверки файлов в секундах (режим hot-reload) |

Примеры с короткими алиасами:

```bash
php artisan hybridgram:polling main -L
php artisan hybridgram:polling main -F
php artisan hybridgram:polling main -R -W=app,routes -I 2
```

## Параметры Polling

### polling_limit

Максимальное количество обновлений за один запрос (1-100):

```php
'polling_limit' => 100, // Максимум
```

Больше обновлений = меньше запросов, но больше задержка.

### polling_timeout

Таймаут запроса в секундах (0 = короткий polling):

```php
'polling_timeout' => 0, // Короткий polling
```

Для длинного polling (long polling):

```php
'polling_timeout' => 60, // Длинный polling (до 60 секунд)
```

Длинный polling уменьшает количество запросов, но увеличивает задержку ответа на команды.

## Hot-reload в разработке

Hot-reload автоматически перезапускает команду при изменении файлов:

```bash
php artisan hybridgram:polling main --hot-reload --watch=app,routes
```

Это позволяет:
- Не перезапускать команду вручную
- Быстро видеть изменения в коде
- Удобно разрабатывать локально

## Запуск через Supervisor (production)

Для постоянной работы в production:

```ini
[program:telegram-polling]
command=php /path/to/artisan hybridgram:polling main
directory=/path/to/project
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
redirect_stderr=true
stdout_logfile=/path/to/storage/logs/polling.log
```

## Ограничения

### allowed_updates

Ограничьте типы обновлений для уменьшения нагрузки:

```php
'allowed_updates' => [
    'message',
    'callback_query',
    // Только нужные типы
],
```

### Один процесс на бота

Не запускайте несколько процессов polling для одного бота одновременно — это может привести к дублированию обновлений.

## Отладка

### Логирование

Чтобы видеть в консоли получаемые апдейты, используйте опции `-l` (краткая строка по каждому апдейту) или `-f` (полный JSON):

```bash
php artisan hybridgram:polling main -L
php artisan hybridgram:polling main -F
```

Пример вывода с `-L`:

```
Processing update 12345...
Processing update 12346...
```

### Проверка статуса

Проверьте, что polling работает:

```bash
ps aux | grep "hybridgram:polling"
```

## Переход с Polling на Webhook

Когда будете готовы к production:

1. Настройте вебхук:
   ```bash
   php artisan hybridgram:set-webhook main
   ```

2. Остановите polling:
   ```bash
   # Найти и остановить процесс
   pkill -f "hybridgram:polling"
   ```

3. Удалите вебхук (если нужно вернуться к polling):
   ```bash
   php artisan hybridgram:delete-webhook main
   ```

## Рекомендации

### Для разработки

- ✅ Используйте hot-reload
- ✅ Ограничьте `allowed_updates` только нужными типами
- ✅ Используйте `polling_limit = 10-20` для быстрой реакции

### Для production

- ❌ Не рекомендуется использовать polling в production
- ✅ Используйте webhook вместо polling
- ✅ Если необходимо, используйте длинный polling с таймаутом

## Когда использовать Polling

Используйте polling когда:
- Разрабатываете бота локально
- Тестируете функциональность
- Нет возможности настроить HTTPS
- Низкая нагрузка и нет критичных задержек

Не используйте polling когда:
- Production окружение
- Высокая нагрузка
- Критичны задержки получения обновлений
- Нужна максимальная производительность

## Что дальше?

- **[Webhook](/ru/modes/webhook/)** — рекомендуемый режим для production
- **[Отправка сообщений](/ru/sending/telegram-bot-api/)** — работа с TelegramBotApi
