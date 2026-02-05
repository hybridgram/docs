// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://hybridgram.space',
	integrations: [
		starlight({
			title: 'Telegram bot api Laravel package',
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
					translations: { en: 'Getting Started', ru: 'Начало работы' },
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction', translations: { en: 'Introduction', ru: 'Введение' } },
						{ label: 'Installation', slug: 'getting-started/installation', translations: { en: 'Installation', ru: 'Установка' } },
						{ label: 'Configuration', slug: 'getting-started/configuration', translations: { en: 'Configuration', ru: 'Конфигурация' } },
					],
				},
				{
					label: 'Basics',
					translations: { en: 'Basics', ru: 'Основы' },
					items: [
						{ label: 'Routing', slug: 'basics/routing', translations: { en: 'Routing', ru: 'Роутинг' } },
						{ label: 'Handling Commands', slug: 'basics/commands', translations: { en: 'Handling Commands', ru: 'Обработка команд' } },
						{ label: 'Handling Messages', slug: 'basics/messages', translations: { en: 'Handling Messages', ru: 'Обработка сообщений' } },
						{ label: 'Callback Query', slug: 'basics/callback-query', translations: { en: 'Callback Query', ru: 'Callback Query' } },
						{ label: 'Routing Reference', slug: 'routing/reference', translations: { en: 'Routing Reference', ru: 'Справочник по роутингу' } },
					],
				},
				{
					label: 'Advanced',
					translations: { en: 'Advanced', ru: 'Продвинутые возможности' },
					items: [
						{ label: 'Middleware', slug: 'advanced/middleware', translations: { en: 'Middleware', ru: 'Middleware' } },
						{ label: 'States', slug: 'advanced/states', translations: { en: 'States', ru: 'Состояния (States)' } },
						{ label: 'Multiple Bots', slug: 'advanced/multiple-bots', translations: { en: 'Multiple Bots', ru: 'Работа с несколькими ботами' } },
						{ label: 'Programmatic Bot Registration', slug: 'advanced/programmatic-bots', translations: { en: 'Programmatic Bot Registration', ru: 'Регистрация ботов в коде' } },
					],
				},
				{
					label: 'Sending Messages',
					translations: { en: 'Sending Messages', ru: 'Отправка сообщений' },
					items: [
						{ label: 'TelegramBotApi', slug: 'sending/telegram-bot-api', translations: { en: 'TelegramBotApi', ru: 'TelegramBotApi' } },
						{ label: 'Priorities and Queues', slug: 'sending/priorities-queues', translations: { en: 'Priorities and Queues', ru: 'Приоритеты и очереди' } },
						{ label: 'Rate Limiting', slug: 'sending/rate-limiting', translations: { en: 'Rate Limiting', ru: 'Rate Limiting' } },
					],
				},
				{
					label: 'Modes',
					translations: { en: 'Modes', ru: 'Режимы работы' },
					items: [
						{ label: 'Webhook', slug: 'modes/webhook', translations: { en: 'Webhook', ru: 'Webhook' } },
						{ label: 'Polling', slug: 'modes/polling', translations: { en: 'Polling', ru: 'Polling' } },
					],
				},
				{
					label: 'Changelog',
					translations: { en: 'Changelog', ru: 'Changelog' },
					items: [
						{ label: 'Changelog', slug: 'changelog', translations: { en: 'Changelog', ru: 'Changelog' } },
					],
				},
			],
		}),
	],
	redirects: {
		'/': '/en/',
	},
});
