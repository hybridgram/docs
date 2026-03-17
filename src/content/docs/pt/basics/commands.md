---
title: Manipulação de Comandos
description: Trabalhando com comandos de bot do Telegram
---

Comandos são a forma principal pela qual os usuários interagem com um bot. Comandos começam com `/` e frequentemente são usados para navegação e execução de ações.

## Uso Básico

### Comando Simples

O primeiro argumento é o manipulador (closure), o terceiro é o padrão do comando para correspondência:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\CommandData;

TelegramRouter::onCommand(function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $chatId = $data->getChat()->id;

    $telegram->sendMessage($chatId, 'Bem-vindo! 👋');
}, '*', '/start');
```

Ou via builder com bot especificado:

```php
TelegramRouter::forBot('main')->onCommand(function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $chatId = $data->getChat()->id;

    $telegram->sendMessage($chatId, 'Bem-vindo! 👋');
}, '/start');
```

### Comandos com Parâmetros

Comandos podem conter parâmetros que são passados no array `$data->commandParams`:

```php
TelegramRouter::onCommand(function(CommandData $data) {
    $chatId = $data->getChat()->id;
    $params = $data->commandParams; // ['123'] se o usuário digitou /user 123

    if (empty($params)) {
        $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
        $telegram->sendMessage($chatId, 'Por favor, especifique o ID do usuário: /user 123');
        return;
    }

    $userId = $params[0];
    // Processamento...
}, '*', '/user');
```

Se o usuário digitar `/user 123`, então `$data->commandParams` conterá `['123']`.

### Padrões em Comandos

Você pode usar padrões com `*` para uma manipulação mais flexível:

```php
// O comando /user:* manipulará /user com quaisquer parâmetros
TelegramRouter::onCommand(function(CommandData $data) {
    $userId = $data->commandParams[0] ?? null;
    // ...
}, '*', '/user:*');
```

### Acessando Dados do Comando

O objeto `CommandData` fornece:

```php
TelegramRouter::onCommand(function(CommandData $data) {
    // Comando
    $command = $data->command; // '/info'

    // Parâmetros do comando
    $params = $data->commandParams; // ['param1', 'param2']

    // Objeto Update completo
    $update = $data->update;

    // Chat e Usuário
    $chat = $data->getChat();
    $user = $data->getUser();

    // ID do Bot
    $botId = $data->botId;
}, '*', '/info');
```

## Usando Controladores

Em vez de closures, você pode usar controladores:

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
        $telegram->sendMessage($data->getChat()->id, 'Olá!');
    }
}
```

## Múltiplos Comandos

Você pode manipular múltiplos comandos com um único manipulador:

```php
$handler = function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $chatId = $data->getChat()->id;
    $message = match($data->command) {
        'start' => 'Bem-vindo!',
        'help' => 'Ajuda com comandos...',
        'info' => 'Informações do bot...',
        default => 'Comando desconhecido',
    };
    $telegram->sendMessage($chatId, $message);
};
TelegramRouter::onCommand($handler, '*', 'start');
TelegramRouter::onCommand($handler, '*', 'help');
TelegramRouter::onCommand($handler, '*', 'info');
```

## Comandos com Opções de Parâmetros

Você pode personalizar a manipulação de parâmetros:

```php
TelegramRouter::onCommand(function(CommandData $data) {
    // ...
}, '*', '/search', function($update, $params) {
    // Filtro personalizado: rota corresponde apenas se retornar true ou CommandData
    return count($params) > 0;
});
```

## Registrando Comandos no BotFather

Após criar comandos no código, registre-os em [@BotFather](https://t.me/botfather):

```
/setcommands
```

Em seguida, especifique a lista de comandos:

```
start - Começar a trabalhar com o bot
help - Obter ajuda
user - Informações do usuário
```

Isso tornará os comandos disponíveis no menu do Telegram.

## Exemplos

### Comando com Validação de Parâmetros

```php
TelegramRouter::onCommand(function(CommandData $data) {
    $params = $data->commandParams;
    $chatId = $data->getChat()->id;
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);

    if (count($params) < 2) {
        $telegram->sendMessage($chatId, 'Uso: /transfer <user_id> <amount>');
        return;
    }

    [$userId, $amount] = $params;

    if (!is_numeric($amount) || $amount <= 0) {
        $telegram->sendMessage($chatId, 'Valor inválido');
        return;
    }

    // Processamento de transferência...
}, '*', '/transfer');
```

### Comando com Estados

```php
TelegramRouter::onCommand(function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);

    // Definir estado para a próxima etapa
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $stateManager->setChatState($data->getChat(), 'awaiting_setting_choice');

    $keyboard = new \Phptg\BotApi\Type\ReplyKeyboardMarkup([
        [['text' => 'Idioma'], ['text' => 'Notificações']],
        [['text' => 'Cancelar']],
    ]);

    $telegram->sendMessage(
        $data->getChat()->id,
        'Escolha uma configuração:',
        replyMarkup: $keyboard
    );
}, '*', '/settings');
```

## O que vem a seguir?

- **[Manipulação de Mensagens](/pt/basics/messages/)** — trabalhando com mensagens de texto
- **[Estados](/pt/advanced/states/)** — gerenciando conversas através de estados
