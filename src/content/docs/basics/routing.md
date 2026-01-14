---
title: Роутинг
description: Основы создания роутов для обработки обновлений Telegram
---

Роутинг в Laravel Async Telegram позволяет определять обработчики для различных типов обновлений от Telegram. API очень похож на стандартный роутинг Laravel, что делает его интуитивно понятным.

## Базовые концепции

### Фасад TelegramRouter

Все роуты регистрируются через фасад `TelegramRouter`:

```php
use HybridGram\Facades\TelegramRouter;

TelegramRouter::onCommand('/start', function(CommandData $data) {
    // Обработка команды /start
});
```

### Структура обработчика

Обработчик роута получает объект данных (например, `CommandData`, `MessageData`), который содержит:
- `$data->update` — полный объект Update от Telegram
- `$data->botId` — ID бота, для которого сработал роут
- `$data->getChat()` — объект Chat
- `$data->getUser()` — объект User
- Дополнительные свойства в зависимости от типа данных

## Типы роутов

### Команды (Commands)

Обработка команд, начинающихся с `/`:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\CommandData;

// Простая команда
TelegramRouter::onCommand('/start', function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->sendMessage($data->getChat()->id, 'Привет!');
});

// Команда с параметрами
TelegramRouter::onCommand('/help', function(CommandData $data) {
    // $data->commandParams содержит массив аргументов после команды
    $params = $data->commandParams;
    // ...
});

// Команда для конкретного бота
TelegramRouter::forBot('main')->onCommand('/start', function(CommandData $data) {
    // ...
});
```

### Сообщения (Messages)

Обработка текстовых сообщений:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\MessageData;

// Все сообщения
TelegramRouter::onMessage(function(MessageData $data) {
    $message = $data->message;
    // ...
});

// Сообщения по паттерну
TelegramRouter::onMessage(function(MessageData $data) {
    // ...
}, '*', 'привет'); // Паттерн для проверки текста

// Кастомная проверка через closure
TelegramRouter::onMessage(function(MessageData $data) {
    // ...
}, '*', function(MessageData $data) {
    return str_contains($data->message, 'hello');
});
```

### Callback Query

Обработка нажатий на inline кнопки:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\CallbackQueryData;

// Все callback query
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $callbackQuery = $data->callbackQuery;
    $action = $data->action;
    $params = $data->params;
    // ...
});

// Callback query по паттерну (например, action="menu:home")
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // ...
}, '*', 'menu:*');

// С проверкой query параметров
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // ...
}, '*', '*', ['category' => 'products']); // только если есть category=products
```

## Работа с несколькими ботами

Если у вас несколько ботов, вы можете указать конкретный бот:

```php
// Для конкретного бота
TelegramRouter::forBot('main')->onCommand('/start', function(CommandData $data) {
    // ...
});

// Для всех ботов (по умолчанию)
TelegramRouter::onCommand('/start', function(CommandData $data) {
    // ...
});
```

## Группировка роутов

Вы можете группировать роуты с общими атрибутами:

```php
use HybridGram\Facades\TelegramRouter;

TelegramRouter::group([
    'botId' => 'main',
    'middlewares' => [AuthTelegramRouteMiddleware::class],
], function($router) {
    $router->onCommand('/admin', function(CommandData $data) {
        // ...
    });
    
    $router->onCommand('/settings', function(CommandData $data) {
        // ...
    });
});
```

## Паттерны и фильтрация

### Строковые паттерны

Многие типы роутов поддерживают строковые паттерны с использованием `*`:

```php
// Команда с параметрами
TelegramRouter::onCommand('/user:*', function(CommandData $data) {
    $userId = $data->commandParams[0] ?? null;
    // ...
});

// Callback query
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // $data->action будет содержать "menu:products"
    // $data->params будет содержать ['category' => 'electronics']
}, '*', 'menu:*', ['category' => null]); // category должен быть присутствовать
```

### Closure паттерны

Для более сложной логики используйте closures:

```php
TelegramRouter::onMessage(function(MessageData $data) {
    // ...
}, '*', function(MessageData $data) {
    // Возвращайте true, если роут должен сработать
    return $data->message->text !== null 
        && strlen($data->message->text) > 100;
});
```

## Дополнительные типы роутов

Пакет поддерживает множество других типов обновлений:

- `onPhoto` — фотографии
- `onDocument` — документы
- `onLocation` — геолокация
- `onContact` — контакты
- `onPoll` — опросы
- `onInlineQuery` — inline запросы
- `onAny` — любые обновления
- И многое другое

Подробнее о каждом типе смотрите в соответствующих разделах.

## Fallback роуты

Роут, который срабатывает, если не найден подходящий обработчик:

```php
TelegramRouter::onFallback(function(FallbackData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->sendMessage($data->getChat()->id, 'Команда не распознана');
});
```

В режиме разработки (`app()->isLocal()`) fallback автоматически отправляет информацию о состоянии для отладки.

## Что дальше?

- **[Обработка команд](/basics/commands/)** — детальная работа с командами
- **[Обработка сообщений](/basics/messages/)** — работа с текстовыми сообщениями
- **[Callback Query](/basics/callback-query/)** — обработка нажатий на кнопки
