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
    initHighlight();
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

/**
 * Навигация по архитектурной диаграмме
 * Использует делегирование событий на контейнере #code .container
 * Обрабатывает клики по .arch-item--clickable
 * При клике переключает соответствующую панель кода
 */
function initCodeNavigation() {
    const container = document.querySelector('#code .container');
    if (!container) return;

    container.addEventListener('click', (e) => {
        // Ищем кликабельный элемент диаграммы
        const clickable = e.target.closest('.arch-item--clickable');
        if (!clickable) return;

        const tabId = clickable.dataset.tab;
        if (!tabId) return;

        // Переключаем активную панель кода
        const panels = document.querySelectorAll('.code__panel');
        panels.forEach((p) => p.classList.remove('active'));
        const targetPanel = document.getElementById(tabId);
        if (targetPanel) {
            targetPanel.classList.add('active');
            // Переподсвечиваем код в активной панели (для новых блоков)
            if (typeof hljs !== 'undefined') {
                const codeBlocks = targetPanel.querySelectorAll('code');
                codeBlocks.forEach((block) => {
                    hljs.highlightElement(block);
                });
            }
        }

        // Скроллим к блоку с кодом (а не к началу секции, где диаграмма)
        const codeExamples = document.querySelector('.code__examples');
        if (codeExamples) {
            const header = document.getElementById('header');
            const headerHeight = header ? header.offsetHeight : 0;
            const targetPosition = codeExamples.getBoundingClientRect().top + window.scrollY - headerHeight;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
    });
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

        const header = document.getElementById('header');
        const headerHeight = header ? header.offsetHeight : 0;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth',
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
            behavior: 'smooth',
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

    navToggle.addEventListener('click', () => {
        navList.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Закрыть меню при клике на ссылку
    navList.addEventListener('click', (e) => {
        if (e.target.classList.contains('nav__link')) {
            navList.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });

    // Закрыть меню при клике вне навигации
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.header__inner')) {
            navList.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });
}

/**
 * Инициализация highlight.js для подсветки синтаксиса
 */
function initHighlight() {
    if (typeof hljs !== 'undefined') {
        hljs.highlightAll();
        console.log('[Main] Highlight.js инициализирован.');
    } else {
        console.warn('[Main] Highlight.js не загружен.');
    }
}

