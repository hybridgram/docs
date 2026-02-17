---
title: Configurações do Bot
description: Configuração multilíngue de parâmetros do bot Telegram
---

HybridGram fornece uma API fluente para configurar parâmetros multilingues do bot Telegram: descrição, nome, comandos de menu, direitos de administrador e botão de menu.

## Conceitos Básicos

### BotSettings Builder

A classe `BotSettings` fornece uma interface fluente para definir as configurações do bot:

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

### Strings Localizadas

Todos os parâmetros de texto aceitam chamadas de método individuais com códigos de idioma:

```php
// Passe null ou omita languageCode para o valor padrão (se aplica a todos os usuários)
$settings
    ->description('Default description')           // Padrão (null languageCode)
    ->description('Описание на русском', 'ru')     // Para russo
    ->description('Опис українською', 'uk');      // Para ucraniano
```

**Importante:** Para definir um valor padrão que se aplique a todos os usuários independentemente do idioma, passe `null` como o parâmetro `languageCode` (ou omita-o, pois `null` é o padrão).

## Configurações Disponíveis

### Descrição do Bot

```php
$settings
    // Descrição completa (até 512 caracteres)
    ->description('Full bot description that appears in the bot profile')
    ->description('Полное описание бота, отображаемое в профиле', 'ru')
    // Descrição curta (até 120 caracteres)
    ->shortDescription('Short description for sharing')
    ->shortDescription('Краткое описание для репостов', 'ru');
```

**Observação:** Passe `null` como `languageCode` (ou omita-o) para definir o valor padrão que se aplica a todos os usuários.

### Nome do Bot

```php
$settings
    ->name('My Awesome Bot')
    ->name('Мой Крутой Бот', 'ru');
```

**Observação:** Passe `null` como `languageCode` (ou omita-o) para definir o valor padrão que se aplica a todos os usuários.

### Comandos de Menu

```php
use Phptg\BotApi\Type\BotCommand;
use Phptg\BotApi\Type\BotCommandScope\BotCommandScopeDefault;
use Phptg\BotApi\Type\BotCommandScope\BotCommandScopeAllGroupChats;
use Phptg\BotApi\Type\BotCommandScope\BotCommandScopeAllPrivateChats;
use Phptg\BotApi\Type\BotCommandScope\BotCommandScopeAllChatAdministrators;

$settings
    // Comandos para todos os usuários (escopo padrão, idioma padrão)
    ->commands([
        new BotCommand('start', 'Start the bot'),
        new BotCommand('help', 'Get help'),
    ])
    // Comandos para usuários em russo (escopo padrão, idioma russo)
    ->commands([
        new BotCommand('start', 'Запустить бота'),
        new BotCommand('help', 'Получить помощь'),
    ], null, 'ru')
    // Comandos apenas para administradores de grupo
    ->commands([
        new BotCommand('ban', 'Ban a user'),
        new BotCommand('settings', 'Group settings'),
    ], new BotCommandScopeAllChatAdministrators())
    // Comandos para chats privados
    ->commands([
        new BotCommand('profile', 'Your profile'),
        new BotCommand('settings', 'Personal settings'),
    ], new BotCommandScopeAllPrivateChats());
```

**Observação:**
- Passe `null` como `languageCode` (ou omita-o) para definir o valor padrão que se aplica a todos os usuários.
- Passe `null` como `scope` (ou omita-o) para usar o escopo padrão (`BotCommandScopeDefault`).

### Botão de Menu

```php
use Phptg\BotApi\Type\MenuButton\MenuButtonCommands;
use Phptg\BotApi\Type\MenuButton\MenuButtonWebApp;
use Phptg\BotApi\Type\WebAppInfo;

// Menu de comando padrão
$settings->menuButton(new MenuButtonCommands());

// Ou botão WebApp
$settings->menuButton(new MenuButtonWebApp(
    text: 'Open App',
    webApp: new WebAppInfo(url: 'https://example.com/app')
));
```

### Direitos Padrão de Administrador

