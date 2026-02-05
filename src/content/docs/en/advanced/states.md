---
title: States
description: Managing chat and user states for creating conversations
---

States allow you to manage conversations with users. The package supports two types of states: **chat state** and **user state**.

## State Concept

A state is a named state with optional data stored in cache. It allows you to:
- Create multi-step conversations
- Filter routes by current state
- Save context between messages

### State Types

- **Chat state** — common for all users in a chat
- **User state** — individual for each user

## Working with StateManager

### Getting State

```php
use HybridGram\Core\State\StateManagerInterface;

$stateManager = app(StateManagerInterface::class);
$chat = $data->getChat();

// Get chat state
$chatState = $stateManager->getChatState($chat);
if ($chatState) {
    $stateName = $chatState->getName();
    $stateData = $chatState->getData();
}

// Get user state
$user = $data->getUser();
if ($user) {
    $userState = $stateManager->getUserState($chat, $user);
}
```

### Setting State

```php
// Set chat state
$stateManager->setChatState(
    chat: $chat,
    state: 'awaiting_name',
    ttl: 3600, // Lifetime in seconds (optional, default 24 hours)
    data: ['step' => 1] // Additional data (optional)
);

// Set user state
$stateManager->setUserState(
    chat: $chat,
    user: $user,
    state: 'filling_profile',
    ttl: 7200,
    data: ['name' => 'John', 'age' => null]
);
```

### Clearing State

```php
// Clear chat state
$stateManager->clearChatState($chat);

// Clear user state
$stateManager->clearUserState($chat, $user);
```

### Checking State

```php
// Check specific state
if ($stateManager->isChatInState($chat, 'awaiting_input')) {
    // ...
}

if ($stateManager->isUserInState($chat, $user, 'filling_form')) {
    // ...
}

// Check any of states
if ($stateManager->isChatInAnyState($chat, ['awaiting_name', 'awaiting_email'])) {
    // ...
}
```

## Using in Routes

### Filtering Routes by State

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // This route triggers only if chat is in 'awaiting_name' state
}, '*', function(TextMessageData $data) {
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $chat = $data->getChat();
    
    return $stateManager->isChatInState($chat, 'awaiting_name');
});
```

Or using route method:

```php
TelegramRouter::forBot('main')
    ->onMessage(function(TextMessageData $data) {
        // Processing
    })
    ->fromChatState('awaiting_name'); // Route triggers only from this state
```

### Setting State via Route

```php
TelegramRouter::onCommand('/start', function(CommandData $data) {
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $stateManager->setChatState($data->getChat(), 'main_menu');
    
    // Send response
});
```

Or via middleware:

```php
use HybridGram\Http\Middlewares\SetStateTelegramRouteMiddleware;

TelegramRouter::onCommand('/start', function(CommandData $data) {
    // ...
})
->middleware(new SetStateTelegramRouteMiddleware('main_menu'));
```

## Usage Examples

### Multi-step Form

```php
// Step 1: Start
TelegramRouter::onCommand('/register', function(CommandData $data) {
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    
    $stateManager->setChatState($data->getChat(), 'awaiting_name');
    
    $telegram->sendMessage(
        $data->getChat()->id,
        'Enter your name:'
    );
});

// Step 2: Getting name
TelegramRouter::forBot('main')
    ->onTextMessage(function(TextMessageData $data) {
        $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
        $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
        $chat = $data->getChat();
        
        $name = $data->message;
        
        // Save name in state data
        $stateManager->setChatState(
            chat: $chat,
            state: 'awaiting_email',
            data: ['name' => $name]
        );
        
        $telegram->sendMessage($chat->id, 'Enter your email:');
    })
    ->fromChatState('awaiting_name');

// Step 3: Getting email
TelegramRouter::forBot('main')
    ->onTextMessage(function(TextMessageData $data) {
        $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
        $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
        $chat = $data->getChat();
        
        $currentState = $stateManager->getChatState($chat);
        $name = $currentState?->getData()['name'] ?? 'Unknown';
        $email = $data->message;
        
        // Save user
        // ... your save logic
        
        // Clear state
        $stateManager->clearChatState($chat);
        
        $telegram->sendMessage(
            $chat->id,
            "Thank you, {$name}! Your email: {$email}"
        );
    })
    ->fromChatState('awaiting_email');
```

### Canceling Process

```php
TelegramRouter::onCommand('/cancel', function(CommandData $data) {
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $chat = $data->getChat();
    
    // Clear all states
    $stateManager->clearChatState($chat);
    if ($user = $data->getUser()) {
        $stateManager->clearUserState($chat, $user);
    }
    
    $telegram->sendMessage($chat->id, 'Operation cancelled');
});
```

### Working with State Data

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $chat = $data->getChat();
    
    $currentState = $stateManager->getChatState($chat);
    
    if ($currentState) {
        $stateData = $currentState->getData() ?? [];
        $step = ($stateData['step'] ?? 0) + 1;
        
        // Update state with new data
        $stateManager->setChatState(
            chat: $chat,
            state: $currentState->getName(),
            data: array_merge($stateData, ['step' => $step])
        );
    }
})
->fromChatState('filling_form');
```

## Excluding States

You can create a route that works only if chat is **NOT** in a specific state:

```php
TelegramRouter::forBot('main')
    ->onCommand('/help', function(CommandData $data) {
        // Show help
    })
    ->exceptChatState('processing'); // Don't show during processing
```

## User States

For individual processing of each user, use user states:

```php
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $chat = $data->getChat();
    $user = $data->getUser();
    
    // Set state for specific user
    $stateManager->setUserState(
        chat: $chat,
        user: $user,
        state: 'selecting_item',
        data: ['item_id' => $data->params[0]]
    );
});
```

## State Lifetime

By default, states are stored for 24 hours. You can change this:

```php
$stateManager->setChatState(
    chat: $chat,
    state: 'temporary_state',
    ttl: 300 // 5 minutes
);
```

## What's Next?

- **[Middleware](/en/advanced/middleware/)** — using middleware for state management
- **[Sending Messages](/en/sending/telegram-bot-api/)** — sending responses to users
