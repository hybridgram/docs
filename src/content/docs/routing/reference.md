---
title: Справочник по роутингу
description: Полный список всех методов роутинга из фасада TelegramRouter
---

# Справочник по роутингу

Этот раздел содержит полный список всех доступных методов роутинга из фасада `TelegramRouter`. Каждый метод описывает, какие параметры он принимает, на какие события Telegram реагирует и какие данные передаются в обработчик.

## Общие параметры

Большинство методов роутинга принимают следующие общие параметры:

- **`$action`** (`array|string|\Closure`) — обработчик роута. Может быть:
  - Closure/функция
  - Строка в формате `'Controller@method'`
  - Массив `[Controller::class, 'method']`
- **`$botId`** (`string`, по умолчанию `'*'`) — ID бота, для которого регистрируется роут. `'*'` означает все боты
- **`$pattern`** (`\Closure|string|null`) — паттерн для фильтрации. Может быть:
  - Строка с поддержкой `*` (wildcard)
  - Closure для кастомной проверки
  - `null` или `'*'` для обработки всех событий данного типа

Все обработчики получают объект данных, который наследуется от `AbstractRouteData` и содержит:
- `$data->update` — полный объект `Update` от Telegram
- `$data->botId` — ID бота
- `$data->getChat()` — метод для получения объекта `Chat`
- `$data->getUser()` — метод для получения объекта `User`

## Команды и сообщения

### `onCommand()`

Обрабатывает команды, начинающиеся с `/`.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (по умолчанию `null`) — паттерн команды (например, `'/start'`, `'/user:*'`)
- `$commandParamOptions` (`?\Closure`) — опциональный фильтр по параметрам команды

**Событие:** `message.text` начинается с `/`

**Данные:** `CommandData`
- `$data->command` — название команды (без `/`)
- `$data->commandParams` — массив аргументов после команды
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

**Пример:**
```php
TelegramRouter::onCommand('/start', function(CommandData $data) {
    // Обработка команды /start
});

TelegramRouter::onCommand('/user:*', function(CommandData $data) {
    $userId = $data->commandParams[0] ?? null;
});
```

### `onMessage()`

Обрабатывает текстовые сообщения.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (по умолчанию `null`) — паттерн для текста сообщения

**Событие:** `message.text` присутствует

**Данные:** `MessageData`
- `$data->message` — текст сообщения
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

**Пример:**
```php
TelegramRouter::onMessage(function(MessageData $data) {
    // Обработка всех сообщений
});

TelegramRouter::onMessage(function(MessageData $data) {
    // Обработка сообщений с паттерном
}, '*', 'привет*');
```

## Медиа контент

### `onPhoto()`

Обрабатывает отправленные фотографии.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (`callable|null`, по умолчанию `null`) — паттерн для подписи (caption)

**Событие:** `message.photo` присутствует

**Данные:** `PhotoData`
- `$data->photoSizes` — массив объектов `PhotoSize`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onPhotoMediaGroup()`

Обрабатывает группы фотографий (альбомы).

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (по умолчанию `null`) — паттерн для подписи

**Событие:** `message.photo` присутствует и `message.mediaGroupId` установлен

**Данные:** `PhotoMediaGroupData`
- `$data->photos` — массив всех фотографий в группе
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onDocument()`

Обрабатывает отправленные документы.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (по умолчанию `null`) — паттерн для подписи
- `$documentOptions` (`?array<MimeType|string>`) — опциональный фильтр по MIME-типам

**Событие:** `message.document` присутствует

**Данные:** `DocumentData`
- `$data->document` — объект `Document`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

**Пример:**
```php
use HybridGram\Telegram\Document\MimeType;

TelegramRouter::onDocument(function(DocumentData $data) {
    // Обработка всех документов
}, '*', null, [MimeType::PDF, MimeType::JSON]);
```

### `onAnimation()`

Обрабатывает анимации (GIF).

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (по умолчанию `null`) — паттерн для подписи

**Событие:** `message.animation` присутствует

**Данные:** `AnimationData`
- `$data->animation` — объект `Animation`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onAudio()`

Обрабатывает аудио файлы.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (по умолчанию `null`) — паттерн для подписи

**Событие:** `message.audio` присутствует

**Данные:** `AudioData`
- `$data->audio` — объект `Audio`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onSticker()`

