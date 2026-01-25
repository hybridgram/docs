---
title: Introduction
description: Getting started with Laravel Async Telegram package
---

Laravel Async Telegram is a high-performance package for building Telegram bots on Laravel. It uses Go to process webhooks and provides maximum performance when handling a large number of updates.

## Key Features

### ⚡ High Performance
- Using Go for fast webhook processing
- Optimized queue and rate limiting handling
- Support for asynchronous message sending

### 🎯 Convenient Routing
- API similar to Laravel Router
- Support for all Telegram update types
- Route grouping and middleware

### 📦 Flexible Configuration
- Support for multiple bots
- Operation modes: Webhook and Polling
- Configuration through config files

### 🔄 State Management
- Chat and user states
- Simple API for working with conversations
- Route filtering by states

### 🛡️ Middleware
- Middleware system for routes
- User authorization
- Logging and rate limiting

## Requirements

- PHP ^8.4
- Laravel ^11.0
- Composer

## What's Next?

1. **[Installation](/en/getting-started/installation/)** — install the package in your project
2. **[Configuration](/en/getting-started/configuration/)** — configure the package for your bot
3. **[Routing](/en/basics/routing/)** — create your first handlers
