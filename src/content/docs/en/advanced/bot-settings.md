---
title: Bot Settings
description: Multilingual configuration of Telegram bot settings
---

HybridGram provides a fluent API for configuring multilingual Telegram bot parameters: description, name, menu commands, admin rights, and menu button.

## Basic Concepts

### BotSettings Builder

The `BotSettings` class provides a fluent interface for defining bot settings:

```php
use HybridGram\Bot\Settings\BotSettings;

$settings = BotSettings::make()
    ->description([
        'en' => 'Your personal assistant bot',
        'ru' => 'Ваш персональный бот-помощник',
    ])
    ->shortDescription([
        'en' => 'Assistant Bot',
        'ru' => 'Бот-помощник',
    ])
    ->name([
        'en' => 'Assistant Bot',
        'ru' => 'Бот Помощник',
    ]);
```

### Localized Strings

All text parameters accept an array with localizations:

```php
// Key '' (empty string) — default value for all languages
$settings->description([
    '' => 'Default description',     // Default
    'ru' => 'Описание на русском',   // For Russian
    'uk' => 'Опис українською',      // For Ukrainian
]);
```

## Available Settings

### Bot Description

```php
$settings
    // Full description (up to 512 characters)
    ->description([
        'en' => 'Full bot description that appears in the bot profile',
        'ru' => 'Полное описание бота, отображаемое в профиле',
    ])
    // Short description (up to 120 characters)
    ->shortDescription([
        'en' => 'Short description for sharing',
        'ru' => 'Краткое описание для репостов',
    ]);
```

### Bot Name

```php
$settings->name([
    'en' => 'My Awesome Bot',
    'ru' => 'Мой Крутой Бот',
]);
```

### Menu Commands

```php
use HybridGram\Bot\Settings\BotCommandScope;

$settings->commands([
    // Commands for all users
    BotCommandScope::default() => [
        '' => [ // Default language
            '/start' => 'Start the bot',
            '/help' => 'Get help',
        ],
        'ru' => [
            '/start' => 'Запустить бота',
            '/help' => 'Получить помощь',
        ],
    ],
    
    // Commands only for group admins
    BotCommandScope::allGroupChatsAdmins() => [
        '' => [
            '/ban' => 'Ban a user',
            '/settings' => 'Group settings',
        ],
        'ru' => [
            '/ban' => 'Заблокировать пользователя',
            '/settings' => 'Настройки группы',
        ],
    ],
    
    // Commands for private chats
    BotCommandScope::allPrivateChats() => [
        '' => [
            '/profile' => 'Your profile',
            '/settings' => 'Personal settings',
        ],
    ],
]);
```

### Menu Button

```php
use Phptg\BotApi\Type\MenuButton\MenuButtonCommands;
use Phptg\BotApi\Type\MenuButton\MenuButtonWebApp;

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
    ->defaultGroupAdminRights(new ChatAdministratorRights(
        canDeleteMessages: true,
        canRestrictMembers: true,
        canPinMessages: true,
    ))
    // Rights in channels
    ->defaultChannelAdminRights(new ChatAdministratorRights(
        canPostMessages: true,
        canEditMessages: true,
    ));
```

## Registering Settings

### BotSettingsRegistry

Register settings for each bot through `BotSettingsRegistry`:

```php
use HybridGram\Bot\Settings\BotSettingsRegistry;
use HybridGram\Bot\Settings\BotSettings;

// In your ServiceProvider or bootstrap file
BotSettingsRegistry::register('main', function(): BotSettings {
    return BotSettings::make()
        ->description([
            'en' => 'Main production bot',
            'ru' => 'Основной продакшн бот',
        ])
        ->commands([
            BotCommandScope::default() => [
                '' => [
                    '/start' => 'Start',
                    '/help' => 'Help',
                ],
                'ru' => [
                    '/start' => 'Начать',
                    '/help' => 'Помощь',
                ],
            ],
        ]);
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
use HybridGram\Bot\Settings\BotSettingsApplier;
use HybridGram\Telegram\TelegramBotApi;

$telegram = app(TelegramBotApi::class)->forBot('main');
$settings = BotSettingsRegistry::get('main');

$applier = new BotSettingsApplier($telegram);
$results = $applier->apply($settings);

foreach ($results as $result) {
    if ($result->success) {
        echo "✓ {$result->operation}: Success\n";
    } else {
        echo "✗ {$result->operation}: {$result->error}\n";
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

## What's Next?

- **[Middleware](/en/advanced/middleware/)** — using middleware for localization
- **[Multiple Bots](/en/advanced/multiple-bots/)** — managing multiple bots
- **[Sending Messages](/en/sending/telegram-bot-api/)** — working with TelegramBotApi
