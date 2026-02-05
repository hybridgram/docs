---
title: Настройки бота
description: Мультиязычная конфигурация настроек Telegram бота
---

HybridGram предоставляет fluent API для настройки мультиязычных параметров Telegram бота: описание, имя, команды меню, права администратора и кнопка меню.

## Основные концепции

### BotSettings Builder

Класс `BotSettings` предоставляет fluent-интерфейс для определения настроек бота:

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

### Локализованные строки

Все текстовые параметры принимают отдельные вызовы методов с кодами языков:

```php
// Передайте null или опустите languageCode для значения по умолчанию (применяется ко всем пользователям)
$settings
    ->description('Default description')           // По умолчанию (null languageCode)
    ->description('Описание на русском', 'ru')     // Для русского языка
    ->description('Опис українською', 'uk');      // Для украинского
```

**Важно:** Чтобы установить значение по умолчанию, которое применяется ко всем пользователям независимо от их языка, передайте `null` в качестве параметра `languageCode` (или опустите его, так как `null` является значением по умолчанию).

## Доступные настройки

### Описание бота

```php
$settings
    // Полное описание (до 512 символов)
    ->description('Full bot description that appears in the bot profile')
    ->description('Полное описание бота, отображаемое в профиле', 'ru')
    // Короткое описание (до 120 символов)
    ->shortDescription('Short description for sharing')
    ->shortDescription('Краткое описание для репостов', 'ru');
```

**Примечание:** Передайте `null` в качестве `languageCode` (или опустите его) для установки значения по умолчанию, которое применяется ко всем пользователям.

### Имя бота

```php
$settings
    ->name('My Awesome Bot')
    ->name('Мой Крутой Бот', 'ru');
```

**Примечание:** Передайте `null` в качестве `languageCode` (или опустите его) для установки значения по умолчанию, которое применяется ко всем пользователям.

### Команды меню

```php
use Phptg\BotApi\Type\BotCommand;
use Phptg\BotApi\Type\BotCommandScope\BotCommandScopeDefault;
use Phptg\BotApi\Type\BotCommandScope\BotCommandScopeAllGroupChats;
use Phptg\BotApi\Type\BotCommandScope\BotCommandScopeAllPrivateChats;
use Phptg\BotApi\Type\BotCommandScope\BotCommandScopeAllChatAdministrators;

$settings
    // Команды для всех пользователей (область по умолчанию, язык по умолчанию)
    ->commands([
        new BotCommand('start', 'Start the bot'),
        new BotCommand('help', 'Get help'),
    ])
    // Команды для русскоязычных пользователей (область по умолчанию, русский язык)
    ->commands([
        new BotCommand('start', 'Запустить бота'),
        new BotCommand('help', 'Получить помощь'),
    ], null, 'ru')
    // Команды только для администраторов групп
    ->commands([
        new BotCommand('ban', 'Ban a user'),
        new BotCommand('settings', 'Group settings'),
    ], new BotCommandScopeAllChatAdministrators())
    // Команды для приватных чатов
    ->commands([
        new BotCommand('profile', 'Your profile'),
        new BotCommand('settings', 'Personal settings'),
    ], new BotCommandScopeAllPrivateChats());
```

**Примечание:** 
- Передайте `null` в качестве `languageCode` (или опустите его) для установки значения по умолчанию, которое применяется ко всем пользователям.
- Передайте `null` в качестве `scope` (или опустите его) для использования области по умолчанию (`BotCommandScopeDefault`).

### Кнопка меню

```php
use Phptg\BotApi\Type\MenuButton\MenuButtonCommands;
use Phptg\BotApi\Type\MenuButton\MenuButtonWebApp;
use Phptg\BotApi\Type\WebAppInfo;

// Стандартное меню команд
$settings->menuButton(new MenuButtonCommands());

// Или кнопка WebApp
$settings->menuButton(new MenuButtonWebApp(
    text: 'Open App',
    webApp: new WebAppInfo(url: 'https://example.com/app')
));
```

### Права администратора по умолчанию

```php
use Phptg\BotApi\Type\ChatAdministratorRights;

$settings
    // Права в группах
    ->defaultAdministratorRights(new ChatAdministratorRights(
        canDeleteMessages: true,
        canRestrictMembers: true,
        canPinMessages: true,
    ))
    // Права в каналах
    ->defaultAdministratorRightsForChannels(new ChatAdministratorRights(
        canPostMessages: true,
        canEditMessages: true,
    ));
```

## Регистрация настроек

### BotSettingsRegistry

Зарегистрируйте настройки для каждого бота через `BotSettingsRegistry::forBot()`:

```php
use HybridGram\Core\Config\BotSettings\BotSettings;
use HybridGram\Core\Config\BotSettings\BotSettingsRegistry;
use Phptg\BotApi\Type\BotCommand;

// В вашем ServiceProvider или bootstrap файле
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

## Применение настроек

### Консольная команда

HybridGram предоставляет Artisan-команду для применения настроек:

```bash
# Применить настройки для конкретного бота
php artisan hybridgram:settings:apply --bot=main

# Применить настройки для всех зарегистрированных ботов
php artisan hybridgram:settings:apply --all

