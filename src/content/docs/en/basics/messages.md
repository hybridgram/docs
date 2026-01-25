---
title: Handling Messages
description: Working with text messages from users
---

Handling text messages is one of the core functions of a Telegram bot. The package provides flexible capabilities for working with messages.

## Basic Usage

### All Messages

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\TextMessageData;

TelegramRouter::onMessage(function(TextMessageData $data) {
    $message = $data->message; // Message text
    $chatId = $data->getChat()->id;
    
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->sendMessage($chatId, "You wrote: {$message}");
});
```

### Messages by Pattern

Check message text by string pattern:

```php
// Exact match
TelegramRouter::onMessage(function(MessageData $data) {
    // ...
}, '*', 'hello');

// With wildcard (Laravel Str::is)
TelegramRouter::onMessage(function(MessageData $data) {
    // Triggers for: "hello", "hello everyone", "say hello"
}, '*', 'hello*');
```

### Custom Check via Closure

For complex logic, use closures:

```php
TelegramRouter::onMessage(function(MessageData $data) {
    // Processing
}, '*', function(MessageData $data) {
    // Return true if route should trigger
    $text = $data->message;
    
    // Check length
    if (strlen($text) < 10) {
        return false;
    }
    
    // Check for keywords
    $keywords = ['order', 'delivery', 'payment'];
    return str_contains($text, $keywords);
});
```

## Accessing Message Data

The `MessageData` object contains:

```php
TelegramRouter::onMessage(function(MessageData $data) {
    // Message text
    $message = $data->message;
    
    // Full Update object
    $update = $data->update;
    
    // Message object from Telegram API
    $messageObject = $update->message;
    
    // Chat and User
    $chat = $data->getChat();
    $user = $data->getUser();
    
    // Additional info from message
    $messageId = $messageObject->messageId;
    $date = $messageObject->date;
    $entities = $messageObject->entities; // Text formatting
});
```

## Working with Formatting

Telegram supports various formatting types in messages:

```php
TelegramRouter::onMessage(function(MessageData $data) {
    $message = $data->update->message;
    
    // Check for formatting
    if ($message->entities !== null) {
        foreach ($message->entities as $entity) {
            if ($entity->type === 'bold') {
                // Handle bold text
            }
            if ($entity->type === 'code') {
                // Handle code
            }
        }
    }
});
```

## Messages in State Context

Messages are often processed depending on current state:

```php
TelegramRouter::onMessage(function(MessageData $data) {
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $chat = $data->getChat();
    
    $currentState = $stateManager->getChatState($chat);
    
    if ($currentState?->getName() === 'awaiting_name') {
        // User is entering name
        $name = $data->message;
        // Save name and proceed to next step
    }
}, '*', function(MessageData $data) {
    // Check if in "awaiting name" state
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $chat = $data->getChat();
    $state = $stateManager->getChatState($chat);
    
    return $state?->getName() === 'awaiting_name';
});
```

## Filtering by Chat Types

You can filter messages by chat type:

```php
TelegramRouter::forBot('main')
    ->onMessage(function(MessageData $data) {
        // Private chats only
    })
    ->whereChatType('private');
```

## Usage Examples

### Echo Bot

```php
TelegramRouter::onMessage(function(MessageData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->sendMessage(
        $data->getChat()->id,
        "You wrote: {$data->message}"
    );
});
```

### Keyword Search

```php
TelegramRouter::onMessage(function(MessageData $data) {
    $text = strtolower($data->message);
    $chatId = $data->getChat()->id;
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    
    if (str_contains($text, 'weather')) {
        $telegram->sendMessage($chatId, 'Fetching weather forecast...');
        // ...
    } elseif (str_contains($text, 'rate')) {
        $telegram->sendMessage($chatId, 'Fetching exchange rates...');
        // ...
    }
}, '*', function(MessageData $data) {
    $keywords = ['weather', 'rate', 'news'];
    $text = strtolower($data->message);
    return str_contains($text, $keywords);
});
```

### Handling Long Messages

```php
TelegramRouter::onMessage(function(MessageData $data) {
    $text = $data->message;
    
    // Split long message into parts
    if (strlen($text) > 4096) {
        $chunks = str_split($text, 4090);
        $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
        
        foreach ($chunks as $chunk) {
            $telegram->sendMessage($data->getChat()->id, $chunk);
        }
    }
}, '*', function(MessageData $data) {
    return strlen($data->message) > 4096;
});
```

## Handling Message Replies

For handling replies to messages, use the special route:

```php
use HybridGram\Core\Routing\RouteData\ReplyData;

TelegramRouter::onReply(function(ReplyData $data) {
    $originalMessage = $data->update->message->replyToMessage;
    $replyText = $data->update->message->text;
    
    // Process reply
});
```

## What's Next?

- **[Callback Query](/en/basics/callback-query/)** — handling inline button presses
- **[States](/en/advanced/states/)** — managing conversations
