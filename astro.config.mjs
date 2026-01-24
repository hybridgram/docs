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
			sidebar: [
				{
					label: 'Начало работы',
					items: [
						{ label: 'Введение', slug: 'getting-started/introduction' },
						{ label: 'Установка', slug: 'getting-started/installation' },
						{ label: 'Конфигурация', slug: 'getting-started/configuration' },
					],
				},
				{
					label: 'Основы',
					items: [
						{ label: 'Роутинг', slug: 'basics/routing' },
						{ label: 'Обработка команд', slug: 'basics/commands' },
						{ label: 'Обработка сообщений', slug: 'basics/messages' },
						{ label: 'Callback Query', slug: 'basics/callback-query' },
						{ label: 'Справочник по роутингу', slug: 'routing/reference' },
					],
				},
				{
					label: 'Продвинутые возможности',
					items: [
						{ label: 'Middleware', slug: 'advanced/middleware' },
						{ label: 'Состояния (States)', slug: 'advanced/states' },
						{ label: 'Работа с несколькими ботами', slug: 'advanced/multiple-bots' },
					],
				},
				{
					label: 'Отправка сообщений',
					items: [
						{ label: 'TelegramBotApi', slug: 'sending/telegram-bot-api' },
						{ label: 'Приоритеты и очереди', slug: 'sending/priorities-queues' },
						{ label: 'Rate Limiting', slug: 'sending/rate-limiting' },
					],
				},
				{
					label: 'Режимы работы',
					items: [
						{ label: 'Webhook', slug: 'modes/webhook' },
						{ label: 'Polling', slug: 'modes/polling' },
					],
				},
			],
		}),
	],
});
