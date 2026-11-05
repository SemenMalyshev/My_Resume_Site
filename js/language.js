/* Static RU/EN pages: explicit URL > saved manual choice > browser preference. */
(() => {
    'use strict';
    const supported = ['ru', 'en'];
    const url = new URL(window.location.href);
    const requested = url.searchParams.get('lang');
    let saved;
    try { saved = localStorage.getItem('language'); } catch { /* Storage may be disabled. */ }
    const preferred = (navigator.languages?.length ? navigator.languages : [navigator.language])
        .map((value) => String(value).toLowerCase().split(/[-_]/)[0])
        .find((value) => supported.includes(value));
    const explicit = supported.includes(requested) ? requested :
        (url.pathname.endsWith('/en.html') ? 'en' : null);
    const language = explicit || (supported.includes(saved) ? saved : null) || preferred || 'en';
    if (language !== document.documentElement.lang) {
        const target = new URL(language === 'en' ? 'en.html' : './', url);
        target.search = url.search;
        target.hash = url.hash;
        window.location.replace(target.href);
    }

    const messages = {
        ru: {
            loading: 'Загрузка кода…', copy: 'Копировать', copied: 'Скопировано',
            opened: 'Открыт файл {file}', copiedFile: 'Скопирован файл {file}',
            loadFailed: 'Не удалось загрузить файл', copyFailed: 'Не удалось скопировать код',
            sourceFailed: 'Не удалось загрузить файл. Откройте исходный код на GitHub.',
            unityFailed: 'Не удалось загрузить Unity WebGL.',
            demoPreparing: 'Подготовка демо… Первый запуск загружает около 18 МБ.',
            demoProgress: 'Загрузка MapPinner: {progress} % · первый запуск загружает около 18 МБ',
            demoFailed: 'Не удалось запустить демо. Попробуйте обновить страницу.'
        },
        en: {
            loading: 'Loading source…', copy: 'Copy code', copied: 'Copied',
            opened: 'Opened {file}', copiedFile: 'Copied {file}',
            loadFailed: 'Could not load the file', copyFailed: 'Could not copy the code',
            sourceFailed: 'Could not load the file. View the source on GitHub.',
            unityFailed: 'Could not load Unity WebGL.',
            demoPreparing: 'Preparing demo… The first launch downloads about 18 MB.',
            demoProgress: 'Loading MapPinner: {progress}% · about 18 MB on the first launch',
            demoFailed: 'Could not start the demo. Try reloading the page.'
        }
    };
    const pageLanguage = document.documentElement.lang;
    window.portfolioText = (key, values = {}) => messages[pageLanguage][key]
        .replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-language]').forEach((link) => {
            const target = new URL(link.href);
            target.hash = window.location.hash;
            link.href = target.href;
            link.addEventListener('click', () => {
                try { localStorage.setItem('language', link.dataset.language); } catch { /* Keep the link usable. */ }
                const destination = new URL(link.href);
                destination.hash = window.location.hash;
                link.href = destination.href;
            });
        });
    });
})();
