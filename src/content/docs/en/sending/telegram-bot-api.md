---
title: TelegramBotApi
description: Sending messages via TelegramBotApi
---

`TelegramBotApi` is a wrapper around the Telegram Bot API with support for queues, priorities, and rate limiting.

## Getting an Instance

```php
use HybridGram\Telegram\TelegramBotApi;

// Get from container
$telegram = app(TelegramBotApi::class);

// For specific bot
$telegram = app(TelegramBotApi::class, ['botId' => 'main']);

// In route handler (automatically for current bot)
TelegramRouter::onCommand('/start', function(CommandData $data) {
    $telegram = app(TelegramBotApi::class); // Uses botId from context
});
```

## Basic Usage

### Sending a Message

```php
$telegram->sendMessage(
    chatId: $chatId,
    text: 'Hello! 👋'
);
```

### Sending with Parameters

```php
$telegram->sendMessage(
    chatId: $chatId,
    text: 'Your message',
    parseMode: 'HTML', // or 'MarkdownV2'
    disableNotification: false,
    protectContent: true
);
```

### Sending with Keyboard

```php
use Phptg\BotApi\Type\InlineKeyboardMarkup;
use Phptg\BotApi\Type\ReplyKeyboardMarkup;

// Inline keyboard
$inlineKeyboard = new InlineKeyboardMarkup([
    [
        ['text' => 'Button 1', 'callback_data' => 'btn1'],
        ['text' => 'Button 2', 'callback_data' => 'btn2'],
    ],
]);

$telegram->sendMessage(
    chatId: $chatId,
    text: 'Choose an action:',
    replyMarkup: $inlineKeyboard
);

// Reply keyboard
$replyKeyboard = new ReplyKeyboardMarkup([
    [['text' => 'Option 1'], ['text' => 'Option 2']],
    [['text' => 'Cancel']],
]);

$telegram->sendMessage(
    chatId: $chatId,
    text: 'Choose:',
    replyMarkup: $replyKeyboard
);
```

## Other Methods

### Editing a Message

```php
$telegram->editMessageText(
    chatId: $chatId,
    messageId: $messageId,
    text: 'Updated text',
    replyMarkup: $newKeyboard
);
```

### Deleting a Message

```php
$telegram->deleteMessage(
    chatId: $chatId,
    messageId: $messageId
);
```

### Sending a Photo

```php
$telegram->sendPhoto(
    chatId: $chatId,
    photo: 'https://example.com/image.jpg',
    caption: 'Photo description'
);
```

### Sending a Document

```php
$telegram->sendDocument(
    chatId: $chatId,
    document: '/path/to/file.pdf',
    caption: 'Document'
);
```

### Answering Callback Query

```php
$telegram->answerCallbackQuery(
    callbackQueryId: $callbackQueryId,
    text: 'Processing...', // Optional
    showAlert: false // true to show alert
);
```

## Direct API Method Usage

You can call any Telegram Bot API methods directly:

```php
use Phptg\BotApi\Method\SendMessage;
use Phptg\BotApi\Method\SendPhoto;

// Via call()
$telegram->call(new SendMessage($chatId, 'Text'));

// Methods are automatically routed through dispatcher
```

## Priorities

By default, all requests have `HIGH` priority. For broadcasts, use `LOW` priority:

```php
use HybridGram\Telegram\Priority;

$telegram->withPriority(Priority::LOW)
    ->sendMessage($chatId, 'Broadcast');
```

Priorities only work in queue mode. More details in [Priorities & Queues](/en/sending/priorities-queues/).

## Error Handling

```php
use HybridGram\Exceptions\Telegram\TelegramRequestError;

try {
    $telegram->sendMessage($chatId, 'Text');
} catch (TelegramRequestError $e) {
    logger()->error('Telegram API error', [
        'error_code' => $e->getErrorCode(),
        'description' => $e->getDescription(),
    ]);
}
```

## Usage Examples

### Simple Command Response

```php
TelegramRouter::onCommand('/start', function(CommandData $data) {
    $telegram = app(TelegramBotApi::class);
    $telegram->sendMessage($data->getChat()->id, 'Welcome!');
});
```

### Sending with Formatting

```php
$telegram->sendMessage(
    chatId: $chatId,
    text: '<b>Bold text</b> and <i>italic</i>',
    parseMode: 'HTML'
);
```

### Sending Multiple Messages

```php
$messages = ['Message 1', 'Message 2', 'Message 3'];

foreach ($messages as $text) {
    $telegram->sendMessage($chatId, $text);
}
```

### Conditional Sending

```php
if ($condition) {
    $telegram->sendMessage($chatId, 'Condition met');
} else {
    $telegram->sendMessage($chatId, 'Condition not met');
}
```

## What's Next?

- **[Priorities & Queues](/en/sending/priorities-queues/)** — configuring queues and priorities
- **[Rate Limiting](/en/sending/rate-limiting/)** — managing request limits
