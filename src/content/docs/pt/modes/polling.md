---
title: Polling
description: Configurando a operação do bot via Polling
---

Polling é um modo onde seu servidor solicita periodicamente atualizações do Telegram. Adequado para desenvolvimento e testes.

## Vantagens

- ✅ Não requer URL pública
- ✅ Configuração simples
- ✅ Adequado para desenvolvimento
- ✅ Pode ser usado localmente

## Desvantagens

- ❌ Atraso no recebimento de atualizações
- ❌ Uso ineficiente de recursos
- ❌ Não recomendado para produção com alta carga

## Configuração

### 1. Configuração em config/hybridgram.php

```php
'bots' => [
    [
        'token' => env('BOT_TOKEN'),
        'bot_id' => 'main',
        'update_mode' => UpdateModeEnum::POLLING,
        'routes_file' => base_path('routes/telegram.php'),
        'polling_limit' => env('TELEGRAM_POLLING_LIMIT', 100),
        'polling_timeout' => env('TELEGRAM_POLLING_TIMEOUT', 0),
        'allowed_updates' => explode(',', env('ALLOWED_TELEGRAM_UPDATES', '')),
    ],
],
```

### 2. Variáveis de Ambiente

```env
BOT_TOKEN=your_token
BOT_ID=main
TELEGRAM_UPDATE_MODE=POLLING
TELEGRAM_POLLING_LIMIT=100
TELEGRAM_POLLING_TIMEOUT=0
ALLOWED_TELEGRAM_UPDATES=message,callback_query
```

### 3. Iniciando o Polling

#### Execução Básica

```bash
php artisan hybridgram:polling main
```

#### Com Hot-reload (para desenvolvimento)

```bash
php artisan hybridgram:polling main --hot-reload
```

O Hot-reload reinicia automaticamente o comando quando o código muda.

#### Com Configurações de Monitoramento

```bash
php artisan hybridgram:polling main \
    --hot-reload \
    --watch=app,routes,config,src \
    --watch-interval=1
```

Parâmetros:
- `--watch` — diretórios a monitorar (separados por vírgula)
- `--watch-interval` — intervalo de verificação em segundos

#### Limitando Tipos de Atualização

```bash
php artisan hybridgram:polling main --allowed-updates=message,callback_query
```

Ou na configuração:

```php
'allowed_updates' => ['message', 'callback_query'],
```

#### Opções do comando hybridgram:polling

| Opção | Curto | Descrição |
|-------|-------|-----------|
| `--log-updates` | `-L`  | Imprimir um resumo de uma linha para cada atualização recebida |
| `--full` | `-F`  | Imprimir a carga completa da atualização como JSON formatado (implica `--log-updates`) |
| `--hot-reload` | `-R`  | Auto-reiniciar em mudanças de código (para desenvolvimento) |
| `--watch=` | `-W=` | Caminhos separados por vírgula para monitorar (padrão: app,routes,config,src) |
| `--watch-interval=1` | `-I`  | Segundos entre varreduras de arquivo no modo hot-reload |

Exemplos com aliases curtos:

```bash
php artisan hybridgram:polling main -L
php artisan hybridgram:polling main -F
php artisan hybridgram:polling main -R -W=app,routes -I 2
```

## Parâmetros de Polling

### polling_limit

Número máximo de atualizações por solicitação (1-100):

```php
'polling_limit' => 100, // Máximo
```

Mais atualizações = menos solicitações, mas mais atraso.

### polling_timeout

Tempo limite da solicitação em segundos (0 = polling curto):

```php
'polling_timeout' => 0, // Polling curto
```

Para polling longo:

```php
'polling_timeout' => 60, // Polling longo (até 60 segundos)
```

O polling longo reduz o número de solicitações, mas aumenta o atraso de resposta aos comandos.

## Hot-reload em Desenvolvimento

O Hot-reload reinicia automaticamente o comando quando os arquivos mudam:

```bash
php artisan hybridgram:polling main --hot-reload --watch=app,routes
```

Isso permite:
- Não reiniciar o comando manualmente
- Ver as mudanças de código rapidamente
- Desenvolvimento local conveniente

## Executando via Supervisor (produção)

Para operação contínua em produção:

```ini
[program:telegram-polling]
command=php /path/to/artisan hybridgram:polling main
directory=/path/to/project
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
redirect_stderr=true
stdout_logfile=/path/to/storage/logs/polling.log
```

## Limitações

### allowed_updates

Limite os tipos de atualização para reduzir a carga:

```php
'allowed_updates' => [
    'message',
    'callback_query',
    // Apenas tipos necessários
],
```

### Um Processo por Bot

Não execute múltiplos processos de polling para o mesmo bot simultaneamente — isso pode levar a atualizações duplicadas.

## Depuração

### Logging

Para ver as atualizações recebidas no console, use `-L` (resumo de uma linha por atualização) ou `-F` (JSON completo):

```bash
php artisan hybridgram:polling main -L
php artisan hybridgram:polling main -F
```

Exemplo de saída com `-L`:

```
Processing update 12345...
Processing update 12346...
```

### Verificação de Status

Verifique se o polling está funcionando:

```bash
ps aux | grep "hybridgram:polling"
```

## Transição de Polling para Webhook

Quando pronto para produção:

1. Configure o webhook:
   ```bash
   php artisan hybridgram:set-webhook main
   ```

2. Pare o polling:
   ```bash
   # Localize e interrompa o processo
   pkill -f "hybridgram:polling"
   ```

3. Delete o webhook (se precisar voltar ao polling):
   ```bash
   php artisan hybridgram:delete-webhook main
   ```

## Recomendações

### Para Desenvolvimento

- ✅ Use hot-reload
- ✅ Limite `allowed_updates` apenas aos tipos necessários
- ✅ Use `polling_limit = 10-20` para resposta rápida

### Para Produção

- ❌ Não é recomendado usar polling em produção
- ✅ Use webhook em vez de polling
- ✅ Se necessário, use polling longo com tempo limite

## Quando Usar Polling

Use polling quando:
- Desenvolvendo o bot localmente
- Testando funcionalidade
- Sem capacidade de configurar HTTPS
- Baixa carga e sem atrasos críticos

Não use polling quando:
- Ambiente de produção
- Alta carga
- Atrasos críticos de atualização
- Desempenho máximo necessário

## Próximos Passos

- **[Webhook](/pt/modes/webhook/)** — modo recomendado para produção
- **[Envio de Mensagens](/pt/sending/telegram-bot-api/)** — trabalhando com TelegramBotApi
