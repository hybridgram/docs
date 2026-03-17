---
title: Handling Commands
description: Working with Telegram bot commands
---

Commands are the primary way users interact with a bot. Commands start with `/` and are often used for navigation and performing actions.

## Basic Usage

### Simple Command

The first argument is the handler (closure), the third is the command pattern to match:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\CommandData;

TelegramRouter::onCommand(function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $chatId = $data->getChat()->id;
    
    $telegram->sendMessage($chatId, 'Welcome! 👋');
}, '*', '/start');
```

Or via builder with bot specified:

```php
TelegramRouter::forBot('main')->onCommand(function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $chatId = $data->getChat()->id;
    
    $telegram->sendMessage($chatId, 'Welcome! 👋');
}, '/start');
```

### Commands with Parameters

Commands can contain parameters that are passed in the `$data->commandParams` array:

```php
TelegramRouter::onCommand(function(CommandData $data) {
    $chatId = $data->getChat()->id;
    $params = $data->commandParams; // ['123'] if user typed /user 123
    
    if (empty($params)) {
        $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
        $telegram->sendMessage($chatId, 'Please specify user ID: /user 123');
        return;
    }
    
    $userId = $params[0];
    // Processing...
}, '*', '/user');
```

If the user enters `/user 123`, then `$data->commandParams` will contain `['123']`.

### Patterns in Commands

You can use patterns with `*` for more flexible handling:

```php
// Command /user:* will handle /user with any parameters
TelegramRouter::onCommand(function(CommandData $data) {
    $userId = $data->commandParams[0] ?? null;
    // ...
}, '*', '/user:*');
```

### Accessing Command Data

The `CommandData` object provides:

```php
TelegramRouter::onCommand(function(CommandData $data) {
    // Command
    $command = $data->command; // '/info'
    
    // Command parameters
    $params = $data->commandParams; // ['param1', 'param2']
    
    // Full Update object
    $update = $data->update;
    
    // Chat and User
    $chat = $data->getChat();
    $user = $data->getUser();
    
    // Bot ID
    $botId = $data->botId;
}, '*', '/info');
```

## Using Controllers

Instead of closures, you can use controllers:

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
        $telegram->sendMessage($data->getChat()->id, 'Hello!');
    }
}
```

## Multiple Commands

You can handle multiple commands with a single handler:

```php
$handler = function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $chatId = $data->getChat()->id;
    $message = match($data->command) {
        'start' => 'Welcome!',
        'help' => 'Command help...',
        'info' => 'Bot info...',
        default => 'Unknown command',
    };
    $telegram->sendMessage($chatId, $message);
};
TelegramRouter::onCommand($handler, '*', 'start');
TelegramRouter::onCommand($handler, '*', 'help');
TelegramRouter::onCommand($handler, '*', 'info');
```

## Commands with Parameter Options

You can customize parameter handling:

```php
TelegramRouter::onCommand(function(CommandData $data) {
    // ...
}, '*', '/search', function($update, $params) {
    // Custom filter: route matches only if returns true or CommandData
    return count($params) > 0;
});
```

## Registering Commands in BotFather

After creating commands in code, register them in [@BotFather](https://t.me/botfather):

```
/setcommands
```

Then specify the list of commands:

```
start - Start working with the bot
help - Get help
user - User information
```

This will make commands available in Telegram's menu.

## Examples

### Command with Parameter Validation

```php
TelegramRouter::onCommand(function(CommandData $data) {
    $params = $data->commandParams;
    $chatId = $data->getChat()->id;
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    
    if (count($params) < 2) {
        $telegram->sendMessage($chatId, 'Usage: /transfer <user_id> <amount>');
        return;
    }
    
    [$userId, $amount] = $params;
    
    if (!is_numeric($amount) || $amount <= 0) {
        $telegram->sendMessage($chatId, 'Invalid amount');
        return;
    }
    
    // Transfer processing...
}, '*', '/transfer');
```

### Command with States

```php
TelegramRouter::onCommand(function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    
    // Set state for the next step
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $stateManager->setChatState($data->getChat(), 'awaiting_setting_choice');
    
    $keyboard = new \Phptg\BotApi\Type\ReplyKeyboardMarkup([
        [['text' => 'Language'], ['text' => 'Notifications']],
        [['text' => 'Cancel']],
    ]);
    
    $telegram->sendMessage(
        $data->getChat()->id,
        'Choose a setting:',
        replyMarkup: $keyboard
    );
}, '*', '/settings');
```

## What's Next?

- **[Handling Messages](/en/basics/messages/)** — working with text messages
- **[States](/en/advanced/states/)** — managing conversations through states
