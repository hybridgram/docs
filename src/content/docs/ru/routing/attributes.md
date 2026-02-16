---
title: Маршрутизация с PHP атрибутами
description: Определяйте маршруты с помощью атрибутов PHP 8 как альтернатива фасаду TelegramRouter
---

PHP атрибуты предоставляют чистую, основанную на декораторах альтернативу определению маршрутов с использованием фасада `TelegramRouter`. Этот подход размещает определения маршрутов близко к методам-обработчикам, улучшая организацию и читаемость кода.

## Обзор

Вместо регистрации маршрутов через фасад:

```php
TelegramRouter::onCommand('/start', function(CommandData $data) {
    // Обработка команды /start
});
```

Вы можете определять маршруты, используя атрибуты прямо на методах контроллера:

```php
#[OnCommand('/start')]
public function handleStart(CommandData $data) {
    // Обработка команды /start
}
```

## Начало работы

### Базовое использование

Создайте класс контроллера и украсьте методы атрибутами маршрутизации:

```php
<?php

namespace App\Telegram\Handlers;

use HybridGram\Core\Routing\Attributes\OnCommand;
use HybridGram\Core\Routing\Attributes\OnTextMessage;
use HybridGram\Core\Routing\RouteData\CommandData;
use HybridGram\Core\Routing\RouteData\TextMessageData;

class BotHandler
{
    #[OnCommand('/start')]
    public function handleStart(CommandData $data): void
    {
        $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
        $telegram->sendMessage($data->getChat()->id, 'Добро пожаловать!');
    }

    #[OnTextMessage]
    public function handleMessage(TextMessageData $data): void
    {
        // Обработка всех текстовых сообщений
    }
}
```

### Регистрация

Маршруты, определённые с атрибутами, автоматически обнаруживаются и регистрируются при загрузке приложения. Фреймворк сканирует классы приложения и регистрирует любые маршруты, определённые с помощью атрибутов маршрутизации.

Чтобы включить маршрутизацию на основе атрибутов, убедитесь, что `AttributeRouteRegistrar` вызывается в поставщике услуг или файле загрузки приложения.

## Доступные атрибуты

### Обработка сообщений

#### OnTextMessage
Обработка текстовых сообщений:

```php
#[OnTextMessage]
public function handleMessage(TextMessageData $data): void {
    // Обработка всех текстовых сообщений
}

#[OnTextMessage(pattern: 'привет')]
public function handleGreeting(TextMessageData $data): void {
    // Обработка сообщений содержащих 'привет'
}
```

#### OnCommand
Обработка команд Telegram:

```php
#[OnCommand('/start')]
public function handleStart(CommandData $data): void {
    // Обработка команды /start
}

#[OnCommand('/user:*')]
public function handleUserCommand(CommandData $data): void {
    // Обработка /user:* с параметрами
}
```

#### OnCallbackQuery
Обработка нажатий на кнопки:

```php
#[OnCallbackQuery(pattern: 'menu:*')]
public function handleMenuCallback(CallbackQueryData $data): void {
    // Обработка callback запросов типа 'menu:home'
}
```

### Обработка медиа

Обработка различных типов медиа:

```php
#[OnPhoto]
public function handlePhoto(PhotoData $data): void {}

#[OnDocument]
public function handleDocument(DocumentData $data): void {}

#[OnAudio]
public function handleAudio(AudioData $data): void {}

#[OnVideo]
public function handleVideo(VideoData $data): void {}

#[OnVoice]
public function handleVoice(VoiceData $data): void {}

#[OnLocation]
public function handleLocation(LocationData $data): void {}

#[OnContact]
public function handleContact(ContactData $data): void {}
```

### События участников чата

```php
#[OnChatMember]
public function handleChatMember(ChatMemberUpdatedData $data): void {}

#[OnMyChatMember]
public function handleBotChatMember(ChatMemberUpdatedData $data): void {}
```

### Другие события

```php
#[OnPoll]
public function handlePoll(PollData $data): void {}

#[OnInlineQuery]
public function handleInlineQuery(InlineQueryData $data): void {}

#[OnAny]
public function handleAny(UpdateData $data): void {}

#[OnFallback]
public function handleFallback(FallbackData $data): void {}
```

## Фильтрация и условия

### Типы чатов

Ограничьте маршруты определённой типа чатов:

```php
use HybridGram\Core\Routing\Attributes\ChatTypes;
use HybridGram\Core\Routing\ChatType;

#[OnCommand('/admin')]
#[ChatTypes([ChatType::PRIVATE, ChatType::GROUP])]
public function handleAdminCommand(CommandData $data): void {
    // Работает только в приватных чатах и группах
}
```

### Выбор бота

Нацельтесь на конкретные боты:

```php
use HybridGram\Core\Routing\Attributes\ForBot;

#[OnCommand('/start')]
#[ForBot('main')]
public function handleStart(CommandData $data): void {
    // Только для бота 'main'
}
```

### Middleware

Применяйте middleware к маршрутам:

