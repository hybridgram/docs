---
title: Обработка команд
description: Работа с командами Telegram бота
---

Команды — это основной способ взаимодействия пользователей с ботом. Команды начинаются с `/` и часто используются для навигации и выполнения действий.

## Базовое использование

### Простая команда

Первый аргумент — обработчик (closure), третий — паттерн команды для сопоставления:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\CommandData;

TelegramRouter::onCommand(function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $chatId = $data->getChat()->id;
    
    $telegram->sendMessage($chatId, 'Добро пожаловать! 👋');
}, '*', '/start');
```

Или через builder с указанием бота:

```php
TelegramRouter::forBot('main')->onCommand(function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $chatId = $data->getChat()->id;
    
    $telegram->sendMessage($chatId, 'Добро пожаловать! 👋');
}, '/start');
```

### Команды с параметрами

Команды могут содержать параметры, которые передаются в массив `$data->commandParams`:

```php
TelegramRouter::onCommand(function(CommandData $data) {
    $chatId = $data->getChat()->id;
    $params = $data->commandParams; // ['123'] если пользователь написал /user 123
    
    if (empty($params)) {
        $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
        $telegram->sendMessage($chatId, 'Укажите ID пользователя: /user 123');
        return;
    }
    
    $userId = $params[0];
    // Обработка...
}, '*', '/user');
```

Если пользователь введет `/user 123`, то `$data->commandParams` будет содержать `['123']`.

### Паттерны в командах

Вы можете использовать паттерны с `*` для более гибкой обработки:

```php
// Команда /user:* будет обрабатывать /user с любыми параметрами
TelegramRouter::onCommand(function(CommandData $data) {
    $userId = $data->commandParams[0] ?? null;
    // ...
}, '*', '/user:*');
```

### Доступ к данным команды

Объект `CommandData` предоставляет:

```php
TelegramRouter::onCommand(function(CommandData $data) {
    // Команда
    $command = $data->command; // '/info'
    
    // Параметры команды
    $params = $data->commandParams; // ['param1', 'param2']
    
    // Полный объект Update
    $update = $data->update;
    
    // Chat и User
    $chat = $data->getChat();
    $user = $data->getUser();
    
    // ID бота
    $botId = $data->botId;
}, '*', '/info');
```

## Использование контроллеров

Вместо замыканий можно использовать контроллеры:

```php
// routes/telegram.php
TelegramRouter::onCommand([StartController::class, 'handle'], '*', '/start');

// app/Telegram/Controllers/StartController.php
namespace App\Telegram\Controllers;

use HybridGram\Core\Routing\RouteData\CommandData;

class StartController
{
    public function handle(CommandData $data)
    {
        $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
        $telegram->sendMessage($data->getChat()->id, 'Привет!');
    }
}
```

## Множественные команды

Вы можете обработать несколько команд одним обработчиком:

```php
$handler = function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $chatId = $data->getChat()->id;
    $message = match($data->command) {
        'start' => 'Добро пожаловать!',
        'help' => 'Справка по командам...',
        'info' => 'Информация о боте...',
        default => 'Неизвестная команда',
    };
    $telegram->sendMessage($chatId, $message);
};
TelegramRouter::onCommand($handler, '*', 'start');
TelegramRouter::onCommand($handler, '*', 'help');
TelegramRouter::onCommand($handler, '*', 'info');
```

## Команды с опциями параметров

Вы можете настроить обработку параметров команды:

```php
TelegramRouter::onCommand(function(CommandData $data) {
    // ...
}, '*', '/search', function($update, $params) {
    // Кастомная фильтрация: маршрут сработает только если вернётся true или CommandData
    return count($params) > 0;
});
```

## Регистрация команд в BotFather

После создания команд в коде, зарегистрируйте их в [@BotFather](https://t.me/botfather):

```
/setcommands
```

Затем укажите список команд:

```
start - Начать работу с ботом
help - Получить помощь
user - Информация о пользователе
```

Это сделает команды доступными в меню Telegram.

## Примеры

### Команда с валидацией параметров

```php
TelegramRouter::onCommand(function(CommandData $data) {
    $params = $data->commandParams;
    $chatId = $data->getChat()->id;
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    
    if (count($params) < 2) {
        $telegram->sendMessage($chatId, 'Использование: /transfer <user_id> <amount>');
        return;
    }
    
    [$userId, $amount] = $params;
    
    if (!is_numeric($amount) || $amount <= 0) {
        $telegram->sendMessage($chatId, 'Неверная сумма');
        return;
    }
    
    // Обработка перевода...
}, '*', '/transfer');
```

### Команда с состояниями

```php
TelegramRouter::onCommand(function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    
    // Установить состояние для следующего шага
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $stateManager->setChatState($data->getChat(), 'awaiting_setting_choice');
    
    $keyboard = new \Phptg\BotApi\Type\ReplyKeyboardMarkup([
        [['text' => 'Язык'], ['text' => 'Уведомления']],
        [['text' => 'Отмена']],
    ]);
    
    $telegram->sendMessage(
        $data->getChat()->id,
        'Выберите настройку:',
        replyMarkup: $keyboard
    );
}, '*', '/settings');
```

## Что дальше?

- **[Обработка сообщений](/ru/basics/messages/)** — работа с текстовыми сообщениями
- **[Состояния](/ru/advanced/states/)** — управление диалогами через состояния
