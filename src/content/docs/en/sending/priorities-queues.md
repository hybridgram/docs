---
title: Priorities & Queues
description: Configuring queues and priorities for sending messages
---

The package supports asynchronous message sending through Laravel queues with a priority system, ensuring fast processing of responses to incoming updates.

## Operation Modes

### Sync Mode (default)

In sync mode, all requests are sent synchronously:

```env
TELEGRAM_QUEUE_ENABLED=false
```

Requests execute immediately but without rate limiting. Suitable for development and small projects.

### Queue Mode

In queue mode, requests are placed in queues:

```env
TELEGRAM_QUEUE_ENABLED=true
```

To run queues, you need to start workers:

```bash
# Process all queues
php artisan queue:work --queue=telegram-high,telegram-low

# Or separately by priority
php artisan queue:work --queue=telegram-high
php artisan queue:work --queue=telegram-low
```

## Priorities

The package uses two priority levels:

### HIGH (default)

- Responses to incoming updates
- Critical messages
- All requests have this priority by default

```php
use HybridGram\Telegram\Priority;

// Explicit specification (not required, this is default)
$telegram->withPriority(Priority::HIGH)
    ->sendMessage($chatId, 'Fast response');
```

### LOW

- Broadcasts
- Background tasks
- Non-critical messages

```php
$telegram->withPriority(Priority::LOW)
    ->sendMessage($chatId, 'Broadcast');
```

## Configuration

In `config/hybridgram.php`:

```php
'sending' => [
    'queue_enabled' => env('TELEGRAM_QUEUE_ENABLED', false),
    
    // Rate limit per minute per bot (default 1800 ≈ 30/sec)
    'rate_limit_per_minute' => env('TELEGRAM_RATE_LIMIT_PER_MINUTE', 1800),
    
    // Reserved slots for HIGH priority
    'reserve_high_per_minute' => env('TELEGRAM_RESERVE_HIGH_PER_MINUTE', 300),
    
    // Queue names
    'queues' => [
        'high' => env('TELEGRAM_QUEUE_HIGH', 'telegram-high'),
        'low' => env('TELEGRAM_QUEUE_LOW', 'telegram-low'),
    ],
],
```

### HIGH Priority Reserve

The `reserve_high_per_minute` parameter guarantees that a certain number of slots are always available for HIGH priority. LOW priority cannot use these slots.

**Example:**
- `rate_limit_per_minute = 1800`
- `reserve_high_per_minute = 300`

This means:
- Up to 1800 requests per minute
- At least 300 slots always available for HIGH
- LOW can use up to 1500 slots per minute

## Usage

### In Route Handlers

In route handlers, HIGH priority is used automatically:

```php
TelegramRouter::onCommand('/start', function(CommandData $data) {
    $telegram = app(TelegramBotApi::class);
    
    // Automatically HIGH priority
    $telegram->sendMessage($data->getChat()->id, 'Hello!');
});
```

### For Broadcasts

Explicitly specify LOW priority for broadcasts:

```php
// Broadcast to all users
$users = User::all();

foreach ($users as $user) {
    $telegram->withPriority(Priority::LOW)
        ->sendMessage($user->telegram_id, 'News!');
}
```

### Mixed Usage

```php
use HybridGram\Core\Routing\RouteData\TextMessageData;

TelegramRouter::onTextMessage(function(TextMessageData $data) {
    $telegram = app(TelegramBotApi::class);
    
    // High-priority response
    $telegram->sendMessage(
        $data->getChat()->id,
        'Your message received!'
    );
    
    // Low-priority task (e.g., logging)
    $telegram->withPriority(Priority::LOW)
        ->sendMessage(
            config('telegram.admin_chat_id'),
            "New message from {$data->getUser()->id}"
        );
});
```

## Running Workers

### Basic Run

```bash
php artisan queue:work --queue=telegram-high,telegram-low
```

### With Settings

```bash
php artisan queue:work \
    --queue=telegram-high,telegram-low \
    --tries=3 \
    --timeout=60 \
    --max-jobs=1000 \
    --max-time=3600
```

### Using Supervisor (recommended)

Create configuration `/etc/supervisor/conf.d/telegram-worker.conf`:

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

Then:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start telegram-worker:*
```

## Rate Limiting in Queue Mode

In queue mode, rate limiting is applied on workers:

1. Job enters queue
2. Worker takes job from queue
3. Rate limit is checked
4. If limit exceeded, job is returned to queue (`release()`)
5. Worker is not blocked by `sleep()`, can process other jobs

This ensures:
- Non-blocking processing
- Efficient resource usage
- Compliance with Telegram limits

## Queue Monitoring

### Checking Queue Sizes

```php
use Illuminate\Support\Facades\Queue;

$highQueueSize = Queue::size('telegram-high');
$lowQueueSize = Queue::size('telegram-low');
```

### Monitoring via Laravel Horizon

If using Laravel Horizon:

```bash
php artisan horizon
```

The web interface will show `telegram-high` and `telegram-low` queues.

## Important Notes

1. **InputFile with resource** not supported in queue mode. Use file paths or base64.

2. **Service methods** (getUpdates, setWebhook, getMe) always execute synchronously.

3. **Default priority**: HIGH is automatically used in route handlers.

4. **Fallback**: If queue is not configured, requests execute synchronously.

## What's Next?

- **[Rate Limiting](/en/sending/rate-limiting/)** — rate limiting details
- **[Operation Modes](/en/modes/webhook/)** — configuring webhook and polling
