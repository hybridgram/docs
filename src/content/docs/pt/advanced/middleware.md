---
title: Middleware
description: Usando middleware em rotas do Telegram
---

Middleware permite que você execute código antes ou depois de processar uma atualização. Isso é útil para autorização, logging, verificação de estados e outras tarefas.

## Conceitos Básicos

### Interface de Middleware

Todo middleware deve implementar a interface `TelegramRouteMiddlewareInterface`:

```php
use HybridGram\Core\Middleware\TelegramRouteMiddlewareInterface;
use Phptg\BotApi\Type\Update\Update;

class MyMiddleware implements TelegramRouteMiddlewareInterface
{
    public function handle(Update $update, \Closure $next): mixed
    {
        // Código antes de processar

        $result = $next($update);

        // Código depois de processar

        return $result;
    }
}
```

## Middleware Integrados

### AuthTelegramRouteMiddleware

Autoriza automaticamente usuários através do Telegram Guard:

```php
use HybridGram\Http\Middlewares\AuthTelegramRouteMiddleware;

TelegramRouter::forBot('main')
    ->onCommand('/profile', function(CommandData $data) {
        // Usuário já está autorizado
        $user = Auth::user();
    })
    ->middleware(AuthTelegramRouteMiddleware::class);
```

### SetStateTelegramRouteMiddleware

Define o estado após a execução do manipulador:

```php
use HybridGram\Http\Middlewares\SetStateTelegramRouteMiddleware;

TelegramRouter::onCommand('/start', function(CommandData $data) {
    // ...
})
->middleware(new SetStateTelegramRouteMiddleware(
    newState: 'main_menu',
    useUserState: false, // Usar estado do chat (padrão)
    ttl: 3600, // Tempo de vida em segundos (opcional)
    data: ['step' => 1] // Dados adicionais (opcional)
));
```

### CheckStateTelegramRouteMiddleware

Verifica se o chat/usuário está em um estado específico:

```php
use HybridGram\Http\Middlewares\CheckStateTelegramRouteMiddleware;

TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // Esta rota só é acionada se o chat estiver no estado 'awaiting_input'
})
->middleware(new CheckStateTelegramRouteMiddleware(
    requiredStates: ['awaiting_input'],
    useUserState: false, // Verificar estado do chat
    exceptMode: false // false = apenas se EM estado, true = apenas se NÃO em estado
));
```

Exemplo com exclusão de estado:

```php
// Rota acionada apenas se NÃO estiver nos estados 'processing' ou 'awaiting'
TelegramRouter::onCommand('/cancel', function(CommandData $data) {
    // ...
})
->middleware(new CheckStateTelegramRouteMiddleware(
    requiredStates: ['processing', 'awaiting'],
    exceptMode: true // Modo de exclusão
));
```

### RateLimitTelegramRouteMiddleware

Limita a frequência de requisições do usuário:

```php
use HybridGram\Http\Middlewares\RateLimitTelegramRouteMiddleware;

TelegramRouter::onTextMessage(function(TextMessageData $data) {
    // ...
})
->middleware(new RateLimitTelegramRouteMiddleware(
    maxAttempts: 10,
    decayMinutes: 1
));
```

### SetLocaleTelegramRouteMiddleware

Define automaticamente a localidade do Laravel com base no idioma do usuário do Telegram:

```php
use HybridGram\Http\Middlewares\SetLocaleTelegramRouteMiddleware;

TelegramRouter::forBot('main')
    ->onCommand('/start', function(CommandData $data) {
        // Localidade já está configurada com base no idioma do usuário
        return __('welcome_message');
    })
    ->middleware(new SetLocaleTelegramRouteMiddleware(
        supportedLocales: ['en', 'ru', 'uk', 'pt'],
        fallbackLocale: 'en'
    ));
```

#### Resolução de Localidade Personalizada

Você pode fornecer lógica personalizada para determinar a localidade usando o parâmetro `userLocale`:

**Usando um Closure:**

