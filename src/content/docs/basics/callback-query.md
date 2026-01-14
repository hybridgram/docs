---
title: Callback Query
description: Обработка нажатий на inline кнопки в Telegram боте
---

Callback Query — это обновление, которое приходит когда пользователь нажимает на inline кнопку (кнопку под сообщением). Это основной способ создания интерактивных интерфейсов в Telegram ботах.

## Базовое использование

### Простой callback query

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\CallbackQueryData;

TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $action = $data->action; // Текст callback_data кнопки
    $chatId = $data->callbackQuery->message->chat->id;
    
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    
    // Ответить на callback (обязательно!)
    $telegram->answerCallbackQuery($data->callbackQuery->id);
    
    // Отправить ответ
    $telegram->sendMessage($chatId, "Вы выбрали: {$action}");
});
```

### Важно: Ответ на callback

**Обязательно** отвечайте на callback query, иначе у пользователя будет крутиться индикатор загрузки. Используйте метод `answerCallbackQuery`:

```php
$telegram->answerCallbackQuery(
    $data->callbackQuery->id,
    text: 'Обрабатываю...', // Опционально: текст для показа пользователю
    showAlert: false // true для показа alert вместо уведомления
);
```

## Структура callback_data

Callback data может быть простой строкой или структурированной. Пакет поддерживает формат `action:param1:param2`:

```php
// Кнопка с callback_data: "menu:products:electronics"
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $action = $data->action; // "menu"
    $params = $data->params; // ['products', 'electronics']
    
    // Обработка
});
```

## Паттерны и фильтрация

### Паттерны с wildcard

```php
// Обработка всех callback с action "menu"
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // ...
}, '*', 'menu:*');

// Обработка callback "menu:products:*"
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $category = $data->params[0] ?? null; // "products"
    // ...
}, '*', 'menu:products:*');
```

### Фильтрация по query параметрам

Вы можете фильтровать callback query по наличию или значению параметров:

```php
// Только если есть параметр "category" со значением "electronics"
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // ...
}, '*', '*', ['category' => 'electronics']);

// Только если есть параметр "category" (любое значение)
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // ...
}, '*', '*', ['category' => null]);
```

### Кастомная проверка через Closure

```php
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // ...
}, '*', function(CallbackQueryData $data) {
    $action = $data->action;
    $params = $data->params;
    
    // Сложная логика проверки
    return $action === 'menu' && count($params) > 0;
});
```

## Доступ к данным

Объект `CallbackQueryData` предоставляет:

```php
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // Action (основная часть callback_data до первого :)
    $action = $data->action;
    
    // Параметры (части после action, разделенные :)
    $params = $data->params; // ['param1', 'param2']
    
    // Полный объект CallbackQuery
    $callbackQuery = $data->callbackQuery;
    
    // ID callback query (нужен для ответа)
    $queryId = $callbackQuery->id;
    
    // Исходное сообщение
    $message = $callbackQuery->message;
    
    // Пользователь, который нажал кнопку
    $user = $callbackQuery->from;
    
    // Полный callback_data (без парсинга)
    $dataString = $callbackQuery->data;
});
```

## Обновление сообщения с кнопками

Часто после нажатия на кнопку нужно обновить сообщение:

```php
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $message = $data->callbackQuery->message;
    
    // Ответить на callback
    $telegram->answerCallbackQuery($data->callbackQuery->id, text: 'Обновляю...');
    
    // Обновить сообщение
    $newKeyboard = new \Phptg\BotApi\Type\InlineKeyboardMarkup([
        [['text' => 'Новая кнопка', 'callback_data' => 'new_action']],
    ]);
    
    $telegram->editMessageText(
        chatId: $message->chat->id,
        messageId: $message->messageId,
        text: 'Сообщение обновлено!',
        replyMarkup: $newKeyboard
    );
});
```

## Примеры использования

### Меню с навигацией

```php
// Создание меню
TelegramRouter::onCommand('/menu', function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    
    $keyboard = new \Phptg\BotApi\Type\InlineKeyboardMarkup([
        [
            ['text' => '📦 Товары', 'callback_data' => 'menu:products'],
            ['text' => '🛒 Корзина', 'callback_data' => 'menu:cart'],
        ],
        [
            ['text' => '⚙️ Настройки', 'callback_data' => 'menu:settings'],
            ['text' => '❓ Помощь', 'callback_data' => 'menu:help'],
        ],
    ]);
    
    $telegram->sendMessage(
        $data->getChat()->id,
        'Выберите раздел:',
        replyMarkup: $keyboard
    );
});

// Обработка выбора пункта меню
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

### Пагинация

```php
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->answerCallbackQuery($data->callbackQuery->id);
    
    $action = $data->action; // "page"
    $page = (int) ($data->params[0] ?? 1);
    
    $items = $this->getItems($page);
    
    $keyboard = new \Phptg\BotApi\Type\InlineKeyboardMarkup([
        [
            ['text' => '◀️ Назад', 'callback_data' => "page:" . ($page - 1)],
            ['text' => 'Вперед ▶️', 'callback_data' => "page:" . ($page + 1)],
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

### Подтверждение действия

```php
TelegramRouter::onCommand('/delete', function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    
    $keyboard = new \Phptg\BotApi\Type\InlineKeyboardMarkup([
        [
            ['text' => '✅ Да, удалить', 'callback_data' => 'confirm:delete:yes'],
            ['text' => '❌ Отмена', 'callback_data' => 'confirm:delete:no'],
        ],
    ]);
    
    $telegram->sendMessage(
        $data->getChat()->id,
        'Вы уверены, что хотите удалить?',
        replyMarkup: $keyboard
    );
});

TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    
    [$action, $type, $answer] = [$data->action, $data->params[0], $data->params[1]];
    
    if ($action === 'confirm' && $type === 'delete') {
        $telegram->answerCallbackQuery($data->callbackQuery->id);
        
        if ($answer === 'yes') {
            // Выполнить удаление
            $telegram->sendMessage(
                $data->callbackQuery->message->chat->id,
                'Удалено!'
            );
        } else {
            $telegram->sendMessage(
                $data->callbackQuery->message->chat->id,
                'Отменено'
            );
        }
        
        // Удалить сообщение с кнопками
        $telegram->deleteMessage(
            $data->callbackQuery->message->chat->id,
            $data->callbackQuery->message->messageId
        );
    }
}, '*', 'confirm:*');
```

## Что дальше?

- **[Middleware](/advanced/middleware/)** — использование middleware для callback query
- **[Состояния](/advanced/states/)** — управление состояниями через callback
