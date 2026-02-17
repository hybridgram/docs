---
title: Registro Programático de Bots
description: Adicionando bots em tempo de execução como alternativa à configuração
---

Além de definir bots em `config/hybridgram.php`, você pode registrar bots programaticamente usando `HybridGramBotManager`. Isso é útil quando as credenciais dos bots ou a lista vêm de um banco de dados, API externa, ou quando você quer construir o gerenciador em código.

## Quando usar

- Bots são armazenados em um banco de dados ou carregados dinamicamente.
- Você quer adicionar bots em um provedor de serviço ou comando personalizado antes de iniciar o polling.
- Você precisa misturar bots baseados em configuração com bots adicionados em tempo de execução.

Para configuração estática, a [abordagem baseada em configuração](/pt/getting-started/configuration/) é mais simples.

## API do HybridGramBotManager

Resolva o gerenciador do contêiner (ele é registrado como `HybridGramBotManager` e aliás `hybridgram`):

```php
use HybridGram\\Core\\HybridGramBotManager;

$manager = app(HybridGramBotManager::class);
// ou
$manager = app('hybridgram');
```

### Adicionando um bot: `withBot()`

```php
use HybridGram\\Core\\Config\\BotConfig;
use HybridGram\\Core\\Config\\PollingModeConfig;
use HybridGram\\Core\\UpdateMode\\UpdateModeEnum;
use HybridGram\\Core\\HybridGramBotManager;

$manager = app(HybridGramBotManager::class);

$botConfig = new BotConfig(
    token: env('BOT_TOKEN'),
    botId: 'dynamic_bot',
    updateMode: UpdateModeEnum::POLLING,
    routesPath: base_path('routes/telegram.php'),
    pollingConfig: new PollingModeConfig(100, [], 0),
    webhookConfig: null,
    botName: 'My Bot'
);

$manager->withBot($botConfig);
```

`withBot(BotConfig $botConfig)` adiciona o bot se um bot com o mesmo `bot_id` não estiver já registrado. Retorna o gerenciador para encadeamento.

### Adicionando múltiplos bots: `withBots()`

```php
use HybridGram\\Core\\Config\\BotConfig;
use HybridGram\\Core\\Config\\PollingModeConfig;
use HybridGram\\Core\\UpdateMode\\UpdateModeEnum;
use HybridGram\\Core\\HybridGramBotManager;

$manager = app(HybridGramBotManager::class);

$configs = [
    new BotConfig(/* ... */),
    new BotConfig(/* ... */),
];

$manager->withBots($configs);
```

`withBots(array $botConfigs)` adiciona cada configuração (pulando duplicatas por `bot_id`) e retorna o gerenciador.

### Encadeamento

```php
$manager
    ->withBot($mainBot)
    ->withBots([$supportBot, $adminBot]);
```

### Obtendo configurações registradas

```php
$configs = $manager->getBotConfigs();
// BotConfig[]
```

## Como funciona com `run()`

- Quando você chama `run()` sem argumentos (por exemplo, de `hybridgram:polling` sem `botId`), o gerenciador primeiro carrega todos os bots de `config('hybridgram.bots')` e depois executa polling/webhook para cada bot registrado (incluindo aqueles adicionados via `withBot` / `withBots`). Duplicatas por `bot_id` são ignoradas.
- Quando você chama `run($botId)` com um `botId` específico, apenas esse bot é executado e ele é resolvido via `BotConfig::getBotConfig($botId)` da **configuração**. Bots adicionados programaticamente não são usados neste caso, portanto esse bot deve existir na configuração.

Portanto, o registro programático é significativo quando você usa **`run()` sem argumentos** e quer adicionar bots extras (ou apenas bots programáticos) antes disso.

## Exemplo: adicionando um bot em um provedor de serviço

```php
// app/Providers/TelegramBotServiceProvider.php
use HybridGram\\Core\\Config\\BotConfig;
use HybridGram\\Core\\Config\\PollingModeConfig;
use HybridGram\\Core\\HybridGramBotManager;
use HybridGram\\Core\\UpdateMode\\UpdateModeEnum;

public function boot(): void
{
    $manager = $this->app->make(HybridGramBotManager::class);

    $dynamicBot = new BotConfig(
        token: config('services.telegram_dynamic.token'),
        botId: 'dynamic',
        updateMode: UpdateModeEnum::POLLING,
        routesPath: base_path('routes/telegram-dynamic.php'),
        pollingConfig: new PollingModeConfig(),
        webhookConfig: null,
        botName: 'Dynamic Bot'
    );

    $manager->withBot($dynamicBot);
}
```

Depois, executar `php artisan hybridgram:polling` (sem id de bot) executará todos os bots da configuração mais o adicionado no provedor.

## Exemplo: modo webhook

Para o modo webhook, passe uma `WebhookModeConfig` e defina `updateMode` como `UpdateModeEnum::WEBHOOK`:

```php
use HybridGram\\Core\\Config\\BotConfig;
use HybridGram\\Core\\Config\\WebhookModeConfig;
use HybridGram\\Core\\UpdateMode\\UpdateModeEnum;

$webhookConfig = new WebhookModeConfig(
    url: 'https://your-domain.com/telegram/bot/webhook/dynamic',
    port: null,
    certificatePath: null,
    ipAddress: null,
    allowedUpdates: [],
    dropPendingUpdates: false,
    secretToken: env('TELEGRAM_WEBHOOK_SECRET')
);

$botConfig = new BotConfig(
    token: env('BOT_TOKEN'),
    botId: 'dynamic',
    updateMode: UpdateModeEnum::WEBHOOK,
    routesPath: base_path('routes/telegram.php'),
    pollingConfig: null,
    webhookConfig: $webhookConfig,
    botName: 'Webhook Bot'
);

app(HybridGramBotManager::class)->withBot($botConfig);
```

## Resumo

| Método | Propósito |
|--------|--------|
| `withBot(BotConfig $botConfig)` | Adiciona um bot; retorna o gerenciador para encadeamento. |
| `withBots(array $botConfigs)` | Adiciona múltiplos bots; retorna o gerenciador. |
| `getBotConfigs()` | Retorna a lista de instâncias `BotConfig` registradas. |

Use registro programático quando os bots não forem fixos na configuração; caso contrário, [configuração](/pt/getting-started/configuration/) e [Múltiplos Bots](/pt/advanced/multiple-bots/) são suficientes.