Обрабатывает стикеры.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (по умолчанию `null`) — паттерн для подписи

**Событие:** `message.sticker` присутствует

**Данные:** `StickerData`
- `$data->sticker` — объект `Sticker`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onVideoNote()`

Обрабатывает видеосообщения (круглые видео).

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (по умолчанию `null`) — паттерн для подписи

**Событие:** `message.videoNote` присутствует

**Данные:** `VideoNoteData`
- `$data->videoNote` — объект `VideoNote`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onVoice()`

Обрабатывает голосовые сообщения.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (по умолчанию `null`) — паттерн для подписи

**Событие:** `message.voice` присутствует

**Данные:** `VoiceData`
- `$data->voice` — объект `Voice`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onStory()`

Обрабатывает истории (stories).

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (по умолчанию `null`) — паттерн для подписи

**Событие:** `message.story` присутствует

**Данные:** `StoryData`
- `$data->story` — объект `Story`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onPaidMedia()`

Обрабатывает платный медиа контент.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (по умолчанию `null`) — паттерн для подписи

**Событие:** `message.paidMedia` присутствует

**Данные:** `PaidMediaData`
- `$data->paidMedia` — объект платного медиа
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

## Геолокация и контакты

### `onLocation()`

Обрабатывает отправку геолокации.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.location` присутствует

**Данные:** `LocationData`
- `$data->location` — объект `Location`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onVenue()`

Обрабатывает отправку места (venue).

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.venue` присутствует

**Данные:** `VenueData`
- `$data->venue` — объект `Venue`
- `$data->location` — объект `Location`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onContact()`

Обрабатывает отправку контакта.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.contact` присутствует

**Данные:** `ContactData`
- `$data->contact` — объект `Contact`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

## Опросы

### `onPoll()`

Обрабатывает создание опроса.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (`callable|null`, по умолчанию `null`) — опциональный паттерн
- `$isAnonymous` (`?bool`) — фильтр по анонимности опроса
- `$pollType` (`?PollType`) — фильтр по типу опроса (`PollType::REGULAR` или `PollType::QUIZ`)

**Событие:** `message.poll` присутствует

**Данные:** `PollData`
- `$data->poll` — объект `Poll`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

**Пример:**
```php
use HybridGram\Telegram\Poll\PollType;

TelegramRouter::onPoll(function(PollData $data) {
    // Обработка только викторин
}, '*', null, false, PollType::QUIZ);
```

### `onPollAnswered()`

Обрабатывает ответы на опрос.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (`callable|null`, по умолчанию `null`) — опциональный паттерн
- `$isAnonymous` (`?bool`) — фильтр по анонимности опроса
- `$pollType` (`?PollType`) — фильтр по типу опроса

**Событие:** `pollAnswer` присутствует

**Данные:** `PollAnswerData`
- `$data->pollAnswer` — объект `PollAnswer`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onPollClosed()`

Обрабатывает закрытие опроса.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (`callable|null`, по умолчанию `null`) — опциональный паттерн
- `$isAnonymous` (`?bool`) — фильтр по анонимности опроса
- `$pollType` (`?PollType`) — фильтр по типу опроса

**Событие:** `pollClosed` присутствует

**Данные:** `PollClosedData`
- `$data->pollClosed` — объект `PollClosed`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

## Игры и развлечения

### `onDice()`

Обрабатывает отправку кубика (dice).

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.dice` присутствует

**Данные:** `DiceData`
- `$data->dice` — объект `Dice`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onGame()`

Обрабатывает отправку игры.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.game` присутствует

**Данные:** `GameData`
- `$data->game` — объект `Game`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onChecklist()`

Обрабатывает отправку чеклиста.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.checklist` присутствует

**Данные:** `ChecklistData`
- `$data->checklist` — объект `Checklist`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

## Платежи

### `onInvoice()`

Обрабатывает отправку счета (invoice).

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.invoice` присутствует

**Данные:** `InvoiceData`
- `$data->invoice` — объект `Invoice`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onSuccessfulPayment()`

Обрабатывает успешную оплату.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.successfulPayment` присутствует

