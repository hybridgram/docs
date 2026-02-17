---
title: Callback Query
description: Tratamento de cliques em botões inline do Telegram
---

Callback Query é uma atualização que chega quando um usuário pressiona um botão inline (botão abaixo de uma mensagem). Esta é a principal forma de criar interfaces interativas em bots Telegram.

## Uso Básico

### Callback Query Simples

```php
use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\CallbackQueryData;

TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $action = $data->action; // Texto callback_data do botão
    $chatId = $data->callbackQuery->message->chat->id;

    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);

    // Responder callback (obrigatório!)
    $telegram->answerCallbackQuery($data->callbackQuery->id);

    // Enviar resposta
    $telegram->sendMessage($chatId, "Você selecionou: {$action}");
});
```

### Importante: Respondendo ao Callback

Você **deve** responder à consulta de callback, caso contrário o usuário verá um ícone de carregamento. Use o método `answerCallbackQuery`:

```php
$telegram->answerCallbackQuery(
    $data->callbackQuery->id,
    text: 'Processando...', // Opcional: texto para mostrar ao usuário
    showAlert: false // true para mostrar alerta em vez de notificação
);
```

## Estrutura de Dados de Callback

Os dados de callback podem ser uma string simples ou estruturada. O pacote suporta o formato `action:param1:param2`:

```php
// Botão com callback_data: "menu:products:electronics"
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $action = $data->action; // "menu"
    $params = $data->params; // ['products', 'electronics']

    // Processamento
});
```

## Padrões e Filtros

### Padrões com Wildcard

```php
// Tratar todos os callbacks com ação "menu"
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // ...
}, '*', 'menu:*');

// Tratar callback "menu:products:*"
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $category = $data->params[0] ?? null; // "products"
    // ...
}, '*', 'menu:products:*');
```

### Filtragem por Parâmetros de Consulta

Você pode filtrar consultas de callback pela presença ou valor de parâmetros:

```php
// Apenas se o parâmetro "category" for igual a "electronics"
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // ...
}, '*', '*', ['category' => 'electronics']);

// Apenas se o parâmetro "category" existir (qualquer valor)
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // ...
}, '*', '*', ['category' => null]);
```

### Verificação Personalizada via Closure

```php
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // ...
}, '*', function(CallbackQueryData $data) {
    $action = $data->action;
    $params = $data->params;

    // Lógica de validação complexa
    return $action === 'menu' && count($params) > 0;
});
```

## Acessando Dados

O objeto `CallbackQueryData` fornece:

```php
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    // Ação (parte principal de callback_data antes do primeiro :)
    $action = $data->action;

    // Parâmetros (partes após ação, separadas por :)
    $params = $data->params; // ['param1', 'param2']

    // Objeto completo CallbackQuery
    $callbackQuery = $data->callbackQuery;

    // ID da consulta de callback (necessário para resposta)
    $queryId = $callbackQuery->id;

    // Mensagem original
    $message = $callbackQuery->message;

    // Usuário que pressionou o botão
    $user = $callbackQuery->from;

    // Dados completos de callback_data (sem análise)
    $dataString = $callbackQuery->data;
});
```

## Atualizando Mensagem com Botões

Frequentemente, após pressionar um botão, você precisa atualizar a mensagem:

```php
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $message = $data->callbackQuery->message;

    // Responder callback
    $telegram->answerCallbackQuery($data->callbackQuery->id, text: 'Atualizando...');

    // Atualizar mensagem
    $newKeyboard = new \Phptg\BotApi\Type\InlineKeyboardMarkup([
        [['text' => 'Novo Botão', 'callback_data' => 'new_action']],
    ]);

    $telegram->editMessageText(
        chatId: $message->chat->id,
        messageId: $message->messageId,
        text: 'Mensagem atualizada!',
        replyMarkup: $newKeyboard
    );
});
```

## Exemplos de Uso

### Menu com Navegação

```php
// Criando menu
TelegramRouter::onCommand('/menu', function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);

    $keyboard = new \Phptg\BotApi\Type\InlineKeyboardMarkup([
        [
            ['text' => '📦 Produtos', 'callback_data' => 'menu:products'],
            ['text' => '🛒 Carrinho', 'callback_data' => 'menu:cart'],
        ],
        [
            ['text' => '⚙️ Configurações', 'callback_data' => 'menu:settings'],
            ['text' => '❓ Ajuda', 'callback_data' => 'menu:help'],
        ],
    ]);

    $telegram->sendMessage(
        $data->getChat()->id,
        'Escolha uma seção:',
        replyMarkup: $keyboard
    );
});

// Tratando seleção de item do menu
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->answerCallbackQuery($data->callbackQuery->id);

    $action = $data->action;
    $menu = $data->params[0] ?? null;

    match($menu) {
        'products' => $this->showProducts($data),
        'cart' => $this->showCart($data),
        'settings' => $this->showSettings($data),
        'help' => $this->showHelp($data),
        default => null,
    };
}, '*', 'menu:*');
```

### Paginação

```php
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->answerCallbackQuery($data->callbackQuery->id);

    $action = $data->action; // "page"
    $page = (int) ($data->params[0] ?? 1);

    $items = $this->getItems($page);

    $keyboard = new \Phptg\BotApi\Type\InlineKeyboardMarkup([
        [
            ['text' => '◀️ Voltar', 'callback_data' => "page:" . ($page - 1)],
            ['text' => 'Próxima ▶️', 'callback_data' => "page:" . ($page + 1)],
        ],
    ]);

    $telegram->editMessageText(
        chatId: $data->callbackQuery->message->chat->id,
        messageId: $data->callbackQuery->message->messageId,
        text: $this->formatItems($items),
        replyMarkup: $keyboard
    );
}, '*', 'page:*');
```

### Confirmação de Ação

```php
TelegramRouter::onCommand('/delete', function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);

    $keyboard = new \Phptg\BotApi\Type\InlineKeyboardMarkup([
        [
            ['text' => '✅ Sim, deletar', 'callback_data' => 'confirm:delete:yes'],
            ['text' => '❌ Cancelar', 'callback_data' => 'confirm:delete:no'],
        ],
    ]);

    $telegram->sendMessage(
        $data->getChat()->id,
        'Tem certeza de que deseja deletar?',
        replyMarkup: $keyboard
    );
});

TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);

    [$action, $type, $answer] = [$data->action, $data->params[0], $data->params[1]];

    if ($action === 'confirm' && $type === 'delete') {
        $telegram->answerCallbackQuery($data->callbackQuery->id);

        if ($answer === 'yes') {
            // Executar deleção
            $telegram->sendMessage(
                $data->callbackQuery->message->chat->id,
                'Deletado!'
            );
        } else {
            $telegram->sendMessage(
                $data->callbackQuery->message->chat->id,
                'Cancelado'
            );
        }

        // Deletar mensagem com botões
        $telegram->deleteMessage(
            $data->callbackQuery->message->chat->id,
            $data->callbackQuery->message->messageId
        );
    }
}, '*', 'confirm:*');
```

## Próximas Etapas

- **[Middleware](/pt/advanced/middleware/)** — usando middleware para consultas de callback
- **[Estados](/pt/advanced/states/)** — gerenciando estados através de callbacks
