---
title: Routing Reference
description: Complete list of all routing methods from the TelegramRouter facade
---

# Routing Reference

This section contains a complete list of all available routing methods from the `TelegramRouter` facade. Each method describes what parameters it accepts, which Telegram events it responds to, and what data is passed to the handler.

## Common Parameters

Most routing methods accept the following common parameters:

- **`$action`** (`array|string|\Closure`) — route handler. Can be:
  - Closure/function
  - String in format `'Controller@method'`
  - Array `[Controller::class, 'method']`
- **`$botId`** (`string`, default `'*'`) — ID of the bot for which the route is registered. `'*'` means all bots
- **`$pattern`** (`\Closure|string|null`) — pattern for filtering. Can be:
  - String with `*` support (wildcard)
  - Closure for custom validation
  - `null` or `'*'` to handle all events of this type

All handlers receive a data object that inherits from `AbstractRouteData` and contains:
- `$data->update` — full `Update` object from Telegram
- `$data->botId` — bot ID
- `$data->getChat()` — method to get `Chat` object
- `$data->getUser()` — method to get `User` object

## Commands and Messages

### `onCommand()`

Handles commands starting with `/`.

**Parameters:**
- `$action` — handler
- `$botId` (default `'*'`) — bot ID
- `$pattern` (default `null`) — command pattern (e.g., `'/start'`, `'/user:*'`)
- `$commandParamOptions` (`?\Closure`) — optional filter by command parameters

**Event:** `message.text` starts with `/`

**Data:** `CommandData`
- `$data->command` — command name (without `/`)
- `$data->commandParams` — array of arguments after command
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

**Example:**
```php
TelegramRouter::onCommand('/start', function(CommandData $data) {
    // Handle /start command
});

TelegramRouter::onCommand('/user:*', function(CommandData $data) {
    $userId = $data->commandParams[0] ?? null;
});
```

### `onMessage()`

Handles text messages.

**Parameters:**
- `$action` — handler
- `$botId` (default `'*'`) — bot ID
- `$pattern` (default `null`) — pattern for message text

**Event:** `message.text` present

**Data:** `MessageData`
- `$data->message` — message text
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

**Example:**
```php
TelegramRouter::onMessage(function(MessageData $data) {
    // Handle all messages
});

TelegramRouter::onMessage(function(MessageData $data) {
    // Handle messages with pattern
}, '*', 'hello*');
```

## Media Content

### `onPhoto()`

Handles sent photos.

**Parameters:**
- `$action` — handler
- `$botId` (default `'*'`) — bot ID
- `$pattern` (`callable|null`, default `null`) — pattern for caption

**Event:** `message.photo` present

**Data:** `PhotoData`
- `$data->photoSizes` — array of `PhotoSize` objects
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onDocument()`

Handles sent documents.

**Parameters:**
- `$action` — handler
- `$botId` (default `'*'`) — bot ID
- `$pattern` (default `null`) — pattern for caption
- `$documentOptions` (`?array<MimeType|string>`) — optional filter by MIME types

**Event:** `message.document` present

**Data:** `DocumentData`
- `$data->document` — `Document` object
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

**Example:**
```php
use HybridGram\Telegram\Document\MimeType;

TelegramRouter::onDocument(function(DocumentData $data) {
    // Handle all documents
}, '*', null, [MimeType::PDF, MimeType::JSON]);
```

### `onAudio()`

Handles audio files.

**Event:** `message.audio` present

**Data:** `AudioData`
- `$data->audio` — `Audio` object

### `onSticker()`

Handles stickers.

**Event:** `message.sticker` present

**Data:** `StickerData`
- `$data->sticker` — `Sticker` object

### `onVoice()`

Handles voice messages.

**Event:** `message.voice` present

**Data:** `VoiceData`
- `$data->voice` — `Voice` object

### `onVideoNote()`

Handles video messages (round videos).

**Event:** `message.videoNote` present

**Data:** `VideoNoteData`
- `$data->videoNote` — `VideoNote` object

## Geolocation and Contacts

### `onLocation()`

Handles geolocation sending.

**Event:** `message.location` present

**Data:** `LocationData`
- `$data->location` — `Location` object

### `onContact()`

Handles contact sending.

**Event:** `message.contact` present

**Data:** `ContactData`
- `$data->contact` — `Contact` object

## Polls

### `onPoll()`

Handles poll creation.

**Parameters:**
- `$action` — handler
- `$botId` (default `'*'`) — bot ID
- `$pattern` (`callable|null`, default `null`) — optional pattern
- `$isAnonymous` (`?bool`) — filter by poll anonymity
- `$pollType` (`?PollType`) — filter by poll type (`PollType::REGULAR` or `PollType::QUIZ`)

**Event:** `message.poll` present

**Data:** `PollData`
- `$data->poll` — `Poll` object

**Example:**
```php
use HybridGram\Telegram\Poll\PollType;

