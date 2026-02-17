---
title: Roteamento
description: Fundamentos da criação de rotas para lidar com atualizações do Telegram
---

O roteamento no TGbot Laravel permite que você defina manipuladores para vários tipos de atualizações do Telegram. A API é muito semelhante ao roteamento padrão do Laravel, tornando-a intuitiva.

## Conceitos Básicos

### Fachada TelegramRouter

Todas as rotas são registradas através da fachada `TelegramRouter`:

```php
use HybridGram\Facades\TelegramRouter;

TelegramRouter::onCommand('/start', function(CommandData $data) {
    // Manipular comando /start
});
```

### Estrutura do Manipulador

Os manipuladores de rota recebem um objeto de dados (por exemplo, `CommandData`, `TextMessageData`) que contém:
- `$data->update` — objeto Update completo do Telegram
- `$data->botId` — ID do bot para o qual a rota foi acionada
- `$data->getChat()` — objeto Chat
- `$data->getUser()` — objeto User
- Propriedades adicionais dependendo do tipo de dados

## Tipos de Rotas

### Comandos

Manipulação de comandos que começam com `/`:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\CommandData;

// Comando simples
TelegramRouter::onCommand('/start', function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->sendMessage($data->getChat()->id, 'Olá!');
});

// Comando com parâmetros
TelegramRouter::onCommand('/help', function(CommandData $data) {
    // $data->commandParams contém um array de argumentos após o comando
    $params = $data->arguments;
    // ...
});

// Comando para um bot específico
TelegramRouter::forBot('main')->onCommand('/start', function(CommandData $data) {
    // ...
});
```

### Mensagens

Manipulação de mensagens de texto:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\TextMessageData;

// Todas as mensagens
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    $message = $data->message;
    // ...
});

// Mensagens por padrão
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // ...
}, '*', 'olá'); // Padrão para verificar texto

// Verificação customizada via closure
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // ...
}, '*', function(TextMessageData $data) {
    return str_contains($data->message, 'olá');
});
```

### Consulta de Callback

Manipulação de cliques em botões inline:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\CallbackQueryData;

// Todas as consultas de callback
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $callbackQuery = $data->callbackQuery;
    $action = $data->action;
    $params = $data->params;
    // ...
});

// Consulta de callback por padrão (ex: action="menu:home")
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // ...
}, '*', 'menu:*');

// Com verificação de parâmetros de consulta
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // ...
}, '*', '*', ['category' => 'products']); // apenas se category=products existir
```

## Trabalhando com Múltiplos Bots

Se você tiver vários bots, pode especificar um bot específico:

```php
// Para um bot específico
TelegramRouter::forBot('main')->onCommand('/start', function(CommandData $data) {
    // ...
});

// Para todos os bots (padrão)
TelegramRouter::onCommand('/start', function(CommandData $data) {
    // ...
});
```

## Filtragem por Tipo de Chat

As rotas podem ser limitadas a tipos de chat específicos (privado, grupos, supergrupos, canais).

### Tipo de Chat Único

Use o método `chatType()` para especificar um único tipo de chat:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\ChatType;

// Rota apenas para chats privados (padrão para a maioria dos tipos)
TelegramRouter::forBot('main')
    ->chatType(ChatType::PRIVATE)
    ->onCommand('/start', function(CommandData $data) {
        // Manipular apenas em chats privados
    });

// Rota apenas para grupos
TelegramRouter::forBot('main')
    ->chatType(ChatType::GROUP)
    ->onTextMessage(function(\HybridGram\Core\Routing\RouteData\TextMessageData $data) {
        // Manipular apenas em grupos
    });
```

### Múltiplos Tipos de Chat

Use o método `chatTypes()` para especificar múltiplos tipos de chat:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\ChatType;

// Rota funciona em chats privados e grupos
TelegramRouter::forBot('main')
    ->chatTypes([ChatType::PRIVATE, ChatType::GROUP])
    ->onCommand('/help', function(CommandData $data) {
        // Manipular em chats privados e grupos
    });

// Rota funciona em todos os tipos de chat
TelegramRouter::forBot('main')
    ->chatTypes(null) // ou não especificar para eventos de grupo
    ->onMyChatMember(function(ChatMemberUpdatedData $data) {
        // Manipular em todos os tipos de chat
    });
