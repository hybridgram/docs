---
title: Обработка сообщений
description: Работа с текстовыми сообщениями от пользователей
---

Обработка текстовых сообщений — одна из основных функций Telegram бота. Пакет предоставляет гибкие возможности для работы с сообщениями.

## Базовое использование

### Все сообщения

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\TextTextMessageData;

TelegramRouter::onTextMessage(function(TextTextMessageData $data) {
    $text = $data->text; // Текст сообщения (string)
    $chatId = $data->getChat()->id;
    
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->sendMessage($chatId, "Вы написали: {$text}");
});
```

### Сообщения по паттерну

Проверка текста сообщения по строковому паттерну:

```php
// Точное совпадение
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // ...
}, '*', 'привет');

// С использованием wildcard (Laravel Str::is)
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // Сработает для: "привет", "привет всем", "скажи привет"
}, '*', 'привет*');
```

### Кастомная проверка через Closure

Для сложной логики используйте closure:

```php
TelegramRouter::onMessage(function(TextMessageData $data) {
    // Обработка
}, '*', function(TextMessageData $data) {
    // Возвращайте true, если роут должен сработать
    $text = $data->text;
    
    // Проверка длины
    if (strlen($text) < 10) {
        return false;
    }
    
    // Проверка на наличие ключевых слов
    $keywords = ['заказ', 'доставка', 'оплата'];
    return str_contains($text, $keywords);
});
```

## Доступ к данным сообщения

Объект `TextMessageData` содержит:

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // Текст сообщения (string)
    $text = $data->text;
    
    // Полный объект Message из Telegram API
    $messageObject = $data->message;
    
    // Полный объект Update
    $update = $data->update;
    
    // Chat и User
    $chat = $data->getChat();
    $user = $data->getUser();
    
    // Дополнительная информация из сообщения
    $messageId = $messageObject->messageId;
    $date = $messageObject->date;
    $entities = $messageObject->entities; // Форматирование текста
});
```

## Работа с форматированием

Telegram поддерживает различные типы форматирования в сообщениях:

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    $message = $data->message;
    
    // Проверка наличия форматирования
    if ($message->entities !== null) {
        foreach ($message->entities as $entity) {
            if ($entity->type === 'bold') {
                // Обработка жирного текста
            }
            if ($entity->type === 'code') {
                // Обработка кода
            }
        }
    }
});
```

## Сообщения в контексте состояний

Сообщения часто обрабатываются в зависимости от текущего состояния:

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $chat = $data->getChat();
    
    $currentState = $stateManager->getChatState($chat);
    
    if ($currentState?->getName() === 'awaiting_name') {
        // Пользователь вводит имя
        $name = $data->message;
        // Сохранить имя и перейти к следующему шагу
    }
}, '*', function(TextMessageData $data) {
    // Проверяем, что это состояние "ожидание имени"
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $chat = $data->getChat();
    $state = $stateManager->getChatState($chat);
    
    return $state?->getName() === 'awaiting_name';
});
```

## Фильтрация по типам чатов

Вы можете фильтровать сообщения по типу чата:

```php
TelegramRouter::forBot('main')
    ->onMessage(function(TextMessageData $data) {
        // Только приватные чаты
    })
    ->whereChatType('private');
```

## Примеры использования

### Эхо-бот

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->sendMessage(
        $data->getChat()->id,
        "Вы написали: {$data->message}"
    );
});
```

### Поиск по ключевым словам

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    $text = strtolower($data->message);
    $chatId = $data->getChat()->id;
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    
    if (str_contains($text, 'погода')) {
        $telegram->sendMessage($chatId, 'Запрашиваю прогноз погоды...');
        // ...
    } elseif (str_contains($text, 'курс')) {
        $telegram->sendMessage($chatId, 'Запрашиваю курс валют...');
        // ...
    }
}, '*', function(TextMessageData $data) {
    $keywords = ['погода', 'курс', 'новости'];
    $text = strtolower($data->message);
    return str_contains($text, $keywords);
});
```

### Обработка длинных сообщений

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    $text = $data->message;
    
    // Разбить длинное сообщение на части
    if (strlen($text) > 4096) {
        $chunks = str_split($text, 4090);
        $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
        
        foreach ($chunks as $chunk) {
            $telegram->sendMessage($data->getChat()->id, $chunk);
        }
    }
}, '*', function(TextMessageData $data) {
    return strlen($data->message) > 4096;
});
```

## Обработка ответов на сообщения

Для обработки ответов (reply) на сообщения используйте специальный роут:

```php
use HybridGram\Core\Routing\RouteData\ReplyData;

TelegramRouter::onReply(function(ReplyData $data) {
    $originalMessage = $data->update->message->replyToMessage;
    $replyText = $data->update->message->text;
    
    // Обработка ответа
});
```

## Что дальше?

- **[Callback Query](/ru/basics/callback-query/)** — обработка нажатий на inline кнопки
- **[Состояния](/ru/advanced/states/)** — управление диалогами
