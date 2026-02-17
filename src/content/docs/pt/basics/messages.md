---
title: Tratamento de Mensagens
description: Trabalhando com mensagens de texto de usuários
---

Tratar mensagens de texto é uma das funções principais de um bot no Telegram. O pacote fornece capacidades flexíveis para trabalhar com mensagens.

## Uso Básico

### Todas as Mensagens

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\TextTextMessageData;

TelegramRouter::onTextMessage(function(TextTextMessageData $data) {
    $text = $data->text; // Texto da mensagem (string)
    $chatId = $data->getChat()->id;

    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->sendMessage($chatId, "Você escreveu: {$text}");
});
```

### Mensagens por Padrão

Verificar o texto da mensagem por padrão de string:

```php
// Correspondência exata
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // ...
}, '*', 'olá');

// Com wildcard (Laravel Str::is)
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // Dispara para: "olá", "olá a todos", "diga olá"
}, '*', 'olá*');
```

### Verificação Personalizada via Closure

Para lógica complexa, use closures:

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // Processamento
}, '*', function(TextMessageData $data) {
    // Retornar true se a rota deve disparar
    $text = $data->text;

    // Verificar comprimento
    if (strlen($text) < 10) {
        return false;
    }

    // Verificar palavras-chave
    $keywords = ['pedido', 'entrega', 'pagamento'];
    return str_contains($text, $keywords);
});
```

## Acessando Dados da Mensagem

O objeto `TextMessageData` contém:

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // Texto da mensagem (string)
    $text = $data->text;

    // Objeto Message completo da API do Telegram
    $messageObject = $data->message;

    // Objeto Update completo
    $update = $data->update;

    // Chat e Usuário
    $chat = $data->getChat();
    $user = $data->getUser();

    // Informações adicionais da mensagem
    $messageId = $messageObject->messageId;
    $date = $messageObject->date;
    $entities = $messageObject->entities; // Formatação de texto
});
```

## Trabalhando com Formatação

O Telegram suporta vários tipos de formatação em mensagens:

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    $message = $data->message;

    // Verificar formatação
    if ($message->entities !== null) {
        foreach ($message->entities as $entity) {
            if ($entity->type === 'bold') {
                // Tratar texto em negrito
            }
            if ($entity->type === 'code') {
                // Tratar código
            }
        }
    }
});
```

## Mensagens em Contexto de Estado

Mensagens são frequentemente processadas dependendo do estado atual:

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $chat = $data->getChat();

    $currentState = $stateManager->getChatState($chat);

    if ($currentState?->getName() === 'awaiting_name') {
        // Usuário está inserindo o nome
        $name = $data->message;
        // Salvar nome e prosseguir para próxima etapa
    }
}, '*', function(TextMessageData $data) {
    // Verificar se está no estado "awaiting name"
    $stateManager = app(\HybridGram\Core\State\StateManagerInterface::class);
    $chat = $data->getChat();
    $state = $stateManager->getChatState($chat);

    return $state?->getName() === 'awaiting_name';
});
```

## Filtrando por Tipos de Chat

Você pode filtrar mensagens por tipo de chat:

```php
TelegramRouter::forBot('main')
    ->onTextMessage(function(TextMessageData $data) {
        // Apenas chats privados
    })
    ->whereChatType('private');
```

## Exemplos de Uso

### Bot Echo

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->sendMessage(
        $data->getChat()->id,
        "Você escreveu: {$data->message}"
    );
});
```

### Busca por Palavras-chave

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    $text = strtolower($data->message);
    $chatId = $data->getChat()->id;
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);

    if (str_contains($text, 'clima')) {
        $telegram->sendMessage($chatId, 'Buscando previsão do tempo...');
        // ...
    } elseif (str_contains($text, 'taxa')) {
        $telegram->sendMessage($chatId, 'Buscando taxas de câmbio...');
        // ...
    }
}, '*', function(TextMessageData $data) {
    $keywords = ['clima', 'taxa', 'notícias'];
    $text = strtolower($data->message);
    return str_contains($text, $keywords);
});
```

### Tratamento de Mensagens Longas

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    $text = $data->message;

    // Dividir mensagem longa em partes
    if (strlen($text) > 4096) {
        $chunks = str_split($text, 4090);
        $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);

        foreach ($chunks as $chunk) {
            $telegram->sendMessage($data->getChat()->id, $chunk);
        }
    }
}, '*', function(TextMessageData $data) {
    return strlen($data->message) > 4096;
});
```

## Tratamento de Respostas de Mensagens

Para tratar respostas a mensagens, use a rota especial:

```php
use HybridGram\Core\Routing\RouteData\ReplyData;

TelegramRouter::onReply(function(ReplyData $data) {
    $originalMessage = $data->update->message->replyToMessage;
    $replyText = $data->update->message->text;

    // Processar resposta
});
```

## O Que Vem Depois?

- **[Consulta de Callback](/pt/basics/callback-query/)** — tratamento de pressões de botões inline
- **[Estados](/pt/advanced/states/)** — gerenciando conversas