```

### Padrões Inteligentes

O sistema automaticamente define padrões razoáveis dependendo do tipo de rota:

**Rotas que funcionam em todos os tipos de chat por padrão:**
- `onMyChatMember()` — mudanças de status do bot
- `onChatMember()` — mudanças de status de membros
- `onNewChatTitle()` — mudanças no título do chat
- `onNewChatPhoto()` — mudanças na foto do chat
- `onDeleteChatPhoto()` — exclusão de foto do chat
- `onPinnedMessage()` — fixação de mensagem
- `onForumTopicEvent()` — eventos de tópico do fórum
- `onGeneralForumTopicEvent()` — eventos de tópico geral
- `onMessageAutoDeleteTimerChanged()` — mudanças no timer de auto-exclusão
- `onBoostAdded()` — boost adicionado

**Outras rotas funcionam apenas em chats privados por padrão:**
- `onCommand()` — comandos
- `onMessage()` — mensagens
- `onCallbackQuery()` — consultas de callback
- E outros...

```php
// Funciona em todos os tipos de chat (padrão para MY_CHAT_MEMBER)
TelegramRouter::onMyChatMember(function(ChatMemberUpdatedData $data) {
    // Manipular bot adicionado a grupo/canal
});

// Funciona apenas em chats privados (padrão para COMMAND)
TelegramRouter::onCommand('/start', function(CommandData $data) {
    // Manipular comando
});

// Especificar explicitamente múltiplos tipos para comando
TelegramRouter::forBot('main')
    ->chatTypes([ChatType::PRIVATE, ChatType::GROUP])
    ->onCommand('/admin', function(CommandData $data) {
        // Comando funciona em chats privados e grupos
    });
```

### Tipos de Chat

Tipos de chat disponíveis:

```php
use HybridGram\Core\Routing\ChatType;

ChatType::PRIVATE      // Chats privados
ChatType::GROUP        // Grupos
ChatType::SUPERGROUP   // Supergrupos
ChatType::CHANNEL      // Canais
```

## Agrupamento de Rotas

Você pode agrupar rotas com atributos comuns, incluindo tipo de chat:

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\ChatType;

TelegramRouter::group([
    'for_bot' => 'main',
    'chat_type' => ChatType::GROUP, // Tipo único
    'middlewares' => [AuthTelegramRouteMiddleware::class],
], function($router) {
    $router->onCommand('/admin', function(CommandData $data) {
        // ...
    });
});

// Ou múltiplos tipos
TelegramRouter::group([
    'for_bot' => 'main',
    'chat_type' => [ChatType::PRIVATE, ChatType::GROUP], // Array de tipos
], function($router) {
    $router->onTextMessage(function(TextMessageData $data) {
        // ...
    });
});
```

## Padrões e Filtragem

### Padrões de String

Muitos tipos de rota suportam padrões de string usando `*`:

```php
// Comando com parâmetros
TelegramRouter::onCommand('/user:*', function(CommandData $data) {
    $userId = $data->commandParams[0] ?? null;
    // ...
});

// Consulta de callback
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // $data->action conterá "menu:products"
    // $data->params conterá ['category' => 'electronics']
}, '*', 'menu:*', ['category' => null]); // category deve estar presente
```

### Padrões de Closure

Para lógica mais complexa, use closures:

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // ...
}, '*', function(TextMessageData $data) {
    // Retornar true se a rota deve ser acionada
    return $data->message->text !== null
        && strlen($data->message->text) > 100;
});
```

## Tipos de Rotas Adicionais

O pacote suporta muitos outros tipos de atualização:

- `onPhoto` — fotos
- `onDocument` — documentos
- `onLocation` — geolocalização
- `onContact` — contatos
- `onPoll` — pesquisas
- `onInlineQuery` — consultas inline
- `onAny` — qualquer atualização
- E muito mais

Veja as seções correspondentes para detalhes sobre cada tipo.

## Rotas de Fallback

Uma rota que é acionada quando nenhum manipulador adequado é encontrado:

```php
TelegramRouter::onFallback(function(FallbackData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->sendMessage($data->getChat()->id, 'Comando não reconhecido');
});
```

Em modo de desenvolvimento (`app()->isLocal()`) o fallback envia automaticamente informações de estado para depuração.

## Alternativa: Atributos PHP

Se você preferir uma abordagem mais moderna, baseada em atributos, para o roteamento, pode usar atributos PHP 8 em vez da fachada. Isso mantém as definições de rota próximas aos seus métodos manipuladores:

```php
#[OnCommand('/start')]
public function handleStart(CommandData $data): void {
    // Manipular comando /start
}
```

**[→ Aprenda sobre Roteamento com Atributos PHP](/pt/routing/attributes/)**

## Próximos Passos

- **[Manipulação de Comandos](/pt/basics/commands/)** — trabalho detalhado com comandos
- **[Manipulação de Mensagens](/pt/basics/messages/)** — trabalho com mensagens de texto
- **[Consulta de Callback](/pt/basics/callback-query/)** — manipulação de cliques em botões
- **[Roteamento com Atributos PHP](/pt/routing/attributes/)** — roteamento moderno baseado em atributos
