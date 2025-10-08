// Smooth scrolling and navigation
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initSmoothScrolling();
    initScrollAnimations();
    initBackToTop();
    initHeaderScroll();
    initThemeToggle();
    initLoadingAnimation();
    initRuleCardAnimations();
    initRoleModal();
    initSearch();
    initSidebarChapters();
});
// Global search with highlight and results
function initSearch() {
    const input = document.getElementById('globalSearch');
    const results = document.getElementById('searchResults');
    const clearBtn = document.getElementById('clearSearch');
    if (!input || !results || !clearBtn) return;

    let currentHighlights = [];
    let selectedIndex = -1;
    let lastItems = [];
    let debounceTimer = null;

    function clearHighlights() {
        currentHighlights.forEach(span => {
            const parent = span.parentNode;
            if (!parent) return;
            parent.replaceChild(document.createTextNode(span.textContent), span);
            parent.normalize();
        });
        currentHighlights = [];
    }

    function escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function buildIndex() {
        const ruleCards = Array.from(document.querySelectorAll('.rule-card'));
        return ruleCards.map(card => {
            const ruleNumber = card.querySelector('.rule-number');
            const ruleContent = card.querySelector('.rule-content');
            const section = card.closest('.section');
            const sectionTitle = section?.querySelector('.section-title');
            
            return {
                el: card,
                text: card.innerText.trim(),
                number: ruleNumber ? ruleNumber.textContent.trim() : '',
                section: sectionTitle ? sectionTitle.textContent.trim() : '',
                title: ruleContent ? ruleContent.querySelector('h3')?.textContent.trim() || '' : ''
            };
        });
    }

    const index = buildIndex();

    function renderResults(items, query) {
        if (!query || items.length === 0) {
            results.classList.remove('visible');
            results.innerHTML = '';
            selectedIndex = -1;
            return;
        }
        const safe = escapeRegExp(query);
        const re = new RegExp(`(${safe})`, 'ig');
        lastItems = items.slice(0, 30);
        results.innerHTML = lastItems.map(it => {
            // Создаем более информативный сниппет
            let snippet = it.text;
            if (it.title && snippet.includes(it.title)) {
                // Если есть заголовок, показываем его и часть текста
                const titleIndex = snippet.indexOf(it.title);
                const start = Math.max(0, titleIndex - 50);
                const end = Math.min(snippet.length, titleIndex + it.title.length + 100);
                snippet = snippet.slice(start, end);
                if (start > 0) snippet = '…' + snippet;
                if (end < it.text.length) snippet = snippet + '…';
            } else {
                // Иначе показываем первые 180 символов
                snippet = snippet.length > 180 ? snippet.slice(0, 180) + '…' : snippet;
            }
            
            const highlighted = snippet.replace(re, '<mark>$1</mark>');
            return `
                <div class="search-result-item" data-target="${it.number}">
                    <div class="result-number">${it.number || ''}</div>
                    <div class="result-text">
                        <div class="result-section">${it.section}</div>
                        <div class="result-snippet">${highlighted}</div>
                    </div>
                </div>
            `;
        }).join('');
        results.classList.add('visible');

        results.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const targetNum = item.getAttribute('data-target');
                goToRule(targetNum, input.value.trim());
                results.classList.remove('visible');
            });
        });
        selectedIndex = 0;
        updateSelected();
    }

    function goToRule(ruleNumber, query) {
        if (!ruleNumber) return;
        const target = index.find(i => i.number === ruleNumber)?.el;
        if (!target) return;
        const section = target.closest('.section');
        if (section && section.id) {
            location.hash = `#${section.id}`;
        }
        setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            clearHighlights();
            if (query) highlightInElement(target, query);
        }, 150);
    }

    function highlightInElement(root, query) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        const tokens = query.trim().split(/\s+/).filter(Boolean);
        if (tokens.length === 0) return;
        const regex = new RegExp(tokens.map(escapeRegExp).join('|'), 'ig');
        const textNodes = [];
        let node;
        while ((node = walker.nextNode())) {
            if (regex.test(node.nodeValue)) textNodes.push(node);
        }
        textNodes.forEach(n => {
            const frag = document.createDocumentFragment();
            const parts = n.nodeValue.split(regex);
            const matches = n.nodeValue.match(regex) || [];
            parts.forEach((part, idx) => {
                if (part) frag.appendChild(document.createTextNode(part));
                if (idx < matches.length) {
                    const span = document.createElement('span');
                    span.className = 'search-highlight';
                    span.textContent = matches[idx];
                    frag.appendChild(span);
                    currentHighlights.push(span);
                }
            });
            n.parentNode.replaceChild(frag, n);
        });
    }

    function performSearch() {
        const q = input.value.trim();
        clearHighlights();
        if (!q) {
            results.classList.remove('visible');
            results.innerHTML = '';
            selectedIndex = -1;
            clearBtn.style.display = 'none';
            return;
        }
        
        clearBtn.style.display = 'flex';
        
        const safe = escapeRegExp(q);
        const re = new RegExp(safe, 'i');
        const found = index
            .map(it => {
                let score = 0;
                // Высокий приоритет для номера правила
                if (it.number && re.test(it.number)) score += 5;
                // Средний приоритет для заголовка
                if (it.title && re.test(it.title)) score += 3;
                // Низкий приоритет для всего текста
                if (re.test(it.text)) score += 1;
                // Дополнительные очки за точное совпадение
                if (it.text.toLowerCase().includes(q.toLowerCase())) score += 2;
                
                return { ...it, score };
            })
            .filter(it => it.score > 0)
            .sort((a, b) => b.score - a.score);
            
        renderResults(found, q);
    }

    function updateSelected() {
        const nodes = results.querySelectorAll('.search-result-item');
        nodes.forEach((n, i) => n.classList.toggle('selected', i === selectedIndex));
        if (selectedIndex >= 0 && nodes[selectedIndex]) {
            const el = nodes[selectedIndex];
            const r = el.getBoundingClientRect();
            const pr = results.getBoundingClientRect();
            if (r.top < pr.top) results.scrollTop -= (pr.top - r.top) + 8;
            if (r.bottom > pr.bottom) results.scrollTop += (r.bottom - pr.bottom) + 8;
        }
    }

    input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(performSearch, 150);
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const nodes = results.querySelectorAll('.search-result-item');
            const target = nodes[selectedIndex] || nodes[0];
            if (target) target.click();
            e.preventDefault();
        } else if (e.key === 'ArrowDown') {
            if (!results.classList.contains('visible')) return;
            const count = results.querySelectorAll('.search-result-item').length;
            if (count === 0) return;
            selectedIndex = Math.min(selectedIndex + 1, count - 1);
            updateSelected();
            e.preventDefault();
        } else if (e.key === 'ArrowUp') {
            if (!results.classList.contains('visible')) return;
            const count = results.querySelectorAll('.search-result-item').length;
            if (count === 0) return;
            selectedIndex = Math.max(selectedIndex - 1, 0);
            updateSelected();
            e.preventDefault();
        } else if (e.key === 'Escape') {
            input.value = '';
            results.classList.remove('visible');
            results.innerHTML = '';
            clearHighlights();
            selectedIndex = -1;
        }
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        results.classList.remove('visible');
        results.innerHTML = '';
        clearHighlights();
        clearBtn.style.display = 'none';
        input.focus();
    });
}

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Update active nav link
                updateActiveNavLink(targetId);
            }
        });
    });
}

