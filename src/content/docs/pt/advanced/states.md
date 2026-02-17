---
title: Estados
description: Gerenciamento de estados de chat e usuário para criar conversas
---

Os estados permitem que você gerencie conversas com os usuários. O pacote suporta dois tipos de estados: **estado de chat** e **estado de usuário**.

## Conceito de Estado

Um estado é um estado nomeado com dados opcionais armazenados em cache. Ele permite que você:
- Crie conversas em múltiplas etapas
- Filtre rotas pelo estado atual
- Salve contexto entre mensagens

### Tipos de Estados

- **Estado de chat** — comum para todos os usuários em um chat
- **Estado de usuário** — individual para cada usuário

## Trabalhando com StateManager

### Obtendo Estado

```php
use HybridGram\\Core\\State\\StateManagerInterface;

$stateManager = app(StateManagerInterface::class);
$chat = $data->getChat();

// Obter estado de chat
$chatState = $stateManager->getChatState($chat);
if ($chatState) {
    $stateName = $chatState->getName();
    $stateData = $chatState->getData();
}

// Obter estado de usuário
$user = $data->getUser();
if ($user) {
    $userState = $stateManager->getUserState($chat, $user);
}
```

### Definindo Estado

```php
// Definir estado de chat
$stateManager->setChatState(
    chat: $chat,
    state: 'awaiting_name',
    ttl: 3600, // Tempo de vida em segundos (opcional, padrão 24 horas)
    data: ['step' => 1] // Dados adicionais (opcional)
);

// Definir estado de usuário
$stateManager->setUserState(
    chat: $chat,
    user: $user,
    state: 'filling_profile',
    ttl: 7200,
    data: ['name' => 'John', 'age' => null]
);
```

### Limpando Estado

```php
// Limpar estado de chat
$stateManager->clearChatState($chat);

// Limpar estado de usuário
$stateManager->clearUserState($chat, $user);
```

### Verificando Estado

```php
// Verificar estado específico
if ($stateManager->isChatInState($chat, 'awaiting_input')) {
    // ...
}

if ($stateManager->isUserInState($chat, $user, 'filling_form')) {
    // ...
}

// Verificar qualquer um dos estados
if ($stateManager->isChatInAnyState($chat, ['awaiting_name', 'awaiting_email'])) {
    // ...
}
```

## Usando em Rotas

### Filtrando Rotas por Estado

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // Esta rota é acionada apenas se o chat estiver em estado 'awaiting_name'
}, '*', function(TextMessageData $data) {
    $stateManager = app(\\HybridGram\\Core\\State\\StateManagerInterface::class);
    $chat = $data->getChat();

    return $stateManager->isChatInState($chat, 'awaiting_name');
});
```

Ou usando o método de rota:

```php
TelegramRouter::forBot('main')
    ->onMessage(function(TextMessageData $data) {
        // Processamento
    })
    ->fromChatState('awaiting_name'); // Rota é acionada apenas a partir deste estado
```

### Definindo Estado via Rota

```php
TelegramRouter::onCommand('/start', function(CommandData $data) {
    $stateManager = app(\\HybridGram\\Core\\State\\StateManagerInterface::class);
    $stateManager->setChatState($data->getChat(), 'main_menu');

    // Enviar resposta
});
```

Ou via middleware:

```php
use HybridGram\\Http\\Middlewares\\SetStateTelegramRouteMiddleware;

TelegramRouter::onCommand('/start', function(CommandData $data) {
    // ...
})
->middleware(new SetStateTelegramRouteMiddleware('main_menu'));
```

## Exemplos de Uso

### Formulário Multi-etapas

```php
// Etapa 1: Início
TelegramRouter::onCommand('/register', function(CommandData $data) {
    $stateManager = app(\\HybridGram\\Core\\State\\StateManagerInterface::class);
    $telegram = app(\\HybridGram\\Telegram\\TelegramBotApi::class);

    $stateManager->setChatState($data->getChat(), 'awaiting_name');

    $telegram->sendMessage(
        $data->getChat()->id,
        'Digite seu nome:'
    );
});

