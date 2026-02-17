---
title: TelegramBotApi
description: Enviando mensagens via TelegramBotApi
---

`TelegramBotApi` é um wrapper em torno da Telegram Bot API com suporte para filas, prioridades e limitação de taxa.

## Obtendo uma Instância

```php
use HybridGram\\Telegram\\TelegramBotApi;

// Obter do container
$telegram = app(TelegramBotApi::class);

// Para um bot específico
$telegram = app(TelegramBotApi::class, ['botId' => 'main']);

// Em um handler de rota (automaticamente para o bot atual)
TelegramRouter::onCommand('/start', function(CommandData $data) {
    $telegram = app(TelegramBotApi::class); // Usa botId do contexto
});
```

## Uso Básico

### Enviando uma Mensagem

```php
$telegram->sendMessage(
    chatId: $chatId,
    text: 'Olá! 👋'
);
```

### Enviando com Parâmetros

```php
$telegram->sendMessage(
    chatId: $chatId,
    text: 'Sua mensagem',
    parseMode: 'HTML', // ou 'MarkdownV2'
    disableNotification: false,
    protectContent: true
);
```

### Enviando com Teclado

```php
use Phptg\\BotApi\\Type\\InlineKeyboardMarkup;
use Phptg\\BotApi\\Type\\ReplyKeyboardMarkup;

// Teclado inline
$inlineKeyboard = new InlineKeyboardMarkup([
    [
        ['text' => 'Botão 1', 'callback_data' => 'btn1'],
        ['text' => 'Botão 2', 'callback_data' => 'btn2'],
    ],
]);

$telegram->sendMessage(
    chatId: $chatId,
    text: 'Escolha uma ação:',
    replyMarkup: $inlineKeyboard
);

// Teclado de resposta
$replyKeyboard = new ReplyKeyboardMarkup([
    [['text' => 'Opção 1'], ['text' => 'Opção 2']],
    [['text' => 'Cancelar']],
]);

$telegram->sendMessage(
    chatId: $chatId,
    text: 'Escolha:',
    replyMarkup: $replyKeyboard
);
```

## Outros Métodos

### Editando uma Mensagem

```php
$telegram->editMessageText(
    chatId: $chatId,
    messageId: $messageId,
    text: 'Texto atualizado',
    replyMarkup: $newKeyboard
);
```

### Deletando uma Mensagem

```php
$telegram->deleteMessage(
    chatId: $chatId,
    messageId: $messageId
);
```

### Enviando uma Foto

```php
$telegram->sendPhoto(
    chatId: $chatId,
    photo: 'https://example.com/image.jpg',
    caption: 'Descrição da foto'
);
```

### Enviando um Documento

```php
$telegram->sendDocument(
    chatId: $chatId,
    document: '/path/to/file.pdf',
    caption: 'Documento'
);
```

### Respondendo a Callback Query

```php
$telegram->answerCallbackQuery(
    callbackQueryId: $callbackQueryId,
    text: 'Processando...', // Opcional
    showAlert: false // true para mostrar alerta
);
```

## Uso Direto de Métodos da API

Você pode chamar qualquer método da Telegram Bot API diretamente:

```php
use Phptg\\BotApi\\Method\\SendMessage;
use Phptg\\BotApi\\Method\\SendPhoto;

// Via call()
$telegram->call(new SendMessage($chatId, 'Texto'));

// Métodos são roteados automaticamente através do dispatcher
```

## Prioridades

Por padrão, todas as requisições têm prioridade `HIGH`. Para broadcasts, use prioridade `LOW`:

```php
use HybridGram\\Telegram\\Priority;

$telegram->withPriority(Priority::LOW)
    ->sendMessage($chatId, 'Broadcast');
```

Prioridades funcionam apenas em modo de fila. Mais detalhes em [Prioridades & Filas](/pt/sending/priorities-queues/).

## Tratamento de Erros

```php
use HybridGram\\Exceptions\\Telegram\\TelegramRequestError;

try {
    $telegram->sendMessage($chatId, 'Texto');
} catch (TelegramRequestError $e) {
    logger()->error('Telegram API error', [
        'error_code' => $e->getErrorCode(),
        'description' => $e->getDescription(),
    ]);
}
```

## Exemplos de Uso

### Resposta Simples a Comando

```php
TelegramRouter::onCommand('/start', function(CommandData $data) {
    $telegram = app(TelegramBotApi::class);
    $telegram->sendMessage($data->getChat()->id, 'Bem-vindo!');
});
```

### Enviando com Formatação

```php
$telegram->sendMessage(
    chatId: $chatId,
    text: '<b>Texto em negrito</b> e <i>itálico</i>',
    parseMode: 'HTML'
);
```

### Enviando Múltiplas Mensagens

```php
$messages = ['Mensagem 1', 'Mensagem 2', 'Mensagem 3'];

foreach ($messages as $text) {
    $telegram->sendMessage($chatId, $text);
}
```

### Envio Condicional

```php
if ($condition) {
    $telegram->sendMessage($chatId, 'Condição atendida');
} else {
    $telegram->sendMessage($chatId, 'Condição não atendida');
}
```

## Próximos Passos

- **[Prioridades & Filas](/pt/sending/priorities-queues/)** — configurando filas e prioridades
- **[Limitação de Taxa](/pt/sending/rate-limiting/)** — gerenciando limites de requisições
