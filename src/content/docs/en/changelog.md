---
title: Changelog
description: Changes and releases for tgbot-laravel
---

# Changelog

## 2026-02-04 — Refactoring and tests (PR #6)

**Pull Request:** [hybridgram/tgbot-laravel#6](https://github.com/hybridgram/tgbot-laravel/pull/6)

- **Internal refactoring** — Routing and route data layer reorganized (e.g. `RouteData` classes under `Core\Routing`). Public API of `TelegramRouter` and handler signatures remain compatible; existing route handlers and documentation (e.g. Routing Reference) continue to apply.
- **Console** — Updates to `StartPollingCommand` and related console wiring.
- **Tests** — Test coverage expanded across the package.
- **Code style** — Laravel Pint applied for consistent formatting.

**Documentation updates (for users):**
- Handlers for `onMessage()` receive `TextMessageData` (namespace `HybridGram\Core\Routing\RouteData`): use `$data->text` for message text and `$data->message` for the full `Message` object.
- All route data classes live in `HybridGram\Core\Routing\RouteData`; the base type provides `getChatId()` and `getUserId()` in addition to `getChat()` and `getUser()`.

No breaking changes for package users; existing code continues to work.
