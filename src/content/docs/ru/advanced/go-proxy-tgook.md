---
title: Go proxy tgook
description: Асинхронный приём Telegram webhook'ов через высокопроизводительный Go‑прокси
---

`tgook` — это отдельный Go‑сервис (см. каталог `go-proxy`), который принимает webhook‑запросы от Telegram и **асинхронно** передаёт их в Laravel через Redis очередь.  
PHP‑приложение больше не обрабатывает запросы Telegram в рамках HTTP‑запроса — оно только забирает задачи из очереди, что даёт высокий запас по производительности.

## Как это работает

Поток выглядит так:

1. Telegram отправляет запрос на `tgook`:
   - `POST /telegram/bot/webhook/{bot_id}`
2. `tgook`:
   - проверяет `X-Telegram-Bot-Api-Secret-Token` (если включён секретный токен),
   - сериализует обновление в формат очереди Laravel (`App\Jobs\ProcessTelegramUpdateJob`),
   - кладёт задачу в Redis очередь (по умолчанию `telegram_updates`) и обновляет ключи Horizon.
3. Laravel воркеры (`queue:work` или Horizon) асинхронно выполняют `ProcessTelegramUpdateJob` и уже внутри него вызывается `HybridGram`.

В результате:

- HTTP‑ответ Telegram от Go приходит мгновенно,
- Laravel обрабатывает обновления параллельно в фоне,
- фронтовой PHP‑сервер (Nginx/Apache + PHP‑FPM) не нагружается прямыми запросами от Telegram.

## Требования

- Redis сервер (тот же, который использует Laravel очередь);
- Laravel очередь на Redis:
  - `QUEUE_CONNECTION=redis`,
  - запущены воркеры `php artisan queue:work` **или** Horizon;
- настроенный job `App\Jobs\ProcessTelegramUpdateJob` (идёт в составе пакета).

## Настройка tgook

В каталоге с бинарником `tgook` (см. `bin/tgook` или соберите из `go-proxy`) создайте `.env`:

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=null

# Тот же секрет, что и в Laravel / при установке вебхука
SECRET_TOKEN=${TELEGRAM_SECRET_TOKEN}

# Порт, на котором слушает tgook
LISTEN_PORT=9070

# Префиксы для Redis / Horizon
REDIS_PREFIX=laravel_database:
HORIZON_PREFIX=laravel_horizon:
APP_NAME=Laravel

# Имя очереди для обновлений (должно совпадать с Laravel)
TELEGRAM_UPDATES_QUEUE_NAME=telegram_updates
```

Ключевые моменты:

- `SECRET_TOKEN` должен совпадать с тем, который вы задаёте при установке вебхука в Telegram (`TELEGRAM_SECRET_TOKEN`);
- `TELEGRAM_UPDATES_QUEUE_NAME` должен совпадать с именем очереди, из которой читают ваши воркеры.

## Запуск tgook

### Локальный запуск

```bash
./tgook           # или ./go-proxy, если вы запускаете собранный бинарь из каталога go-proxy
```

Можно явно указать путь к `.env`:

```bash
./tgook /path/to/.env
```

### Как systemd‑сервис (Linux)

Краткий пример unit‑файла:

```ini
[Unit]
Description=Go Proxy for Telegram Webhooks (tgook)
After=network.target redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/hybridgram/go-proxy
ExecStart=/var/www/hybridgram/bin/tgook
Restart=always
RestartSec=5
EnvironmentFile=/var/www/hybridgram/go-proxy/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable tgook
sudo systemctl start tgook
```

## Подключение к HybridGram (Webhook + tgook)

`tgook` работает в связке с режимом **Webhook**:

1. В Laravel‑приложении включите webhook‑режим, как описано в разделе **Webhook**:

   ```php
   'bots' => [
       [
           'token' => env('BOT_TOKEN'),
           'bot_id' => 'main',
           'update_mode' => UpdateModeEnum::WEBHOOK,
           'webhook_url' => env('TELEGRAM_WEBHOOK_URL'),
           'secret_token' => env('TELEGRAM_SECRET_TOKEN'),
           'routes_file' => base_path('routes/telegram.php'),
       ],
   ],
   ```

2. Для `TELEGRAM_WEBHOOK_URL` укажите адрес Go‑прокси:

   ```env
   TELEGRAM_WEBHOOK_URL=https://your-tgook-host.com/telegram/bot/webhook/main
   TELEGRAM_SECRET_TOKEN=сложный_секрет
   ```

3. Установите вебхук через команду или код:

   ```bash
   php artisan hybridgram:set-webhook main
   ```

   Теперь Telegram будет отправлять обновления **на tgook**, а Laravel будет получать их уже из Redis очереди.

## Когда имеет смысл использовать tgook

- **Высокая нагрузка** — десятки/сотни запросов в секунду от Telegram;
- **Жёсткие требования по latency** — нужно быстро отдавать 200 OK в Telegram;
- **Отделение приёма и обработки** — приём обновлений и их обработка выполняются разными серверами/сервисами;
- **Горизонтальное масштабирование** — можно масштабировать воркеры Laravel независимо от входного HTTP‑трафика.

Если у вас небольшой бот и обычный webhook на PHP справляется с нагрузкой, `tgook` не обязателен. Но при росте нагрузки он позволяет получить “запас по прочности” почти бесплатно.

