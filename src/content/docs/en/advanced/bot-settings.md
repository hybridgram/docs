---
title: Bot Settings
description: Multilingual configuration of Telegram bot settings
---

HybridGram provides a fluent API for configuring multilingual Telegram bot parameters: description, name, menu commands, admin rights, and menu button.

## Basic Concepts

### BotSettings Builder

The `BotSettings` class provides a fluent interface for defining bot settings:

```php
use HybridGram\Core\Config\BotSettings\BotSettings;

$settings = BotSettings::create()
    ->description('Your personal assistant bot')
    ->description('Ваш персональный бот-помощник', 'ru')
    ->shortDescription('Assistant Bot')
    ->shortDescription('Бот-помощник', 'ru')
    ->name('Assistant Bot')
    ->name('Бот Помощник', 'ru');
```

### Localized Strings

All text parameters accept individual method calls with language codes:

```php
// Pass null or omit languageCode for default value (applies to all users)
$settings
    ->description('Default description')           // Default (null languageCode)
    ->description('Описание на русском', 'ru')     // For Russian
    ->description('Опис українською', 'uk');      // For Ukrainian
```

**Important:** To set a default value that applies to all users regardless of their language, pass `null` as the `languageCode` parameter (or omit it, as `null` is the default).

## Available Settings

### Bot Description

```php
$settings
    // Full description (up to 512 characters)
    ->description('Full bot description that appears in the bot profile')
    ->description('Полное описание бота, отображаемое в профиле', 'ru')
    // Short description (up to 120 characters)
    ->shortDescription('Short description for sharing')
    ->shortDescription('Краткое описание для репостов', 'ru');
```

**Note:** Pass `null` as `languageCode` (or omit it) to set the default value that applies to all users.

### Bot Name

```php
$settings
    ->name('My Awesome Bot')
    ->name('Мой Крутой Бот', 'ru');
```

**Note:** Pass `null` as `languageCode` (or omit it) to set the default value that applies to all users.

### Menu Commands

```php
use Phptg\BotApi\Type\BotCommand;
use Phptg\BotApi\Type\BotCommandScope\BotCommandScopeDefault;
use Phptg\BotApi\Type\BotCommandScope\BotCommandScopeAllGroupChats;
use Phptg\BotApi\Type\BotCommandScope\BotCommandScopeAllPrivateChats;
use Phptg\BotApi\Type\BotCommandScope\BotCommandScopeAllChatAdministrators;

$settings
    // Commands for all users (default scope, default language)
    ->commands([
        new BotCommand('start', 'Start the bot'),
        new BotCommand('help', 'Get help'),
    ])
    // Commands for Russian users (default scope, Russian language)
    ->commands([
        new BotCommand('start', 'Запустить бота'),
        new BotCommand('help', 'Получить помощь'),
    ], null, 'ru')
    // Commands only for group admins
    ->commands([
        new BotCommand('ban', 'Ban a user'),
        new BotCommand('settings', 'Group settings'),
    ], new BotCommandScopeAllChatAdministrators())
    // Commands for private chats
    ->commands([
        new BotCommand('profile', 'Your profile'),
        new BotCommand('settings', 'Personal settings'),
    ], new BotCommandScopeAllPrivateChats());
```

**Note:** 
- Pass `null` as `languageCode` (or omit it) to set the default value that applies to all users.
- Pass `null` as `scope` (or omit it) to use the default scope (`BotCommandScopeDefault`).

### Menu Button

```php
use Phptg\BotApi\Type\MenuButton\MenuButtonCommands;
use Phptg\BotApi\Type\MenuButton\MenuButtonWebApp;
use Phptg\BotApi\Type\WebAppInfo;

// Standard command menu
$settings->menuButton(new MenuButtonCommands());

// Or WebApp button
$settings->menuButton(new MenuButtonWebApp(
    text: 'Open App',
    webApp: new WebAppInfo(url: 'https://example.com/app')
));
```

### Default Admin Rights

```php
use Phptg\BotApi\Type\ChatAdministratorRights;

$settings
    // Rights in groups
    ->defaultAdministratorRights(new ChatAdministratorRights(
        canDeleteMessages: true,
        canRestrictMembers: true,
        canPinMessages: true,
    ))
    // Rights in channels
    ->defaultAdministratorRightsForChannels(new ChatAdministratorRights(
        canPostMessages: true,
        canEditMessages: true,
    ));
```

