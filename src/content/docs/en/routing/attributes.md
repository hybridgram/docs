---
title: Routing with PHP Attributes
description: Define routes using PHP 8 attributes as an alternative to facade-based routing
---

PHP Attributes provide a clean, decorator-based alternative to defining routes using the `TelegramRouter` facade. This approach keeps route definitions close to their handler methods, improving code organization and readability.

## Overview

Instead of registering routes through the facade:

```php
TelegramRouter::onCommand('/start', function(CommandData $data) {
    // Handle /start command
});
```

You can define routes using attributes directly on controller methods:

```php
#[OnCommand('/start')]
public function handleStart(CommandData $data) {
    // Handle /start command
}
```

## Getting Started

### Basic Usage

Create a controller class and decorate methods with routing attributes:

```php
<?php

namespace App\Telegram\Handlers;

use HybridGram\Core\Routing\Attributes\OnCommand;
use HybridGram\Core\Routing\Attributes\OnTextMessage;
use HybridGram\Core\Routing\RouteData\CommandData;
use HybridGram\Core\Routing\RouteData\TextMessageData;

class BotHandler
{
    #[OnCommand('/start')]
    public function handleStart(CommandData $data): void
    {
        $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
        $telegram->sendMessage($data->getChat()->id, 'Welcome!');
    }

    #[OnTextMessage]
    public function handleMessage(TextMessageData $data): void
    {
        // Handle all text messages
    }
}
```

### Registration

Routes defined with attributes are automatically discovered and registered during application bootstrap. The framework scans your application's classes and registers any routes defined with routing attributes.

To enable attribute-based routing, ensure the `AttributeRouteRegistrar` is called in your application's service provider or bootstrap file.

## Available Attributes

### Message Handling

#### OnTextMessage
Handle text messages:

```php
#[OnTextMessage]
public function handleMessage(TextMessageData $data): void {
    // Handle all text messages
}

#[OnTextMessage(pattern: 'hello')]
public function handleGreeting(TextMessageData $data): void {
    // Handle messages containing 'hello'
}
```

#### OnCommand
Handle Telegram commands:

```php
#[OnCommand('/start')]
public function handleStart(CommandData $data): void {
    // Handle /start command
}

#[OnCommand('/user:*')]
public function handleUserCommand(CommandData $data): void {
    // Handle /user:* with parameters
}
```

#### OnCallbackQuery
Handle inline button presses:

```php
#[OnCallbackQuery(pattern: 'menu:*')]
public function handleMenuCallback(CallbackQueryData $data): void {
    // Handle callback queries like 'menu:home'
}
```

### Media Handling

Handle various media types:

```php
#[OnPhoto]
public function handlePhoto(PhotoData $data): void {}

#[OnDocument]
public function handleDocument(DocumentData $data): void {}

#[OnAudio]
public function handleAudio(AudioData $data): void {}

#[OnVideo]
public function handleVideo(VideoData $data): void {}

#[OnVoice]
public function handleVoice(VoiceData $data): void {}

#[OnLocation]
public function handleLocation(LocationData $data): void {}

#[OnContact]
public function handleContact(ContactData $data): void {}
```

### Chat Member Events

```php
#[OnChatMember]
public function handleChatMember(ChatMemberUpdatedData $data): void {}

#[OnMyChatMember]
public function handleBotChatMember(ChatMemberUpdatedData $data): void {}
```

### Other Events

```php
#[OnPoll]
public function handlePoll(PollData $data): void {}

#[OnInlineQuery]
public function handleInlineQuery(InlineQueryData $data): void {}

#[OnAny]
public function handleAny(UpdateData $data): void {}

#[OnFallback]
public function handleFallback(FallbackData $data): void {}
```

## Filtering & Conditions

### Chat Types

Limit routes to specific chat types:

```php
use HybridGram\Core\Routing\Attributes\ChatTypes;
use HybridGram\Core\Routing\ChatType;

#[OnCommand('/admin')]
#[ChatTypes([ChatType::PRIVATE, ChatType::GROUP])]
public function handleAdminCommand(CommandData $data): void {
    // Only works in private chats and groups
}
```

### Bot Selection

Target specific bots:

```php
use HybridGram\Core\Routing\Attributes\ForBot;

#[OnCommand('/start')]
#[ForBot('main')]
public function handleStart(CommandData $data): void {
    // Only for 'main' bot
}
```

