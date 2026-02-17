---
title: Limitação de Taxa
description: Gerenciamento de limites de requisição para a API do Telegram
---

A API do Telegram Bot tem um limite de aproximadamente 30 requisições por segundo por bot. O pacote gerencia automaticamente esses limites com um sistema de limitação de taxa.

## Como Funciona

### Em Modo Síncrono

Em modo síncrono, a limitação de taxa **não é aplicada**. Todas as requisições são enviadas imediatamente. Isso é adequado para desenvolvimento, mas pode levar a erros 429 (Muitas Requisições) em produção.

### Em Modo Fila

Em modo fila, a limitação de taxa é aplicada em workers:

1. O limite atual do bot é verificado
2. Se houver slots disponíveis — a requisição é enviada
3. Se o limite for atingido — o trabalho é retornado à fila
4. O worker não é bloqueado, processa outros trabalhos

## Configuração

```php
'sending' => [
    // Limite de taxa por minuto por bot
    'rate_limit_per_minute' => 1800, // ~30/seg

    // Reserva para prioridade ALTA
    'reserve_high_per_minute' => 300,
],
```

### Limite Por Bot

A limitação de taxa é contada **separadamente para cada bot**. Se você tiver múltiplos bots, cada um tem seu próprio limite.

### Janela Deslizante

Uma janela deslizante de 60 segundos via cache é usada. Isso significa:
- O limite é verificado nos últimos 60 segundos
- Requisições antigas saem automaticamente da janela
- Conformidade de limite mais precisa

## Prioridades e Reserva

O sistema reserva slots para prioridade ALTA:

```php
'rate_limit_per_minute' => 1800,
'reserve_high_per_minute' => 300,
```

Isso significa:
- **ALTA** pode usar todos os 1800 slots por minuto
- **BAIXA** pode usar no máximo 1500 slots (1800 - 300)
- Pelo menos 300 slots sempre disponíveis para ALTA

**Cenário de exemplo:**
- 1500 requisições BAIXA na fila
- 400 requisições ALTA chegam
- BAIXA aguardará até que ALTA sejam processadas
- 300 slots ALTA são reservados e sempre disponíveis

## Configurando Limites

### Para um Único Bot

```env
TELEGRAM_RATE_LIMIT_PER_MINUTE=1800
TELEGRAM_RESERVE_HIGH_PER_MINUTE=300
```

### Para Produção

Valores recomendados:

```env
# Abordagem conservadora (menor risco de erros 429)
TELEGRAM_RATE_LIMIT_PER_MINUTE=1500

# Abordagem agressiva (máxima utilização)
TELEGRAM_RATE_LIMIT_PER_MINUTE=1800
```

## Tratamento de Erros 429

Se o erro 429 ainda ocorrer, o pacote faz o registro:

```php
// Nos logs será:
// Telegram outgoing request failed
// error_code: 429
// description: Too Many Requests
```

Em modo fila, o trabalho automaticamente retorna à fila e será processado posteriormente.

## Monitoramento

### Registro de Atividades

Habilite o registro de erros na configuração:

```php
'sending' => [
    'log_failures' => true,
    'log_response_body' => true, // Inclui corpo da resposta nos logs
],
```

### Verificação via Cache

O limitador de taxa armazena dados no cache do Laravel. Você pode verificar a carga atual:

```php
use Illuminate\\Support\\Facades\\Cache;

// Chaves para verificação (exemplo)
$cacheKey = "telegram_rate_limit_{$botId}";
$data = Cache::get($cacheKey);
```

## Configuração para Diferentes Cenários

### Alta Carga (transmissões)

```php
// Aumentar limite se confiante
'rate_limit_per_minute' => 1800,
'reserve_high_per_minute' => 500, // Mais reserva para respostas
```

### Baixa Carga

```php
// Valores conservadores
'rate_limit_per_minute' => 1200,
'reserve_high_per_minute' => 200,
```

### Múltiplos Bots

Cada bot tem limite separado, mas considere a carga geral do servidor.

## Depuração

### Habilitar Registro Detalhado

```php
'sending' => [
    'log_failures' => true,
    'log_response_body' => true,
],
```

### Verificando Tamanhos de Fila

```php
use Illuminate\\Support\\Facades\\Queue;

$highSize = Queue::size('telegram-high');
$lowSize = Queue::size('telegram-low');

logger()->info('Queue sizes', [
    'high' => $highSize,
    'low' => $lowSize,
]);
```

## Recomendações

1. **Use modo fila em produção** para conformidade de limite

2. **Configure monitoramento** para tamanhos de fila e erros 429

3. **Use prioridade BAIXA** para transmissões

4. **Reserve slots suficientes** para prioridade ALTA (respostas recebidas)

5. **Teste limites** antes de deploy em produção

## O que Vem a Seguir?

- **[Prioridades e Filas](/pt/sending/priorities-queues/)** — configurando filas
- **[Modos de Operação](/pt/modes/webhook/)** — configurando webhook e polling
