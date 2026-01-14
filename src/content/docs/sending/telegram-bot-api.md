---
title: TelegramBotApi
description: Отправка сообщений через TelegramBotApi
---

`TelegramBotApi` — это обертка вокруг Telegram Bot API с поддержкой очередей, приоритетов и rate limiting.

## Получение экземпляра

```php
use HybridGram\Telegram\TelegramBotApi;

// Получить из контейнера
$telegram = app(TelegramBotApi::class);

// Для конкретного бота
$telegram = app(TelegramBotApi::class, ['botId' => 'main']);

// В обработчике роута (автоматически для текущего бота)
TelegramRouter::onCommand('/start', function(CommandData $data) {
    $telegram = app(TelegramBotApi::class); // Использует botId из контекста
});
```

## Базовое использование

### Отправка сообщения

```php
$telegram->sendMessage(
    chatId: $chatId,
    text: 'Привет! 👋'
);
```

### Отправка с параметрами

```php
$telegram->sendMessage(
    chatId: $chatId,
    text: 'Ваше сообщение',
    parseMode: 'HTML', // или 'MarkdownV2'
    disableNotification: false,
    protectContent: true
);
```

### Отправка с клавиатурой

```php
use Phptg\BotApi\Type\InlineKeyboardMarkup;
use Phptg\BotApi\Type\ReplyKeyboardMarkup;

// Inline клавиатура
$inlineKeyboard = new InlineKeyboardMarkup([
    [
        ['text' => 'Кнопка 1', 'callback_data' => 'btn1'],
        ['text' => 'Кнопка 2', 'callback_data' => 'btn2'],
    ],
]);

$telegram->sendMessage(
    chatId: $chatId,
    text: 'Выберите действие:',
    replyMarkup: $inlineKeyboard
);

// Reply клавиатура
$replyKeyboard = new ReplyKeyboardMarkup([
    [['text' => 'Опция 1'], ['text' => 'Опция 2']],
    [['text' => 'Отмена']],
]);

$telegram->sendMessage(
    chatId: $chatId,
    text: 'Выберите:',
    replyMarkup: $replyKeyboard
);
```

## Другие методы

### Редактирование сообщения

```php
$telegram->editMessageText(
    chatId: $chatId,
    messageId: $messageId,
    text: 'Обновленный текст',
    replyMarkup: $newKeyboard
);
```

### Удаление сообщения

```php
$telegram->deleteMessage(
    chatId: $chatId,
    messageId: $messageId
);
```

### Отправка фото

```php
$telegram->sendPhoto(
    chatId: $chatId,
    photo: 'https://example.com/image.jpg',
    caption: 'Описание фото'
);
```

### Отправка документа

```php
$telegram->sendDocument(
    chatId: $chatId,
    document: '/path/to/file.pdf',
    caption: 'Документ'
);
```

### Ответ на callback query

```php
$telegram->answerCallbackQuery(
    callbackQueryId: $callbackQueryId,
    text: 'Обрабатываю...', // Опционально
    showAlert: false // true для показа alert
);
```

## Прямое использование методов API

Вы можете вызывать любые методы Telegram Bot API напрямую:

```php
use Phptg\BotApi\Method\SendMessage;
use Phptg\BotApi\Method\SendPhoto;

// Через call()
$telegram->call(new SendMessage($chatId, 'Текст'));

// Методы автоматически маршрутизируются через dispatcher
```

## Приоритеты

По умолчанию все запросы имеют приоритет `HIGH`. Для рассылок используйте приоритет `LOW`:

```php
use HybridGram\Telegram\Priority;

$telegram->withPriority(Priority::LOW)
    ->sendMessage($chatId, 'Рассылка');
```

Приоритеты работают только в режиме очередей. Подробнее в разделе [Приоритеты и очереди](/sending/priorities-queues/).

## Обработка ошибок

```php
use HybridGram\Exceptions\Telegram\TelegramRequestError;

try {
    $telegram->sendMessage($chatId, 'Текст');
} catch (TelegramRequestError $e) {
    logger()->error('Telegram API error', [
        'error_code' => $e->getErrorCode(),
        'description' => $e->getDescription(),
    ]);
}
```

## Примеры использования

### Простой ответ на команду

```php
TelegramRouter::onCommand('/start', function(CommandData $data) {
    $telegram = app(TelegramBotApi::class);
    $telegram->sendMessage($data->getChat()->id, 'Добро пожаловать!');
});
```

### Отправка с форматированием

```php
$telegram->sendMessage(
    chatId: $chatId,
    text: '<b>Жирный текст</b> и <i>курсив</i>',
    parseMode: 'HTML'
);
```

### Отправка нескольких сообщений

```php
$messages = ['Сообщение 1', 'Сообщение 2', 'Сообщение 3'];

foreach ($messages as $text) {
    $telegram->sendMessage($chatId, $text);
}
```

### Условная отправка

```php
if ($condition) {
    $telegram->sendMessage($chatId, 'Условие выполнено');
} else {
    $telegram->sendMessage($chatId, 'Условие не выполнено');
}
```

## Что дальше?

- **[Приоритеты и очереди](/sending/priorities-queues/)** — настройка очередей и приоритетов
- **[Rate Limiting](/sending/rate-limiting/)** — управление лимитами запросов