### Middleware

Apply middleware to routes:

```php
use HybridGram\Core\Routing\Attributes\TgMiddlewares;
use App\Telegram\Middleware\AuthMiddleware;

#[OnCommand('/admin')]
#[TgMiddlewares([AuthMiddleware::class])]
public function handleAdmin(CommandData $data): void {
    // AuthMiddleware runs before this handler
}
```

### State-Based Routing

Route based on user state:

```php
use HybridGram\Core\Routing\Attributes\FromUserState;
use HybridGram\Core\Routing\Attributes\ToUserState;

#[OnTextMessage]
#[FromUserState('waiting_name')]
#[ToUserState('name_received')]
public function handleNameInput(TextMessageData $data): void {
    // Only processes if user is in 'waiting_name' state
    // Transitions to 'name_received' state after execution
}
```

### Chat State

Route based on chat state:

```php
use HybridGram\Core\Routing\Attributes\FromChatState;
use HybridGram\Core\Routing\Attributes\ToChatState;

#[OnTextMessage]
#[FromChatState('setup_mode')]
public function handleSetup(TextMessageData $data): void {
    // Only when chat is in 'setup_mode'
}
```

## Combining Attributes

You can combine multiple attributes on a single method:

```php
#[OnTextMessage(pattern: 'price:*')]
#[ForBot('main')]
#[ChatTypes([ChatType::PRIVATE])]
#[FromUserState('shopping')]
public function handlePriceQuery(TextMessageData $data): void {
    // This handler only triggers when ALL conditions are met:
    // - Message text contains pattern 'price:*'
    // - Bot is 'main'
    // - Chat is private
    // - User is in 'shopping' state
}
```

## Best Practices

### Organization

Group related handlers in dedicated controller classes:

```php
<?php

namespace App\Telegram\Handlers;

class CommandHandler
{
    #[OnCommand('/start')]
    public function handleStart(CommandData $data): void {}

    #[OnCommand('/help')]
    public function handleHelp(CommandData $data): void {}
}

class MessageHandler
{
    #[OnTextMessage]
    public function handleMessage(TextMessageData $data): void {}
}
```

### Discoverable Paths

Ensure your handler classes are in discoverable locations. By default, the framework scans:
- `app/Telegram/`
- `app/Handlers/`

Configure additional paths in your configuration as needed.

### Type Safety

Always type-hint the data parameter:

```php
// ✅ Good - type hints prevent bugs
#[OnCommand('/start')]
public function handleStart(CommandData $data): void {}

// ❌ Avoid - loses type safety
#[OnCommand('/start')]
public function handleStart($data): void {}
```

## Comparison with Facade-Based Routing

### Facade-Based (Traditional)

```php
// routes/telegram.php

TelegramRouter::onCommand('/start', function(CommandData $data) {
    // ...
});

TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // ...
});
```

### Attribute-Based (Modern)

```php
// app/Telegram/BotHandler.php

class BotHandler
{
    #[OnCommand('/start')]
    public function handleStart(CommandData $data): void {
        // ...
    }

    #[OnTextMessage]
    public function handleMessage(TextMessageData $data): void {
        // ...
    }
}
```

Both approaches work equally well. Choose based on your project's preference:
- **Attributes**: Better for large projects with many handlers
- **Facade**: Better for small projects or when all routes are in one place

## Advanced Topics

### Custom Attributes

You can create custom attributes that extend `TelegramRouteAttribute`:

```php
use HybridGram\Core\Routing\Attributes\TelegramRouteAttribute;
use HybridGram\Core\Routing\TelegramRouteBuilder;

#[Attribute(Attribute::TARGET_METHOD)]
final class OnVIP implements TelegramRouteAttribute
{
    public function registerRoute(TelegramRouteBuilder $builder, \Closure|string|array $action): void
    {
        // Custom registration logic
        $builder->onTextMessage($action)
                ->middleware(VIPCheckMiddleware::class);
    }
}
```

### Attribute Caching

In production, attribute routes are cached for better performance. Run:

```bash
php artisan config:cache
```

To clear the cache during development, use:

```bash
php artisan config:clear
```

## See Also

- **[Basic Routing](/en/basics/routing/)** — Overview of routing concepts
- **[Middleware](/en/advanced/middleware/)** — Using middleware with routes
- **[States](/en/advanced/states/)** — Managing user and chat states
