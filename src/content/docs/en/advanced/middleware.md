---
title: Middleware
description: Using middleware in Telegram routes
---

Middleware allows you to execute code before or after processing an update. This is useful for authorization, logging, state checking, and other tasks.

## Basic Concepts

### Middleware Interface

All middleware must implement the `TelegramRouteMiddlewareInterface` interface:

```php
use HybridGram\Core\Middleware\TelegramRouteMiddlewareInterface;
use Phptg\BotApi\Type\Update\Update;

class MyMiddleware implements TelegramRouteMiddlewareInterface
{
    public function handle(Update $update, callable $next): mixed
    {
        // Code before processing
        
        $result = $next($update);
        
        // Code after processing
        
        return $result;
    }
}
```

## Built-in Middleware

### AuthTelegramRouteMiddleware

Automatically authorizes users through Telegram Guard:

```php
use HybridGram\Http\Middlewares\AuthTelegramRouteMiddleware;

TelegramRouter::forBot('main')
    ->onCommand('/profile', function(CommandData $data) {
        // User is already authorized
        $user = Auth::user();
    })
    ->middleware(AuthTelegramRouteMiddleware::class);
```

### SetStateTelegramRouteMiddleware

Sets state after handler execution:

```php
use HybridGram\Http\Middlewares\SetStateTelegramRouteMiddleware;

TelegramRouter::onCommand('/start', function(CommandData $data) {
    // ...
})
->middleware(new SetStateTelegramRouteMiddleware(
    newState: 'main_menu',
    useUserState: false, // Use chat state (default)
    ttl: 3600, // Lifetime in seconds (optional)
    data: ['step' => 1] // Additional data (optional)
));
```

### CheckStateTelegramRouteMiddleware

Checks if chat/user is in a specific state:

```php
use HybridGram\Http\Middlewares\CheckStateTelegramRouteMiddleware;

TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // This route triggers only if chat is in 'awaiting_input' state
})
->middleware(new CheckStateTelegramRouteMiddleware(
    requiredStates: ['awaiting_input'],
    useUserState: false, // Check chat state
    exceptMode: false // false = only if IN state, true = only if NOT in state
));
```

Example with state exclusion:

```php
// Route triggers only if NOT in 'processing' or 'awaiting' states
TelegramRouter::onCommand('/cancel', function(CommandData $data) {
    // ...
})
->middleware(new CheckStateTelegramRouteMiddleware(
    requiredStates: ['processing', 'awaiting'],
    exceptMode: true // Exclusion mode
));
```

### RateLimitTelegramRouteMiddleware

Limits request frequency from user:

```php
use HybridGram\Http\Middlewares\RateLimitTelegramRouteMiddleware;

TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // ...
})
->middleware(new RateLimitTelegramRouteMiddleware(
    maxAttempts: 10,
    decayMinutes: 1
));
```

### SetLocaleTelegramRouteMiddleware

Automatically sets Laravel locale based on Telegram user language:

```php
use HybridGram\Http\Middlewares\SetLocaleTelegramRouteMiddleware;

TelegramRouter::forBot('main')
    ->onCommand('/start', function(CommandData $data) {
        // Locale is already set based on user language
        return __('welcome_message');
    })
    ->middleware(new SetLocaleTelegramRouteMiddleware(
        supportedLocales: ['en', 'ru', 'uk', 'pt'],
        fallbackLocale: 'en'
    ));
```

#### Custom Locale Resolution

You can provide custom logic for determining the locale using the `userLocale` parameter:

**Using a Closure:**

```php
use HybridGram\Http\Middlewares\SetLocaleTelegramRouteMiddleware;
use Phptg\BotApi\Type\Update\Update;

// Determine locale from user database settings
TelegramRouter::forBot('main')
    ->onCommand('/start', function(CommandData $data) {
        return __('welcome_message');
    })
    ->middleware(new SetLocaleTelegramRouteMiddleware(
        supportedLocales: ['en', 'ru', 'uk', 'pt'],
        fallbackLocale: 'en',
        userLocale: function(Update $update): ?string {
            $user = UpdateHelper::getUserFromUpdate($update);
            if (!$user) {
                return null;
            }

            // Fetch locale from your database
            $userModel = User::where('telegram_id', $user->id)->first();
            return $userModel?->preferred_locale;
        }
    ));
```

**Using a static string:**

```php
// Force a specific locale for all users in this route
TelegramRouter::onCommand('/en_only', function(CommandData $data) {
    // Always in English
})
->middleware(new SetLocaleTelegramRouteMiddleware(
    userLocale: 'en'
));
```

## Using Middleware

### For Single Route

```php
TelegramRouter::onCommand('/admin', function(CommandData $data) {
    // ...
})
->middleware(AuthTelegramRouteMiddleware::class);
```

### Multiple Middleware

```php
TelegramRouter::onCommand('/admin', function(CommandData $data) {
    // ...
})
->middleware([
    AuthTelegramRouteMiddleware::class,
    new RateLimitTelegramRouteMiddleware(maxAttempts: 5, decayMinutes: 1),
]);
```

### In Route Groups

```php
TelegramRouter::group([
    'botId' => 'main',
    'middlewares' => [
        AuthTelegramRouteMiddleware::class,
        LoggingTelegramRouteMiddleware::class,
    ],
], function($router) {
    $router->onCommand('/admin', function(CommandData $data) {
        // Both middleware will be applied
    });
    
    $router->onCommand('/settings', function(CommandData $data) {
        // Both middleware will be applied
    });
});
```

## Creating Custom Middleware

### Example: Admin Permission Check

```php
<?php

namespace App\Telegram\Middleware;

use HybridGram\Core\Middleware\TelegramRouteMiddlewareInterface;
use HybridGram\Core\UpdateHelper;
use Phptg\BotApi\Type\Update\Update;

class AdminMiddleware implements TelegramRouteMiddlewareInterface
{
    public function handle(Update $update, callable $next): mixed
    {
        $user = UpdateHelper::getUserFromUpdate($update);
        
        if (!$user || !$this->isAdmin($user->id)) {
            $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
            $chat = UpdateHelper::getChatFromUpdate($update);
            
            if ($chat) {
                $telegram->sendMessage(
                    $chat->id,
                    '❌ You do not have permission to execute this command'
                );
            }
            
            return null; // Stop execution
        }
        
        return $next($update);
    }
    
    private function isAdmin(int $userId): bool
    {
        // Your validation logic
        return in_array($userId, config('telegram.admins', []));
    }
}
```

Usage:

```php
use App\Telegram\Middleware\AdminMiddleware;

TelegramRouter::onCommand('/admin', function(CommandData $data) {
    // Access only for admins
})
->middleware(AdminMiddleware::class);
```

## Global Middleware

You can register global middleware in `TelegramServiceProvider`:

```php
// In boot() method of your ServiceProvider
public function boot(): void
{
    $middlewareManager = app(\HybridGram\Core\Middleware\MiddlewareManager::class);
    
    $middlewareManager->addGlobalMiddleware(
        LoggingTelegramRouteMiddleware::class
    );
}
```

Global middleware applies to all routes.

## Execution Order

Middleware executes in the following order:

1. Global middleware (in registration order)
2. Route group middleware
3. Specific route middleware

Each middleware can:
- Continue execution (`return $next($update)`)
- Stop execution (`return null`)
- Modify data (pass modified Update)

## What's Next?

- **[States](/en/advanced/states/)** — managing chat and user states
- **[Sending Messages](/en/sending/telegram-bot-api/)** — working with TelegramBotApi