## Registering Settings

### BotSettingsRegistry

Register settings for each bot through `BotSettingsRegistry::forBot()`:

```php
use HybridGram\Core\Config\BotSettings\BotSettings;
use HybridGram\Core\Config\BotSettings\BotSettingsRegistry;
use Phptg\BotApi\Type\BotCommand;

// In your ServiceProvider or bootstrap file
BotSettingsRegistry::forBot('main', function(): BotSettings {
    return BotSettings::create()
        ->description('Main production bot')
        ->description('Основной продакшн бот', 'ru')
        ->commands([
            new BotCommand('start', 'Start'),
            new BotCommand('help', 'Help'),
        ])
        ->commands([
            new BotCommand('start', 'Начать'),
            new BotCommand('help', 'Помощь'),
        ], null, 'ru');
});
```

## Applying Settings

### Console Command

HybridGram provides an Artisan command for applying settings:

```bash
# Apply settings for specific bot
php artisan hybridgram:settings:apply --bot=main

# Apply settings for all registered bots
php artisan hybridgram:settings:apply --all

# Preview without applying (dry-run)
php artisan hybridgram:settings:apply --bot=main --dry-run
```

### Programmatic Application

For applying settings programmatically, use `BotSettingsApplier`:

```php
use HybridGram\Core\Config\BotSettings\BotSettingsApplier;
use HybridGram\Core\Config\BotSettings\BotSettingsRegistry;
use HybridGram\Telegram\TelegramBotApi;

$telegram = app(TelegramBotApi::class)->forBot('main');
$settings = BotSettingsRegistry::get('main');

$applier = new BotSettingsApplier($telegram);
$results = $applier->apply($settings);

foreach ($results as $key => $result) {
    if ($result['success']) {
        echo "✓ {$key}: Success\n";
    } else {
        echo "✗ {$key}: {$result['error']}\n";
    }
}
```

## CI/CD Automation

Add settings application to your deployment pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Apply bot settings
  run: php artisan hybridgram:settings:apply --all
  env:
    TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
```

## BotCommandScope

The `BotCommandScope` object represents the scope to which bot commands are applied. Currently, the following 7 scopes are supported:

- `BotCommandScopeDefault` - Default scope for all users
- `BotCommandScopeAllPrivateChats` - All private chats
- `BotCommandScopeAllGroupChats` - All group and supergroup chats
- `BotCommandScopeAllChatAdministrators` - All group and supergroup chat administrators
- `BotCommandScopeChat` - Specific chat
- `BotCommandScopeChatAdministrators` - Administrators of a specific chat
- `BotCommandScopeChatMember` - Specific member in a chat

### Determining List of Commands

The following algorithm is used to determine the list of commands for a particular user viewing the bot menu. The first list of commands which is set is returned:

**Commands in the chat with the bot:**

1. `botCommandScopeChat` + `language_code`
2. `botCommandScopeChat`
3. `botCommandScopeAllPrivateChats` + `language_code`
4. `botCommandScopeAllPrivateChats`
5. `botCommandScopeDefault` + `language_code`
6. `botCommandScopeDefault`

**Commands in group and supergroup chats:**

1. `botCommandScopeChatMember` + `language_code`
2. `botCommandScopeChatMember`
3. `botCommandScopeChatAdministrators` + `language_code` (administrators only)
4. `botCommandScopeChatAdministrators` (administrators only)
5. `botCommandScopeChat` + `language_code`
6. `botCommandScopeChat`
7. `botCommandScopeAllChatAdministrators` + `language_code` (administrators only)
8. `botCommandScopeAllChatAdministrators` (administrators only)
9. `botCommandScopeAllGroupChats` + `language_code`
10. `botCommandScopeAllGroupChats`
11. `botCommandScopeDefault` + `language_code`
12. `botCommandScopeDefault`

This means that more specific scopes take precedence over general ones, and language-specific commands take precedence over default (null language code) commands.

## What's Next?

- **[Middleware](/en/advanced/middleware/)** — using middleware for localization
- **[Multiple Bots](/en/advanced/multiple-bots/)** — managing multiple bots
- **[Sending Messages](/en/sending/telegram-bot-api/)** — working with TelegramBotApi
