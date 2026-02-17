---
title: Webhook
description: Configurando a operação do bot via Webhook
---

Webhook é um modo onde o Telegram envia atualizações para seu servidor via requisições HTTP. Este é o método recomendado para ambientes de produção.

## Vantagens

- ✅ Entrega instantânea de atualizações
- ✅ Uso eficiente de recursos
- ✅ Adequado para produção
- ✅ Suporte para múltiplos bots

## Configuração

### 1. Configuração em config/hybridgram.php

```php
'bots' => [
    [
        'token' => env('BOT_TOKEN'),
        'bot_id' => 'main',
        'update_mode' => UpdateModeEnum::WEBHOOK,
        'webhook_url' => env('TELEGRAM_WEBHOOK_URL'),
        'secret_token' => env('TELEGRAM_SECRET_TOKEN'), // Recomendado
        'routes_file' => base_path('routes/telegram.php'),
    ],
],
```

### 2. Variáveis de Ambiente

```env
BOT_TOKEN=seu_token
BOT_ID=main
TELEGRAM_UPDATE_MODE=WEBHOOK
TELEGRAM_WEBHOOK_URL=https://seu-dominio.com/telegram/bot/webhook/main
TELEGRAM_SECRET_TOKEN=seu_token_secreto
```

### 3. Configurando o Webhook

#### Via Comando Artisan

```bash
php artisan hybridgram:set-webhook main
```

Ou com parâmetros adicionais:

```bash
php artisan hybridgram:set-webhook main \
    --url=https://seu-dominio.com/telegram/bot/webhook/main \
    --secret-token=seu_token_secreto \
    --drop-pending
```

#### Via Código

```php
use HybridGram\\Telegram\\TelegramBotApi;

$telegram = app(TelegramBotApi::class, ['botId' => 'main']);
$telegram->setWebhook(
    url: 'https://seu-dominio.com/telegram/bot/webhook/main',
    secretToken: 'seu_token_secreto'
);
```

### 4. Rota do Webhook

O pacote registra uma rota automaticamente, mas você pode configurar a sua própria:

```php
// routes/web.php ou routes/api.php
Route::post('/telegram/bot/webhook/{botId}',
    [\\HybridGram\\Http\\Controllers\\WebhookController::class, 'handle']
)->name('telegram.bot.webhook');
```

O parâmetro `{botId}` da URL é resolvido automaticamente para um objeto `BotConfig`. O método `handle` recebe a configuração do bot já resolvida, não uma string:

```php
use HybridGram\\Core\\Config\\BotConfig;
use HybridGram\\Http\\Controllers\\WebhookController;

// Assinatura do método handle — segundo argumento é BotConfig, não string
public function handle(\\Illuminate\\Http\\Request $request, BotConfig $botConfig): \\Illuminate\\Http\\Response
{
    // $botConfig — objeto com token, bot_id, routes_file e outras configurações do bot
    // ...
}
```

## Segurança

### Token Secreto

Usar um token secreto para verificar a autenticidade das requisições é recomendado:

1. Gere um token aleatório:
   ```bash
   php artisan tinker
   >>> Str::random(32)
   ```

2. Configure em `.env`:
   ```env
   TELEGRAM_SECRET_TOKEN=seu_token_gerado
   ```

3. Use ao configurar o webhook:
   ```bash
   php artisan hybridgram:set-webhook main --secret-token=seu_token_gerado
   ```

O pacote verifica automaticamente o token secreto no cabeçalho `X-Telegram-Bot-Api-Secret-Token`.

### HTTPS

O Telegram requer HTTPS para webhooks. Use:
- Certificado SSL (Let's Encrypt, Cloudflare, etc.)
- Certificado local para desenvolvimento (não recomendado para produção)

## Certificado SSL

Se você possui um certificado auto-assinado:

```bash
php artisan hybridgram:set-webhook main \
    --certificate=/path/to/certificate.pem
```

Ou na configuração:

```php
'certificate_path' => env('TELEGRAM_CERTIFICATE_PATH'),
```

## Verificação do Webhook

### Obter Informações do Webhook

```bash
php artisan hybridgram:get-webhook-info main
```

Ou via código:

```php
$telegram = app(TelegramBotApi::class, ['botId' => 'main']);
$info = $telegram->getWebhookInfo();
```

### Deletar Webhook

```bash
php artisan hybridgram:delete-webhook main
```

## Atualizações Permitidas

Você pode limitar os tipos de atualizações que o bot recebe:

```php
'allowed_updates' => ['message', 'callback_query', 'inline_query'],
```

Ou em `.env`:

```env
ALLOWED_TELEGRAM_UPDATES=message,callback_query
```

## Removendo Atualizações Pendentes

Ao configurar o webhook, você pode remover todas as atualizações pendentes:

```bash
php artisan hybridgram:set-webhook main --drop-pending
```

Ou na configuração:

```php
'webhook_drop_pending_updates' => true,
```

## Go Handler tgook (opcional)

O pacote suporta um proxy Go separado `tgook` para máximo desempenho e processamento assíncrono de atualizações.

```php
'webhook_port' => env('TELEGRAM_WEBHOOK_PORT', 9070),
```

Neste modo, o Telegram envia requisições para o serviço Go, que coloca as atualizações em uma fila Redis, e os workers do Laravel as processam em segundo plano.
Arquitetura detalhada e instruções de configuração — na seção **"Go proxy tgook"** (`/pt/advanced/go-proxy-tgook/`).

## Depuração

### Logging

Ative o logging em `config/logging.php`:

```php
'channels' => [
    'telegram' => [
        'driver' => 'single',
        'path' => storage_path('logs/telegram.log'),
    ],
],
```

### Inspeção de Requisições

Todas as atualizações recebidas são registradas na tabela `telegram_updates` (se a migração foi executada).

## Problemas Comuns

### 429 Too Many Requests

Se você receber o erro 429:
- Verifique as configurações de rate limiting
- Certifique-se de que está usando modo de fila
- Verifique se há requisições duplicadas

### Webhook Não Funciona

1. Verifique se HTTPS está configurado
2. Certifique-se de que a URL está acessível externamente
3. Verifique o token secreto
4. Verifique os logs do servidor

### Atraso de Atualizações

- Verifique as configurações do webhook via `get-webhook-info`
- Certifique-se de que o servidor não está sobrecarregado
- Verifique o tamanho da fila

## Recomendações para Produção

1. ✅ Use HTTPS com certificado válido
2. ✅ Configure o token secreto
3. ✅ Use modo de fila para envio
4. ✅ Configure monitoramento e alertas
5. ✅ Verifique regularmente o status do webhook
6. ✅ Limite `allowed_updates` apenas para os tipos necessários

## Próximos Passos

- **[Polling](/pt/modes/polling/)** — modo alternativo para receber atualizações
- **[Enviando Mensagens](/pt/sending/telegram-bot-api/)** — trabalhando com TelegramBotApi
