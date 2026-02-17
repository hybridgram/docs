---
title: Roteamento com Atributos PHP
description: Defina rotas usando atributos PHP 8 como uma alternativa ao roteamento baseado em fachada
---

Os Atributos PHP fornecem uma alternativa limpa e baseada em decoradores para definir rotas usando a fachada `TelegramRouter`. Essa abordagem mantém as definições de rotas próximas aos seus métodos de manipuladores, melhorando a organização e legibilidade do código.

## Visão Geral

Em vez de registrar rotas através da fachada:

```php
TelegramRouter::onCommand('/start', function(CommandData $data) {
    // Manipular comando /start
});
```

Você pode definir rotas usando atributos diretamente em métodos do controlador:

```php
#[OnCommand('/start')]
public function handleStart(CommandData $data) {
    // Manipular comando /start
}
```

## Começando

### Uso Básico

Crie uma classe de controlador e decore os métodos com atributos de roteamento:

```php
<?php

namespace App\Telegram\Handlers;

use HybridGram\Core\Routing\Attributes\OnCommand;
use HybridGram\Core\Routing\Attributes\OnTextMessage;
use HybridGram\Core\Routing\RouteData\CommandData;
use HybridGram\Core\Routing\RouteData\TextMessageData;

class BotHandler
{
    #[OnCommand('/start')]
    public function handleStart(CommandData $data): void
    {
        $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
        $telegram->sendMessage($data->getChat()->id, 'Bem-vindo!');
    }

    #[OnTextMessage]
    public function handleMessage(TextMessageData $data): void
    {
        // Manipular todas as mensagens de texto
    }
}
```

### Registro

As rotas definidas com atributos são descobertas e registradas automaticamente durante a inicialização da aplicação. O framework varre as classes da sua aplicação e registra qualquer rota definida com atributos de roteamento.

Para ativar o roteamento baseado em atributos, certifique-se de que o `AttributeRouteRegistrar` seja chamado no provedor de serviços ou arquivo de inicialização da sua aplicação.

## Atributos Disponíveis

### Manipulação de Mensagens

#### OnTextMessage
Manipular mensagens de texto:

```php
#[OnTextMessage]
public function handleMessage(TextMessageData $data): void {
    // Manipular todas as mensagens de texto
}

#[OnTextMessage(pattern: 'hello')]
public function handleGreeting(TextMessageData $data): void {
    // Manipular mensagens contendo 'hello'
}
```

#### OnCommand
Manipular comandos do Telegram:

```php
#[OnCommand('/start')]
public function handleStart(CommandData $data): void {
    // Manipular comando /start
}

#[OnCommand('/user:*')]
public function handleUserCommand(CommandData $data): void {
    // Manipular /user:* com parâmetros
}
```

#### OnCallbackQuery
Manipular pressionamentos de botões embutidos:

```php
#[OnCallbackQuery(pattern: 'menu:*')]
public function handleMenuCallback(CallbackQueryData $data): void {
    // Manipular consultas de callback como 'menu:home'
}
```

### Manipulação de Mídia

Manipular vários tipos de mídia:

```php
#[OnPhoto]
public function handlePhoto(PhotoData $data): void {}

#[OnDocument]
public function handleDocument(DocumentData $data): void {}

#[OnAudio]
public function handleAudio(AudioData $data): void {}

#[OnVideo]
public function handleVideo(VideoData $data): void {}

#[OnVoice]
public function handleVoice(VoiceData $data): void {}

#[OnLocation]
public function handleLocation(LocationData $data): void {}

#[OnContact]
public function handleContact(ContactData $data): void {}
```

### Eventos de Membro do Chat

```php
#[OnChatMember]
public function handleChatMember(ChatMemberUpdatedData $data): void {}

#[OnMyChatMember]
public function handleBotChatMember(ChatMemberUpdatedData $data): void {}
```

### Outros Eventos

```php
#[OnPoll]
public function handlePoll(PollData $data): void {}

#[OnInlineQuery]
public function handleInlineQuery(InlineQueryData $data): void {}

#[OnAny]
public function handleAny(UpdateData $data): void {}

#[OnFallback]
public function handleFallback(FallbackData $data): void {}
```

## Filtragem e Condições

### Tipos de Chat

Limitar rotas a tipos de chat específicos:

```php
use HybridGram\Core\Routing\Attributes\ChatTypes;
use HybridGram\Core\Routing\ChatType;

#[OnCommand('/admin')]
#[ChatTypes([ChatType::PRIVATE, ChatType::GROUP])]
public function handleAdminCommand(CommandData $data): void {
    // Funciona apenas em chats privados e grupos
}
```

### Seleção de Bot

Direcionar bots específicos:

```php
use HybridGram\Core\Routing\Attributes\ForBot;

#[OnCommand('/start')]
#[ForBot('main')]
public function handleStart(CommandData $data): void {
    // Apenas para o bot 'main'
}
```

### Middleware

Aplicar middleware a rotas:

