---
title: Роутинг
description: Основы создания роутов для обработки обновлений Telegram
---

Роутинг в TGbot Laravel позволяет определять обработчики для различных типов обновлений от Telegram. API очень похож на стандартный роутинг Laravel, что делает его интуитивно понятным.

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
use HybridGram\Core\Routing\RouteData\TextMessageData;

// Все сообщения
TelegramRouter::onMessage(function(TextMessageData $data) {
    $message = $data->message;
    // ...
});

// Сообщения по паттерну
TelegramRouter::onMessage(function(TextMessageData $data) {
    // ...
}, '*', 'привет'); // Паттерн для проверки текста

// Кастомная проверка через closure
TelegramRouter::onMessage(function(TextMessageData $data) {
    // ...
}, '*', function(TextMessageData $data) {
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

## Фильтрация по типу чата

Роуты могут быть ограничены определенными типами чатов (приватные, группы, супергруппы, каналы).

### Один тип чата

Используйте метод `chatType()` для указания одного типа чата:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\ChatType;

// Роут только для приватных чатов (дефолт для большинства типов)
TelegramRouter::forBot('main')
    ->chatType(ChatType::PRIVATE)
    ->onCommand('/start', function(CommandData $data) {
        // Обработка только в приватных чатах
    });

// Роут только для групп
TelegramRouter::forBot('main')
    ->chatType(ChatType::GROUP)
    ->onTextMessage(function(\HybridGram\Core\Routing\RouteData\TextMessageData $data) {
        // Обработка только в группах
    });
```

### Несколько типов чатов

Используйте метод `chatTypes()` для указания нескольких типов чатов:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\ChatType;

// Роут работает в приватных чатах и группах
TelegramRouter::forBot('main')
    ->chatTypes([ChatType::PRIVATE, ChatType::GROUP])
    ->onCommand('/help', function(CommandData $data) {
        // Обработка в приватных чатах и группах
    });

// Роут работает во всех типах чатов
TelegramRouter::forBot('main')
    ->chatTypes(null) // или не указывать для групповых событий
    ->onMyChatMember(function(ChatMemberUpdatedData $data) {
        // Обработка во всех типах чатов
    });
```

### Умные дефолты

Система автоматически устанавливает разумные дефолты в зависимости от типа роута:

**Роуты, которые по умолчанию работают во всех типах чатов:**
- `onMyChatMember()` — изменения статуса бота
- `onChatMember()` — изменения статуса участников
- `onNewChatTitle()` — изменение названия чата
- `onNewChatPhoto()` — изменение фото чата
- `onDeleteChatPhoto()` — удаление фото чата
- `onPinnedMessage()` — закрепление сообщений
- `onForumTopicEvent()` — события топиков форума
- `onGeneralForumTopicEvent()` — события общего топика
- `onMessageAutoDeleteTimerChanged()` — изменение таймера автоудаления
- `onBoostAdded()` — добавление буста

**Остальные роуты по умолчанию работают только в приватных чатах:**
- `onCommand()` — команды
- `onMessage()` — сообщения
- `onCallbackQuery()` — callback query
- И другие...

```php
// Работает во всех типах чатов (дефолт для MY_CHAT_MEMBER)
TelegramRouter::onMyChatMember(function(ChatMemberUpdatedData $data) {
    // Обработка добавления бота в группу/канал
});

// Работает только в приватных чатах (дефолт для COMMAND)
TelegramRouter::onCommand('/start', function(CommandData $data) {
    // Обработка команды
});

// Явно указать несколько типов для команды
TelegramRouter::forBot('main')
    ->chatTypes([ChatType::PRIVATE, ChatType::GROUP])
    ->onCommand('/admin', function(CommandData $data) {
        // Команда работает в приватных чатах и группах
    });
```

### Типы чатов

Доступные типы чатов:

```php
use HybridGram\Core\Routing\ChatType;

ChatType::PRIVATE      // Приватные чаты
ChatType::GROUP        // Группы
ChatType::SUPERGROUP   // Супергруппы
ChatType::CHANNEL      // Каналы
```

## Группировка роутов

Вы можете группировать роуты с общими атрибутами, включая тип чата:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\ChatType;

TelegramRouter::group([
    'for_bot' => 'main',
    'chat_type' => ChatType::GROUP, // Один тип
    'middlewares' => [AuthTelegramRouteMiddleware::class],
], function($router) {
    $router->onCommand('/admin', function(CommandData $data) {
        // ...
    });
});

// Или несколько типов
TelegramRouter::group([
    'for_bot' => 'main',
    'chat_type' => [ChatType::PRIVATE, ChatType::GROUP], // Массив типов
], function($router) {
    $router->onMessage(function(MessageData $data) {
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

- **[Обработка команд](/ru/basics/commands/)** — детальная работа с командами
- **[Обработка сообщений](/ru/basics/messages/)** — работа с текстовыми сообщениями
- **[Callback Query](/ru/basics/callback-query/)** — обработка нажатий на кнопки