```php
use Phptg\BotApi\Type\ChatAdministratorRights;

$settings
    // Direitos em grupos
    ->defaultAdministratorRights(new ChatAdministratorRights(
        canDeleteMessages: true,
        canRestrictMembers: true,
        canPinMessages: true,
    ))
    // Direitos em canais
    ->defaultAdministratorRightsForChannels(new ChatAdministratorRights(
        canPostMessages: true,
        canEditMessages: true,
    ));
```

## Registrando Configurações

### BotSettingsRegistry

Registre as configurações para cada bot através de `BotSettingsRegistry::forBot()`:

```php
use HybridGram\Core\Config\BotSettings\BotSettings;
use HybridGram\Core\Config\BotSettings\BotSettingsRegistry;
use Phptg\BotApi\Type\BotCommand;

// No seu ServiceProvider ou arquivo de inicialização
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

## Aplicando Configurações

### Comando Console

HybridGram fornece um comando Artisan para aplicar configurações:

```bash
# Aplicar configurações para bot específico
php artisan hybridgram:settings:apply --bot=main

# Aplicar configurações para todos os bots registrados
php artisan hybridgram:settings:apply --all

# Visualizar sem aplicar (dry-run)
php artisan hybridgram:settings:apply --bot=main --dry-run
```

### Aplicação Programática

Para aplicar configurações programaticamente, use `BotSettingsApplier`:

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

## Automação CI/CD

Adicione a aplicação de configurações ao seu pipeline de implantação:

```yaml
# .github/workflows/deploy.yml
- name: Apply bot settings
  run: php artisan hybridgram:settings:apply --all
  env:
    TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
```

## BotCommandScope

O objeto `BotCommandScope` representa o escopo ao qual os comandos do bot são aplicados. Atualmente, são suportados os seguintes 7 escopos:

- `BotCommandScopeDefault` - Escopo padrão para todos os usuários
- `BotCommandScopeAllPrivateChats` - Todos os chats privados
- `BotCommandScopeAllGroupChats` - Todos os chats de grupo e supergrupo
- `BotCommandScopeAllChatAdministrators` - Todos os administradores de chats de grupo e supergrupo
- `BotCommandScopeChat` - Chat específico
- `BotCommandScopeChatAdministrators` - Administradores de um chat específico
- `BotCommandScopeChatMember` - Membro específico em um chat

### Determinando Lista de Comandos

O seguinte algoritmo é usado para determinar a lista de comandos para um usuário específico visualizando o menu do bot. A primeira lista de comandos que é definida é retornada:

**Comandos no chat com o bot:**

1. `botCommandScopeChat` + `language_code`
2. `botCommandScopeChat`
3. `botCommandScopeAllPrivateChats` + `language_code`
4. `botCommandScopeAllPrivateChats`
5. `botCommandScopeDefault` + `language_code`
6. `botCommandScopeDefault`

**Comandos em chats de grupo e supergrupo:**

1. `botCommandScopeChatMember` + `language_code`
2. `botCommandScopeChatMember`
3. `botCommandScopeChatAdministrators` + `language_code` (apenas administradores)
4. `botCommandScopeChatAdministrators` (apenas administradores)
5. `botCommandScopeChat` + `language_code`
6. `botCommandScopeChat`
7. `botCommandScopeAllChatAdministrators` + `language_code` (apenas administradores)
8. `botCommandScopeAllChatAdministrators` (apenas administradores)
9. `botCommandScopeAllGroupChats` + `language_code`
10. `botCommandScopeAllGroupChats`
11. `botCommandScopeDefault` + `language_code`
12. `botCommandScopeDefault`

Isso significa que escopos mais específicos têm precedência sobre os gerais, e comandos específicos de idioma têm precedência sobre comandos padrão (null language code).

## Próximos Passos

- **[Middleware](/pt/advanced/middleware/)** — usando middleware para localização
- **[Múltiplos Bots](/pt/advanced/multiple-bots/)** — gerenciando múltiplos bots
- **[Enviando Mensagens](/pt/sending/telegram-bot-api/)** — trabalhando com TelegramBotApi
