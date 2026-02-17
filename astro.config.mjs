// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://hybridgram.space',
	integrations: [
		starlight({
			title: 'Telegram bot api Laravel package',
			description: 'Super fast package for Laravel to build Telegram bots powered by Go',
			head: [
				{
					tag: 'script',
					attrs: { type: 'text/javascript' },
					content: `(function(m,e,t,r,i,k,a){
	m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
	m[i].l=1*new Date();
	for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
	k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=106683062', 'ym');
ym(106683062, 'init', {ssr:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`,
				},
				{
					tag: 'noscript',
					content: '<div><img src="https://mc.yandex.ru/watch/106683062" style="position:absolute; left:-9999px;" alt="" /></div>',
				},
			],
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
				pt: {
					label: 'Português',
					lang: 'pt',
				},
			},
			defaultLocale: 'en',
			sidebar: [
				{
					label: 'Getting Started',
					translations: { en: 'Getting Started', ru: 'Начало работы', pt: 'Começando' },
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction', translations: { en: 'Introduction', ru: 'Введение', pt: 'Introdução' } },
						{ label: 'Installation', slug: 'getting-started/installation', translations: { en: 'Installation', ru: 'Установка', pt: 'Instalação' } },
						{ label: 'Configuration', slug: 'getting-started/configuration', translations: { en: 'Configuration', ru: 'Конфигурация', pt: 'Configuração' } },
					],
				},
				{
					label: 'Basics',
					translations: { en: 'Basics', ru: 'Основы', pt: 'Básicos' },
					items: [
						{ label: 'Routing', slug: 'basics/routing', translations: { en: 'Routing', ru: 'Роутинг', pt: 'Roteamento' } },
						{ label: 'Handling Commands', slug: 'basics/commands', translations: { en: 'Handling Commands', ru: 'Обработка команд', pt: 'Manipulação de Comandos' } },
						{ label: 'Handling Messages', slug: 'basics/messages', translations: { en: 'Handling Messages', ru: 'Обработка сообщений', pt: 'Manipulação de Mensagens' } },
						{ label: 'Callback Query', slug: 'basics/callback-query', translations: { en: 'Callback Query', ru: 'Callback Query', pt: 'Callback Query' } },
						{ label: 'Routing Reference', slug: 'routing/reference', translations: { en: 'Routing Reference', ru: 'Справочник по роутингу', pt: 'Referência de Roteamento' } },
						{ label: 'PHP Attributes Routing', slug: 'routing/attributes', translations: { en: 'PHP Attributes Routing', ru: 'Рутинг с атрибутами PHP', pt: 'Roteamento com Atributos PHP' } },
					],
				},
				{
					label: 'Advanced',
					translations: { en: 'Advanced', ru: 'Продвинутые возможности', pt: 'Avançado' },
					items: [
						{ label: 'Middleware', slug: 'advanced/middleware', translations: { en: 'Middleware', ru: 'Middleware', pt: 'Middleware' } },
						{ label: 'States', slug: 'advanced/states', translations: { en: 'States', ru: 'Состояния (States)', pt: 'Estados' } },
						{ label: 'Multiple Bots', slug: 'advanced/multiple-bots', translations: { en: 'Multiple Bots', ru: 'Работа с несколькими ботами', pt: 'Múltiplos Bots' } },
						{ label: 'Programmatic Bot Registration', slug: 'advanced/programmatic-bots', translations: { en: 'Programmatic Bot Registration', ru: 'Регистрация ботов в коде', pt: 'Registro Programático de Bots' } },
					],
				},
				{
					label: 'Sending Messages',
					translations: { en: 'Sending Messages', ru: 'Отправка сообщений', pt: 'Enviando Mensagens' },
					items: [
						{ label: 'TelegramBotApi', slug: 'sending/telegram-bot-api', translations: { en: 'TelegramBotApi', ru: 'TelegramBotApi', pt: 'TelegramBotApi' } },
						{ label: 'Priorities and Queues', slug: 'sending/priorities-queues', translations: { en: 'Priorities and Queues', ru: 'Приоритеты и очереди', pt: 'Prioridades e Filas' } },
						{ label: 'Rate Limiting', slug: 'sending/rate-limiting', translations: { en: 'Rate Limiting', ru: 'Rate Limiting', pt: 'Rate Limiting' } },
					],
				},
				{
					label: 'Modes',
					translations: { en: 'Modes', ru: 'Режимы работы', pt: 'Modos' },
					items: [
						{ label: 'Webhook', slug: 'modes/webhook', translations: { en: 'Webhook', ru: 'Webhook', pt: 'Webhook' } },
						{ label: 'Polling', slug: 'modes/polling', translations: { en: 'Polling', ru: 'Polling', pt: 'Polling' } },
					],
				},
				{
					label: 'Changelog',
					translations: { en: 'Changelog', ru: 'Changelog', pt: 'Changelog' },
					items: [
						{ label: 'Changelog', slug: 'changelog', translations: { en: 'Changelog', ru: 'Changelog', pt: 'Changelog' } },
					],
				},
			],
		}),
	],
	redirects: {
		'/': '/en/',
	},
});
