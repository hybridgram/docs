---
title: Middleware
description: Использование middleware в Telegram роутах
---

Middleware позволяет выполнять код до или после обработки обновления. Это полезно для авторизации, логирования, проверки состояний и других задач.

## Базовые концепции

### Интерфейс Middleware

Все middleware должны реализовывать интерфейс `TelegramRouteMiddlewareInterface`:

```php
use HybridGram\Core\Middleware\TelegramRouteMiddlewareInterface;
use Phptg\BotApi\Type\Update\Update;

class MyMiddleware implements TelegramRouteMiddlewareInterface
{
    public function handle(Update $update, callable $next): mixed
    {
        // Код до обработки
        
        $result = $next($update);
        
        // Код после обработки
        
        return $result;
    }
}
```

## Встроенные Middleware

### AuthTelegramRouteMiddleware

Автоматически авторизует пользователя через Telegram Guard:

```php
use HybridGram\Http\Middlewares\AuthTelegramRouteMiddleware;

TelegramRouter::forBot('main')
    ->onCommand('/profile', function(CommandData $data) {
        // Пользователь уже авторизован
        $user = Auth::user();
    })
    ->middleware(AuthTelegramRouteMiddleware::class);
```

### SetStateTelegramRouteMiddleware

Устанавливает состояние после выполнения обработчика:

```php
use HybridGram\Http\Middlewares\SetStateTelegramRouteMiddleware;

TelegramRouter::onCommand('/start', function(CommandData $data) {
    // ...
})
->middleware(new SetStateTelegramRouteMiddleware(
    newState: 'main_menu',
    useUserState: false, // Использовать состояние чата (по умолчанию)
    ttl: 3600, // Время жизни в секундах (опционально)
    data: ['step' => 1] // Дополнительные данные (опционально)
));
```

### CheckStateTelegramRouteMiddleware

Проверяет, находится ли чат/пользователь в определенном состоянии:

```php
use HybridGram\Http\Middlewares\CheckStateTelegramRouteMiddleware;

TelegramRouter::onMessage(function(MessageData $data) {
    // Этот роут сработает только если чат в состоянии 'awaiting_input'
})
->middleware(new CheckStateTelegramRouteMiddleware(
    requiredStates: ['awaiting_input'],
    useUserState: false, // Проверять состояние чата
    exceptMode: false // false = только если В состоянии, true = только если НЕ в состоянии
));
```

Пример с исключением состояний:

```php
// Роут сработает только если НЕ в состояниях 'processing' или 'awaiting'
TelegramRouter::onCommand('/cancel', function(CommandData $data) {
    // ...
})
->middleware(new CheckStateTelegramRouteMiddleware(
    requiredStates: ['processing', 'awaiting'],
    exceptMode: true // Исключающий режим
));
```

### RateLimitTelegramRouteMiddleware

Ограничивает частоту запросов от пользователя:

```php
use HybridGram\Http\Middlewares\RateLimitTelegramRouteMiddleware;

TelegramRouter::onMessage(function(MessageData $data) {
    // ...
})
->middleware(new RateLimitTelegramRouteMiddleware(
    maxAttempts: 10,
    decayMinutes: 1
));
```

### LoggingTelegramRouteMiddleware

Логирует все обновления:

```php
use HybridGram\Http\Middlewares\LoggingTelegramRouteMiddleware;

TelegramRouter::onAny(function(AnyData $data) {
    // ...
})
->middleware(LoggingTelegramRouteMiddleware::class);
```

## Использование Middleware

### Для отдельного роута

```php
TelegramRouter::onCommand('/admin', function(CommandData $data) {
    // ...
})
->middleware(AuthTelegramRouteMiddleware::class);
```

### Несколько Middleware

```php
TelegramRouter::onCommand('/admin', function(CommandData $data) {
    // ...
})
->middleware([
    AuthTelegramRouteMiddleware::class,
    new RateLimitTelegramRouteMiddleware(maxAttempts: 5, decayMinutes: 1),
]);
```

### В группах роутов

```php
TelegramRouter::group([
    'botId' => 'main',
    'middlewares' => [
        AuthTelegramRouteMiddleware::class,
        LoggingTelegramRouteMiddleware::class,
    ],
], function($router) {
    $router->onCommand('/admin', function(CommandData $data) {
        // Оба middleware применятся
    });
    
    $router->onCommand('/settings', function(CommandData $data) {
        // Оба middleware применятся
    });
});
```

## Создание собственного Middleware

### Пример: Проверка прав администратора

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
                    '❌ У вас нет прав для выполнения этой команды'
                );
            }
            
            return null; // Прервать выполнение
        }
        
        return $next($update);
    }
    
    private function isAdmin(int $userId): bool
    {
        // Ваша логика проверки
        return in_array($userId, config('telegram.admins', []));
    }
}
```

Использование:

```php
use App\Telegram\Middleware\AdminMiddleware;

TelegramRouter::onCommand('/admin', function(CommandData $data) {
    // Доступ только для администраторов
})
->middleware(AdminMiddleware::class);
```

### Пример: Логирование с контекстом

```php
<?php

namespace App\Telegram\Middleware;

use HybridGram\Core\Middleware\TelegramRouteMiddlewareInterface;
use HybridGram\Core\UpdateHelper;
use Phptg\BotApi\Type\Update\Update;

class RequestLoggingMiddleware implements TelegramRouteMiddlewareInterface
{
    public function handle(Update $update, callable $next): mixed
    {
        $startTime = microtime(true);
        $user = UpdateHelper::getUserFromUpdate($update);
        $chat = UpdateHelper::getChatFromUpdate($update);
        
        logger()->info('Telegram update received', [
            'user_id' => $user?->id,
            'chat_id' => $chat?->id,
            'update_id' => $update->updateId,
        ]);
        
        try {
            $result = $next($update);
            
            $duration = microtime(true) - $startTime;
            logger()->info('Telegram update processed', [
                'duration_ms' => round($duration * 1000, 2),
                'success' => true,
            ]);
            
            return $result;
        } catch (\Throwable $e) {
            logger()->error('Telegram update failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            throw $e;
        }
    }
}
```

## Глобальные Middleware

Вы можете зарегистрировать глобальные middleware в `TelegramServiceProvider`:

```php
// В методе boot() вашего ServiceProvider
public function boot(): void
{
    $middlewareManager = app(\HybridGram\Core\Middleware\MiddlewareManager::class);
    
    $middlewareManager->addGlobalMiddleware(
        LoggingTelegramRouteMiddleware::class
    );
}
```

Глобальные middleware применяются ко всем роутам.

## Порядок выполнения

Middleware выполняются в следующем порядке:

1. Глобальные middleware (в порядке регистрации)
2. Middleware из группы роутов
3. Middleware конкретного роута

Каждый middleware может:
- Пропустить выполнение (`return $next($update)`)
- Прервать выполнение (`return null`)
- Изменить данные (передать модифицированный Update)

## Что дальше?

- **[Состояния](/advanced/states/)** — управление состояниями чата и пользователя
- **[Отправка сообщений](/sending/telegram-bot-api/)** — работа с TelegramBotApi
