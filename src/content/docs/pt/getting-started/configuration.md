---
title: Configuração
description: Configurando o pacote TGbot Laravel
---

A configuração do pacote está localizada no arquivo `config/hybridgram.php`, que é criado após publicar a configuração.

## Configuração dos Bots

No array `bots`, você configura seus bots do Telegram. Você pode adicionar múltiplos bots:

```php
'bots' => [
    [
        'token' => env('BOT_TOKEN'),
        'bot_id' => env('BOT_ID', 'main'),
        'update_mode' => UpdateModeEnum::POLLING, // ou WEBHOOK ou WEBHOOK_ASYNC
        'routes_file' => base_path(env('TELEGRAM_ROUTES_FILE', 'routes/telegram.php')),
        'polling_limit' => env('TELEGRAM_POLLING_LIMIT', 100),
        'polling_timeout' => env('TELEGRAM_POLLING_TIMEOUT', 0),
        'allowed_updates' => explode(',', env('ALLOWED_TELEGRAM_UPDATES', '')),
        'secret_token' => env('TELEGRAM_SECRET_TOKEN'),
        'webhook_url' => env('TELEGRAM_WEBHOOK_URL'),
        'webhook_port' => env('TELEGRAM_WEBHOOK_PORT', 9070),
        'certificate_path' => env('TELEGRAM_CERTIFICATE_PATH'),
        'webhook_drop_pending_updates' => env('TELEGRAM_WEBHOOK_DROP_PENDING', false),
        'bot_name' => env('BOT_NAME', 'main'),
    ],
    // Adicione bots adicionais aqui
],
```

### Parâmetros de Configuração do Bot

| Parâmetro | Descrição | Obrigatório |
|-----------|-----------|------------|
| `token` | Token do bot do @BotFather | ✅ Sim |
| `bot_id` | Identificador único do bot | Não (padrão: 'main') |
| `update_mode` | Modo de operação: `POLLING` ou `WEBHOOK` ou `WEBHOOK_ASYNC` pode ser string | Sim |
| `routes_file` | Caminho para o arquivo de rotas | Sim |
| `polling_limit` | Limite de atualizações por requisição (para Polling) | Não |
| `polling_timeout` | Tempo limite da requisição em segundos (para Polling) | Não |
| `allowed_updates` | Array de tipos de atualização permitidos | Não |
| `secret_token` | Token secreto para webhook | Não |
| `webhook_url` | URL do webhook | Para modo WEBHOOK |
| `webhook_port` | Porta para manipulador Go | Não |
| `certificate_path` | Caminho para certificado SSL | Não |
| `webhook_drop_pending_updates` | Descartar atualizações pendentes | Não |
| `bot_name` | Nome do bot | Não |

## Configuração de Envio

A seção `sending` configura o comportamento do envio de mensagens:

```php
'sending' => [
    // Habilitar envio através de filas
    'queue_enabled' => env('TELEGRAM_QUEUE_ENABLED', false),

    // Limite de requisições por minuto por bot (limite do Telegram ~30/seg = 1800/min)
    'rate_limit_per_minute' => (int) env('TELEGRAM_RATE_LIMIT_PER_MINUTE', 1800),

    // Slots reservados para prioridade HIGH (respostas a atualizações recebidas)
    'reserve_high_per_minute' => (int) env('TELEGRAM_RESERVE_HIGH_PER_MINUTE', 300),

    // Tempo máximo de espera em modo síncrono (ms)
    'sync_max_wait_ms' => (int) env('TELEGRAM_SYNC_MAX_WAIT_MS', 2000),

    // Nomes de filas para diferentes prioridades
    'queues' => [
        'high' => env('TELEGRAM_QUEUE_HIGH', 'telegram-high'),
        'low' => env('TELEGRAM_QUEUE_LOW', 'telegram-low'),
    ],

    // Registrar falhas de envio
    'log_failures' => env('TELEGRAM_LOG_FAILURES', true),

    // Incluir corpo da resposta nos logs (pode conter detalhes da requisição)
    'log_response_body' => env('TELEGRAM_LOG_RESPONSE_BODY', true),
],
```

### Modos de Envio

#### Modo Síncrono (queue_enabled = false)
Todas as requisições são enviadas sincronamente sem limite de taxa. Adequado para desenvolvimento e pequenos projetos.

#### Modo Fila (queue_enabled = true)
As requisições são colocadas nas filas do Laravel com prioridades:
- **HIGH** — respostas a atualizações recebidas (processadas primeiro)
- **LOW** — broadcasts e tarefas de fundo

Para executar as filas, você precisa iniciar os workers:

```bash
php artisan queue:work --queue=telegram-high,telegram-low
```

## Configuração de Autorização

A seção `auth` configura a autorização de usuários do Telegram:

```php
'auth' => [
    // Nome do guard para autorização do Telegram
    'guard' => 'hybridgram',

    // Modelo de usuário
    'user_model' => env('TELEGRAM_USER_MODEL', 'App\\Models\\User'),

    // Coluna do banco de dados para armazenar ID do usuário do Telegram
    'telegram_id_column' => env('TELEGRAM_ID_COLUMN', 'telegram_id'),

    // Criar automaticamente usuário se não for encontrado
    'auto_create_user' => env('TELEGRAM_AUTO_CREATE_USER', false),
],
```

## URL Base da API

```php
'base_url' => env('TELEGRAM_BASE_URL', 'https://api.telegram.org/bot'),
```

Este parâmetro pode ser alterado se você estiver usando seu próprio proxy ou servidor de API do Telegram local.

## Exemplo de Configuração Completa

```php
<?php

use HybridGram\Core\UpdateMode\UpdateModeEnum;

return [
    'bots' => [
        [
            'token' => env('BOT_TOKEN'),
            'bot_id' => 'main',
            'update_mode' => UpdateModeEnum::POLLING,
            'routes_file' => base_path('routes/telegram.php'),
        ],
        [
            'token' => env('BOT_TOKEN_2'),
            'bot_id' => 'second_bot',
            'update_mode' => UpdateModeEnum::WEBHOOK,
            'routes_file' => base_path('routes/telegram-bot-2.php'),
            'webhook_url' => env('TELEGRAM_WEBHOOK_URL_2'),
        ],
    ],
    'base_url' => env('TELEGRAM_BASE_URL', 'https://api.telegram.org/bot'),
    'sending' => [
        'queue_enabled' => env('TELEGRAM_QUEUE_ENABLED', false),
        'rate_limit_per_minute' => 1800,
        'reserve_high_per_minute' => 300,
        'queues' => [
            'high' => 'telegram-high',
            'low' => 'telegram-low',
        ],
    ],
    'auth' => [
        'guard' => 'hybridgram',
        'user_model' => 'App\\Models\\User',
        'telegram_id_column' => 'telegram_id',
        'auto_create_user' => false,
    ],
];
```

## O que vem depois?

- **[Roteamento](/pt/basics/routing/)** — criando manipuladores para vários tipos de atualização
- **[Enviando Mensagens](/pt/sending/telegram-bot-api/)** — usando TelegramBotApi