```php
use HybridGram\Core\Routing\Attributes\TgMiddlewares;
use App\Telegram\Middleware\AuthMiddleware;

#[OnCommand('/admin')]
#[TgMiddlewares([AuthMiddleware::class])]
public function handleAdmin(CommandData $data): void {
    // AuthMiddleware executa antes deste manipulador
}
```

### Roteamento Baseado em Estado

Rotear baseado no estado do usuário:

```php
use HybridGram\Core\Routing\Attributes\FromUserState;
use HybridGram\Core\Routing\Attributes\ToUserState;

#[OnTextMessage]
#[FromUserState('waiting_name')]
#[ToUserState('name_received')]
public function handleNameInput(TextMessageData $data): void {
    // Processa apenas se o usuário estiver no estado 'waiting_name'
    // Transição para o estado 'name_received' após a execução
}
```

### Estado do Chat

Rotear baseado no estado do chat:

```php
use HybridGram\Core\Routing\Attributes\FromChatState;
use HybridGram\Core\Routing\Attributes\ToChatState;

#[OnTextMessage]
#[FromChatState('setup_mode')]
public function handleSetup(TextMessageData $data): void {
    // Apenas quando o chat estiver em 'setup_mode'
}
```

## Combinando Atributos

Você pode combinar múltiplos atributos em um único método:

```php
#[OnTextMessage(pattern: 'price:*')]
#[ForBot('main')]
#[ChatTypes([ChatType::PRIVATE])]
#[FromUserState('shopping')]
public function handlePriceQuery(TextMessageData $data): void {
    // Este manipulador só é acionado quando TODAS as condições forem atendidas:
    // - O texto da mensagem contém o padrão 'price:*'
    // - O bot é 'main'
    // - O chat é privado
    // - O usuário está no estado 'shopping'
}
```

## Melhores Práticas

### Organização

Agrupar manipuladores relacionados em classes de controlador dedicadas:

```php
<?php

namespace App\Telegram\Handlers;

class CommandHandler
{
    #[OnCommand('/start')]
    public function handleStart(CommandData $data): void {}

    #[OnCommand('/help')]
    public function handleHelp(CommandData $data): void {}
}

class MessageHandler
{
    #[OnTextMessage]
    public function handleMessage(TextMessageData $data): void {}
}
```

### Caminhos Descobríveis

Certifique-se de que suas classes de manipuladores estão em locais descobríveis. Por padrão, o framework varre:
- `app/Telegram/`
- `app/Handlers/`

Configure caminhos adicionais em sua configuração conforme necessário.

### Segurança de Tipos

Sempre fornça dicas de tipo para o parâmetro de dados:

```php
// ✅ Bom - dicas de tipo previnem erros
#[OnCommand('/start')]
public function handleStart(CommandData $data): void {}

// ❌ Evitar - perde segurança de tipo
#[OnCommand('/start')]
public function handleStart($data): void {}
```

## Comparação com Roteamento Baseado em Fachada

### Baseado em Fachada (Tradicional)

```php
// routes/telegram.php

TelegramRouter::onCommand('/start', function(CommandData $data) {
    // ...
});

TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // ...
});
```

### Baseado em Atributos (Moderno)

```php
// app/Telegram/BotHandler.php

class BotHandler
{
    #[OnCommand('/start')]
    public function handleStart(CommandData $data): void {
        // ...
    }

    #[OnTextMessage]
    public function handleMessage(TextMessageData $data): void {
        // ...
    }
}
```

Ambas as abordagens funcionam igualmente bem. Escolha com base na preferência do seu projeto:
- **Atributos**: Melhor para projetos grandes com muitos manipuladores
- **Fachada**: Melhor para pequenos projetos ou quando todas as rotas estão em um só lugar

## Tópicos Avançados

### Atributos Personalizados

Você pode criar atributos personalizados que estendem `TelegramRouteAttribute`:

```php
use HybridGram\Core\Routing\Attributes\TelegramRouteAttribute;
use HybridGram\Core\Routing\TelegramRouteBuilder;

#[Attribute(Attribute::TARGET_METHOD)]
final class OnVIP implements TelegramRouteAttribute
{
    public function registerRoute(TelegramRouteBuilder $builder, \Closure|string|array $action): void
    {
        // Lógica de registro personalizado
        $builder->onTextMessage($action)
                ->middleware(VIPCheckMiddleware::class);
    }
}
```

### Cache de Atributos

Em produção, as rotas de atributos são armazenadas em cache para melhor desempenho. Execute:

```bash
php artisan config:cache
```

Para limpar o cache durante o desenvolvimento, use:

```bash
php artisan config:clear
```

## Veja Também

- **[Roteamento Básico](/pt/basics/routing/)** — Visão geral de conceitos de roteamento
- **[Middleware](/pt/advanced/middleware/)** — Usando middleware com rotas
- **[Estados](/pt/advanced/states/)** — Gerenciando estados de usuário e chat
