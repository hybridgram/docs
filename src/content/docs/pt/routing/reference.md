---
title: Referência de Roteamento
description: Lista completa de todos os métodos de roteamento da fachada TelegramRouter
---

# Referência de Roteamento

Esta seção contém uma lista completa de todos os métodos de roteamento disponíveis na fachada `TelegramRouter`. Cada método descreve quais parâmetros ele aceita, a quais eventos do Telegram ele responde e quais dados são passados para o manipulador.

> **Nota:** Se você prefere uma abordagem mais moderna, também pode definir rotas usando atributos PHP 8. Veja **[Roteamento com Atributos PHP](/pt/routing/attributes/)** para uma abordagem alternativa para registro de rotas.

## Parâmetros Comuns

A maioria dos métodos de roteamento aceita os seguintes parâmetros comuns:

- **`$action`** (`array|string|\Closure`) — manipulador da rota. Pode ser:
  - Closure/função
  - String no formato `'Controller@method'`
  - Array `[Controller::class, 'method']`
- **`$botId`** (`string`, padrão `'*'`) — ID do bot para o qual a rota está registrada. `'*'` significa todos os bots
- **`$pattern`** (`\Closure|string|null`) — padrão para filtragem. Pode ser:
  - String com suporte a `*` (curinga)
  - Closure para validação customizada
  - `null` ou `'*'` para lidar com todos os eventos deste tipo

Todos os manipuladores recebem um objeto de dados que herda de `AbstractRouteData` (namespace `HybridGram\Core\Routing\RouteData`) e contém:
- `$data->update` — objeto `Update` completo do Telegram
- `$data->botId` — ID do bot
- `$data->getChat()` — método para obter objeto `Chat`
- `$data->getUser()` — método para obter objeto `User`
- `$data->getChatId()` — ID do chat (ou `null`)
- `$data->getUserId()` — ID do usuário (ou `null`)

## Comandos e Mensagens

### `onCommand()`

Manipula comandos que começam com `/`.

**Parâmetros:**
- `$action` — manipulador
- `$botId` (padrão `'*'`) — ID do bot
- `$pattern` (padrão `null`) — padrão do comando (ex: `'/start'`, `'/user:*'`)
- `$commandParamOptions` (`?\Closure`) — filtro opcional por parâmetros do comando

**Evento:** `message.text` começa com `/`

**Dados:** `CommandData`
- `$data->command` — nome do comando (sem `/`)
- `$data->commandParams` — array de argumentos após o comando
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

**Exemplo:**
```php
TelegramRouter::onCommand('/start', function(CommandData $data) {
    // Manipular comando /start
});

TelegramRouter::onCommand('/user:*', function(CommandData $data) {
    $userId = $data->commandParams[0] ?? null;
});
```

### `onMessage()`

Manipula mensagens de texto.

**Parâmetros:**
- `$action` — manipulador
- `$botId` (padrão `'*'`) — ID do bot
- `$pattern` (padrão `null`) — padrão para texto da mensagem

**Evento:** `message.text` presente

**Dados:** `TextMessageData` (`HybridGram\Core\Routing\RouteData\TextMessageData`)
- `$data->text` — texto da mensagem (string)
- `$data->message` — objeto `Message` completo
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

**Exemplo:**
```php
use HybridGram\Core\Routing\RouteData\TextMessageData;

TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // Manipular todas as mensagens; texto está em $data->text
});

TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // Manipular mensagens com padrão
}, '*', 'hello*');
```

## Conteúdo de Mídia

### `onPhoto()`

Manipula fotos enviadas.

**Parâmetros:**
- `$action` — manipulador
- `$botId` (padrão `'*'`) — ID do bot
- `$pattern` (`\Closure|null`, padrão `null`) — padrão para legenda

**Evento:** `message.photo` presente

**Dados:** `PhotoData`
- `$data->photoSizes` — array de objetos `PhotoSize`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onDocument()`

Manipula documentos enviados.

**Parâmetros:**
- `$action` — manipulador
- `$botId` (padrão `'*'`) — ID do bot
- `$pattern` (padrão `null`) — padrão para legenda
- `$documentOptions` (`?array<MimeType|string>`) — filtro opcional por tipos MIME

**Evento:** `message.document` presente

**Dados:** `DocumentData`
- `$data->document` — objeto `Document`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

**Exemplo:**
```php
use HybridGram\Telegram\Document\MimeType;

TelegramRouter::onDocument(function(DocumentData $data) {
    // Manipular todos os documentos
}, '*', null, [MimeType::PDF, MimeType::JSON]);
```

### `onAudio()`

Manipula arquivos de áudio.

**Evento:** `message.audio` presente

**Dados:** `AudioData`
- `$data->audio` — objeto `Audio`

### `onSticker()`

Manipula adesivos.

**Evento:** `message.sticker` presente

**Dados:** `StickerData`
- `$data->sticker` — objeto `Sticker`

### `onVoice()`

Manipula mensagens de voz.

**Evento:** `message.voice` presente

**Dados:** `VoiceData`
- `$data->voice` — objeto `Voice`

### `onVideoNote()`

Manipula mensagens de vídeo (vídeos redondos).

**Evento:** `message.videoNote` presente

**Dados:** `VideoNoteData`
- `$data->videoNote` — objeto `VideoNote`

## Geolocalização e Contatos

### `onLocation()`

Manipula envio de geolocalização.

**Evento:** `message.location` presente

**Dados:** `LocationData`
- `$data->location` — objeto `Location`

### `onContact()`

Manipula envio de contatos.

**Evento:** `message.contact` presente

**Dados:** `ContactData`
- `$data->contact` — objeto `Contact`

## Pesquisas

### `onPoll()`

Manipula criação de pesquisas.

**Parâmetros:**
- `$action` — manipulador
- `$botId` (padrão `'*'`) — ID do bot
- `$pattern` (`\Closure|null`, padrão `null`) — padrão opcional
- `$isAnonymous` (`?bool`) — filtrar por anonimato da pesquisa
- `$pollType` (`?PollType`) — filtrar por tipo de pesquisa (`PollType::REGULAR` ou `PollType::QUIZ`)

**Evento:** `message.poll` presente

**Dados:** `PollData`
- `$data->poll` — objeto `Poll`

**Exemplo:**
```php
use HybridGram\Telegram\Poll\PollType;

