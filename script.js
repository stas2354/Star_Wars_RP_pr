// Создание звездного фона
function createStars() {
    const starsContainer = document.getElementById('stars');
    if (!starsContainer) return;
    
    const starsCount = 150;
    
    for (let i = 0; i < starsCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        
        const opacity = Math.random() * 0.6 + 0.2;
        star.style.opacity = opacity;
        
        // Анимация мерцания для некоторых звезд
        if (Math.random() > 0.8) {
            star.style.animation = `twinkle ${Math.random() * 4 + 2}s infinite alternate`;
        }
        
        starsContainer.appendChild(star);
    }
}

// Добавление стилей для анимации мерцания
function addTwinkleAnimation() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes twinkle {
            0% { opacity: 0.2; }
            100% { opacity: 0.8; }
        }
    `;
    document.head.appendChild(style);
}

// Показ/скрытие меню устава
let charterMenuTimeout;

function showCharterMenu() {
    const charterMenu = document.getElementById('charterMenu');
    if (!charterMenu) return;
    
    clearTimeout(charterMenuTimeout);
    charterMenu.classList.add('show');
}

function hideCharterMenu() {
    const charterMenu = document.getElementById('charterMenu');
    if (!charterMenu) return;
    
    charterMenuTimeout = setTimeout(() => {
        charterMenu.classList.remove('show');
    }, 300);
}

// Плавная прокрутка к разделам
function setupSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            
            // Обработка якорных ссылок на текущей странице
            if (targetId !== '#') {
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    // Закрываем меню устава при переходе
                    const charterMenu = document.getElementById('charterMenu');
                    if (charterMenu) {
                        charterMenu.classList.remove('show');
                    }
                    
                    // Плавная прокрутка
                    const headerHeight = document.querySelector('header')?.offsetHeight || 80;
                    const targetPosition = targetElement.offsetTop - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Добавляем класс активного раздела
                    highlightActiveSection(targetId);
                }
            }
        });
    });
}

// Подсветка активного раздела при прокрутке
function setupSectionHighlights() {
    // Для страницы с уставом
    const charterSections = document.querySelectorAll('.charter-section');
    const charterNavLinks = document.querySelectorAll('.charter-nav a[href^="#"]');
    
    // Для страницы флота
    const fleetSections = document.querySelectorAll('.fleet-section');
    const fleetNavLinks = document.querySelectorAll('.fleet-nav a[href^="#"]');
    
    // Для страницы ордена
    const orderSections = document.querySelectorAll('.order-section');
    const orderNavLinks = document.querySelectorAll('.order-nav a[href^="#"]');
    
    function highlightSection(sections, navLinks) {
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const headerHeight = document.querySelector('header')?.offsetHeight || 80;
            
            if (window.scrollY >= sectionTop - headerHeight - 50 && 
                window.scrollY < sectionTop + sectionHeight - headerHeight - 50) {
                currentSection = '#' + section.id;
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentSection) {
                link.classList.add('active');
            }
        });
    }
    
    function checkAllSections() {
        if (charterSections.length > 0) {
            highlightSection(charterSections, charterNavLinks);
        }
        if (fleetSections.length > 0) {
            highlightSection(fleetSections, fleetNavLinks);
        }
        if (orderSections.length > 0) {
            highlightSection(orderSections, orderNavLinks);
        }
    }
    
    window.addEventListener('scroll', checkAllSections);
    window.addEventListener('resize', checkAllSections);
    
    // Первоначальная проверка
    setTimeout(checkAllSections, 100);
}

// Ручная подсветка активного раздела
function highlightActiveSection(sectionId) {
    // Убираем подсветку у всех ссылок
    const allNavLinks = document.querySelectorAll('.charter-nav a[href^="#"], .fleet-nav a[href^="#"], .order-nav a[href^="#"]');
    allNavLinks.forEach(link => link.classList.remove('active'));
    
    // Подсвечиваем активную ссылку
    const activeLink = document.querySelector(`a[href="${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Имитация изменения количества игроков онлайн
function updateOnlinePlayers() {
    const onlineCount = document.getElementById('online-count');
    if (!onlineCount) return;
    
    const baseCount = 47;
    const variation = Math.floor(Math.random() * 11) - 5;
    const newCount = Math.max(30, baseCount + variation);
    onlineCount.textContent = newCount;
}

// Обработчик кнопки присоединения
function setupJoinButton() {
    const joinBtn = document.querySelector('.join-server-btn');
    if (joinBtn) {
        joinBtn.addEventListener('click', function() {
            alert('Подключение к серверу...\nIP: imperial-forces.com:27015');
        });
    }
}

// Функция поиска по контенту
function setupSearch() {
    // Проверяем, есть ли контент для поиска
    const charterContent = document.querySelector('.charter-content');
    const fleetContent = document.querySelector('.fleet-content');
    const orderContent = document.querySelector('.order-content');
    
    if (!charterContent && !fleetContent && !orderContent) return;
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Поиск по содержанию...';
    searchInput.className = 'search-input';
    
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.appendChild(searchInput);
    
    // Добавляем поиск в соответствующий заголовок
    const contentHeader = document.querySelector('.content-header');
    if (contentHeader) {
        contentHeader.appendChild(searchContainer);
    }
    
    // Добавляем стили для поиска
    const searchStyle = document.createElement('style');
    searchStyle.textContent = `
        .search-container {
            margin: 20px auto 0;
            max-width: 400px;
        }
        
        .search-input {
            width: 100%;
            padding: 12px 16px;
            background: rgba(30, 35, 70, 0.8);
            border: 1px solid #3a5a8a;
            border-radius: 6px;
            color: #e0e0e0;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        .search-input:focus {
            outline: none;
            border-color: #4bd5ee;
            box-shadow: 0 0 10px rgba(75, 213, 238, 0.3);
        }
        
        .search-input::placeholder {
            color: #8a9ba8;
        }
        
        .search-highlight {
            background: rgba(255, 193, 7, 0.3);
            padding: 2px 4px;
            border-radius: 2px;
            transition: background-color 0.3s ease;
        }
        
        .search-result-count {
            text-align: center;
            margin: 10px 0;
            color: #4bd5ee;
            font-size: 0.9rem;
        }
        
        .no-results {
            text-align: center;
            padding: 20px;
            color: #ff6b6b;
            background: rgba(255, 107, 107, 0.1);
            border-radius: 6px;
            margin: 20px 0;
        }
    `;
    document.head.appendChild(searchStyle);
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        // Убираем предыдущие подсветки
        document.querySelectorAll('.search-highlight').forEach(el => {
            el.outerHTML = el.innerHTML;
        });
        
        // Убираем сообщение о результатах
        const existingResultCount = document.querySelector('.search-result-count');
        const existingNoResults = document.querySelector('.no-results');
        if (existingResultCount) existingResultCount.remove();
        if (existingNoResults) existingNoResults.remove();
        
        if (searchTerm.length > 2) {
            let totalResults = 0;
            
            // Поиск в уставе
            if (charterContent) {
                totalResults += searchInContent(charterContent, searchTerm);
            }
            
            // Поиск во флоте
            if (fleetContent) {
                totalResults += searchInContent(fleetContent, searchTerm);
            }
            
            // Поиск в ордене
            if (orderContent) {
                totalResults += searchInContent(orderContent, searchTerm);
            }
            
            // Показываем количество результатов
            if (totalResults > 0) {
                const resultCount = document.createElement('div');
                resultCount.className = 'search-result-count';
                resultCount.textContent = `Найдено результатов: ${totalResults}`;
                searchContainer.appendChild(resultCount);
                
                // Прокручиваем к первому результату
                const firstHighlight = document.querySelector('.search-highlight');
                if (firstHighlight) {
                    const headerHeight = document.querySelector('header')?.offsetHeight || 80;
                    const highlightPosition = firstHighlight.offsetTop - headerHeight - 20;
                    window.scrollTo({
                        top: highlightPosition,
                        behavior: 'smooth'
                    });
                }
            } else {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = `По запросу "${searchTerm}" ничего не найдено`;
                searchContainer.appendChild(noResults);
            }
        }
    });
}