```php
use HybridGram\Core\Routing\Attributes\TgMiddlewares;
use App\Telegram\Middleware\AuthMiddleware;

#[OnCommand('/admin')]
#[TgMiddlewares([AuthMiddleware::class])]
public function handleAdmin(CommandData $data): void {
    // AuthMiddleware выполняется перед этим обработчиком
}
```

### Маршрутизация на основе состояния пользователя

Маршрутизируйте в зависимости от состояния пользователя:

```php
use HybridGram\Core\Routing\Attributes\FromUserState;
use HybridGram\Core\Routing\Attributes\ToUserState;

#[OnTextMessage]
#[FromUserState('waiting_name')]
#[ToUserState('name_received')]
public function handleNameInput(TextMessageData $data): void {
    // Обрабатывает только если пользователь в состоянии 'waiting_name'
    // Переходит в состояние 'name_received' после выполнения
}
```

### Состояние чата

Маршрутизируйте на основе состояния чата:

```php
use HybridGram\Core\Routing\Attributes\FromChatState;
use HybridGram\Core\Routing\Attributes\ToChatState;

#[OnTextMessage]
#[FromChatState('setup_mode')]
public function handleSetup(TextMessageData $data): void {
    // Только когда чат в режиме 'setup_mode'
}
```

## Комбинирование атрибутов

Вы можете комбинировать несколько атрибутов на одном методе:

```php
#[OnTextMessage(pattern: 'price:*')]
#[ForBot('main')]
#[ChatTypes([ChatType::PRIVATE])]
#[FromUserState('shopping')]
public function handlePriceQuery(TextMessageData $data): void {
    // Этот обработчик срабатывает только когда ВСЕ условия выполнены:
    // - Текст сообщения содержит шаблон 'price:*'
    // - Бот 'main'
    // - Чат приватный
    // - Пользователь в состоянии 'shopping'
}
```

## Лучшие практики

### Организация

Группируйте связанные обработчики в выделённых классах контроллера:

```php
<?php

namespace App\Telegram\Handlers;

class CommandHandler
{
    #[OnCommand('/start')]
    public function handleStart(CommandData $data): void {}

    #[OnCommand('/help')]
    public function handleHelp(CommandData $data): void {}
}

class MessageHandler
{
    #[OnTextMessage]
    public function handleMessage(TextMessageData $data): void {}
}
```

### Доступные пути

Убедитесь, что ваши классы обработчиков находятся в доступных местоположениях. По умолчанию фреймворк сканирует:
- `app/Telegram/`
- `app/Handlers/`

Если нужно, сконфигурируйте дополнительные пути.

### Безопасность типов

Всегда добавляйте тип параметру данных:

```php
// ✅ Хорошо - типы предотвращают ошибки
#[OnCommand('/start')]
public function handleStart(CommandData $data): void {}

// ❌ Избегайте - теряется безопасность типов
#[OnCommand('/start')]
public function handleStart($data): void {}
```

## Сравнение с фасадной маршрутизацией

### Маршрутизация через фасад (традиционный способ)

```php
// routes/telegram.php

TelegramRouter::onCommand('/start', function(CommandData $data) {
    // ...
});

TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // ...
});
```

### Маршрутизация через атрибуты (современный способ)

```php
// app/Telegram/BotHandler.php

class BotHandler
{
    #[OnCommand('/start')]
    public function handleStart(CommandData $data): void {
        // ...
    }

    #[OnTextMessage]
    public function handleMessage(TextMessageData $data): void {
        // ...
    }
}
```

Оба подхода работают одинаково хорошо. Выбирайте в зависимости от предпочтений вашего проекта:
- **Атрибуты**: Лучше для больших проектов с множеством обработчиков
- **Фасад**: Лучше для небольших проектов или когда все маршруты в одном месте

## Продвинутые темы

### Пользовательские атрибуты

Вы можете создавать пользовательские атрибуты, расширяющие `TelegramRouteAttribute`:

```php
use HybridGram\Core\Routing\Attributes\TelegramRouteAttribute;
use HybridGram\Core\Routing\TelegramRouteBuilder;

#[Attribute(Attribute::TARGET_METHOD)]
final class OnVIP implements TelegramRouteAttribute
{
    public function registerRoute(TelegramRouteBuilder $builder, \Closure|string|array $action): void
    {
        // Пользовательская логика регистрации
        $builder->onTextMessage($action)
                ->middleware(VIPCheckMiddleware::class);
    }
}
```

### Кеширование атрибутов

В production маршруты атрибутов кешируются для лучшей производительности. Запустите:

```bash
php artisan config:cache
```

Чтобы очистить кеш во время разработки, используйте:

```bash
php artisan config:clear
```

## Смотрите также

- **[Базовая маршрутизация](/ru/basics/routing/)** — Обзор концепций маршрутизации
- **[Middleware](/ru/advanced/middleware/)** — Использование middleware с маршрутами
- **[Состояния](/ru/advanced/states/)** — Управление состояниями пользователя и чата
