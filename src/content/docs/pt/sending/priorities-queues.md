---
title: Prioridades & Filas
description: Configuração de filas e prioridades para envio de mensagens
---

O pacote suporta envio assíncrono de mensagens através de filas do Laravel com um sistema de prioridades, garantindo processamento rápido de respostas para atualizações recebidas.

## Modos de Operação

### Modo Sincronizado (padrão)

No modo sincronizado, todas as requisições são enviadas sincronamente:

```env
TELEGRAM_QUEUE_ENABLED=false
```

Requisições são executadas imediatamente, mas sem limite de taxa. Adequado para desenvolvimento e projetos pequenos.

### Modo Fila

No modo fila, requisições são colocadas em filas:

```env
TELEGRAM_QUEUE_ENABLED=true
```

Para executar filas, você precisa iniciar workers:

```bash
# Processar todas as filas
php artisan queue:work --queue=telegram-high,telegram-low

# Ou separadamente por prioridade
php artisan queue:work --queue=telegram-high
php artisan queue:work --queue=telegram-low
```

## Prioridades

O pacote usa dois níveis de prioridade:

### ALTA (padrão)

- Respostas para atualizações recebidas
- Mensagens críticas
- Todas as requisições têm essa prioridade por padrão

```php
use HybridGram\\Telegram\\Priority;

// Especificação explícita (não obrigatória, esse é o padrão)
$telegram->withPriority(Priority::HIGH)
    ->sendMessage($chatId, 'Resposta rápida');
```

### BAIXA

- Transmissões (broadcasts)
- Tarefas em background
- Mensagens não críticas

```php
$telegram->withPriority(Priority::LOW)
    ->sendMessage($chatId, 'Transmissão');
```

## Configuração

Em `config/hybridgram.php`:

```php
'sending' => [
    'queue_enabled' => env('TELEGRAM_QUEUE_ENABLED', false),

    // Limite de taxa por minuto por bot (padrão 1800 ≈ 30/seg)
    'rate_limit_per_minute' => env('TELEGRAM_RATE_LIMIT_PER_MINUTE', 1800),

    // Slots reservados para prioridade ALTA
    'reserve_high_per_minute' => env('TELEGRAM_RESERVE_HIGH_PER_MINUTE', 300),

    // Nomes das filas
    'queues' => [
        'high' => env('TELEGRAM_QUEUE_HIGH', 'telegram-high'),
        'low' => env('TELEGRAM_QUEUE_LOW', 'telegram-low'),
    ],
],
```

### Reserva de Prioridade ALTA

O parâmetro `reserve_high_per_minute` garante que um certo número de slots estejam sempre disponíveis para prioridade ALTA. A prioridade BAIXA não pode usar esses slots.

**Exemplo:**
- `rate_limit_per_minute = 1800`
- `reserve_high_per_minute = 300`

Isso significa:
- Até 1800 requisições por minuto
- Pelo menos 300 slots sempre disponíveis para ALTA
- BAIXA pode usar até 1500 slots por minuto

## Uso

### Em Manipuladores de Rota

Em manipuladores de rota, a prioridade ALTA é usada automaticamente:

```php
TelegramRouter::onCommand('/start', function(CommandData $data) {
    $telegram = app(TelegramBotApi::class);

    // Automaticamente prioridade ALTA
    $telegram->sendMessage($data->getChat()->id, 'Olá!');
});
```

### Para Transmissões

Especifique explicitamente a prioridade BAIXA para transmissões:

```php
// Transmitir para todos os usuários
$users = User::all();

foreach ($users as $user) {
    $telegram->withPriority(Priority::LOW)
        ->sendMessage($user->telegram_id, 'Notícias!');
}
```

### Uso Misto

```php
use HybridGram\\Core\\Routing\\RouteData\\TextMessageData;

TelegramRouter::onTextMessage(function(TextMessageData $data) {
    $telegram = app(TelegramBotApi::class);

    // Resposta de alta prioridade
    $telegram->sendMessage(
        $data->getChat()->id,
        'Sua mensagem foi recebida!'
    );

    // Tarefa de baixa prioridade (ex: logging)
    $telegram->withPriority(Priority::LOW)
        ->sendMessage(
            config('telegram.admin_chat_id'),
            "Nova mensagem de {$data->getUser()->id}"
        );
});
```

## Executando Workers

### Execução Básica

```bash
php artisan queue:work --queue=telegram-high,telegram-low
```

### Com Configurações

```bash
php artisan queue:work \
    --queue=telegram-high,telegram-low \
    --tries=3 \
    --timeout=60 \
    --max-jobs=1000 \
    --max-time=3600
```

### Usando Supervisor (recomendado)

Crie a configuração `/etc/supervisor/conf.d/telegram-worker.conf`:

```ini
[program:telegram-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/artisan queue:work --queue=telegram-high,telegram-low --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/path/to/storage/logs/worker.log
stopwaitsecs=3600
```

Então:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start telegram-worker:*
```

## Limite de Taxa no Modo Fila

No modo fila, o limite de taxa é aplicado nos workers:

1. Job entra na fila
2. Worker retira job da fila
3. Limite de taxa é verificado
4. Se limite excedido, job é retornado à fila (`release()`)
5. Worker não é bloqueado por `sleep()`, pode processar outros jobs

Isso garante:
- Processamento não-bloqueante
- Uso eficiente de recursos
- Conformidade com limites do Telegram

## Monitoramento de Filas

### Verificando Tamanho das Filas

```php
use Illuminate\\Support\\Facades\\Queue;

$highQueueSize = Queue::size('telegram-high');
$lowQueueSize = Queue::size('telegram-low');
```

### Monitoramento via Laravel Horizon

Se usando Laravel Horizon:

```bash
php artisan horizon
```

A interface web mostrará as filas `telegram-high` e `telegram-low`.

## Notas Importantes

1. **InputFile com resource** não é suportado no modo fila. Use caminhos de arquivo ou base64.

2. **Métodos de serviço** (getUpdates, setWebhook, getMe) sempre executam sincronamente.

3. **Prioridade padrão**: ALTA é automaticamente usada em manipuladores de rota.

4. **Fallback**: Se fila não estiver configurada, requisições executam sincronamente.

## Próximos Passos

- **[Limite de Taxa](/pt/sending/rate-limiting/)** — detalhes sobre limite de taxa
- **[Modos de Operação](/pt/modes/webhook/)** — configuração de webhook e polling