// Etapa 2: Obtendo nome
TelegramRouter::forBot('main')
    ->onTextMessage(function(TextMessageData $data) {
        $stateManager = app(\\HybridGram\\Core\\State\\StateManagerInterface::class);
        $telegram = app(\\HybridGram\\Telegram\\TelegramBotApi::class);
        $chat = $data->getChat();

        $name = $data->message;

        // Salvar nome nos dados de estado
        $stateManager->setChatState(
            chat: $chat,
            state: 'awaiting_email',
            data: ['name' => $name]
        );

        $telegram->sendMessage($chat->id, 'Digite seu email:');
    })
    ->fromChatState('awaiting_name');

// Etapa 3: Obtendo email
TelegramRouter::forBot('main')
    ->onTextMessage(function(TextMessageData $data) {
        $stateManager = app(\\HybridGram\\Core\\State\\StateManagerInterface::class);
        $telegram = app(\\HybridGram\\Telegram\\TelegramBotApi::class);
        $chat = $data->getChat();

        $currentState = $stateManager->getChatState($chat);
        $name = $currentState?->getData()['name'] ?? 'Unknown';
        $email = $data->message;

        // Salvar usuário
        // ... sua lógica de salvamento

        // Limpar estado
        $stateManager->clearChatState($chat);

        $telegram->sendMessage(
            $chat->id,
            "Obrigado, {$name}! Seu email: {$email}"
        );
    })
    ->fromChatState('awaiting_email');
```

### Cancelando Processo

```php
TelegramRouter::onCommand('/cancel', function(CommandData $data) {
    $stateManager = app(\\HybridGram\\Core\\State\\StateManagerInterface::class);
    $telegram = app(\\HybridGram\\Telegram\\TelegramBotApi::class);
    $chat = $data->getChat();

    // Limpar todos os estados
    $stateManager->clearChatState($chat);
    if ($user = $data->getUser()) {
        $stateManager->clearUserState($chat, $user);
    }

    $telegram->sendMessage($chat->id, 'Operação cancelada');
});
```

### Trabalhando com Dados de Estado

```php
TelegramRouter::onTextMessage(function(TextMessageData $data) {
    $stateManager = app(\\HybridGram\\Core\\State\\StateManagerInterface::class);
    $chat = $data->getChat();

    $currentState = $stateManager->getChatState($chat);

    if ($currentState) {
        $stateData = $currentState->getData() ?? [];
        $step = ($stateData['step'] ?? 0) + 1;

        // Atualizar estado com novos dados
        $stateManager->setChatState(
            chat: $chat,
            state: $currentState->getName(),
            data: array_merge($stateData, ['step' => $step])
        );
    }
})
->fromChatState('filling_form');
```

## Excluindo Estados

Você pode criar uma rota que funciona apenas se o chat **NÃO** estiver em um estado específico:

```php
TelegramRouter::forBot('main')
    ->onCommand('/help', function(CommandData $data) {
        // Mostrar ajuda
    })
    ->exceptChatState('processing'); // Não mostrar durante o processamento
```

## Estados de Usuário

Para o processamento individual de cada usuário, use estados de usuário:

```php
TelegramRouter::onCallbackQuery(function(CallbackQueryData $data) {
    $stateManager = app(\\HybridGram\\Core\\State\\StateManagerInterface::class);
    $chat = $data->getChat();
    $user = $data->getUser();

    // Definir estado para usuário específico
    $stateManager->setUserState(
        chat: $chat,
        user: $user,
        state: 'selecting_item',
        data: ['item_id' => $data->params[0]]
    );
});
```

## Tempo de Vida do Estado

Por padrão, os estados são armazenados por 24 horas. Você pode alterar isso:

```php
$stateManager->setChatState(
    chat: $chat,
    state: 'temporary_state',
    ttl: 300 // 5 minutos
);
```

## Próximos Passos

- **[Middleware](/pt/advanced/middleware/)** — usando middleware para gerenciamento de estado
- **[Enviando Mensagens](/pt/sending/telegram-bot-api/)** — enviando respostas para usuários
