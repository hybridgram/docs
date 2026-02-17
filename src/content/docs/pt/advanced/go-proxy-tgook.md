---
title: Go proxy tgook
description: Manipulação assíncrona de webhook do Telegram através de proxy Go de alto desempenho
---

`tgook` é um serviço Go separado (veja diretório `go-proxy`) que aceita requisições webhook do Telegram e **assincronamente** as passa ao Laravel através de uma fila Redis.
A aplicação PHP não mais trata requisições do Telegram dentro do ciclo de vida da requisição HTTP — ela apenas processa tarefas da fila, proporcionando uma margem de desempenho elevada.

## Como Funciona

O fluxo é assim:

1. Telegram envia requisição para `tgook`:
   - `POST /telegram/bot/webhook/{bot_id}`
2. `tgook`:
   - valida `X-Telegram-Bot-Api-Secret-Token` (se token secreto estiver habilitado),
   - serializa a atualização no formato de fila Laravel (`App\Jobs\ProcessTelegramUpdateJob`),
   - coloca a tarefa na fila Redis (padrão `telegram_updates`) e atualiza chaves Horizon.
3. Workers Laravel (`queue:work` ou Horizon) executam assincronamente `ProcessTelegramUpdateJob` e dentro dela chamam `HybridGram`.

Resultado:

- Resposta HTTP ao Telegram do Go chega instantaneamente,
- Laravel processa atualizações em paralelo em background,
- Servidor PHP frontend (Nginx/Apache + PHP-FPM) não é carregado com requisições diretas do Telegram.

## Requisitos

- Servidor Redis (o mesmo que Laravel queue usa);
- Fila Laravel em Redis:
  - `QUEUE_CONNECTION=redis`,
  - workers executando `php artisan queue:work` **ou** Horizon;
- Job configurado `App\Jobs\ProcessTelegramUpdateJob` (incluído com o pacote).

## Configurando tgook

No diretório com binário `tgook` (veja `bin/tgook` ou compile de `go-proxy`) crie `.env`:

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=null

# Mesmo segredo que em Laravel / ao configurar webhook
SECRET_TOKEN=${TELEGRAM_SECRET_TOKEN}

# Porta que tgook ouve
LISTEN_PORT=9070

# Prefixos para Redis / Horizon
REDIS_PREFIX=laravel_database:
HORIZON_PREFIX=laravel_horizon:
APP_NAME=Laravel

# Nome da fila para atualizações (deve coincidir com Laravel)
TELEGRAM_UPDATES_QUEUE_NAME=telegram_updates
```

Pontos-chave:

- `SECRET_TOKEN` deve coincidir com o que você definiu ao instalar webhook no Telegram (`TELEGRAM_SECRET_TOKEN`);
- `TELEGRAM_UPDATES_QUEUE_NAME` deve coincidir com o nome da fila que seus workers leem.

## Executando tgook

### Execução Local

```bash
./tgook           # ou ./go-proxy se executando binário compilado do diretório go-proxy
```

Você pode especificar explicitamente o caminho para `.env`:

```bash
./tgook /path/to/.env
```

### Como Serviço systemd (Linux)

Exemplo breve de arquivo unit:

```ini
[Unit]
Description=Go Proxy for Telegram Webhooks (tgook)
After=network.target redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/hybridgram/go-proxy
ExecStart=/var/www/hybridgram/bin/tgook
Restart=always
RestartSec=5
 EnvironmentFile=/var/www/hybridgram/go-proxy/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable tgook
sudo systemctl start tgook
```

## Conectando ao HybridGram (Webhook + tgook)

`tgook` funciona em conjunto com modo **Webhook**:

1. Na aplicação Laravel ative modo webhook conforme descrito na seção **Webhook**:

   ```php
   'bots' => [
       [
           'token' => env('BOT_TOKEN'),
           'bot_id' => 'main',
           'update_mode' => UpdateModeEnum::WEBHOOK,
           'webhook_url' => env('TELEGRAM_WEBHOOK_URL'),
           'secret_token' => env('TELEGRAM_SECRET_TOKEN'),
           'routes_file' => base_path('routes/telegram.php'),
       ],
   ],
   ```

2. Para `TELEGRAM_WEBHOOK_URL` especifique endereço do proxy Go:

   ```env
   TELEGRAM_WEBHOOK_URL=https://your-tgook-host.com/telegram/bot/webhook/main
   TELEGRAM_SECRET_TOKEN=complex_secret
   ```

3. Configure webhook via comando ou código:

   ```bash
   php artisan hybridgram:set-webhook main
   ```

   Agora Telegram enviará atualizações **para tgook**, e Laravel as receberá da fila Redis.

## Quando Usar tgook

- **Alta carga** — dezenas/centenas de requisições por segundo do Telegram;
- **Requisitos estritos de latência** — precisa rapidamente retornar 200 OK ao Telegram;
- **Separação de recebimento e processamento** — recebimento de atualizações e processamento feito por diferentes servidores/serviços;
- **Dimensionamento horizontal** — pode dimensionar workers Laravel independentemente do tráfego HTTP de entrada.

Se você tem um bot pequeno e webhook PHP regular trata a carga, `tgook` é opcional. Mas conforme a carga cresce, ele proporciona "margem de confiabilidade" quase gratuitamente.
