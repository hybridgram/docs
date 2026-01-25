---
title: Rate Limiting
description: Managing request limits to Telegram API
---

Telegram Bot API has a limit of ~30 requests per second per bot. The package automatically manages these limits with a rate limiting system.

## How It Works

### In Sync Mode

In sync mode, rate limiting is **not applied**. All requests are sent immediately. This is suitable for development but may lead to 429 (Too Many Requests) errors in production.

### In Queue Mode

In queue mode, rate limiting is applied on workers:

1. Current limit for bot is checked
2. If slots available — request is sent
3. If limit reached — job is returned to queue
4. Worker is not blocked, processes other jobs

## Configuration

```php
'sending' => [
    // Rate limit per minute per bot
    'rate_limit_per_minute' => 1800, // ~30/sec
    
    // Reserve for HIGH priority
    'reserve_high_per_minute' => 300,
],
```

### Per Bot Limit

Rate limiting is counted **separately for each bot**. If you have multiple bots, each has its own limit.

### Sliding Window

A 60-second sliding window via cache is used. This means:
- Limit is checked over the last 60 seconds
- Old requests automatically exit the window
- More accurate limit compliance

## Priorities and Reservation

The system reserves slots for HIGH priority:

```php
'rate_limit_per_minute' => 1800,
'reserve_high_per_minute' => 300,
```

This means:
- **HIGH** can use all 1800 slots per minute
- **LOW** can use maximum 1500 slots (1800 - 300)
- At least 300 slots always available for HIGH

**Example scenario:**
- 1500 LOW requests in queue
- 400 HIGH requests arrive
- LOW will wait until HIGH are processed
- 300 HIGH slots are reserved and always available

## Configuring Limits

### For Single Bot

```env
TELEGRAM_RATE_LIMIT_PER_MINUTE=1800
TELEGRAM_RESERVE_HIGH_PER_MINUTE=300
```

### For Production

Recommended values:

```env
# Conservative approach (less risk of 429 errors)
TELEGRAM_RATE_LIMIT_PER_MINUTE=1500

# Aggressive approach (maximum utilization)
TELEGRAM_RATE_LIMIT_PER_MINUTE=1800
```

## Handling 429 Errors

If 429 error still occurs, the package logs it:

```php
// In logs will be:
// Telegram outgoing request failed
// error_code: 429
// description: Too Many Requests
```

In queue mode, job automatically returns to queue and will be processed later.

## Monitoring

### Logging

Enable error logging in config:

```php
'sending' => [
    'log_failures' => true,
    'log_response_body' => true, // Include response body in logs
],
```

### Checking via Cache

Rate limiter stores data in Laravel cache. You can check current load:

```php
use Illuminate\Support\Facades\Cache;

// Keys for checking (example)
$cacheKey = "telegram_rate_limit_{$botId}";
$data = Cache::get($cacheKey);
```

## Configuration for Different Scenarios

### High Load (broadcasts)

```php
// Increase limit if confident
'rate_limit_per_minute' => 1800,
'reserve_high_per_minute' => 500, // More reserve for responses
```

### Low Load

```php
// Conservative values
'rate_limit_per_minute' => 1200,
'reserve_high_per_minute' => 200,
```

### Multiple Bots

Each bot has separate limit, but consider overall server load.

## Debugging

### Enable Detailed Logging

```php
'sending' => [
    'log_failures' => true,
    'log_response_body' => true,
],
```

### Checking Queue Sizes

```php
use Illuminate\Support\Facades\Queue;

$highSize = Queue::size('telegram-high');
$lowSize = Queue::size('telegram-low');

logger()->info('Queue sizes', [
    'high' => $highSize,
    'low' => $lowSize,
]);
```

## Recommendations

1. **Use queue mode in production** for limit compliance

2. **Set up monitoring** for queue sizes and 429 errors

3. **Use LOW priority** for broadcasts

4. **Reserve enough slots** for HIGH priority (incoming responses)

5. **Test limits** before production deploy

## What's Next?

- **[Priorities & Queues](/en/sending/priorities-queues/)** — configuring queues
- **[Operation Modes](/en/modes/webhook/)** — configuring webhook and polling
