---
title: Настройки бота
description: Мультиязычная конфигурация настроек Telegram бота
---

HybridGram предоставляет fluent API для настройки мультиязычных параметров Telegram бота: описание, имя, команды меню, права администратора и кнопка меню.

## Основные концепции

### BotSettings Builder

Класс `BotSettings` предоставляет fluent-интерфейс для определения настроек бота:

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

### Локализованные строки

Все текстовые параметры принимают массив с локализациями:

```php
// Ключ '' (пустая строка) — значение по умолчанию для всех языков
$settings->description([
    '' => 'Default description',     // По умолчанию
    'ru' => 'Описание на русском',   // Для русского языка
    'uk' => 'Опис українською',      // Для украинского
]);
```

## Доступные настройки

### Описание бота

```php
$settings
    // Полное описание (до 512 символов)
    ->description([
        'en' => 'Full bot description that appears in the bot profile',
        'ru' => 'Полное описание бота, отображаемое в профиле',
    ])
    // Короткое описание (до 120 символов)
    ->shortDescription([
        'en' => 'Short description for sharing',
        'ru' => 'Краткое описание для репостов',
    ]);
```

### Имя бота

```php
$settings->name([
    'en' => 'My Awesome Bot',
    'ru' => 'Мой Крутой Бот',
]);
```

### Команды меню

```php
use HybridGram\Bot\Settings\BotCommandScope;

$settings->commands([
    // Команды для всех пользователей
    BotCommandScope::default() => [
        '' => [ // Язык по умолчанию
            '/start' => 'Start the bot',
            '/help' => 'Get help',
        ],
        'ru' => [
            '/start' => 'Запустить бота',
            '/help' => 'Получить помощь',
        ],
    ],
    
    // Команды только для администраторов групп
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
    
    // Команды для приватных чатов
    BotCommandScope::allPrivateChats() => [
        '' => [
            '/profile' => 'Your profile',
            '/settings' => 'Personal settings',
        ],
    ],
]);
```

### Кнопка меню

```php
use Phptg\BotApi\Type\MenuButton\MenuButtonCommands;
use Phptg\BotApi\Type\MenuButton\MenuButtonWebApp;

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
    ->defaultGroupAdminRights(new ChatAdministratorRights(
        canDeleteMessages: true,
        canRestrictMembers: true,
        canPinMessages: true,
    ))
    // Права в каналах
    ->defaultChannelAdminRights(new ChatAdministratorRights(
        canPostMessages: true,
        canEditMessages: true,
    ));
```

## Регистрация настроек

### BotSettingsRegistry

Зарегистрируйте настройки для каждого бота через `BotSettingsRegistry`:

```php
use HybridGram\Bot\Settings\BotSettingsRegistry;
use HybridGram\Bot\Settings\BotSettings;

// В вашем ServiceProvider или bootstrap файле
BotSettingsRegistry::register('main', function(): BotSettings {
    return BotSettings::make()
        ->description([
            'en' => 'Main production bot',
            'ru' => 'Основной продакшн бот',
        ])
        ->shortDescription([
            'en' => 'Main Bot',
            'ru' => 'Главный Бот',
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

// Регистрация для другого бота
BotSettingsRegistry::register('support', function(): BotSettings {
    return BotSettings::make()
        ->description([
            'en' => 'Support bot for customer service',
            'ru' => 'Бот поддержки для обслуживания клиентов',
        ]);
});
```

### Получение зарегистрированных ботов

```php
// Получить список ID всех зарегистрированных ботов
$botIds = BotSettingsRegistry::registeredBots();
// ['main', 'support']

// Получить настройки конкретного бота
$settings = BotSettingsRegistry::get('main');

// Проверить, зарегистрирован ли бот
if (BotSettingsRegistry::has('main')) {
    // ...
}

// Очистить все регистрации (для тестов)
BotSettingsRegistry::clear();
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

#### Вывод команды

Команда выводит детальный отчёт о каждой операции:

```
Applying settings for bot: main

✓ setMyDescription (en): Success
✓ setMyDescription (ru): Success
✓ setMyShortDescription (en): Success
✓ setMyShortDescription (ru): Success
✓ setMyName (en): Success
✓ setMyCommands (default, en): Success
✓ setMyCommands (default, ru): Success

Settings applied successfully!
```

### Программное применение

Для применения настроек программно используйте `BotSettingsApplier`:

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

## Полный пример

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use HybridGram\Bot\Settings\BotSettings;
use HybridGram\Bot\Settings\BotSettingsRegistry;
use HybridGram\Bot\Settings\BotCommandScope;
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
        BotSettingsRegistry::register('main', function(): BotSettings {
            return BotSettings::make()
                // Описания
                ->description([
                    '' => 'Your smart assistant for daily tasks',
                    'ru' => 'Ваш умный помощник для ежедневных задач',
                    'uk' => 'Ваш розумний помічник для щоденних завдань',
                ])
                ->shortDescription([
                    '' => 'Smart Assistant',
                    'ru' => 'Умный Помощник',
                    'uk' => 'Розумний Помічник',
                ])
                
                // Имя бота
                ->name([
                    '' => 'Smart Assistant',
                    'ru' => 'Умный Помощник',
                    'uk' => 'Розумний Помічник',
                ])
                
                // Команды меню
                ->commands([
                    BotCommandScope::default() => [
                        '' => [
                            '/start' => 'Start the bot',
                            '/help' => 'Show help',
                            '/settings' => 'Open settings',
                        ],
                        'ru' => [
                            '/start' => 'Запустить бота',
                            '/help' => 'Показать справку',
                            '/settings' => 'Открыть настройки',
                        ],
                        'uk' => [
                            '/start' => 'Запустити бота',
                            '/help' => 'Показати довідку',
                            '/settings' => 'Відкрити налаштування',
                        ],
                    ],
                    BotCommandScope::allGroupChatsAdmins() => [
                        '' => [
                            '/config' => 'Configure group',
                            '/stats' => 'Group statistics',
                        ],
                        'ru' => [
                            '/config' => 'Настроить группу',
                            '/stats' => 'Статистика группы',
                        ],
                    ],
                ])
                
                // Кнопка меню
                ->menuButton(new MenuButtonCommands())
                
                // Права администратора
                ->defaultGroupAdminRights(new ChatAdministratorRights(
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

## Что дальше?

- **[Middleware](/ru/advanced/middleware/)** — использование middleware для локализации
- **[Несколько ботов](/ru/advanced/multiple-bots/)** — управление несколькими ботами
- **[Отправка сообщений](/ru/sending/telegram-bot-api/)** — работа с TelegramBotApi
