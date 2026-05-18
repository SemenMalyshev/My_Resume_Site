/**
 * Animations Module
 * Отвечает за анимации появления элементов при скролле
 * Поддерживает CSS-класс .animate-on-scroll + кастомные CSS-анимации
 * + атрибут data-animation для выбора типа анимации
 */

/**
 * Создаёт Intersection Observer для анимации появления элементов
 * @param {string} selector — CSS-селектор элементов для наблюдения
 * @param {Function} callback — функция, вызываемая при появлении элемента
 * @param {object} options — дополнительные опции для Observer
 * @returns {IntersectionObserver}
 */
export function observeElements(selector, callback, options = {}) {
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return null;

    const defaultOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
        ...options,
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                callback(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, defaultOptions);

    elements.forEach((el) => observer.observe(el));

    return observer;
}

/**
 * Анимационные типы, доступные через data-animation="..."
 * Каждый тип добавляет CSS-класс .visible элементу
 * @type {Object<string, Function>}
 */
const animationTypes = {
    fadeInUp(element) {
        element.classList.add('visible');
    },
    fadeInLeft(element) {
        element.classList.add('visible');
    },
    fadeInRight(element) {
        element.classList.add('visible');
    },
    zoomIn(element) {
        element.classList.add('visible');
    },
};

/**
 * Универсальная функция анимации элемента
 * Определяет тип анимации по data-animation или использует fadeInUp по умолчанию
 * @param {HTMLElement} element
 */
function animateElement(element) {
    if (element.classList.contains('visible')) return;

    const type = element.dataset.animation || 'fadeInUp';
    const animFn = animationTypes[type] || animationTypes.fadeInUp;
    animFn(element);
}

/**
 * Анимация для элементов с задержкой (stagger)
 * Применяется к дочерним элементам внутри контейнера
 * @param {string} containerSelector — селектор контейнера
 * @param {string} childSelector — селектор дочерних элементов
 * @param {number} delay — базовая задержка в ms
 * @param {number} stagger — шаг задержки между элементами в ms
 */
export function staggerChildren(containerSelector, childSelector, delay = 100, stagger = 150) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const children = container.querySelectorAll(childSelector);
    children.forEach((child, index) => {
        child.style.transitionDelay = `${delay + index * stagger}ms`;
        child.classList.add('animate-on-scroll');
    });
}

/**
 * Параллакс-эффект для Hero-секции
 * Смещает фоновый слой при скролле
 */
function initParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY > 600) return; // Ограничиваем эффект

        const heroContent = hero.querySelector('.hero__inner');
        if (heroContent) {
            heroContent.style.transform = `translateY(${scrollY * 0.15}px)`;
        }
    }, { passive: true });
}

/**
 * Stagger-анимация для элементов таймлайна
 * Устанавливает CSS-переменную --stagger-index на каждый элемент
 */
function initTimelineStagger() {
    const items = document.querySelectorAll('.timeline__item');
    items.forEach((item, index) => {
        item.style.setProperty('--stagger-index', index);
    });
}

// При загрузке модуля запускаем наблюдение
document.addEventListener('DOMContentLoaded', () => {
    // Все элементы с классом .animate-on-scroll
    observeElements('.animate-on-scroll', animateElement);

    // Инициализация stagger-индексов для таймлайна
    initTimelineStagger();

    // Параллакс для Hero
    initParallax();

    console.log('[Animations] Наблюдение за анимациями запущено.');
});

export default {
    observeElements,
    animateElement,
    animationTypes,
    staggerChildren,
    initParallax,
};