TelegramRouter::onPoll(function(PollData $data) {
    // Handle only quizzes
}, '*', null, false, PollType::QUIZ);
```

## Callback Query and Inline Query

### `onCallbackQuery()`

Handles inline button presses.

**Parameters:**
- `$action` — handler
- `$botId` (default `'*'`) — bot ID
- `$pattern` (default `'*'`) — pattern for action (e.g., `'menu:*'`)
- `$queryParams` (`?array<string, string|null>|array<int, QueryParamInterface>`) — optional query parameter filters

**Event:** `callbackQuery` present

**Data:** `CallbackQueryData`
- `$data->action` — action string from callback data
- `$data->params` — parameter array from callback data
- `$data->query` — `CallbackQuery` object
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onInlineQuery()`

Handles inline queries.

**Event:** `inlineQuery` present

**Data:** `InlineQueryData`
- `$data->inlineQuery` — `InlineQuery` object

## Chat Events

### `onNewChatMembers()`

Handles adding new members to chat.

**Data:** `NewChatMembersData`
- `$data->newChatMembers` — array of new members

### `onLeftChatMember()`

Handles member leaving chat.

**Data:** `LeftChatMemberData`
- `$data->leftChatMember` — left member object

### `onMyChatMember()`

Handles bot status changes in chat.

**Event:** `myChatMember` present

**Data:** `ChatMemberUpdatedData`
- `$data->chatMemberUpdated` — `ChatMemberUpdated` object

**Note:** Works in all chat types by default (PRIVATE, GROUP, SUPERGROUP, CHANNEL).

### `onChatMember()`

Handles chat member status changes.

**Event:** `chatMember` present

**Data:** `ChatMemberUpdatedData`

## Universal Routes

### `onAny()`

Handles any updates.

**Data:** `AnyData`
- `$data->update`
- `$data->botId`

### `onFallback()`

Handles updates for which no suitable route was found.

**Data:** `FallbackData`

## Helper Methods

### `forBot()`

Returns route builder for specific bot.

```php
TelegramRouter::forBot('main')
    ->onCommand('/start', function(CommandData $data) {
        // Route only for 'main' bot
    });
```

### `group()`

Groups routes with common attributes.

**Attributes:**
- `for_bot` (`string`) — bot ID
- `chat_type` (`ChatType|ChatType[]|null`) — chat type or array of types
- `middlewares` (`array`) — array of middleware classes
- `from_state` (`array`) — array of states from which transition should occur
- `to_state` (`string`) — state to transition to

```php
TelegramRouter::group([
    'for_bot' => 'main',
    'chat_type' => ChatType::GROUP,
    'middlewares' => [AuthTelegramRouteMiddleware::class],
], function($router) {
    $router->onCommand('/admin', function(CommandData $data) {
        // Route with group's common attributes
    });
});
```

### `chatType()` and `chatTypes()`

Set chat types for route.

```php
// Single type
TelegramRouter::forBot('main')
    ->chatType(ChatType::PRIVATE)
    ->onCommand('/start', function(CommandData $data) {
        // ...
    });

// Multiple types
TelegramRouter::forBot('main')
    ->chatTypes([ChatType::PRIVATE, ChatType::GROUP])
    ->onCommand('/help', function(CommandData $data) {
        // ...
    });
```

## Data Types for Filtering

### ChatType

Enum for filtering routes by chat type:

```php
use HybridGram\Core\Routing\ChatType;

ChatType::PRIVATE      // Private chats
ChatType::GROUP        // Groups
ChatType::SUPERGROUP   // Supergroups
ChatType::CHANNEL      // Channels
```

### MimeType

Enum for filtering documents by MIME type:

```php
use HybridGram\Telegram\Document\MimeType;

MimeType::PNG
MimeType::JPEG
MimeType::PDF
MimeType::JSON
// ... and others
```

### PollType

Enum for filtering polls by type:

```php
use HybridGram\Telegram\Poll\PollType;

PollType::REGULAR  // Regular poll
PollType::QUIZ     // Quiz
```

### ChatMemberStatus

Enum for filtering by chat member status:

```php
use HybridGram\Telegram\ChatMember\ChatMemberStatus;

ChatMemberStatus::CREATOR
ChatMemberStatus::ADMINISTRATOR
ChatMemberStatus::MEMBER
ChatMemberStatus::RESTRICTED
ChatMemberStatus::LEFT
ChatMemberStatus::KICKED
```
