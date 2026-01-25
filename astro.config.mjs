// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://hybridgram.space',
	integrations: [
		starlight({
			title: 'Laravel Async Telegram',
			description: 'Super fast package for Laravel to build Telegram bots powered by Go',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/hybridgram/tgbot-laravel' },
			],
			locales: {
				en: {
					label: 'English',
					lang: 'en',
				},
				ru: {
					label: 'Русский',
					lang: 'ru',
				},
			},
			defaultLocale: 'en',
			sidebar: [
				{
					label: 'Getting Started',
					translations: { ru: 'Начало работы' },
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction', translations: { ru: 'Введение' } },
						{ label: 'Installation', slug: 'getting-started/installation', translations: { ru: 'Установка' } },
						{ label: 'Configuration', slug: 'getting-started/configuration', translations: { ru: 'Конфигурация' } },
					],
				},
				{
					label: 'Basics',
					translations: { ru: 'Основы' },
					items: [
						{ label: 'Routing', slug: 'basics/routing', translations: { ru: 'Роутинг' } },
						{ label: 'Handling Commands', slug: 'basics/commands', translations: { ru: 'Обработка команд' } },
						{ label: 'Handling Messages', slug: 'basics/messages', translations: { ru: 'Обработка сообщений' } },
						{ label: 'Callback Query', slug: 'basics/callback-query' },
						{ label: 'Routing Reference', slug: 'routing/reference', translations: { ru: 'Справочник по роутингу' } },
					],
				},
				{
					label: 'Advanced Features',
					translations: { ru: 'Продвинутые возможности' },
					items: [
						{ label: 'Middleware', slug: 'advanced/middleware' },
						{ label: 'States', slug: 'advanced/states', translations: { ru: 'Состояния (States)' } },
						{ label: 'Bot Settings', slug: 'advanced/bot-settings', translations: { ru: 'Настройки бота' } },
						{ label: 'Multiple Bots', slug: 'advanced/multiple-bots', translations: { ru: 'Работа с несколькими ботами' } },
						{ label: 'Go proxy tgook', slug: 'advanced/go-proxy-tgook' },
					],
				},
				{
					label: 'Sending Messages',
					translations: { ru: 'Отправка сообщений' },
					items: [
						{ label: 'TelegramBotApi', slug: 'sending/telegram-bot-api' },
						{ label: 'Priorities & Queues', slug: 'sending/priorities-queues', translations: { ru: 'Приоритеты и очереди' } },
						{ label: 'Rate Limiting', slug: 'sending/rate-limiting' },
					],
				},
				{
					label: 'Operation Modes',
					translations: { ru: 'Режимы работы' },
					items: [
						{ label: 'Webhook', slug: 'modes/webhook' },
						{ label: 'Polling', slug: 'modes/polling' },
					],
				},
			],
		}),
	],
});