# Предварительный просмотр без применения (dry-run)
php artisan hybridgram:settings:apply --bot=main --dry-run
```

### Программное применение

Для применения настроек программно используйте `BotSettingsApplier`:

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

## Полный пример

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use HybridGram\Core\Config\BotSettings\BotSettings;
use HybridGram\Core\Config\BotSettings\BotSettingsRegistry;
use Phptg\BotApi\Type\BotCommand;
use Phptg\BotApi\Type\BotCommandScope\BotCommandScopeAllChatAdministrators;
use Phptg\BotApi\Type\MenuButton\MenuButtonCommands;
use Phptg\BotApi\Type\ChatAdministratorRights;

class TelegramBotServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->registerBotSettings();
    }
    
    private function registerBotSettings(): void
    {
        BotSettingsRegistry::forBot('main', function(): BotSettings {
            return BotSettings::create()
                // Описания
                ->description('Your smart assistant for daily tasks')
                ->description('Ваш умный помощник для ежедневных задач', 'ru')
                ->description('Ваш розумний помічник для щоденних завдань', 'uk')
                ->shortDescription('Smart Assistant')
                ->shortDescription('Умный Помощник', 'ru')
                ->shortDescription('Розумний Помічник', 'uk')
                
                // Имя бота
                ->name('Smart Assistant')
                ->name('Умный Помощник', 'ru')
                ->name('Розумний Помічник', 'uk')
                
                // Команды меню
                ->commands([
                    new BotCommand('start', 'Start the bot'),
                    new BotCommand('help', 'Show help'),
                    new BotCommand('settings', 'Open settings'),
                ])
                ->commands([
                    new BotCommand('start', 'Запустить бота'),
                    new BotCommand('help', 'Показать справку'),
                    new BotCommand('settings', 'Открыть настройки'),
                ], null, 'ru')
                ->commands([
                    new BotCommand('start', 'Запустити бота'),
                    new BotCommand('help', 'Показати довідку'),
                    new BotCommand('settings', 'Відкрити налаштування'),
                ], null, 'uk')
                ->commands([
                    new BotCommand('config', 'Configure group'),
                    new BotCommand('stats', 'Group statistics'),
                ], new BotCommandScopeAllChatAdministrators())
                ->commands([
                    new BotCommand('config', 'Настроить группу'),
                    new BotCommand('stats', 'Статистика группы'),
                ], new BotCommandScopeAllChatAdministrators(), 'ru')
                
                // Кнопка меню
                ->menuButton(new MenuButtonCommands())
                
                // Права администратора
                ->defaultAdministratorRights(new ChatAdministratorRights(
                    canDeleteMessages: true,
                    canRestrictMembers: true,
                    canPinMessages: true,
                    canManageChat: true,
                ));
        });
    }
}
```

## Автоматизация через CI/CD

Добавьте применение настроек в ваш deployment pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Apply bot settings
  run: php artisan hybridgram:settings:apply --all
  env:
    TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
```

## BotCommandScope

Объект `BotCommandScope` представляет область применения команд бота. В настоящее время поддерживаются следующие 7 областей:

- `BotCommandScopeDefault` - Область по умолчанию для всех пользователей
- `BotCommandScopeAllPrivateChats` - Все приватные чаты
- `BotCommandScopeAllGroupChats` - Все групповые и супергрупповые чаты
- `BotCommandScopeAllChatAdministrators` - Все администраторы групповых и супергрупповых чатов
- `BotCommandScopeChat` - Конкретный чат
- `BotCommandScopeChatAdministrators` - Администраторы конкретного чата
- `BotCommandScopeChatMember` - Конкретный участник в чате

### Определение списка команд

Следующий алгоритм используется для определения списка команд для конкретного пользователя, просматривающего меню бота. Возвращается первый найденный список команд:

**Команды в чате с ботом:**

1. `botCommandScopeChat` + `language_code`
2. `botCommandScopeChat`
3. `botCommandScopeAllPrivateChats` + `language_code`
4. `botCommandScopeAllPrivateChats`
5. `botCommandScopeDefault` + `language_code`
6. `botCommandScopeDefault`

**Команды в групповых и супергрупповых чатах:**

1. `botCommandScopeChatMember` + `language_code`
2. `botCommandScopeChatMember`
3. `botCommandScopeChatAdministrators` + `language_code` (только для администраторов)
4. `botCommandScopeChatAdministrators` (только для администраторов)
5. `botCommandScopeChat` + `language_code`
6. `botCommandScopeChat`
7. `botCommandScopeAllChatAdministrators` + `language_code` (только для администраторов)
8. `botCommandScopeAllChatAdministrators` (только для администраторов)
9. `botCommandScopeAllGroupChats` + `language_code`
10. `botCommandScopeAllGroupChats`
11. `botCommandScopeDefault` + `language_code`
12. `botCommandScopeDefault`

Это означает, что более специфичные области имеют приоритет над общими, а команды для конкретного языка имеют приоритет над командами по умолчанию (null language code).

## Что дальше?

- **[Middleware](/ru/advanced/middleware/)** — использование middleware для локализации
- **[Несколько ботов](/ru/advanced/multiple-bots/)** — управление несколькими ботами
- **[Отправка сообщений](/ru/sending/telegram-bot-api/)** — работа с TelegramBotApi