// Update active navigation link
function updateActiveNavLink(activeId) {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === activeId) {
            link.classList.add('active');
        }
    });
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.rule-card, .section-title, .intro-content, .hero-stats');
    animatedElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

// Back to top button
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Header scroll effect
function initHeaderScroll() {
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Sidebar chapters (accordion-like behavior)
function initSidebarChapters() {
    const body = document.body;
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');
    const links = sidebar ? sidebar.querySelectorAll('.chapter-link') : [];

    if (!sidebar || !toggle) {
        console.warn('Sidebar or toggle button not found');
        return;
    }

    if (links.length === 0) {
        console.warn('No chapter links found in sidebar');
        return;
    }

    function openSidebar() {
        sidebar.classList.add('open');
        body.classList.add('sidebar-open');
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        body.classList.remove('sidebar-open');
    }

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sidebar.classList.contains('open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    // Добавляем анимацию для кнопки
    toggle.addEventListener('mouseenter', () => {
        toggle.style.transform = 'scale(1.1)';
    });

    toggle.addEventListener('mouseleave', () => {
        if (!sidebar.classList.contains('open')) {
            toggle.style.transform = 'scale(1)';
        }
    });

    links.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetSection = document.querySelector(targetId);
            links.forEach(l => l.classList.remove('active'));
            btn.classList.add('active');
            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const y = targetSection.offsetTop - headerHeight - 8;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
            // Автоматически сворачиваем панель после перехода на мобильных
            if (window.innerWidth < 1024) {
                closeSidebar();
            }
        });
    });

    // Закрытие по клику вне панели (на десктопе панель может оставаться открытой)
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && e.target !== toggle && window.innerWidth < 1024) {
            closeSidebar();
        }
    });

    // Закрытие по клавише ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });
}

