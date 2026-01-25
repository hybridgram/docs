---
title: Callback Query
description: Handling inline button presses in Telegram bot
---

Callback Query is an update that comes when a user presses an inline button (button under a message). This is the primary way to create interactive interfaces in Telegram bots.

## Basic Usage

### Simple Callback Query

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\CallbackQueryData;

TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $action = $data->action; // Button's callback_data text
    $chatId = $data->callbackQuery->message->chat->id;
    
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    
    // Answer callback (required!)
    $telegram->answerCallbackQuery($data->callbackQuery->id);
    
    // Send response
    $telegram->sendMessage($chatId, "You selected: {$action}");
});
```

### Important: Answering Callback

You **must** answer the callback query, otherwise the user will see a loading spinner. Use the `answerCallbackQuery` method:

```php
$telegram->answerCallbackQuery(
    $data->callbackQuery->id,
    text: 'Processing...', // Optional: text to show user
    showAlert: false // true to show alert instead of notification
);
```

## Callback Data Structure

Callback data can be a simple string or structured. The package supports the format `action:param1:param2`:

```php
// Button with callback_data: "menu:products:electronics"
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $action = $data->action; // "menu"
    $params = $data->params; // ['products', 'electronics']
    
    // Processing
});
```

## Patterns and Filtering

### Wildcard Patterns

```php
// Handle all callbacks with action "menu"
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // ...
}, '*', 'menu:*');

// Handle callback "menu:products:*"
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $category = $data->params[0] ?? null; // "products"
    // ...
}, '*', 'menu:products:*');
```

### Filtering by Query Parameters

You can filter callback queries by presence or value of parameters:

```php
// Only if "category" parameter equals "electronics"
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // ...
}, '*', '*', ['category' => 'electronics']);

// Only if "category" parameter exists (any value)
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // ...
}, '*', '*', ['category' => null]);
```

### Custom Check via Closure

```php
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // ...
}, '*', function(CallbackQueryData $data) {
    $action = $data->action;
    $params = $data->params;
    
    // Complex validation logic
    return $action === 'menu' && count($params) > 0;
});
```

## Accessing Data

The `CallbackQueryData` object provides:

```php
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // Action (main part of callback_data before first :)
    $action = $data->action;
    
    // Parameters (parts after action, separated by :)
    $params = $data->params; // ['param1', 'param2']
    
    // Full CallbackQuery object
    $callbackQuery = $data->callbackQuery;
    
    // Callback query ID (needed for response)
    $queryId = $callbackQuery->id;
    
    // Original message
    $message = $callbackQuery->message;
    
    // User who pressed the button
    $user = $callbackQuery->from;
    
    // Full callback_data (without parsing)
    $dataString = $callbackQuery->data;
});
```

## Updating Message with Buttons

Often after button press you need to update the message:

```php
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $message = $data->callbackQuery->message;
    
    // Answer callback
    $telegram->answerCallbackQuery($data->callbackQuery->id, text: 'Updating...');
    
    // Update message
    $newKeyboard = new \Phptg\BotApi\Type\InlineKeyboardMarkup([
        [['text' => 'New Button', 'callback_data' => 'new_action']],
    ]);
    
    $telegram->editMessageText(
        chatId: $message->chat->id,
        messageId: $message->messageId,
        text: 'Message updated!',
        replyMarkup: $newKeyboard
    );
});
```

## Usage Examples

### Menu with Navigation

```php
// Creating menu
TelegramRouter::onCommand('/menu', function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    
    $keyboard = new \Phptg\BotApi\Type\InlineKeyboardMarkup([
        [
            ['text' => '📦 Products', 'callback_data' => 'menu:products'],
            ['text' => '🛒 Cart', 'callback_data' => 'menu:cart'],
        ],
        [
            ['text' => '⚙️ Settings', 'callback_data' => 'menu:settings'],
            ['text' => '❓ Help', 'callback_data' => 'menu:help'],
        ],
    ]);
    
    $telegram->sendMessage(
        $data->getChat()->id,
        'Choose a section:',
        replyMarkup: $keyboard
    );
});

// Handling menu item selection
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->answerCallbackQuery($data->callbackQuery->id);
    
    $action = $data->action;
    $menu = $data->params[0] ?? null;
    
    match($menu) {
        'products' => $this->showProducts($data),
        'cart' => $this->showCart($data),
        'settings' => $this->showSettings($data),
        'help' => $this->showHelp($data),
        default => null,
    };
}, '*', 'menu:*');
```

### Pagination

```php
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->answerCallbackQuery($data->callbackQuery->id);
    
    $action = $data->action; // "page"
    $page = (int) ($data->params[0] ?? 1);
    
    $items = $this->getItems($page);
    
    $keyboard = new \Phptg\BotApi\Type\InlineKeyboardMarkup([
        [
            ['text' => '◀️ Back', 'callback_data' => "page:" . ($page - 1)],
            ['text' => 'Forward ▶️', 'callback_data' => "page:" . ($page + 1)],
        ],
    ]);
    
    $telegram->editMessageText(
        chatId: $data->callbackQuery->message->chat->id,
        messageId: $data->callbackQuery->message->messageId,
        text: $this->formatItems($items),
        replyMarkup: $keyboard
    );
}, '*', 'page:*');
```

### Action Confirmation

```php
TelegramRouter::onCommand('/delete', function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    
    $keyboard = new \Phptg\BotApi\Type\InlineKeyboardMarkup([
        [
            ['text' => '✅ Yes, delete', 'callback_data' => 'confirm:delete:yes'],
            ['text' => '❌ Cancel', 'callback_data' => 'confirm:delete:no'],
        ],
    ]);
    
    $telegram->sendMessage(
        $data->getChat()->id,
        'Are you sure you want to delete?',
        replyMarkup: $keyboard
    );
});

TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    
    [$action, $type, $answer] = [$data->action, $data->params[0], $data->params[1]];
    
    if ($action === 'confirm' && $type === 'delete') {
        $telegram->answerCallbackQuery($data->callbackQuery->id);
        
        if ($answer === 'yes') {
            // Perform deletion
            $telegram->sendMessage(
                $data->callbackQuery->message->chat->id,
                'Deleted!'
            );
        } else {
            $telegram->sendMessage(
                $data->callbackQuery->message->chat->id,
                'Cancelled'
            );
        }
        
        // Delete message with buttons
        $telegram->deleteMessage(
            $data->callbackQuery->message->chat->id,
            $data->callbackQuery->message->messageId
        );
    }
}, '*', 'confirm:*');
```

## What's Next?

- **[Middleware](/en/advanced/middleware/)** — using middleware for callback queries
- **[States](/en/advanced/states/)** — managing states through callbacks
