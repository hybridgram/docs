---
title: Trabalhando com Múltiplos Bots
description: Configuração e uso de múltiplos bots do Telegram
---

O pacote suporta o trabalho com múltiplos bots simultaneamente. Cada bot possui sua própria configuração e rotas.

## Configuração de Múltiplos Bots

No arquivo `config/hybridgram.php`:

```php
'bots' => [
    [
        'token' => env('BOT_TOKEN_1'),
        'bot_id' => 'main',
        'update_mode' => UpdateModeEnum::WEBHOOK,
        'webhook_url' => env('TELEGRAM_WEBHOOK_URL_1'),
        'routes_file' => base_path('routes/telegram-main.php'),
    ],
    [
        'token' => env('BOT_TOKEN_2'),
        'bot_id' => 'support',
        'update_mode' => UpdateModeEnum::WEBHOOK,
        'webhook_url' => env('TELEGRAM_WEBHOOK_URL_2'),
        'routes_file' => base_path('routes/telegram-support.php'),
    ],
    [
        'token' => env('BOT_TOKEN_3'),
        'bot_id' => 'admin',
        'update_mode' => UpdateModeEnum::POLLING,
        'routes_file' => base_path('routes/telegram-admin.php'),
    ],
],
```

## Variáveis de Ambiente

```env
# Primeiro bot
BOT_TOKEN_1=token_do_primeiro_bot
TELEGRAM_WEBHOOK_URL_1=https://seu-dominio.com/telegram/bot/webhook/main

# Segundo bot
BOT_TOKEN_2=token_do_segundo_bot
TELEGRAM_WEBHOOK_URL_2=https://seu-dominio.com/telegram/bot/webhook/support

# Terceiro bot
BOT_TOKEN_3=token_do_terceiro_bot
```

## Roteamento para Bot Específico

### Usando forBot()

```php
// routes/telegram-main.php
use HybridGram\Facades\TelegramRouter;

TelegramRouter::forBot('main')->onCommand('/start', function(CommandData $data) {
    // Manipula apenas para o bot 'main'
});

// routes/telegram-support.php
TelegramRouter::forBot('support')->onCommand('/start', function(CommandData $data) {
    // Manipula apenas para o bot 'support'
});
```

### Rotas Comuns para Todos os Bots

```php
// Rota para todos os bots
TelegramRouter::onCommand('/help', function(CommandData $data) {
    // $data->botId contém o ID do bot para o qual a rota foi acionada
    $botId = $data->botId;

    // Lógica diferente dependendo do bot
    match($botId) {
        'main' => $this->handleMainHelp($data),
        'support' => $this->handleSupportHelp($data),
        default => $this->handleDefaultHelp($data),
    };
});
```

## Obtendo Instância de TelegramBotApi para Bot Específico

```php
// Para bot específico
$telegram = app(\HybridGram\Telegram\TelegramBotApi::class, ['botId' => 'main']);
$telegram->sendMessage($chatId, 'Mensagem do bot main');

$telegram = app(\HybridGram\Telegram\TelegramBotApi::class, ['botId' => 'support']);
$telegram->sendMessage($chatId, 'Mensagem do bot support');
```

## Agrupando Rotas por Bots

```php
TelegramRouter::group([
    'botId' => 'main',
], function($router) {
    $router->onCommand('/start', function(CommandData $data) {
        // ...
    });

    $router->onCommand('/menu', function(CommandData $data) {
        // ...
    });
});
```

## Diferentes Modos de Operação

Cada bot pode funcionar em seu próprio modo:

```php
'bots' => [
    [
        'bot_id' => 'main',
        'update_mode' => UpdateModeEnum::WEBHOOK, // Bot de produção
    ],
    [
        'bot_id' => 'dev',
        'update_mode' => UpdateModeEnum::POLLING, // Bot de desenvolvimento
    ],
],
```

## Gerenciamento de Webhook

### Configurando Webhook para Bot Específico

```bash
php artisan hybridgram:set-webhook main
php artisan hybridgram:set-webhook support
```

### Obtendo Informações do Webhook

```bash
php artisan hybridgram:get-webhook-info main
php artisan hybridgram:get-webhook-info support
```

## Executando Polling para Múltiplos Bots

Execute um processo separado para cada bot:

```bash
# Terminal 1
php artisan hybridgram:polling main

# Terminal 2
php artisan hybridgram:polling support
```

Ou use Supervisor:

```ini
[program:telegram-main]
command=php /path/to/artisan hybridgram:polling main

[program:telegram-support]
command=php /path/to/artisan hybridgram:polling support
```

## Isolamento de Dados

Cada bot possui:
- Suas próprias rotas
- Seu próprio rate limit (contador separado)
- Seus próprios estados (isolados)
- Sua própria configuração

## Compartilhando Código Entre Bots

Você pode extrair a lógica comum em serviços:

```php
// app/Telegram/Services/CommonService.php
class CommonService
{
    public function handleWelcome(CommandData $data, string $botId): void
    {
        $telegram = app(\HybridGram\Telegram\TelegramBotApi::class, ['botId' => $botId]);

        $message = match($botId) {
            'main' => 'Bem-vindo ao bot principal!',
            'support' => 'Bem-vindo ao suporte!',
            default => 'Bem-vindo!',
        };

        $telegram->sendMessage($data->getChat()->id, $message);
    }
}

// Uso
TelegramRouter::forBot('main')->onCommand('/start', function(CommandData $data) {
    app(CommonService::class)->handleWelcome($data, 'main');
});
```

## Recomendações

1. ✅ Use `bot_id` único para cada bot
2. ✅ Separe as rotas em arquivos para melhor organização
3. ✅ Use prefixos nos nomes das variáveis de ambiente
4. ✅ Documente o propósito de cada bot
5. ✅ Monitore os rate limits para cada bot separadamente

## Próximos Passos

- **[Configuração](/pt/getting-started/configuration/)** — configuração detalhada
- **[Webhook](/pt/modes/webhook/)** — configuração de webhooks para múltiplos bots
