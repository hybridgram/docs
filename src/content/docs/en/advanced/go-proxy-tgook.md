---
title: Go proxy tgook
description: Async Telegram webhook handling through high-performance Go proxy
---

`tgook` is a separate Go service (see `go-proxy` directory) that accepts webhook requests from Telegram and **asynchronously** passes them to Laravel through a Redis queue.  
The PHP application no longer handles Telegram requests within HTTP request lifecycle — it only processes tasks from the queue, providing high performance headroom.

## How It Works

The flow looks like this:

1. Telegram sends request to `tgook`:
   - `POST /telegram/bot/webhook/{bot_id}`
2. `tgook`:
   - validates `X-Telegram-Bot-Api-Secret-Token` (if secret token is enabled),
   - serializes update into Laravel queue format (`App\Jobs\ProcessTelegramUpdateJob`),
   - puts task into Redis queue (default `telegram_updates`) and updates Horizon keys.
3. Laravel workers (`queue:work` or Horizon) asynchronously execute `ProcessTelegramUpdateJob` and inside it calls `HybridGram`.

Result:

- HTTP response to Telegram from Go arrives instantly,
- Laravel processes updates in parallel in background,
- Frontend PHP server (Nginx/Apache + PHP-FPM) is not loaded with direct Telegram requests.

## Requirements

- Redis server (same one that Laravel queue uses);
- Laravel queue on Redis:
  - `QUEUE_CONNECTION=redis`,
  - workers running `php artisan queue:work` **or** Horizon;
- configured job `App\Jobs\ProcessTelegramUpdateJob` (included with package).

## Configuring tgook

In directory with `tgook` binary (see `bin/tgook` or build from `go-proxy`) create `.env`:

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=null

# Same secret as in Laravel / when setting webhook
SECRET_TOKEN=${TELEGRAM_SECRET_TOKEN}

# Port that tgook listens on
LISTEN_PORT=9070

# Prefixes for Redis / Horizon
REDIS_PREFIX=laravel_database:
HORIZON_PREFIX=laravel_horizon:
APP_NAME=Laravel

# Queue name for updates (must match Laravel)
TELEGRAM_UPDATES_QUEUE_NAME=telegram_updates
```

Key points:

- `SECRET_TOKEN` must match what you set when installing webhook in Telegram (`TELEGRAM_SECRET_TOKEN`);
- `TELEGRAM_UPDATES_QUEUE_NAME` must match queue name that your workers read from.

## Running tgook

### Local Run

```bash
./tgook           # or ./go-proxy if running built binary from go-proxy directory
```

You can explicitly specify path to `.env`:

```bash
./tgook /path/to/.env
```

### As systemd Service (Linux)

Brief example unit file:

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

## Connecting to HybridGram (Webhook + tgook)

`tgook` works in conjunction with **Webhook** mode:

1. In Laravel application enable webhook mode as described in **Webhook** section:

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

2. For `TELEGRAM_WEBHOOK_URL` specify Go proxy address:

   ```env
   TELEGRAM_WEBHOOK_URL=https://your-tgook-host.com/telegram/bot/webhook/main
   TELEGRAM_SECRET_TOKEN=complex_secret
   ```

3. Set webhook via command or code:

   ```bash
   php artisan hybridgram:set-webhook main
   ```

   Now Telegram will send updates **to tgook**, and Laravel will receive them from Redis queue.

## When to Use tgook

- **High load** — tens/hundreds of requests per second from Telegram;
- **Strict latency requirements** — need to quickly return 200 OK to Telegram;
- **Separation of receiving and processing** — receiving updates and processing done by different servers/services;
- **Horizontal scaling** — can scale Laravel workers independently of incoming HTTP traffic.

If you have a small bot and regular PHP webhook handles the load, `tgook` is optional. But as load grows, it provides "reliability margin" almost for free.
