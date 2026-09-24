/**
 * Main Application Script
 * Unity Developer Portfolio
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Main] Страница загружена и готова к работе.');

    // Инициализация модулей
    initTheme();
    initCodeNavigation();
    initScrollAnimations();
    initMobileNav();
    initSmoothScroll();
    initHeaderScroll();
    initScrollToTop();
});

/**
 * Переключение тёмной/светлой темы
 * Сохранение в localStorage, учёт системных предпочтений
 */
function initTheme() {
    const toggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    if (!toggle || !html) return;

    // Функция установки темы
    function setTheme(theme, save = true) {
        html.setAttribute('data-theme', theme);
        // Инверсия: если тема dark — кнопка ☀️ (предлагает переключить на светлую)
        // Если тема light — кнопка 🌙 (предлагает переключить на тёмную)
        toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        if (save) {
            localStorage.setItem('theme', theme);
        }
    }

    // Определяем начальную тему
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme, false);
    } else {
        // Проверяем системные предпочтения
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light', false);
    }

    // Переключение по клику
    toggle.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    });

    // Слушаем изменение системной темы (если нет сохранённой)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light', false);
        }
    });
}

/** Load the selected MapPinner source file into a compact, accessible viewer. */
function initCodeNavigation() {
    const sourceRoot = 'https://raw.githubusercontent.com/SemenMalyshev/MapPinner/main/';
    const fileList = document.querySelector('.code__navigator');
    const viewer = document.getElementById('code-viewer');
    const sourceBlock = document.getElementById('code-source');
    const fileName = document.getElementById('code-file-name');
    const fileGroup = document.getElementById('code-file-group');
    const copyButton = document.getElementById('copy-code');
    const status = document.getElementById('code-status');
    const buttons = [...document.querySelectorAll('.arch-item--clickable[data-source]')];
    if (!fileList || !viewer || !sourceBlock || !fileName || !fileGroup || !copyButton || !status || !buttons.length) return;

    let requestNumber = 0;

    async function showFile(button, scrollToViewer = false) {
        const currentRequest = ++requestNumber;
        buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        const path = button.dataset.source;
        const isJavaScript = path.endsWith('.jslib');
        fileName.textContent = path.split('/').pop();
        fileGroup.textContent = `${button.closest('.arch-layer').querySelector('.arch-layer__label').textContent} / ${isJavaScript ? 'JavaScript' : 'C#'}`;
        sourceBlock.textContent = 'Загрузка кода…';
        sourceBlock.className = isJavaScript ? 'language-javascript' : 'language-csharp';
        sourceBlock.removeAttribute('data-highlighted');
        copyButton.disabled = true;
        copyButton.textContent = 'Копировать';
        status.textContent = '';
        viewer.setAttribute('aria-busy', 'true');

        if (scrollToViewer && window.matchMedia('(max-width: 980px)').matches) {
            viewer.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                block: 'start'
            });
        }

        try {
            const response = await fetch(sourceRoot + path);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const source = await response.text();
            if (currentRequest !== requestNumber) return;
            sourceBlock.textContent = source;
            if (window.hljs) window.hljs.highlightElement(sourceBlock);
            copyButton.disabled = false;
            status.textContent = `Открыт файл ${fileName.textContent}`;
        } catch (error) {
            if (currentRequest !== requestNumber) return;
            sourceBlock.textContent = 'Не удалось загрузить файл. Откройте исходный код на GitHub.';
            status.textContent = 'Не удалось загрузить файл';
            console.error('[Code viewer] Failed to load source:', error);
        } finally {
            if (currentRequest === requestNumber) viewer.setAttribute('aria-busy', 'false');
        }
    }

    fileList.addEventListener('click', (event) => {
        const button = event.target.closest('.arch-item--clickable[data-source]');
        if (button && fileList.contains(button)) showFile(button, true);
    });

    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(sourceBlock.textContent);
            copyButton.textContent = 'Скопировано';
            status.textContent = `Скопирован файл ${fileName.textContent}`;
        } catch (error) {
            status.textContent = 'Не удалось скопировать код';
            console.error('[Code viewer] Failed to copy source:', error);
        }
    });

    showFile(buttons[0]);
}

/**
 * Анимации при скролле (переданы в animations.js)
 */
function initScrollAnimations() {
    // Логика анимаций вынесена в animations.js
}

/**
 * Плавный скролл по якорям
 * Перехват кликов по ссылкам с href="#..."
 */
function initSmoothScroll() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;

        const targetId = link.getAttribute('href');
        if (!targetId || targetId === '#') return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        if (window.location.hash !== targetId) {
            window.history.pushState(null, '', targetId);
        }

        const header = document.getElementById('header');
        const headerHeight = header ? header.offsetHeight : 0;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;

        window.scrollTo({
            top: targetPosition,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
    });
}

/**
 * Хедер: скрывать при скролле вниз, показывать при скролле вверх
 * Добавлять тень при скролле
 */
function initHeaderScroll() {
    const header = document.getElementById('header');
    if (!header) return;

    let lastScroll = 0;
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const currentScroll = window.scrollY;

                // Добавляем/убираем класс scrolled
                if (currentScroll > 50) {
                    header.classList.add('header--scrolled');
                } else {
                    header.classList.remove('header--scrolled');
                }

                // Скрываем/показываем хедер
                if (currentScroll > 100) {
                    if (currentScroll > lastScroll) {
                        // Скролл вниз — скрываем
                        header.classList.add('header--hidden');
                    } else {
                        // Скролл вверх — показываем
                        header.classList.remove('header--hidden');
                    }
                } else {
                    header.classList.remove('header--hidden');
                }

                lastScroll = currentScroll;
                ticking = false;
            });

            ticking = true;
        }
    });
}

/**
 * Кнопка "Наверх" (scroll-to-top)
 * Показывать после 300px скролла
 */
function initScrollToTop() {
    const btn = document.getElementById('scrollTop');
    if (!btn) return;

    // Показываем/скрываем кнопку
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    // Плавный скролл наверх
    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
    });
}

/**
 * Мобильная навигация (бургер-меню)
 */
function initMobileNav() {
    const navToggle = document.getElementById('navToggle');
    const navList = document.querySelector('.nav__list');

    if (!navToggle || !navList) return;

    const closeMenu = () => {
        navList.classList.remove('active');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
    };

    navToggle.addEventListener('click', () => {
        navList.classList.toggle('active');
        navToggle.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', String(navList.classList.contains('active')));
    });

    // Закрыть меню при клике на ссылку
    navList.addEventListener('click', (e) => {
        if (e.target.classList.contains('nav__link')) {
            closeMenu();
        }
    });

    // Закрыть меню при клике вне навигации
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.header__inner')) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
    });
}