TelegramRouter::onPoll(function(PollData $data) {
    // Manipular apenas quizzes
}, '*', null, false, PollType::QUIZ);
```

## Consulta de Callback e Consulta Inline

### `onCallbackQuery()`

Manipula pressionamento de botões inline.

**Parâmetros:**
- `$action` — manipulador
- `$botId` (padrão `'*'`) — ID do bot
- `$pattern` (padrão `'*'`) — padrão para ação (ex: `'menu:*'`)
- `$queryParams` (`?array<string, string|null>|array<int, QueryParamInterface>`) — filtros de parâmetros de consulta opcionais

**Evento:** `callbackQuery` presente

**Dados:** `CallbackQueryData`
- `$data->action` — string de ação dos dados de callback
- `$data->params` — array de parâmetros dos dados de callback
- `$data->query` — objeto `CallbackQuery`
- `$data->update`
- `$data->botId`
- `$data->getChat()`
- `$data->getUser()`

### `onInlineQuery()`

Manipula consultas inline.

**Evento:** `inlineQuery` presente

**Dados:** `InlineQueryData`
- `$data->inlineQuery` — objeto `InlineQuery`

## Eventos de Chat

### `onNewChatMembers()`

Manipula adição de novos membros ao chat.

**Dados:** `NewChatMembersData`
- `$data->newChatMembers` — array de novos membros

### `onLeftChatMember()`

Manipula saída de membros do chat.

**Dados:** `LeftChatMemberData`
- `$data->leftChatMember` — objeto do membro que saiu

### `onMyChatMember()`

Manipula mudanças no status do bot no chat.

**Evento:** `myChatMember` presente

**Dados:** `ChatMemberUpdatedData`
- `$data->chatMemberUpdated` — objeto `ChatMemberUpdated`

**Nota:** Funciona em todos os tipos de chat por padrão (PRIVATE, GROUP, SUPERGROUP, CHANNEL).

### `onChatMember()`

Manipula mudanças no status de membros do chat.

**Evento:** `chatMember` presente

**Dados:** `ChatMemberUpdatedData`

## Rotas Universais

### `onAny()`

Manipula qualquer atualização.

**Dados:** `AnyData`
- `$data->update`
- `$data->botId`

### `onFallback()`

Manipula atualizações para as quais nenhuma rota apropriada foi encontrada.

**Dados:** `FallbackData`

## Métodos Auxiliares

### `forBot()`

Retorna o construtor de rota para um bot específico.

```php
TelegramRouter::forBot('main')
    ->onCommand('/start', function(CommandData $data) {
        // Rota apenas para bot 'main'
    });
```

### `group()`

Agrupa rotas com atributos comuns.

**Atributos:**
- `for_bot` (`string`) — ID do bot
- `chat_type` (`ChatType|ChatType[]|null`) — tipo de chat ou array de tipos
- `middlewares` (`array`) — array de classes de middleware
- `from_state` (`array`) — array de estados a partir dos quais a transição deve ocorrer
- `to_state` (`string`) — estado para o qual transicionar

```php
TelegramRouter::group([
    'for_bot' => 'main',
    'chat_type' => ChatType::GROUP,
    'middlewares' => [AuthTelegramRouteMiddleware::class],
], function($router) {
    $router->onCommand('/admin', function(CommandData $data) {
        // Rota com atributos comuns do grupo
    });
});
```

### `chatType()` e `chatTypes()`

Define tipos de chat para a rota.

```php
// Tipo único
TelegramRouter::forBot('main')
    ->chatType(ChatType::PRIVATE)
    ->onCommand('/start', function(CommandData $data) {
        // ...
    });

// Múltiplos tipos
TelegramRouter::forBot('main')
    ->chatTypes([ChatType::PRIVATE, ChatType::GROUP])
    ->onCommand('/help', function(CommandData $data) {
        // ...
    });
```

## Tipos de Dados para Filtragem

### ChatType

Enum para filtrar rotas por tipo de chat:

```php
use HybridGram\Core\Routing\ChatType;

ChatType::PRIVATE      // Chats privados
ChatType::GROUP        // Grupos
ChatType::SUPERGROUP   // Supergrupos
ChatType::CHANNEL      // Canais
```

### MimeType

Enum para filtrar documentos por tipo MIME:

```php
use HybridGram\Telegram\Document\MimeType;

MimeType::PNG
MimeType::JPEG
MimeType::PDF
MimeType::JSON
// ... e outros
```

### PollType

Enum para filtrar pesquisas por tipo:

```php
use HybridGram\Telegram\Poll\PollType;

PollType::REGULAR  // Pesquisa regular
PollType::QUIZ     // Quiz
```

### ChatMemberStatus

Enum para filtrar por status de membro do chat:

```php
use HybridGram\Telegram\ChatMember\ChatMemberStatus;

ChatMemberStatus::CREATOR
ChatMemberStatus::ADMINISTRATOR
ChatMemberStatus::MEMBER
ChatMemberStatus::RESTRICTED
ChatMemberStatus::LEFT
ChatMemberStatus::KICKED
```