// Theme toggle functionality
function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light-theme') {
        body.classList.add('light-theme');
        updateThemeIcon('light-theme');
    }
    
    themeToggle.addEventListener('click', function() {
        body.classList.toggle('light-theme');
        
        const currentTheme = body.classList.contains('light-theme') ? 'light-theme' : '';
        localStorage.setItem('theme', currentTheme);
        
        updateThemeIcon(currentTheme);
        
        // Add ripple effect
        createRippleEffect(this);
    });
}

// Update theme icon
function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-toggle i');
    if (theme === 'light-theme') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// Loading animation
function initLoadingAnimation() {
    // Create loading screen
    const loadingScreen = document.createElement('div');
    loadingScreen.className = 'loading';
    loadingScreen.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loadingScreen);
    
    // Hide loading screen after page load
    window.addEventListener('load', function() {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.remove();
            }, 300);
        }, 1000);
    });
}

// Rule card animations
function initRuleCardAnimations() {
    const ruleCards = document.querySelectorAll('.rule-card');
    
    ruleCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
        
        // Add click animation
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'translateY(-5px) scale(1)';
            }, 150);
        });
    });
}

// Create ripple effect
function createRippleEffect(element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Parallax effect for hero section
function initParallaxEffect() {
    const hero = document.querySelector('.hero');
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        if (hero) {
            hero.style.transform = `translateY(${rate}px)`;
        }
    });
}


// Keyboard shortcuts
function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl + K for search
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('.search-input');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Escape to clear search
        if (e.key === 'Escape') {
            const searchInput = document.querySelector('.search-input');
            if (searchInput) {
                searchInput.value = '';
                searchInput.blur();
            }
        }
        
        // Arrow keys for navigation
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            navigateWithArrows(e.key === 'ArrowDown');
        }
    });
}

// Navigate with arrow keys
function navigateWithArrows(down) {
    const sections = document.querySelectorAll('section[id]');
    const currentScroll = window.pageYOffset;
    const headerHeight = document.querySelector('.header').offsetHeight;
    
    let targetSection = null;
    
    if (down) {
        for (let section of sections) {
            if (section.offsetTop - headerHeight > currentScroll + 50) {
                targetSection = section;
                break;
            }
        }
    } else {
        for (let i = sections.length - 1; i >= 0; i--) {
            if (sections[i].offsetTop - headerHeight < currentScroll - 50) {
                targetSection = sections[i];
                break;
            }
        }
    }
    
    if (targetSection) {
        const targetPosition = targetSection.offsetTop - headerHeight;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
        
        updateActiveNavLink('#' + targetSection.id);
    }
}