// Функция поиска в контенте
function searchInContent(container, searchTerm) {
    let resultsCount = 0;
    
    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // Игнорируем текст в навигации и кнопках
                if (node.parentElement.closest('nav') || 
                    node.parentElement.closest('.search-input') ||
                    node.parentElement.tagName === 'BUTTON' ||
                    node.parentElement.tagName === 'CODE') {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        },
        false
    );
    
    const nodes = [];
    let node;
    
    while (node = walker.nextNode()) {
        if (node.textContent.toLowerCase().includes(searchTerm)) {
            nodes.push(node);
        }
    }
    
    nodes.forEach(node => {
        const span = document.createElement('span');
        span.className = 'search-highlight';
        
        const text = node.textContent;
        const lowerText = text.toLowerCase();
        const searchIndex = lowerText.indexOf(searchTerm);
        
        if (searchIndex !== -1) {
            const before = text.substring(0, searchIndex);
            const match = text.substring(searchIndex, searchIndex + searchTerm.length);
            const after = text.substring(searchIndex + searchTerm.length);
            
            span.innerHTML = before + '<mark>' + match + '</mark>' + after;
            node.parentNode.replaceChild(span, node);
            resultsCount++;
        }
    });
    
    return resultsCount;
}

// Функция для печати страницы


// Функция для копирования IP сервера
function setupCopyIP() {
    const serverIP = document.querySelector('.server-ip');
    if (serverIP) {
        serverIP.style.cursor = 'pointer';
        serverIP.title = 'Кликните для копирования IP';
        
        serverIP.addEventListener('click', function() {
            const ipText = this.textContent.replace('IP: ', '');
            
            navigator.clipboard.writeText(ipText).then(() => {
                const originalText = this.textContent;
                this.textContent = 'IP скопирован!';
                this.style.background = 'rgba(40, 167, 69, 0.3)';
                this.style.borderColor = '#28a745';
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.background = '';
                    this.style.borderColor = '';
                }, 2000);
            }).catch(err => {
                console.error('Ошибка копирования: ', err);
            });
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем анимацию мерцания звезд
    addTwinkleAnimation();
    
    // Создаем звездный фон
    createStars();
    
    // Настраиваем плавную прокрутку
    setupSmoothScroll();
    
    // Настраиваем подсветку активных разделов
    setupSectionHighlights();
    
    // Настраиваем кнопку присоединения
    setupJoinButton();
    
    // Настраиваем поиск
    setupSearch();
    
    // Настраиваем утилиты (печать)
    setupPrintButton();
    
    // Настраиваем копирование IP
    setupCopyIP();
    
    // Обновляем счетчик игроков каждые 30 секунд
    setInterval(updateOnlinePlayers, 30000);
    
    // Первое обновление через 5 секунд после загрузки
    setTimeout(updateOnlinePlayers, 5000);
    
    // Обработка загрузки страницы с якорной ссылкой
    if (window.location.hash) {
        setTimeout(() => {
            const targetElement = document.querySelector(window.location.hash);
            if (targetElement) {
                const headerHeight = document.querySelector('header')?.offsetHeight || 80;
                const targetPosition = targetElement.offsetTop - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                highlightActiveSection(window.location.hash);
            }
        }, 500);
    }
});

// Обработка изменения хэша URL (при клике на якорные ссылки)
window.addEventListener('hashchange', function() {
    if (window.location.hash) {
        setTimeout(() => {
            const targetElement = document.querySelector(window.location.hash);
            if (targetElement) {
                const headerHeight = document.querySelector('header')?.offsetHeight || 80;
                const targetPosition = targetElement.offsetTop - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                highlightActiveSection(window.location.hash);
            }
        }, 100);
    }
});

// Дополнительные утилитные функции
function sharePage() {
    if (navigator.share) {
        navigator.share({
            title: document.title,
            text: 'Официальный устав сервера Star Wars GMod',
            url: window.location.href
        });
    } else {
        // Fallback для браузеров без поддержки Web Share API
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('Ссылка скопирована в буфер обмена!');
        });
    }
}

// Глобальные функции для использования в HTML
window.sharePage = sharePage;
window.printPage = printPage;