**Данные:** `SuccessfulPaymentData`
- `$data->successfulPayment` — объект `SuccessfulPayment`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onPassportData()`

Обрабатывает данные Telegram Passport.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.passportData` присутствует

**Данные:** `PassportData`
- `$data->passportData` — объект `PassportData`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

## Ответы и цитирование

### `onReply()`

Обрабатывает ответы на сообщения.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (по умолчанию `null`) — паттерн для текста ответа

**Событие:** `message.replyToMessage` присутствует

**Данные:** `ReplyData`
- `$data->replyToMessage` — объект `Message` на который отвечают
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onExternalReply()`

Обрабатывает ответы на сообщения из другого чата.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (по умолчанию `null`) — паттерн для текста ответа

**Событие:** `message.externalReply` присутствует

**Данные:** `ExternalReplyData`
- `$data->externalReply` — объект внешнего ответа
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onQuote()`

Обрабатывает цитирование сообщений.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (по умолчанию `null`) — паттерн для текста цитаты

**Событие:** `message.quote` присутствует

**Данные:** `QuoteData`
- `$data->quote` — объект цитаты
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onReplyToStory()`

Обрабатывает ответы на истории.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (по умолчанию `null`) — паттерн для текста ответа

**Событие:** `message.replyToStory` присутствует

**Данные:** `ReplyToStoryData`
- `$data->replyToStory` — объект ответа на историю
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

## Callback Query и Inline Query

### `onCallbackQuery()`

Обрабатывает нажатия на inline кнопки.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (по умолчанию `'*'`) — паттерн для action (например, `'menu:*'`)
- `$queryParams` (`?array<string, string|null>|array<int, QueryParamInterface>`) — опциональные фильтры по query параметрам

**Событие:** `callbackQuery` присутствует

**Данные:** `CallbackQueryData`
- `$data->action` — строка action из callback data
- `$data->params` — массив параметров из callback data
- `$data->query` — объект `CallbackQuery`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

**Пример:**
```php
use HybridGram\Core\Routing\RouteOptions\QueryParams\Exist;
use HybridGram\Core\Routing\RouteOptions\QueryParams\Value;

TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // Обработка callback query
}, '*', 'menu:*', [
    new Exist('lang'),
    new Value('category', 'products')
]);
```

### `onInlineQuery()`

Обрабатывает inline запросы.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$pattern` (по умолчанию `null`) — паттерн для текста запроса

**Событие:** `inlineQuery` присутствует

**Данные:** `InlineQueryData`
- `$data->inlineQuery` — объект `InlineQuery`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

## События чата

### `onNewChatMembers()`

Обрабатывает добавление новых участников в чат.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.newChatMembers` присутствует

**Данные:** `NewChatMembersData`
- `$data->newChatMembers` — массив новых участников
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onLeftChatMember()`

Обрабатывает выход участника из чата.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.leftChatMember` присутствует

**Данные:** `LeftChatMemberData`
- `$data->leftChatMember` — объект вышедшего участника
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onNewChatTitle()`

Обрабатывает изменение названия чата.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.newChatTitle` присутствует

**Данные:** `NewChatTitleData`
- `$data->newChatTitle` — новое название чата
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onNewChatPhoto()`

Обрабатывает изменение фото чата.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.newChatPhoto` присутствует

**Данные:** `NewChatPhotoData`
- `$data->newChatPhoto` — массив новых фото
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onDeleteChatPhoto()`

Обрабатывает удаление фото чата.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.deleteChatPhoto` присутствует

**Данные:** `DeleteChatPhotoData`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onMessageAutoDeleteTimerChanged()`

Обрабатывает изменение таймера автоудаления сообщений.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.autoDeleteTimerChanged` присутствует

**Данные:** `AutoDeleteTimerChangedData`
- `$data->autoDeleteTimerChanged` — объект с информацией о таймере
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onPinnedMessage()`

Обрабатывает закрепление сообщения.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.pinnedMessage` присутствует

**Данные:** `PinnedMessageData`
- `$data->pinnedMessage` — объект закрепленного сообщения
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onForumTopicEvent()`

Обрабатывает события топика форума.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.forumTopicEvent` присутствует

**Данные:** `ForumTopicEventData`
- `$data->forumTopicEvent` — объект события топика
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onGeneralForumTopicEvent()`

