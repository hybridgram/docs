---
title: Routing
description: Basics of creating routes for handling Telegram updates
---

Routing in TGbot Laravel allows you to define handlers for various types of Telegram updates. The API is very similar to standard Laravel routing, making it intuitive.

## Basic Concepts

### TelegramRouter Facade

All routes are registered through the `TelegramRouter` facade:

```php
use HybridGram\Facades\TelegramRouter;

TelegramRouter::onCommand('/start', function(CommandData $data) {
    // Handle /start command
});
```

### Handler Structure

Route handlers receive a data object (e.g., `CommandData`, `MessageData`) that contains:
- `$data->update` — full Update object from Telegram
- `$data->botId` — ID of the bot for which the route was triggered
- `$data->getChat()` — Chat object
- `$data->getUser()` — User object
- Additional properties depending on the data type

## Route Types

### Commands

Handling commands starting with `/`:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\CommandData;

// Simple command
TelegramRouter::onCommand('/start', function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->sendMessage($data->getChat()->id, 'Hello!');
});

// Command with parameters
TelegramRouter::onCommand('/help', function(CommandData $data) {
    // $data->commandParams contains array of arguments after the command
    $params = $data->commandParams;
    // ...
});

// Command for specific bot
TelegramRouter::forBot('main')->onCommand('/start', function(CommandData $data) {
    // ...
});
```

### Messages

Handling text messages:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\TextMessageData;

// All messages
TelegramRouter::onMessage(function(TextMessageData $data) {
    $message = $data->message;
    // ...
});

// Messages by pattern
TelegramRouter::onMessage(function(TextMessageData $data) {
    // ...
}, '*', 'hello'); // Pattern to check text

// Custom check via closure
TelegramRouter::onMessage(function(TextMessageData $data) {
    // ...
}, '*', function(TextMessageData $data) {
    return str_contains($data->message, 'hello');
});
```

### Callback Query

Handling inline button presses:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\CallbackQueryData;

// All callback queries
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $callbackQuery = $data->callbackQuery;
    $action = $data->action;
    $params = $data->params;
    // ...
});

// Callback query by pattern (e.g., action="menu:home")
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // ...
}, '*', 'menu:*');

// With query parameter check
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // ...
}, '*', '*', ['category' => 'products']); // only if category=products exists
```

## Working with Multiple Bots

If you have multiple bots, you can specify a specific bot:

```php
// For specific bot
TelegramRouter::forBot('main')->onCommand('/start', function(CommandData $data) {
    // ...
});

// For all bots (default)
TelegramRouter::onCommand('/start', function(CommandData $data) {
    // ...
});
```

## Filtering by Chat Type

Routes can be limited to specific chat types (private, groups, supergroups, channels).

### Single Chat Type

Use the `chatType()` method to specify a single chat type:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\ChatType;

// Route only for private chats (default for most types)
TelegramRouter::forBot('main')
    ->chatType(ChatType::PRIVATE)
    ->onCommand('/start', function(CommandData $data) {
        // Handle only in private chats
    });

// Route only for groups
TelegramRouter::forBot('main')
    ->chatType(ChatType::GROUP)
    ->onTextMessage(function(\HybridGram\Core\Routing\RouteData\TextMessageData $data) {
        // Handle only in groups
    });
```

### Multiple Chat Types

Use the `chatTypes()` method to specify multiple chat types:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\ChatType;

// Route works in private chats and groups
TelegramRouter::forBot('main')
    ->chatTypes([ChatType::PRIVATE, ChatType::GROUP])
    ->onCommand('/help', function(CommandData $data) {
        // Handle in private chats and groups
    });

// Route works in all chat types
TelegramRouter::forBot('main')
    ->chatTypes(null) // or don't specify for group events
    ->onMyChatMember(function(ChatMemberUpdatedData $data) {
        // Handle in all chat types
    });
```

### Smart Defaults

The system automatically sets reasonable defaults depending on route type:

**Routes that work in all chat types by default:**
- `onMyChatMember()` — bot status changes
- `onChatMember()` — member status changes
- `onNewChatTitle()` — chat title changes
- `onNewChatPhoto()` — chat photo changes
- `onDeleteChatPhoto()` — chat photo deletion
- `onPinnedMessage()` — message pinning
- `onForumTopicEvent()` — forum topic events
- `onGeneralForumTopicEvent()` — general topic events
- `onMessageAutoDeleteTimerChanged()` — auto-delete timer changes
- `onBoostAdded()` — boost added

**Other routes work only in private chats by default:**
- `onCommand()` — commands
- `onMessage()` — messages
- `onCallbackQuery()` — callback queries
- And others...

```php
// Works in all chat types (default for MY_CHAT_MEMBER)
TelegramRouter::onMyChatMember(function(ChatMemberUpdatedData $data) {
    // Handle bot added to group/channel
});

// Works only in private chats (default for COMMAND)
TelegramRouter::onCommand('/start', function(CommandData $data) {
    // Handle command
});

// Explicitly specify multiple types for command
TelegramRouter::forBot('main')
    ->chatTypes([ChatType::PRIVATE, ChatType::GROUP])
    ->onCommand('/admin', function(CommandData $data) {
        // Command works in private chats and groups
    });
```

### Chat Types

Available chat types:

```php
use HybridGram\Core\Routing\ChatType;

ChatType::PRIVATE      // Private chats
ChatType::GROUP        // Groups
ChatType::SUPERGROUP   // Supergroups
ChatType::CHANNEL      // Channels
```

## Route Grouping

You can group routes with common attributes, including chat type:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\ChatType;

TelegramRouter::group([
    'for_bot' => 'main',
    'chat_type' => ChatType::GROUP, // Single type
    'middlewares' => [AuthTelegramRouteMiddleware::class],
], function($router) {
    $router->onCommand('/admin', function(CommandData $data) {
        // ...
    });
});

// Or multiple types
TelegramRouter::group([
    'for_bot' => 'main',
    'chat_type' => [ChatType::PRIVATE, ChatType::GROUP], // Array of types
], function($router) {
    $router->onMessage(function(MessageData $data) {
        // ...
    });
});
```

## Patterns and Filtering

### String Patterns

Many route types support string patterns using `*`:

```php
// Command with parameters
TelegramRouter::onCommand('/user:*', function(CommandData $data) {
    $userId = $data->commandParams[0] ?? null;
    // ...
});

// Callback query
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // $data->action will contain "menu:products"
    // $data->params will contain ['category' => 'electronics']
}, '*', 'menu:*', ['category' => null]); // category must be present
```

### Closure Patterns

For more complex logic, use closures:

```php
TelegramRouter::onMessage(function(MessageData $data) {
    // ...
}, '*', function(MessageData $data) {
    // Return true if route should trigger
    return $data->message->text !== null 
        && strlen($data->message->text) > 100;
});
```

## Additional Route Types

The package supports many other update types:

- `onPhoto` — photos
- `onDocument` — documents
- `onLocation` — geolocation
- `onContact` — contacts
- `onPoll` — polls
- `onInlineQuery` — inline queries
- `onAny` — any updates
- And much more

See the corresponding sections for details on each type.

## Fallback Routes

A route that triggers when no suitable handler is found:

```php
TelegramRouter::onFallback(function(FallbackData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->sendMessage($data->getChat()->id, 'Command not recognized');
});
```

In development mode (`app()->isLocal()`) fallback automatically sends state information for debugging.

## What's Next?

- **[Handling Commands](/en/basics/commands/)** — detailed work with commands
- **[Handling Messages](/en/basics/messages/)** — working with text messages
- **[Callback Query](/en/basics/callback-query/)** — handling button presses