```php
use HybridGram\Http\Middlewares\SetLocaleTelegramRouteMiddleware;
use Phptg\BotApi\Type\Update\Update;

// Determinar localidade das configurações de usuário no banco de dados
TelegramRouter::forBot('main')
    ->onCommand('/start', function(CommandData $data) {
        return __('welcome_message');
    })
    ->middleware(new SetLocaleTelegramRouteMiddleware(
        supportedLocales: ['en', 'ru', 'uk', 'pt'],
        fallbackLocale: 'en',
        userLocale: function(Update $update): ?string {
            $user = UpdateHelper::getUserFromUpdate($update);
            if (!$user) {
                return null;
            }

            // Buscar localidade do seu banco de dados
            $userModel = User::where('telegram_id', $user->id)->first();
            return $userModel?->preferred_locale;
        }
    ));
```

**Usando uma string estática:**

```php
// Forçar uma localidade específica para todos os usuários nesta rota
TelegramRouter::onCommand('/en_only', function(CommandData $data) {
    // Sempre em inglês
})
->middleware(new SetLocaleTelegramRouteMiddleware(
    userLocale: 'en'
));
```

## Usando Middleware

### Para uma Rota Única

```php
TelegramRouter::onCommand('/admin', function(CommandData $data) {
    // ...
})
->middleware(AuthTelegramRouteMiddleware::class);
```

### Múltiplos Middleware

```php
TelegramRouter::onCommand('/admin', function(CommandData $data) {
    // ...
})
->middleware([
    AuthTelegramRouteMiddleware::class,
    new RateLimitTelegramRouteMiddleware(maxAttempts: 5, decayMinutes: 1),
]);
```

### Em Grupos de Rotas

```php
TelegramRouter::group([
    'botId' => 'main',
    'middlewares' => [
        AuthTelegramRouteMiddleware::class,
        LoggingTelegramRouteMiddleware::class,
    ],
], function($router) {
    $router->onCommand('/admin', function(CommandData $data) {
        // Ambos os middleware serão aplicados
    });

    $router->onCommand('/settings', function(CommandData $data) {
        // Ambos os middleware serão aplicados
    });
});
```

## Criando Middleware Personalizado

### Exemplo: Verificação de Permissões de Administrador

```php
<?php

namespace App\Telegram\Middleware;

use HybridGram\Core\Middleware\TelegramRouteMiddlewareInterface;
use HybridGram\Core\UpdateHelper;
use Phptg\BotApi\Type\Update\Update;

class AdminMiddleware implements TelegramRouteMiddlewareInterface
{
    public function handle(Update $update, \Closure $next): mixed
    {
        $user = UpdateHelper::getUserFromUpdate($update);

        if (!$user || !$this->isAdmin($user->id)) {
            $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
            $chat = UpdateHelper::getChatFromUpdate($update);

            if ($chat) {
                $telegram->sendMessage(
                    $chat->id,
                    '❌ Você não tem permissão para executar este comando'
                );
            }

            return null; // Parar execução
        }

        return $next($update);
    }

    private function isAdmin(int $userId): bool
    {
        // Sua lógica de validação
        return in_array($userId, config('telegram.admins', []));
    }
}
```

Uso:

```php
use App\Telegram\Middleware\AdminMiddleware;

TelegramRouter::onCommand('/admin', function(CommandData $data) {
    // Acesso apenas para administradores
})
->middleware(AdminMiddleware::class);
```

## Middleware Global

Você pode registrar middleware global em `TelegramServiceProvider`:

```php
// No método boot() do seu ServiceProvider
public function boot(): void
{
    $middlewareManager = app(\HybridGram\Core\Middleware\MiddlewareManager::class);

    $middlewareManager->addGlobalMiddleware(
        LoggingTelegramRouteMiddleware::class
    );
}
```

Middleware global se aplica a todas as rotas.

## Ordem de Execução

Middleware é executado na seguinte ordem:

1. Middleware global (em ordem de registro)
2. Middleware do grupo de rotas
3. Middleware de rota específica

Cada middleware pode:
- Continuar execução (`return $next($update)`)
- Parar execução (`return null`)
- Modificar dados (passar Update modificado)

## Próximos Passos

- **[Estados](/pt/advanced/states/)** — gerenciando estados de chat e usuário
- **[Enviando Mensagens](/pt/sending/telegram-bot-api/)** — trabalhando com TelegramBotApi