Обрабатывает события общего топика форума.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.generalForumTopicEvent` присутствует

**Данные:** `GeneralForumTopicEventData`
- `$data->generalForumTopicEvent` — объект события общего топика
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onBoostAdded()`

Обрабатывает добавление буста в чат.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** `message.boostAdded` присутствует

**Данные:** `BoostAddedData`
- `$data->boostAdded` — объект с информацией о бусте
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

## Обновления статуса участников

### `onMyChatMember()`

Обрабатывает изменения статуса бота в чате.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$isBot` (`?bool`) — фильтр по isBot для пользователя (from)
- `$allowedStatuses` (`?array<ChatMemberStatus>`) — разрешенные статусы для newChatMember

**Событие:** `myChatMember` присутствует

**Данные:** `ChatMemberUpdatedData`
- `$data->chatMemberUpdated` — объект `ChatMemberUpdated`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

**Пример:**
```php
use HybridGram\Telegram\ChatMember\ChatMemberStatus;

TelegramRouter::onMyChatMember(function(ChatMemberUpdatedData $data) {
    // Обработка изменения статуса бота
}, '*', false, [ChatMemberStatus::ADMINISTRATOR, ChatMemberStatus::MEMBER]);
```

### `onChatMember()`

Обрабатывает изменения статуса участника чата.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота
- `$isBot` (`?bool`) — фильтр по isBot для пользователя (from)
- `$allowedStatuses` (`?array<ChatMemberStatus>`) — разрешенные статусы для newChatMember

**Событие:** `chatMember` присутствует

**Данные:** `ChatMemberUpdatedData`
- `$data->chatMemberUpdated` — объект `ChatMemberUpdated`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

## Универсальные роуты

### `onAny()`

Обрабатывает любые обновления.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** Любое обновление

**Данные:** `AnyData`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onFallback()`

Обрабатывает обновления, для которых не найден подходящий роут.

**Параметры:**
- `$action` — обработчик
- `$botId` (по умолчанию `'*'`) — ID бота

**Событие:** Обновление, не соответствующее ни одному роуту

**Данные:** `FallbackData`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

**Примечание:** В режиме разработки (`app()->isLocal()`) fallback автоматически отправляет информацию о состоянии для отладки.

## Вспомогательные методы

### `forBot()`

Возвращает билдер роутов для конкретного бота.

**Параметры:**
- `$botId` (`string`) — ID бота

**Возвращает:** `TelegramRouteBuilder`

**Пример:**
```php
TelegramRouter::forBot('main')
    ->onCommand('/start', function(CommandData $data) {
        // Роут только для бота 'main'
    });
```

### `group()`

Группирует роуты с общими атрибутами.

**Параметры:**
- `$attributes` (`array`) — массив атрибутов (например, `['botId' => 'main', 'middlewares' => [...]`)
- `$callback` (`callable`) — функция, которая получает `TelegramRouteBuilder` в качестве параметра

**Пример:**
```php
TelegramRouter::group([
    'botId' => 'main',
    'middlewares' => [AuthTelegramRouteMiddleware::class],
], function($router) {
    $router->onCommand('/admin', function(CommandData $data) {
        // Роут с общими атрибутами группы
    });
});
```

## Типы данных для фильтрации

### MimeType

Enum для фильтрации документов по MIME-типу:

```php
use HybridGram\Telegram\Document\MimeType;

MimeType::PNG
MimeType::JPEG
MimeType::WEBP
MimeType::GIF
MimeType::PDF
MimeType::MP4
MimeType::MPEG
MimeType::MOV
MimeType::HTML
MimeType::JSON
```

### PollType

Enum для фильтрации опросов по типу:

```php
use HybridGram\Telegram\Poll\PollType;

PollType::REGULAR  // Обычный опрос
PollType::QUIZ     // Викторина
```

### ChatMemberStatus

Enum для фильтрации по статусу участника чата:

```php
use HybridGram\Telegram\ChatMember\ChatMemberStatus;

ChatMemberStatus::CREATOR
ChatMemberStatus::ADMINISTRATOR
ChatMemberStatus::MEMBER
ChatMemberStatus::RESTRICTED
ChatMemberStatus::LEFT
ChatMemberStatus::KICKED
```
