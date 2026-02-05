---
title: Состояния (States)
description: Управление состояниями чата и пользователя для создания диалогов
---

Состояния позволяют управлять диалогами с пользователями. Пакет поддерживает два типа состояний: **состояние чата** и **состояние пользователя**.

## Концепция состояний

Состояние — это именованное состояние с опциональными данными, которое хранится в кеше. Оно позволяет:
- Создавать многошаговые диалоги
- Фильтровать роуты по текущему состоянию
- Сохранять контекст между сообщениями

### Типы состояний

- **Состояние чата** — общее для всех пользователей в чате
- **Состояние пользователя** — индивидуальное для каждого пользователя

## Работа с StateManager

### Получение состояния

```php
use HybridGram\Core\State\StateManagerInterface;

$stateManager = app(StateManagerInterface::class);
$chat = $data->getChat();

// Получить состояние чата
$chatState = $stateManager->getChatState($chat);
if ($chatState) {
    $stateName = $chatState->getName();
    $stateData = $chatState->getData();
}

// Получить состояние пользователя
$user = $data->getUser();
if ($user) {
    $userState = $stateManager->getUserState($chat, $user);
}
```

### Установка состояния

```php
// Установить состояние чата
$stateManager->setChatState(
    chat: $chat,
    state: 'awaiting_name',
    ttl: 3600, // Время жизни в секундах (опционально, по умолчанию 24 часа)
    data: ['step' => 1] // Дополнительные данные (опционально)
);

// Установить состояние пользователя
$stateManager->setUserState(
    chat: $chat,
    user: $user,
    state: 'filling_profile',
    ttl: 7200,
    data: ['name' => 'John', 'age' => null]
);
```

### Очистка состояния

```php
// Очистить состояние чата
$stateManager->clearChatState($chat);

// Очистить состояние пользователя
$stateManager->clearUserState($chat, $user);
```

### Проверка состояния

```php
// Проверить конкретное состояние
if ($stateManager->isChatInState($chat, 'awaiting_input')) {
    // ...
}

if ($stateManager->isUserInState($chat, $user, 'filling_form')) {
    // ...
}

// Проверить любое из состояний
if ($stateManager->isChatInAnyState($chat, ['awaiting_name', 'awaiting_email'])) {
    // ...
}
```

## Использование в роутах

### Фильтрация роутов по состоянию

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // Этот роут сработает только если чат в состоянии 'awaiting_name'
}, '*', function(TextMessageData $data) {
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $chat = $data->getChat();
    
    return $stateManager->isChatInState($chat, 'awaiting_name');
});
```

Или используя метод роута:

```php
TelegramRouter::forBot('main')
    ->onMessage(function(TextMessageData $data) {
        // Обработка
    })
    ->fromChatState('awaiting_name'); // Роут сработает только из этого состояния
```

### Установка состояния через роут

```php
TelegramRouter::onCommand('/start', function(CommandData $data) {
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $stateManager->setChatState($data->getChat(), 'main_menu');
    
    // Отправить ответ
});
```

Или через middleware:

```php
use HybridGram\Http\Middlewares\SetStateTelegramRouteMiddleware;

TelegramRouter::onCommand('/start', function(CommandData $data) {
    // ...
})
->middleware(new SetStateTelegramRouteMiddleware('main_menu'));
```

## Примеры использования

### Многошаговая форма

```php
// Шаг 1: Начало
TelegramRouter::onCommand('/register', function(CommandData $data) {
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    
    $stateManager->setChatState($data->getChat(), 'awaiting_name');
    
    $telegram->sendMessage(
        $data->getChat()->id,
        'Введите ваше имя:'
    );
});

// Шаг 2: Получение имени
TelegramRouter::forBot('main')
    ->onTextMessage(function(TextMessageData $data) {
        $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
        $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
        $chat = $data->getChat();
        
        $name = $data->message;
        
        // Сохранить имя в данных состояния
        $stateManager->setChatState(
            chat: $chat,
            state: 'awaiting_email',
            data: ['name' => $name]
        );
        
        $telegram->sendMessage($chat->id, 'Введите ваш email:');
    })
    ->fromChatState('awaiting_name');

// Шаг 3: Получение email
TelegramRouter::forBot('main')
    ->onTextMessage(function(TextMessageData $data) {
        $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
        $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
        $chat = $data->getChat();
        
        $currentState = $stateManager->getChatState($chat);
        $name = $currentState?->getData()['name'] ?? 'Unknown';
        $email = $data->message;
        
        // Сохранить пользователя
        // ... ваша логика сохранения
        
        // Очистить состояние
        $stateManager->clearChatState($chat);
        
        $telegram->sendMessage(
            $chat->id,
            "Спасибо, {$name}! Ваш email: {$email}"
        );
    })
    ->fromChatState('awaiting_email');
```

### Отмена процесса

```php
TelegramRouter::onCommand('/cancel', function(CommandData $data) {
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $chat = $data->getChat();
    
    // Очистить все состояния
    $stateManager->clearChatState($chat);
    if ($user = $data->getUser()) {
        $stateManager->clearUserState($chat, $user);
    }
    
    $telegram->sendMessage($chat->id, 'Операция отменена');
});
```

### Работа с данными состояния

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $chat = $data->getChat();
    
    $currentState = $stateManager->getChatState($chat);
    
    if ($currentState) {
        $stateData = $currentState->getData() ?? [];
        $step = ($stateData['step'] ?? 0) + 1;
        
        // Обновить состояние с новыми данными
        $stateManager->setChatState(
            chat: $chat,
            state: $currentState->getName(),
            data: array_merge($stateData, ['step' => $step])
        );
    }
})
->fromChatState('filling_form');
```

## Исключение состояний

Вы можете создать роут, который работает только если чат **НЕ** в определенном состоянии:

```php
TelegramRouter::forBot('main')
    ->onCommand('/help', function(CommandData $data) {
        // Показывать справку
    })
    ->exceptChatState('processing'); // Не показывать во время обработки
```

## Пользовательские состояния

Для индивидуальной обработки каждого пользователя используйте состояния пользователя:

```php
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $chat = $data->getChat();
    $user = $data->getUser();
    
    // Установить состояние для конкретного пользователя
    $stateManager->setUserState(
        chat: $chat,
        user: $user,
        state: 'selecting_item',
        data: ['item_id' => $data->params[0]]
    );
});
```

## Время жизни состояния

По умолчанию состояния хранятся 24 часа. Вы можете изменить это:

```php
$stateManager->setChatState(
    chat: $chat,
    state: 'temporary_state',
    ttl: 300 // 5 минут
);
```

## Что дальше?

- **[Middleware](/ru/advanced/middleware/)** — использование middleware для управления состояниями
- **[Отправка сообщений](/ru/sending/telegram-bot-api/)** — отправка ответов пользователям