// Print functionality
function initPrintFunctionality() {
    const printBtn = document.createElement('button');
    printBtn.innerHTML = '<i class="fas fa-print"></i> Печать';
    printBtn.className = 'print-btn';
    
    printBtn.addEventListener('click', function() {
        window.print();
    });
    
    // Add print button to header
    const headerContent = document.querySelector('.header-content');
    headerContent.appendChild(printBtn);
}

// Copy to clipboard functionality
function initCopyToClipboard() {
    const ruleCards = document.querySelectorAll('.rule-card');
    
    ruleCards.forEach(card => {
        const copyBtn = document.createElement('button');
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.className = 'copy-btn';
        copyBtn.title = 'Копировать правило';
        
        copyBtn.addEventListener('click', function() {
            const ruleText = card.querySelector('.rule-content').textContent;
            navigator.clipboard.writeText(ruleText).then(() => {
                showNotification('Правило скопировано!');
                this.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            });
        });
        
        card.appendChild(copyBtn);
    });
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Role Modal functionality
function initRoleModal() {
    const modal = document.getElementById('roleModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalClose = document.getElementById('modalClose');
    const modalOverlay = document.getElementById('modalOverlay');
    
    // Role data
    const roleData = {
        'Основатель': {
            icon: 'fas fa-crown',
            level: 'Высший уровень',
            description: 'Главный руководитель проекта LIQUID, обладающий абсолютными полномочиями и ответственностью за все аспекты функционирования сервера.',
            responsibilities: [
                'Полный контроль над всеми аспектами проекта',
                'Принятие стратегических решений',
                'Управление финансовыми операциями',
                'Назначение и снятие с должностей всех сотрудников',
                'Изменение правил и регламентов',
                'Решение спорных ситуаций высшего уровня'
            ],
            rights: [
                'Право вето на любые решения',
                'Доступ ко всем административным функциям',
                'Возможность изменения архитектуры сервера',
                'Управление донатами и финансами',
                'Право на окончательное решение в любых вопросах'
            ],
            restrictions: [
                'Не может нарушать собственные правила',
                'Обязан обеспечивать стабильность проекта',
                'Должен учитывать интересы сообщества'
            ]
        },
        'Команда проекта': {
            icon: 'fas fa-users',
            level: 'Высший уровень',
            description: 'Ближайшие помощники основателя, ответственные за координацию работы всех подразделений проекта.',
            responsibilities: [
                'Координация работы всех отделов',
                'Контроль выполнения стратегических задач',
                'Мониторинг качества работы сотрудников',
                'Планирование развития проекта',
                'Решение конфликтных ситуаций'
            ],
            rights: [
                'Доступ к административным функциям',
                'Право назначения младших сотрудников',
                'Возможность изменения настроек сервера',
                'Доступ к статистике и аналитике'
            ],
            restrictions: [
                'Подчинение основателю',
                'Не могут принимать решения без согласования',
                'Обязаны отчитываться о своей деятельности'
            ]
        },
        'Куратор': {
            icon: 'fas fa-user-tie',
            level: 'Высокий уровень',
            description: 'Руководитель ролевой части проекта, ответственный за поддержание игровой атмосферы и развитие сюжетных линий.',
            responsibilities: [
                'Контроль качества ролевой игры',
                'Разработка сюжетных линий',
                'Координация работы администрации',
                'Решение спорных ситуаций в игре',
                'Проверка игроков на соответствие правилам'
            ],
            rights: [
                'Право вызова игроков на проверку',
                'Доступ к административным инструментам',
                'Возможность временного ограничения доступа',
                'Право одобрения глобальных изменений'
            ],
            restrictions: [
                'Подчинение команде проекта',
                'Не может принимать решения без согласования',
                'Обязан следовать политике проекта'
            ]
        },
        'Главный Администратор': {
            icon: 'fas fa-shield-alt',
            level: 'Высокий уровень',
            description: 'Старший администратор, ответственный за техническую стабильность сервера и координацию работы администрации.',
            responsibilities: [
                'Техническое обслуживание сервера',
                'Координация работы администраторов',
                'Решение технических проблем',
                'Контроль соблюдения правил',
                'Обучение новых администраторов'
            ],
            rights: [
                'Полный доступ к административным функциям',
                'Право временного ограничения доступа',
                'Возможность изменения настроек сервера',
                'Доступ к логам и статистике'
            ],
            restrictions: [
                'Подчинение куратору и выше',
                'Не может использовать привилегии против старших',
                'Обязан работать только в режиме администратора'
            ]
        },
        'Администратор': {
            icon: 'fas fa-user-shield',
            level: 'Средний уровень',
            description: 'Сотрудник администрации, ответственный за помощь игрокам и поддержание порядка на сервере.',
            responsibilities: [
                'Принятие тикетов от игроков',
                'Помощь в решении игровых вопросов',
                'Контроль соблюдения правил чата',
                'Временное ограничение нарушителей',
                'Помощь в отыгрывании ролей'
            ],
            rights: [
                'Доступ к административным инструментам',
                'Право временного ограничения доступа',
                'Возможность использования специальных режимов',
                'Доступ к системе тикетов'
            ],
            restrictions: [
                'Запрет использования привилегий для корысти',
                'Запрет использования привилегий против старших',
                'Запрет использования noclip/cloak при игроках',
                'Обязан работать только в режиме администратора'
            ]
        },
        'Главный Ивентолог': {
            icon: 'fas fa-calendar-alt',
            level: 'Средний уровень',
            description: 'Руководитель отдела ивентологии, ответственный за организацию крупных игровых событий и координацию работы ивентологов.',
            responsibilities: [
                'Планирование крупных игровых событий',
                'Координация работы ивентологов',
                'Разработка сценариев событий',
                'Контроль качества проведения ивентов',
                'Взаимодействие с другими отделами'
            ],
            rights: [
                'Доступ к административным инструментам',
                'Право организации глобальных событий',
                'Возможность временного ограничения доступа',
                'Доступ к ресурсам для ивентов'
            ],
            restrictions: [
                'Подчинение куратору и выше',
                'Обязан согласовывать крупные события',
                'Не может использовать привилегии для корысти',
                'Обязан работать только в режиме администратора'
            ]
        },
        'Ивентолог': {
            icon: 'fas fa-calendar',
            level: 'Базовый уровень',
            description: 'Сотрудник отдела ивентологии, ответственный за организацию игровых событий и поддержание активности игроков.',
            responsibilities: [
                'Организация малых ролевых событий',
                'Поддержание игровой активности',
                'Помощь игрокам в отыгрывании ролей',
                'Создание атмосферы на сервере',
                'Взаимодействие с игроками'
            ],
            rights: [
                'Доступ к административным инструментам',
                'Право организации малых событий',
                'Возможность временного ограничения доступа',
                'Доступ к ресурсам для ивентов'
            ],
            restrictions: [
                'Подчинение главному ивентологу и выше',
                'Обязан согласовывать крупные события',
                'Не может использовать привилегии для корысти',
                'Обязан работать только в режиме администратора'
            ]
        },
        'Дискорд-Модератор': {
            icon: 'fab fa-discord',
            level: 'Базовый уровень',
            description: 'Модератор Discord сервера, ответственный за поддержание порядка в чатах и голосовых каналах.',
            responsibilities: [
                'Модерация текстовых каналов',
                'Контроль голосовых каналов',
                'Решение конфликтов в чате',
                'Помощь новым участникам',
                'Поддержание дружелюбной атмосферы'
            ],
            rights: [
                'Право удаления сообщений',
                'Возможность временного мута участников',
                'Доступ к модераторским функциям Discord',
                'Право кика нарушителей'
            ],
            restrictions: [
                'Подчинение всем вышестоящим сотрудникам',
                'Не может принимать решения по игровым вопросам',
                'Обязан следовать правилам чата',
                'Действует только в рамках Discord сервера'
            ]
        }
    };
    
    // Add click handlers to hierarchy items
    const hierarchyItems = document.querySelectorAll('.hierarchy-item');
    hierarchyItems.forEach(item => {
        item.addEventListener('click', function() {
            const roleName = this.textContent.trim();
            showRoleModal(roleName, roleData[roleName]);
        });
    });
    
    // Close modal handlers
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    
    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
    
    function showRoleModal(roleName, roleInfo) {
        if (!roleInfo) return;
        
        modalTitle.textContent = roleName;
        modalBody.innerHTML = createRoleContent(roleInfo);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Add animation delay for content
        setTimeout(() => {
            const roleSections = modalBody.querySelectorAll('.role-section');
            roleSections.forEach((section, index) => {
                section.style.opacity = '0';
                section.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    section.style.transition = 'all 0.3s ease';
                    section.style.opacity = '1';
                    section.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }, 100);
    }
    
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset animations
        setTimeout(() => {
            const roleSections = modalBody.querySelectorAll('.role-section');
            roleSections.forEach(section => {
                section.style.transition = '';
                section.style.opacity = '';
                section.style.transform = '';
            });
        }, 300);
    }
    
    function createRoleContent(roleInfo) {
        return `
            <div class="role-info">
                <div class="role-icon">
                    <i class="${roleInfo.icon}"></i>
                </div>
                <div class="role-level">${roleInfo.level}</div>
                <div class="role-description">${roleInfo.description}</div>
                
                <div class="role-section">
                    <h3><i class="fas fa-tasks"></i> Обязанности</h3>
                    <ul class="role-list">
                        ${roleInfo.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="role-section">
                    <h3><i class="fas fa-check-circle"></i> Права</h3>
                    <ul class="role-list">
                        ${roleInfo.rights.map(right => `<li>${right}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="role-section">
                    <h3><i class="fas fa-exclamation-triangle"></i> Ограничения</h3>
                    <ul class="role-list">
                        ${roleInfo.restrictions.map(restriction => `<li>${restriction}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }
}


// Initialize additional features
document.addEventListener('DOMContentLoaded', function() {
    // Uncomment these lines to enable additional features
    // initParallaxEffect();
    // initSearch();
    // initKeyboardShortcuts();
    // initPrintFunctionality();
    // initCopyToClipboard();
});

// Add CSS for additional features
const additionalStyles = `
.search-container {
    position: relative;
}

.search-input {
    background: var(--background-card);
    border: 1px solid var(--border-color);
    border-radius: 25px;
    padding: 0.5rem 1rem;
    color: var(--text-primary);
    outline: none;
    transition: var(--transition);
}

.search-input:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.2);
}

.print-btn {
    background: var(--gradient-primary);
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    color: white;
    cursor: pointer;
    transition: var(--transition);
}

.print-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-primary);
}

.copy-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(0, 212, 255, 0.1);
    border: 1px solid var(--primary-color);
    border-radius: 50%;
    width: 35px;
    height: 35px;
    color: var(--primary-color);
    cursor: pointer;
    transition: var(--transition);
    opacity: 0;
}

.rule-card:hover .copy-btn {
    opacity: 1;
}

.copy-btn:hover {
    background: var(--primary-color);
    color: white;
}

.notification {
    position: fixed;
    top: 100px;
    right: 20px;
    background: var(--gradient-primary);
    color: white;
    padding: 1rem 2rem;
    border-radius: 8px;
    box-shadow: var(--shadow-primary);
    transform: translateX(100%);
    transition: var(--transition);
    z-index: 10000;
}

.notification.show {
    transform: translateX(0);
}

.ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0);
    animation: ripple 0.6s linear;
    pointer-events: none;
}

@keyframes ripple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}

@media print {
    .header,
    .back-to-top,
    .theme-toggle,
    .print-btn,
    .copy-btn {
        display: none !important;
    }
    
    .section {
        page-break-inside: avoid;
    }
    
    .rule-card {
        border: 1px solid #000 !important;
        box-shadow: none !important;
    }
}
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
