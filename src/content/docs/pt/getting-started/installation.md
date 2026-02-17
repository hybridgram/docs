---
title: Instalação
description: Instalando o pacote TGbot Laravel
---

## Instalação via Composer

Instale o pacote em seu projeto Laravel:

```bash
composer require hybridgram/tgbot-laravel
```

## Publicar Configuração

Publique o arquivo de configuração do pacote:

```bash
php artisan vendor:publish --provider="HybridGram\Providers\TelegramServiceProvider"
```

Isso criará o arquivo `config/hybridgram.php` onde você pode configurar seus bots.

## Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Token do seu bot do @BotFather
BOT_TOKEN=seu_token_bot

# ID do bot (opcional, padrão é 'main')
# Se não especificado, BOT_TOKEN será usado como identificador
BOT_ID=main

# Modo de recebimento de atualizações: POLLING ou WEBHOOK
TELEGRAM_UPDATE_MODE=POLLING

# Caminho para o arquivo de rotas (opcional)
TELEGRAM_ROUTES_FILE=routes/telegram.php
```

### Configurações Adicionais de Webhook

Se você estiver usando o modo Webhook, adicione:

```env
# URL do webhook
TELEGRAM_WEBHOOK_URL=https://seu-dominio.com/telegram/bot/webhook/main

# Token secreto para segurança (opcional)
TELEGRAM_SECRET_TOKEN=seu_token_secreto

# Porta para processamento de webhook (se usar manipulador Go)
TELEGRAM_WEBHOOK_PORT=9070

# Caminho para certificado SSL (se necessário)
TELEGRAM_CERTIFICATE_PATH=/path/to/certificate.pem

# Descartar atualizações pendentes ao configurar webhook
TELEGRAM_WEBHOOK_DROP_PENDING=false
```

### Configurações de Polling

Para o modo Polling:

```env
# Limite de atualizações por solicitação (padrão 100)
TELEGRAM_POLLING_LIMIT=100

# Tempo limite da solicitação em segundos (padrão 0)
TELEGRAM_POLLING_TIMEOUT=0

# Tipos de atualização permitidos (separados por vírgula)
ALLOWED_TELEGRAM_UPDATES=message,callback_query
```

## Criar Arquivo de Rotas

Crie um arquivo para definir as rotas do seu bot. Por padrão, é `routes/telegram.php`:

```php
<?php

use HybridGram\Facades\TelegramRouter;
use HybridGram\Core\Routing\RouteData\CommandData;

TelegramRouter::onCommand('/start', function(CommandData $data) {
    $telegram = app(\HybridGram\Telegram\TelegramBotApi::class);
    $telegram->sendMessage($data->chatId, 'Olá! 👋');
});
```

## Verificar Instalação

Após a instalação, certifique-se de que:

1. ✅ O pacote está instalado via Composer
2. ✅ O arquivo de configuração foi publicado
3. ✅ As variáveis de ambiente foram configuradas
4. ✅ O arquivo de rotas foi criado

## Próximos Passos

- **[Configuração](/pt/getting-started/configuration/)** — configuração detalhada do pacote
- **[Criando Sua Primeira Rota](/pt/basics/routing/)** — comece a criar manipuladores
