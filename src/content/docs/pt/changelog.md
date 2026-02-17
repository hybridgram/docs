---
title: Changelog
description: Mudanças e lançamentos do tgbot-laravel
---

# Changelog

## 2026-02-04 — Refatoração e testes (PR #6)

**Pull Request:** [hybridgram/tgbot-laravel#6](https://github.com/hybridgram/tgbot-laravel/pull/6)

- **Refatoração interna** — Roteamento e camada de dados de rota reorganizados (ex: classes `RouteData` sob `Core\Routing`). A API pública do `TelegramRouter` e assinaturas de manipuladores permanecem compatíveis; manipuladores de rota existentes e documentação (ex: Referência de Roteamento) continuam a se aplicar.
- **Console** — Atualizações para `StartPollingCommand` e fiação de console relacionada.
- **Testes** — Cobertura de testes expandida em todo o pacote.
- **Estilo de código** — Laravel Pint aplicado para formatação consistente.

**Atualizações de documentação (para usuários):**
- Manipuladores para `onMessage()` recebem `TextMessageData` (namespace `HybridGram\Core\Routing\RouteData`): use `$data->text` para o texto da mensagem e `$data->message` para o objeto `Message` completo.
- Todas as classes de dados de rota residem em `HybridGram\Core\Routing\RouteData`; o tipo base fornece `getChatId()` e `getUserId()` além de `getChat()` e `getUser()`.

Sem mudanças significativas para usuários do pacote; código existente continua funcionando.
