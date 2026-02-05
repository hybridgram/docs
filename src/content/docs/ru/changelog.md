---
title: Changelog
description: Изменения и релизы tgbot-laravel
---

# Changelog

## 2026-02-04 — Рефакторинг и тесты (PR #6)

**Pull Request:** [hybridgram/tgbot-laravel#6](https://github.com/hybridgram/tgbot-laravel/pull/6)

- **Внутренний рефакторинг** — реорганизованы роутинг и слой данных маршрутов (классы `RouteData` в `Core\Routing`). Публичный API `TelegramRouter` и сигнатуры обработчиков остаются совместимыми; существующие обработчики и документация (в т.ч. справочник по роутингу) по-прежнему применимы.
- **Консоль** — обновления команды `StartPollingCommand` и связанной консольной обвязки.
- **Тесты** — расширено покрытие тестами по пакету.
- **Стиль кода** — применён Laravel Pint для единообразного форматирования.

**Обновления документации (для пользователей):**
- Обработчики `onMessage()` получают `TextMessageData` (пространство имён `HybridGram\Core\Routing\RouteData`): текст сообщения — в `$data->text`, полный объект `Message` — в `$data->message`.
- Все классы данных маршрутов находятся в `HybridGram\Core\Routing\RouteData`; базовый тип предоставляет `getChatId()` и `getUserId()` в дополнение к `getChat()` и `getUser()`.

Без breaking changes для пользователей пакета; существующий код продолжает работать.
