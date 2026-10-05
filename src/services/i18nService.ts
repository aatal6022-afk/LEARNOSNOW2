import { useState, useEffect } from 'react';

export type SupportedLanguage = 'kk' | 'uk' | 'ru' | 'en' | 'ja';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша', flag: '🇰🇿' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
];

export const DICTIONARY: Record<SupportedLanguage, Record<string, string>> = {
  // ==========================================================================
  // 1. ҚАЗАҚША (Kazakh)
  // ==========================================================================
  kk: {
    // App & Nav
    'app.title': 'Learning OS',
    'app.subtitle': 'Когнитивті оқытудың операциялық жүйесі',
    'nav.desktop': 'Жұмыс үстеліне',
    'nav.launch': 'Learning OS іске қосу',
    'nav.products': 'Өнімдер',
    'nav.about': 'Компания туралы',
    'nav.principles': 'Принциптер',
    'nav.login': 'Кіру',
    'nav.startFree': 'Тегін бастау',
    'nav.demo': 'Демо жұмыс үстелі',
    'nav.logout': 'Шығу',
    'nav.settings': 'Баптаулар',
    'nav.profile': 'Профиль',
    'nav.changelog': 'Жаңартулар журналы',
    'nav.toDesktop': 'Жұмыс үстеліне',
    'nav.closeFullscreen': 'Толық экранды жабу (Esc)',
    'nav.fullscreen': 'Толық экран режимі',
    'nav.windowed': 'Терезе режимі',
    'nav.pressEsc': 'Шығу үшін Esc басыңыз',

    // TopBar
    'topbar.brand': 'Learning OS',
    'topbar.homeTitle': 'Жұмыс үстеліне оралу',
    'topbar.createModule': 'Модуль құру',
    'topbar.search': 'Іздеу',
    'topbar.searchKbd': '⌘K',
    'topbar.focusTimer': 'Фокус-Таймер',
    'topbar.focusStart': 'Фокус бастау',
    'topbar.focusPause': 'Пауза',
    'topbar.team': 'Команда',
    'topbar.sync': 'Синхрондау',
    'topbar.offline': 'Офлайн',
    'topbar.findPartner': 'Напарник іздеу',
    'topbar.activeCall': 'Қоңырау',
    'topbar.welcomeSplash': 'Сәлемдесу экраны',
    'topbar.personalize': 'Жекешелендіру',
    'topbar.wallpapers': 'Тұсқағаздар галереясы',
    'topbar.lockScreen': 'Экранды құлыптау',
    'topbar.mobileView': 'Мобильді көрініс',
    'topbar.aboutPlatform': 'Платформа туралы',
    'topbar.themeToggle': 'Тақырыпты ауыстыру',
    'topbar.profileTitle': 'Профильді ашу және өңдеу',
    'topbar.student': 'Студент',
    'topbar.syncing': 'Firestore синхрондалуда...',
    'topbar.synced': 'Firestore синхрондалды',
    'topbar.syncError': 'Офлайн (жергілікті сақталды)',

    // Windows & Apps
    'app.desktop': 'Виджеттері бар жұмыс үстелі',
    'app.dag': 'Оқу жоспары (DAG Граф)',
    'app.dag.short': 'DAG-Граф',
    'app.knowledge_sphere': '3D Білімдер сферасы',
    'app.knowledge_git': 'Білім Git Репозиторийі',
    'app.textbook_library': 'Оқулықтар & Кванттар',
    'app.survey': 'Бастапқы диагностика & Жоспар',
    'app.calendar': 'Күнтізбе & Кесте',
    'app.focus': 'Фокус-Студия (20/10/70)',
    'app.peer': 'P2P Напарник & Whiteboard',
    'app.chat': 'Курстың ИИ-Операторы',
    'app.white_screen': 'Ақ экран (White Screen)',
    'app.portfolio': 'Артефакттар портфолиосы',
    'app.widgets': 'Виджеттер & Тапсырмалар',
    'app.admin': 'Сапа бақылауы & Модерация',
    'app.partner_search': 'P2P Напарник іздеу',
    'app.shortcuts': 'Пернетақта пернелері',
    'app.notes': 'Жазбалар',

    // Window Controls
    'win.minimize': 'Терезені бүктеу',
    'win.maximize': 'Үлкейту',
    'win.restore': 'Қалпына келтіру',
    'win.close': 'Жабу',
    'win.autoFit': 'Бос орынға сәйкестендіру',
    'win.remoteDragging': 'жылжытуда',

    // Widgets & Desktop
    'widget.clock': 'Уақыт & Күнтізбе',
    'widget.pomodoro': 'Фокус-Таймер',
    'widget.tasks': 'Жедел тапсырмалар',
    'widget.insight': 'ИИ-Кеңес',
    'widget.system': 'OS Жүйелік мониторы',
    'widget.sticky': 'Жедел жазба',
    'widget.habits': 'Стриктер & Әдеттер',
    'widget.ambient': 'Шоғырлану дыбыстары',
    'widget.currentUnit': 'Ағымдағы DAG кванты',
    'widget.karma': 'Карма & Деңгей',
    'widget.byteConverter': 'Жад конвертері',
    'widget.quickLinks': 'Жылдам сілтемелер',
    'widget.memoryRetention': 'Жадты сақтау қисығы',
    'widget.catalog': 'Виджеттер каталогы',
    'widget.addWidget': 'Виджет қосу',
    'widget.arrangeGrid': 'Торға реттеу',
    'widget.resetDefaults': 'Бастапқы күйге қайтару',
    'widget.clearAll': 'Барлығын тазалау',
    'widget.layoutGrid': 'Адаптивті тор',
    'widget.layoutFree': 'Еркін орналасу',
    'widget.noTasks': 'Тапсырмалар жоқ',
    'widget.addTask': 'Тапсырма енгізіңіз...',
    'widget.addHabit': 'Әдет енгізіңіз...',

    // Focus Studio (20/10/70)
    'focus.theory': '20% Теория & Кванттар',
    'focus.blank': '10% «Таза парақ» сынағы',
    'focus.practice': '70% Практика & Код',
    'focus.sparring': 'ИИ Сократтық диалог',
    'focus.telemetry': 'Нейротелеметрия',
    'focus.completeQuantum': 'Квантты аяқтау (+15 XP)',
    'focus.submitRecall': 'Жадтан жауапты тексеру',
    'focus.runCode': 'Кодты іске қосу',
    'focus.nextStep': 'Келесі қадам',
    'focus.reset': 'Қайтару',
    'focus.evaluating': 'ИИ бағалауда...',
    'focus.score': 'Нәтиже',

    // Common Actions
    'action.save': 'Сақтау',
    'action.cancel': 'Бас тарту',
    'action.delete': 'Жою',
    'action.edit': 'Өңдеу',
    'action.add': 'Қосу',
    'action.create': 'Құру',
    'action.apply': 'Қолдану',
    'action.reset': 'Ысыру',
    'action.export': 'Экспорт',
    'action.import': 'Импорт',
    'action.search': 'Іздеу...',
    'action.filter': 'Сүзгі',
    'action.copy': 'Көшіру',
    'action.copied': 'Көшірілді!',
    'action.done': 'Дайын',
    'action.start': 'Бастау',
    'action.pause': 'Пауза',
    'action.continue': 'Жалғастыру',
    'action.close': 'Жабу',
    'action.unlock': 'Құлыпты ашу',
    'action.lock': 'Құлыптау',
    'action.back': 'Артқа',
    'action.next': 'Алға',
    'action.finish': 'Аяқтау',
    'action.loading': 'Жүктелуде...',
    'action.success': 'Сәтті орындалды',
    'action.error': 'Қате орын алды',

    // Lock Screen
    'lock.title': 'Жүйе уақытша құлыпталды',
    'lock.hint': 'Сеансты жалғастыру үшін «Құлыпты ашу» түймесін басыңыз',
    'lock.button': 'Жүйеге кіру',
    'lock.sessionRestored': 'Сеанс сәтті жаңартылды',

    // Spotlight & Quick Search
    'spotlight.placeholder': 'Команданы, пәнді, файлды немесе терезені іздеу...',
    'spotlight.apps': 'Қолданбалар мен терезелер',
    'spotlight.commands': 'Жүйелік пәрмендер',
    'spotlight.units': 'Оқу кванттары мен тақырыптар',
    'spotlight.noResults': 'Ештеңе табылмады',

    // Spaced Repetition
    'srs.title': 'Интервалды қайталау (SuperMemo-2)',
    'srs.flip': 'Жауапты көрсету (Бос орын)',
    'srs.again': 'Қайтадан (<1 мин)',
    'srs.hard': 'Қиын (1 күн)',
    'srs.good': 'Жақсы (3 күн)',
    'srs.easy': 'Оңай (7 күн)',
    'srs.completed': 'Бүгінгі барлық карточкалар қайталанды!',

    // Profile & Level
    'profile.title': 'Студент профилі',
    'profile.level': 'Деңгей',
    'profile.xp': 'XP Ұпайы',
    'profile.streak': 'Стрик',
    'profile.days': 'күн',
    'profile.stats': 'Оқу статистикасы',
    'profile.badges': 'Марапаттар мен белгілер',
    'profile.edit': 'Профильді өңдеу',

    // Diagnostics & Personalization
    'survey.title': 'Адаптивті білім диагностикасы',
    'survey.subtitle': 'Деңгейіңізді анықтап, дербес DAG-траекториясын құрыңыз',
    'survey.start': 'Диагностикадан өту',
    'survey.generating': 'ИИ оқу траекториясын құруда...',
    'survey.ready': 'Жоспар дайын!',

    // Splash, Dock & Interactive Tools
    'splash.sessionActive': 'Сессия белсенді',
    'splash.hello': 'Сәлем',
    'splash.ready': 'Жұмыс кеңістігі дайын',
    'splash.skipPrompt': 'Кіру үшін басыңыз немесе бос орын пернесін басыңыз',
    'dock.aiOperator': 'ИИ-Оператор: жеке тьютор және фасилитатор',
    'dock.openPeerChat': 'Напарникпен чатты ашу',
    'dock.communityGroups': 'P2P Чат және оқу топтары: қауымдастықты ашу',
    'dock.whiteboardTooltip': 'Интерактивті тақта (Ақ экран)',
    'dock.chatWith': 'Напарникпен чат',
    'dock.communityChat': 'Оқу тобы мен қауымдастық чаты',
    'dock.tasksTooltip': 'Ағымдағы спринт тапсырмалары',
    'whiteboard.title': 'Ақ экран (White Screen)',
    'whiteboard.partner': 'Напарник',
    'whiteboard.partnerActive': 'Напарник белсенді',
    'whiteboard.demoPartner': 'Демо-напарник',
    'whiteboard.save': 'Сақтау',
    'whiteboard.clear': 'Тақта тазалау',
    'whiteboard.grid': 'Тор',
    'whiteboard.pen': 'Қалам',
    'whiteboard.eraser': 'Өшіргіш',
    'whiteboard.text': 'Мәтін',
    'whiteboard.shapes': 'Фигуралар',
    'whiteboard.export': 'Экспорт',
    'hero.badge': 'Ерте альфа-нұсқа.',
    'hero.subtitle': 'Жад қалай жұмыс істесе, солай оқыңыз',
    'hero.desc': 'Тақырыпты білім графына, ал әр модульді портфолиоға дайын жұмысқа айналдыратын платформа.',
  },

  // ==========================================================================
  // 2. УКРАЇНСЬКА (Ukrainian)
  // ==========================================================================
  uk: {
    // App & Nav
    'app.title': 'Learning OS',
    'app.subtitle': 'Операційна система когнітивного навчання',
    'nav.desktop': 'На робочий стіл',
    'nav.launch': 'Запустити Learning OS',
    'nav.products': 'Продукти',
    'nav.about': 'Про компанію',
    'nav.principles': 'Принципи',
    'nav.login': 'Увійти',
    'nav.startFree': 'Почати безкоштовно',
    'nav.demo': 'Демо-робочий стіл',
    'nav.logout': 'Вийти',
    'nav.settings': 'Налаштування',
    'nav.profile': 'Профіль',
    'nav.changelog': 'Журнал оновлень',
    'nav.toDesktop': 'На робочий стіл',
    'nav.closeFullscreen': 'Закрити повноекранний режим (Esc)',
    'nav.fullscreen': 'Повноекранний режим',
    'nav.windowed': 'Віконний режим',
    'nav.pressEsc': 'Натисніть Esc для виходу',

    // TopBar
    'topbar.brand': 'Learning OS',
    'topbar.homeTitle': 'Повернутися на робочий стіл',
    'topbar.createModule': 'Створити модуль',
    'topbar.search': 'Пошук',
    'topbar.searchKbd': '⌘K',
    'topbar.focusTimer': 'Фокус-Таймер',
    'topbar.focusStart': 'Старт фокусу',
    'topbar.focusPause': 'Пауза',
    'topbar.team': 'Команда',
    'topbar.sync': 'Синхронізація',
    'topbar.offline': 'Офлайн',
    'topbar.findPartner': 'Пошук напарника',
    'topbar.activeCall': 'Дзвінок',
    'topbar.welcomeSplash': 'Екран привітання',
    'topbar.personalize': 'Персоналізація',
    'topbar.wallpapers': 'Галерея шпалер',
    'topbar.lockScreen': 'Заблокувати екран',
    'topbar.mobileView': 'Мобільний вигляд',
    'topbar.aboutPlatform': 'Про платформу',
    'topbar.themeToggle': 'Змінити тему',
    'topbar.profileTitle': 'Відкрити та редагувати профіль',
    'topbar.student': 'Студент',
    'topbar.syncing': 'Синхронізація Firestore...',
    'topbar.synced': 'Firestore синхронізовано',
    'topbar.syncError': 'Офлайн (збережено локально)',

    // Windows & Apps
    'app.desktop': 'Робочий стіл з віджетами',
    'app.dag': 'План навчання (DAG Граф)',
    'app.dag.short': 'DAG-Граф',
    'app.knowledge_sphere': '3D Сфера знань',
    'app.knowledge_git': 'Git Репозиторій знань',
    'app.textbook_library': 'Підручники & Кванти',
    'app.survey': 'Вхідна діагностика & План',
    'app.calendar': 'Календар & Розклад',
    'app.focus': 'Фокус-Студія (20/10/70)',
    'app.peer': 'P2P Напарник & Whiteboard',
    'app.chat': 'ШІ-Оператор курсу',
    'app.white_screen': 'Чистий екран (White Screen)',
    'app.portfolio': 'Портфоліо артефактів',
    'app.widgets': 'Віджети & Завдання',
    'app.admin': 'Контроль якості & Модерація',
    'app.partner_search': 'P2P Пошук напарника',
    'app.shortcuts': 'Гарячі клавіші',
    'app.notes': 'Нотатки',

    // Window Controls
    'win.minimize': 'Згорнути вікно',
    'win.maximize': 'Розгорнути',
    'win.restore': 'Відновити',
    'win.close': 'Закрити',
    'win.autoFit': 'Авто-підгонка під вільне місце',
    'win.remoteDragging': 'переміщує',

    // Widgets & Desktop
    'widget.clock': 'Час & Календар',
    'widget.pomodoro': 'Фокус-Таймер',
    'widget.tasks': 'Оперативні завдання',
    'widget.insight': 'ШІ-Порада по блоку',
    'widget.system': 'Системний монітор OS',
    'widget.sticky': 'Швидка нотатка',
    'widget.habits': 'Стріки & Звички',
    'widget.ambient': 'Фоновий звук концентрації',
    'widget.currentUnit': 'Поточний модуль DAG',
    'widget.karma': 'Карма & Рівень',
    'widget.byteConverter': 'Конвертер пам’яті',
    'widget.quickLinks': 'Швидкі посилання',
    'widget.memoryRetention': 'Крива збереження пам’яті',
    'widget.catalog': 'Каталог віджетів',
    'widget.addWidget': 'Додати віджет',
    'widget.arrangeGrid': 'Вирівняти по сітці',
    'widget.resetDefaults': 'Скинути за замовчуванням',
    'widget.clearAll': 'Очистити все',
    'widget.layoutGrid': 'Адаптивна сітка',
    'widget.layoutFree': 'Вільне розташування',
    'widget.noTasks': 'Немає активних завдань',
    'widget.addTask': 'Введіть нове завдання...',
    'widget.addHabit': 'Введіть назву звички...',

    // Focus Studio (20/10/70)
    'focus.theory': '20% Теорія & Кванти',
    'focus.blank': '10% «Чистий аркуш»',
    'focus.practice': '70% Практика & Код',
    'focus.sparring': 'ШІ Сократичний спаринг',
    'focus.telemetry': 'Нейротелеметрія',
    'focus.completeQuantum': 'Завершити квант (+15 XP)',
    'focus.submitRecall': 'Перевірити згадування з пам’яті',
    'focus.runCode': 'Запустити код',
    'focus.nextStep': 'Наступний крок',
    'focus.reset': 'Скинути',
    'focus.evaluating': 'ШІ оцінює...',
    'focus.score': 'Оцінка',

    // Common Actions
    'action.save': 'Зберегти',
    'action.cancel': 'Скасувати',
    'action.delete': 'Видалити',
    'action.edit': 'Редагувати',
    'action.add': 'Додати',
    'action.create': 'Створити',
    'action.apply': 'Застосувати',
    'action.reset': 'Скинути',
    'action.export': 'Експорт',
    'action.import': 'Імпорт',
    'action.search': 'Пошук...',
    'action.filter': 'Фільтр',
    'action.copy': 'Копіювати',
    'action.copied': 'Скопійовано!',
    'action.done': 'Готово',
    'action.start': 'Старт',
    'action.pause': 'Пауза',
    'action.continue': 'Продовжити',
    'action.close': 'Закрити',
    'action.unlock': 'Розблокувати',
    'action.lock': 'Заблокувати',
    'action.back': 'Назад',
    'action.next': 'Вперед',
    'action.finish': 'Завершити',
    'action.loading': 'Завантаження...',
    'action.success': 'Успішно виконано',
    'action.error': 'Виникла помилка',

    // Lock Screen
    'lock.title': 'Система тимчасово заблокована',
    'lock.hint': 'Натисніть «Увійти в систему» для відновлення сеансу',
    'lock.button': 'Увійти в систему',
    'lock.sessionRestored': 'Сеанс успішно відновлено',

    // Spotlight
    'spotlight.placeholder': 'Пошук команди, модуля, файлу чи вікна...',
    'spotlight.apps': 'Програми та вікна',
    'spotlight.commands': 'Системні команди',
    'spotlight.units': 'Кванти та теми курсу',
    'spotlight.noResults': 'Нічого не знайдено',

    // Spaced Repetition
    'srs.title': 'Інтервальне повторення (SuperMemo-2)',
    'srs.flip': 'Показати відповідь (Пробіл)',
    'srs.again': 'Знову (<1 хв)',
    'srs.hard': 'Важко (1 день)',
    'srs.good': 'Добре (3 дні)',
    'srs.easy': 'Легко (7 днів)',
    'srs.completed': 'Всі картки на сьогодні повторено!',

    // Profile & Diagnostics
    'profile.title': 'Профіль студента',
    'profile.level': 'Рівень',
    'profile.xp': 'Бали XP',
    'profile.streak': 'Стрік',
    'profile.days': 'днів',
    'profile.stats': 'Статистика навчання',
    'profile.badges': 'Нагороди та бейджі',
    'profile.edit': 'Редагувати профіль',
    'survey.title': 'Адаптивна діагностика знань',
    'survey.subtitle': 'Визначте свій рівень та побудуйте індивідуальну траєкторію',
    'survey.start': 'Пройти діагностику',
    'survey.generating': 'ШІ генерує навчальну траєкторію...',
    'survey.ready': 'План готовий!',

    // Splash, Dock & Interactive Tools
    'splash.sessionActive': 'Сесія активна',
    'splash.hello': 'Привіт',
    'splash.ready': 'Робочий простір готовий',
    'splash.skipPrompt': 'Клікніть або натисніть пробіл для входу',
    'dock.aiOperator': 'ШІ-Оператор: персональний тьютор та фасилітатор',
    'dock.openPeerChat': 'Відкрити чат з напарником',
    'dock.communityGroups': 'P2P Чат та навчальні групи: відкрити спільноту',
    'dock.whiteboardTooltip': 'Інтерактивна дошка (Чистий екран)',
    'dock.chatWith': 'Чат з напарником',
    'dock.communityChat': 'Чат навчальної групи та спільноти',
    'dock.tasksTooltip': 'Завдання поточного спринту',
    'whiteboard.title': 'Чистий екран (White Screen)',
    'whiteboard.partner': 'Напарник',
    'whiteboard.partnerActive': 'Напарник активний',
    'whiteboard.demoPartner': 'Демо-напарник',
    'whiteboard.save': 'Зберегти',
    'whiteboard.clear': 'Очистити дошку',
    'whiteboard.grid': 'Сітка',
    'whiteboard.pen': 'Олівець',
    'whiteboard.eraser': 'Гумка',
    'whiteboard.text': 'Текст',
    'whiteboard.shapes': 'Фігури',
    'whiteboard.export': 'Експорт',
    'hero.badge': 'Рання альфа-версія.',
    'hero.subtitle': 'Вчіться так, як працює пам’ять',
    'hero.desc': 'Платформа, що перетворює тему на граф знань, а кожен модуль — на готову роботу для портфоліо.',
  },

  // ==========================================================================
  // 3. РУССКИЙ (Russian)
  // ==========================================================================
  ru: {
    // App & Nav
    'app.title': 'Learning OS',
    'app.subtitle': 'Операционная система когнитивного обучения',
    'nav.desktop': 'На рабочий стол',
    'nav.launch': 'Запустить Learning OS',
    'nav.products': 'Продукты',
    'nav.about': 'О компании',
    'nav.principles': 'Принципы',
    'nav.login': 'Войти',
    'nav.startFree': 'Начать бесплатно',
    'nav.demo': 'Демо-рабочий стол',
    'nav.logout': 'Выйти',
    'nav.settings': 'Настройки',
    'nav.profile': 'Профиль',
    'nav.changelog': 'Журнал обновлений',
    'nav.toDesktop': 'На рабочий стол',
    'nav.closeFullscreen': 'Закрыть полноэкранный режим (Esc)',
    'nav.fullscreen': 'Полноэкранный режим',
    'nav.windowed': 'Оконный режим',
    'nav.pressEsc': 'Нажмите Esc для выхода',

    // TopBar
    'topbar.brand': 'Learning OS',
    'topbar.homeTitle': 'Вернуться на рабочий стол',
    'topbar.createModule': 'Создать модуль',
    'topbar.search': 'Поиск',
    'topbar.searchKbd': '⌘K',
    'topbar.focusTimer': 'Фокус-Таймер',
    'topbar.focusStart': 'Старт фокуса',
    'topbar.focusPause': 'Пауза',
    'topbar.team': 'Команда',
    'topbar.sync': 'Синхронизация',
    'topbar.offline': 'Офлайн',
    'topbar.findPartner': 'Поиск напарника',
    'topbar.activeCall': 'Звонок',
    'topbar.welcomeSplash': 'Экран «Привет»',
    'topbar.personalize': 'Персонализировать',
    'topbar.wallpapers': 'Галерея обоев',
    'topbar.lockScreen': 'Заблокировать экран',
    'topbar.mobileView': 'Мобильный вид',
    'topbar.aboutPlatform': 'О платформе',
    'topbar.themeToggle': 'Сменить тему',
    'topbar.profileTitle': 'Открыть и редактировать профиль',
    'topbar.student': 'Студент',
    'topbar.syncing': 'Синхронизация Firestore...',
    'topbar.synced': 'Firestore синхронизирована',
    'topbar.syncError': 'Офлайн (сохранено локально)',

    // Windows & Apps
    'app.desktop': 'Рабочий стол с виджетами',
    'app.dag': 'План обучения (DAG Граф)',
    'app.dag.short': 'DAG-Граф',
    'app.knowledge_sphere': 'Сфера знаний 3D',
    'app.knowledge_git': 'Git Репозиторий Знаний',
    'app.textbook_library': 'Учебники & Кванты',
    'app.survey': 'Входная диагностика & План',
    'app.calendar': 'Календарь & Расписание',
    'app.focus': 'Фокус-Студия (20/10/70)',
    'app.peer': 'P2P Напарник & Whiteboard',
    'app.chat': 'ИИ-Оператор курса',
    'app.white_screen': 'Белый экран (White Screen)',
    'app.portfolio': 'Портфолио артефактов',
    'app.widgets': 'Виджеты & Задачи',
    'app.admin': 'Контроль качества & Модерация',
    'app.partner_search': 'Поиск напарника (P2P)',
    'app.shortcuts': 'Горячие клавиши',
    'app.notes': 'Заметки',

    // Window Controls
    'win.minimize': 'Свернуть окно',
    'win.maximize': 'Развернуть',
    'win.restore': 'Восстановить',
    'win.close': 'Закрыть',
    'win.autoFit': 'Авто-подгонка под свободное место',
    'win.remoteDragging': 'перемещает',

    // Widgets & Desktop
    'widget.clock': 'Время & Календарь',
    'widget.pomodoro': 'Фокус-Таймер',
    'widget.tasks': 'Оперативные задачи',
    'widget.insight': 'ИИ-Совет по блоку',
    'widget.system': 'Системный монитор OS',
    'widget.sticky': 'Быстрая заметка',
    'widget.habits': 'Стрики & Привычки',
    'widget.ambient': 'Звуковой фон концентрации',
    'widget.currentUnit': 'Текущий модуль DAG',
    'widget.karma': 'Карма & Уровень',
    'widget.byteConverter': 'Конвертер памяти',
    'widget.quickLinks': 'Быстрые ссылки',
    'widget.memoryRetention': 'Кривая сохранения памяти',
    'widget.catalog': 'Каталог виджетов',
    'widget.addWidget': 'Добавить виджет',
    'widget.arrangeGrid': 'Выровнять по сетке',
    'widget.resetDefaults': 'Сбросить по умолчанию',
    'widget.clearAll': 'Очистить всё',
    'widget.layoutGrid': 'Адаптивная сетка',
    'widget.layoutFree': 'Свободное расположение',
    'widget.noTasks': 'Нет активных задач',
    'widget.addTask': 'Введите новую задачу...',
    'widget.addHabit': 'Введите название привычки...',

    // Focus Studio (20/10/70)
    'focus.theory': '20% Теория & Кванты',
    'focus.blank': '10% «Чистый лист»',
    'focus.practice': '70% Практика & Код',
    'focus.sparring': 'ИИ Сократический спарринг',
    'focus.telemetry': 'Нейротелеметрия',
    'focus.completeQuantum': 'Завершить квант (+15 XP)',
    'focus.submitRecall': 'Проверить слепое воспроизведение',
    'focus.runCode': 'Запустить код',
    'focus.nextStep': 'Следующий шаг',
    'focus.reset': 'Сбросить',
    'focus.evaluating': 'ИИ оценивает...',
    'focus.score': 'Оценка',

    // Common Actions
    'action.save': 'Сохранить',
    'action.cancel': 'Отмена',
    'action.delete': 'Удалить',
    'action.edit': 'Редактировать',
    'action.add': 'Добавить',
    'action.create': 'Создать',
    'action.apply': 'Применить',
    'action.reset': 'Сбросить',
    'action.export': 'Экспорт',
    'action.import': 'Импорт',
    'action.search': 'Поиск...',
    'action.filter': 'Фильтр',
    'action.copy': 'Копировать',
    'action.copied': 'Скопировано!',
    'action.done': 'Готово',
    'action.start': 'Старт',
    'action.pause': 'Пауза',
    'action.continue': 'Продолжить',
    'action.close': 'Закрыть',
    'action.unlock': 'Разблокировать',
    'action.lock': 'Заблокировать',
    'action.back': 'Назад',
    'action.next': 'Далее',
    'action.finish': 'Завершить',
    'action.loading': 'Загрузка...',
    'action.success': 'Успешно выполнено',
    'action.error': 'Произошла ошибка',

    // Lock Screen
    'lock.title': 'Система временно заблокирована',
    'lock.hint': 'Нажмите «Войти в систему» для возобновления сеанса',
    'lock.button': 'Войти в систему',
    'lock.sessionRestored': 'Сеанс успешно возобновлен',

    // Spotlight
    'spotlight.placeholder': 'Поиск команды, модуля, файла или окна...',
    'spotlight.apps': 'Приложения и окна',
    'spotlight.commands': 'Системные команды',
    'spotlight.units': 'Кванты и темы курса',
    'spotlight.noResults': 'Ничего не найдено',

    // Spaced Repetition
    'srs.title': 'Интервальное повторение (SuperMemo-2)',
    'srs.flip': 'Показать ответ (Пробел)',
    'srs.again': 'Снова (<1 мин)',
    'srs.hard': 'Трудно (1 день)',
    'srs.good': 'Хорошо (3 дня)',
    'srs.easy': 'Легко (7 дней)',
    'srs.completed': 'Все карточки на сегодня повторены!',

    // Profile & Diagnostics
    'profile.title': 'Профиль студента',
    'profile.level': 'Уровень',
    'profile.xp': 'Очки XP',
    'profile.streak': 'Стрик',
    'profile.days': 'дней',
    'profile.stats': 'Статистика обучения',
    'profile.badges': 'Награды и бейджи',
    'profile.edit': 'Редактировать профиль',
    'survey.title': 'Адаптивная диагностика знаний',
    'survey.subtitle': 'Определите свой уровень и постройте индивидуальную траекторию',
    'survey.start': 'Пройти диагностику',
    'survey.generating': 'ИИ генерирует учебную траекторию...',
    'survey.ready': 'План готов!',

    // Splash, Dock & Interactive Tools
    'splash.sessionActive': 'Сессия активна',
    'splash.hello': 'Привет',
    'splash.ready': 'Рабочее пространство готово',
    'splash.skipPrompt': 'Кликните или нажмите пробел для входа',
    'dock.aiOperator': 'ИИ-Оператор: персональный тьютор и фасилитатор',
    'dock.openPeerChat': 'Открыть чат с напарником',
    'dock.communityGroups': 'P2P Чат и учебные группы: открыть сообщество',
    'dock.whiteboardTooltip': 'Интерактивная доска (Белый экран)',
    'dock.chatWith': 'Чат с напарником',
    'dock.communityChat': 'Чат учебной группы & сообщества',
    'dock.tasksTooltip': 'Задачи текущего спринта',
    'whiteboard.title': 'Белый экран (White Screen)',
    'whiteboard.partner': 'Напарник',
    'whiteboard.partnerActive': 'Напарник активен',
    'whiteboard.demoPartner': 'Демо-напарник',
    'whiteboard.save': 'Сохранить',
    'whiteboard.clear': 'Очистить доску',
    'whiteboard.grid': 'Сетка',
    'whiteboard.pen': 'Перо',
    'whiteboard.eraser': 'Ластик',
    'whiteboard.text': 'Текст',
    'whiteboard.shapes': 'Фигуры',
    'whiteboard.export': 'Экспорт',
    'hero.badge': 'Ранняя альфа-версия.',
    'hero.subtitle': 'Учитесь так, как работает память',
    'hero.desc': 'Платформа, которая превращает тему в граф знаний, а каждый модуль в готовую работу для портфолио.',
  },

  // ==========================================================================
  // 4. ENGLISH (English)
  // ==========================================================================
  en: {
    // App & Nav
    'app.title': 'Learning OS',
    'app.subtitle': 'Cognitive Learning Operating System',
    'nav.desktop': 'To Desktop',
    'nav.launch': 'Launch Learning OS',
    'nav.products': 'Products',
    'nav.about': 'About Us',
    'nav.principles': 'Principles',
    'nav.login': 'Sign In',
    'nav.startFree': 'Start Free',
    'nav.demo': 'Demo Desktop',
    'nav.logout': 'Sign Out',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',
    'nav.changelog': 'Changelog',
    'nav.toDesktop': 'To Desktop',
    'nav.closeFullscreen': 'Exit Fullscreen (Esc)',
    'nav.fullscreen': 'Fullscreen Mode',
    'nav.windowed': 'Windowed Mode',
    'nav.pressEsc': 'Press Esc to exit',

    // TopBar
    'topbar.brand': 'Learning OS',
    'topbar.homeTitle': 'Return to Desktop',
    'topbar.createModule': 'Create Module',
    'topbar.search': 'Search',
    'topbar.searchKbd': '⌘K',
    'topbar.focusTimer': 'Focus Timer',
    'topbar.focusStart': 'Start Focus',
    'topbar.focusPause': 'Pause',
    'topbar.team': 'Team',
    'topbar.sync': 'Sync',
    'topbar.offline': 'Offline',
    'topbar.findPartner': 'Find Partner',
    'topbar.activeCall': 'Call',
    'topbar.welcomeSplash': 'Welcome Splash',
    'topbar.personalize': 'Personalize',
    'topbar.wallpapers': 'Wallpaper Gallery',
    'topbar.lockScreen': 'Lock Screen',
    'topbar.mobileView': 'Mobile View',
    'topbar.aboutPlatform': 'About Platform',
    'topbar.themeToggle': 'Switch Theme',
    'topbar.profileTitle': 'Open and edit profile',
    'topbar.student': 'Student',
    'topbar.syncing': 'Syncing Firestore...',
    'topbar.synced': 'Firestore synced',
    'topbar.syncError': 'Offline (saved locally)',

    // Windows & Apps
    'app.desktop': 'Widget Desktop',
    'app.dag': 'Learning Path (DAG Graph)',
    'app.dag.short': 'DAG Graph',
    'app.knowledge_sphere': '3D Knowledge Sphere',
    'app.knowledge_git': 'Knowledge Git Repo',
    'app.textbook_library': 'Textbooks & Quanta',
    'app.survey': 'Diagnostic & Plan',
    'app.calendar': 'Calendar & Schedule',
    'app.focus': 'Focus Studio (20/10/70)',
    'app.peer': 'P2P Partner & Whiteboard',
    'app.chat': 'AI Course Operator',
    'app.white_screen': 'White Screen',
    'app.portfolio': 'Artifact Portfolio',
    'app.widgets': 'Widgets & Tasks',
    'app.admin': 'Quality Control & Moderation',
    'app.partner_search': 'P2P Matchmaking',
    'app.shortcuts': 'Keyboard Shortcuts',
    'app.notes': 'Notes',

    // Window Controls
    'win.minimize': 'Minimize',
    'win.maximize': 'Maximize',
    'win.restore': 'Restore',
    'win.close': 'Close',
    'win.autoFit': 'Auto-fit empty space',
    'win.remoteDragging': 'is moving',

    // Widgets & Desktop
    'widget.clock': 'Clock & Calendar',
    'widget.pomodoro': 'Focus Timer',
    'widget.tasks': 'Daily Tasks',
    'widget.insight': 'AI Block Insight',
    'widget.system': 'System Monitor OS',
    'widget.sticky': 'Sticky Note',
    'widget.habits': 'Streaks & Habits',
    'widget.ambient': 'Ambient Audio',
    'widget.currentUnit': 'Current DAG Unit',
    'widget.karma': 'Karma & Level',
    'widget.byteConverter': 'Byte Converter',
    'widget.quickLinks': 'Quick Links',
    'widget.memoryRetention': 'Memory Retention Curve',
    'widget.catalog': 'Widget Catalog',
    'widget.addWidget': 'Add Widget',
    'widget.arrangeGrid': 'Align to Grid',
    'widget.resetDefaults': 'Reset to Defaults',
    'widget.clearAll': 'Clear All',
    'widget.layoutGrid': 'Responsive Grid',
    'widget.layoutFree': 'Freeform Layout',
    'widget.noTasks': 'No active tasks',
    'widget.addTask': 'Add a new task...',
    'widget.addHabit': 'Add a habit name...',

    // Focus Studio (20/10/70)
    'focus.theory': '20% Theory & Quanta',
    'focus.blank': '10% Blank Page Recall',
    'focus.practice': '70% Code & Practice',
    'focus.sparring': 'AI Socratic Sparring',
    'focus.telemetry': 'Neuro Telemetry',
    'focus.completeQuantum': 'Complete Quantum (+15 XP)',
    'focus.submitRecall': 'Verify Active Recall',
    'focus.runCode': 'Run Code',
    'focus.nextStep': 'Next Step',
    'focus.reset': 'Reset',
    'focus.evaluating': 'AI is evaluating...',
    'focus.score': 'Score',

    // Common Actions
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.add': 'Add',
    'action.create': 'Create',
    'action.apply': 'Apply',
    'action.reset': 'Reset',
    'action.export': 'Export',
    'action.import': 'Import',
    'action.search': 'Search...',
    'action.filter': 'Filter',
    'action.copy': 'Copy',
    'action.copied': 'Copied!',
    'action.done': 'Done',
    'action.start': 'Start',
    'action.pause': 'Pause',
    'action.continue': 'Continue',
    'action.close': 'Close',
    'action.unlock': 'Unlock',
    'action.lock': 'Lock',
    'action.back': 'Back',
    'action.next': 'Next',
    'action.finish': 'Finish',
    'action.loading': 'Loading...',
    'action.success': 'Operation successful',
    'action.error': 'An error occurred',

    // Lock Screen
    'lock.title': 'System is Locked',
    'lock.hint': 'Click "Sign In / Unlock" to resume your active session',
    'lock.button': 'Sign In / Unlock',
    'lock.sessionRestored': 'Session successfully resumed',

    // Spotlight
    'spotlight.placeholder': 'Search command, module, file, or window...',
    'spotlight.apps': 'Applications & Windows',
    'spotlight.commands': 'System Commands',
    'spotlight.units': 'Knowledge Quanta & Topics',
    'spotlight.noResults': 'No results found',

    // Spaced Repetition
    'srs.title': 'Spaced Repetition (SuperMemo-2)',
    'srs.flip': 'Show Answer (Spacebar)',
    'srs.again': 'Again (<1m)',
    'srs.hard': 'Hard (1d)',
    'srs.good': 'Good (3d)',
    'srs.easy': 'Easy (7d)',
    'srs.completed': 'All cards for today completed!',

    // Profile & Diagnostics
    'profile.title': 'Student Profile',
    'profile.level': 'Level',
    'profile.xp': 'XP Points',
    'profile.streak': 'Streak',
    'profile.days': 'days',
    'profile.stats': 'Learning Statistics',
    'profile.badges': 'Badges & Achievements',
    'profile.edit': 'Edit Profile',
    'survey.title': 'Adaptive Knowledge Diagnostic',
    'survey.subtitle': 'Determine your baseline and construct a personalized DAG path',
    'survey.start': 'Start Diagnostic',
    'survey.generating': 'AI is compiling learning trajectory...',
    'survey.ready': 'Path is ready!',

    // Splash, Dock & Interactive Tools
    'splash.sessionActive': 'Session active',
    'splash.hello': 'Hello',
    'splash.ready': 'Workspace is ready',
    'splash.skipPrompt': 'Click or press Space to enter',
    'dock.aiOperator': 'AI Operator: personal tutor and facilitator',
    'dock.openPeerChat': 'Open chat with study partner',
    'dock.communityGroups': 'P2P Chat & Study Groups: open community',
    'dock.whiteboardTooltip': 'Interactive Whiteboard (White Screen)',
    'dock.chatWith': 'Partner Chat',
    'dock.communityChat': 'Study Group & Community Chat',
    'dock.tasksTooltip': 'Current Sprint Tasks',
    'whiteboard.title': 'White Screen',
    'whiteboard.partner': 'Partner',
    'whiteboard.partnerActive': 'Partner active',
    'whiteboard.demoPartner': 'Demo partner',
    'whiteboard.save': 'Save',
    'whiteboard.clear': 'Clear board',
    'whiteboard.grid': 'Grid',
    'whiteboard.pen': 'Pen',
    'whiteboard.eraser': 'Eraser',
    'whiteboard.text': 'Text',
    'whiteboard.shapes': 'Shapes',
    'whiteboard.export': 'Export',
    'hero.badge': 'Early alpha version.',
    'hero.subtitle': 'Learn the way memory works',
    'hero.desc': 'A platform that turns topics into knowledge DAGs, and every module into portfolio-ready work.',
  },

  // ==========================================================================
  // 5. 日本語 (Japanese)
  // ==========================================================================
  ja: {
    // App & Nav
    'app.title': 'Learning OS',
    'app.subtitle': '認知的学習オペレーティングシステム',
    'nav.desktop': 'デスクトップへ',
    'nav.launch': 'Learning OS を起動',
    'nav.products': 'プロダクト',
    'nav.about': '企業情報',
    'nav.principles': '設計理念',
    'nav.login': 'ログイン',
    'nav.startFree': '無料で開始',
    'nav.demo': 'デモデスクトップ',
    'nav.logout': 'ログアウト',
    'nav.settings': '設定',
    'nav.profile': 'プロフィール',
    'nav.changelog': '更新履歴',
    'nav.toDesktop': 'デスクトップへ',
    'nav.closeFullscreen': '全画面を閉じる (Esc)',
    'nav.fullscreen': '全画面モード',
    'nav.windowed': 'ウィンドウモード',
    'nav.pressEsc': 'Escキーで終了',

    // TopBar
    'topbar.brand': 'Learning OS',
    'topbar.homeTitle': 'デスクトップに戻る',
    'topbar.createModule': 'モジュール作成',
    'topbar.search': '検索',
    'topbar.searchKbd': '⌘K',
    'topbar.focusTimer': '集中タイマー',
    'topbar.focusStart': '集中開始',
    'topbar.focusPause': '一時停止',
    'topbar.team': 'チーム',
    'topbar.sync': '同期',
    'topbar.offline': 'オフライン',
    'topbar.findPartner': 'ペア検索',
    'topbar.activeCall': '通話中',
    'topbar.welcomeSplash': 'ウェルカム画面',
    'topbar.personalize': 'パーソナライズ',
    'topbar.wallpapers': '壁紙ギャラリー',
    'topbar.lockScreen': '画面ロック',
    'topbar.mobileView': 'モバイル表示',
    'topbar.aboutPlatform': 'プラットフォームについて',
    'topbar.themeToggle': 'テーマ切替',
    'topbar.profileTitle': 'プロフィールを開いて編集',
    'topbar.student': '学習者',
    'topbar.syncing': 'Firestore同期中...',
    'topbar.synced': 'Firestore同期完了',
    'topbar.syncError': 'オフライン（ローカル保存）',

    // Windows & Apps
    'app.desktop': 'ウィジェット付きデスクトップ',
    'app.dag': '学習計画 (DAGグラフ)',
    'app.dag.short': 'DAGグラフ',
    'app.knowledge_sphere': '3D 知識スフィア',
    'app.knowledge_git': '知識 Git リポジトリ',
    'app.textbook_library': '教科書 & クオンタ',
    'app.survey': '初期診断 & 適応計画',
    'app.calendar': 'カレンダー & スケジュール',
    'app.focus': 'フォーカススタジオ (20/10/70)',
    'app.peer': 'P2P ペア学習 & ボード',
    'app.chat': 'AI コースオペレーター',
    'app.white_screen': 'ホワイトスクリーン',
    'app.portfolio': '成果物ポートフォリオ',
    'app.widgets': 'ウィジェット & タスク',
    'app.admin': '品質管理 & モデレーション',
    'app.partner_search': 'P2P ペア検索',
    'app.shortcuts': 'ショートカットキー',
    'app.notes': 'メモ帳',

    // Window Controls
    'win.minimize': '最小化',
    'win.maximize': '最大化',
    'win.restore': '元に戻す',
    'win.close': '閉じる',
    'win.autoFit': '空きスペースに自動調整',
    'win.remoteDragging': 'が移動中',

    // Widgets & Desktop
    'widget.clock': '時計 & カレンダー',
    'widget.pomodoro': 'ポモドーロタイマー',
    'widget.tasks': 'タスク一覧',
    'widget.insight': 'AI ブロック助言',
    'widget.system': 'OS システムモニター',
    'widget.sticky': 'クイックメモ',
    'widget.habits': '習慣 & 連続記録',
    'widget.ambient': '集中サウンド',
    'widget.currentUnit': '現在のDAGクオンタ',
    'widget.karma': 'カルマ & レベル',
    'widget.byteConverter': 'メモリ変換器',
    'widget.quickLinks': 'クイックリンク',
    'widget.memoryRetention': '記憶定着曲線',
    'widget.catalog': 'ウィジェットカタログ',
    'widget.addWidget': 'ウィジェットを追加',
    'widget.arrangeGrid': 'グリッド整列',
    'widget.resetDefaults': '初期状態にリセット',
    'widget.clearAll': 'すべて消去',
    'widget.layoutGrid': 'レスポンシブグリッド',
    'widget.layoutFree': 'フリー配置',
    'widget.noTasks': 'タスクはありません',
    'widget.addTask': '新しいタスクを入力...',
    'widget.addHabit': '習慣名を入力...',

    // Focus Studio (20/10/70)
    'focus.theory': '20% 理論 & クオンタ',
    'focus.blank': '10% 白紙想起テスト',
    'focus.practice': '70% 実践 & コード',
    'focus.sparring': 'AI ソクラテス対話',
    'focus.telemetry': '神経テレメトリ',
    'focus.completeQuantum': 'クオンタ完了 (+15 XP)',
    'focus.submitRecall': '想起内容を検証',
    'focus.runCode': 'コード実行',
    'focus.nextStep': '次のステップ',
    'focus.reset': 'リセット',
    'focus.evaluating': 'AI が評価中...',
    'focus.score': 'スコア',

    // Common Actions
    'action.save': '保存',
    'action.cancel': 'キャンセル',
    'action.delete': '削除',
    'action.edit': '編集',
    'action.add': '追加',
    'action.create': '作成',
    'action.apply': '適用',
    'action.reset': 'リセット',
    'action.export': 'エクスポート',
    'action.import': 'インポート',
    'action.search': '検索...',
    'action.filter': 'フィルター',
    'action.copy': 'コピー',
    'action.copied': 'コピー完了！',
    'action.done': '完了',
    'action.start': '開始',
    'action.pause': '一時停止',
    'action.continue': '再開',
    'action.close': '閉じる',
    'action.unlock': 'ロック解除',
    'action.lock': '画面ロック',
    'action.back': '戻る',
    'action.next': '次へ',
    'action.finish': '終了',
    'action.loading': '読み込み中...',
    'action.success': '成功しました',
    'action.error': 'エラーが発生しました',

    // Lock Screen
    'lock.title': 'システムがロックされています',
    'lock.hint': 'セッションを再開するには「ロック解除」をクリックしてください',
    'lock.button': 'ログイン / ロック解除',
    'lock.sessionRestored': 'セッションを復帰しました',

    // Spotlight
    'spotlight.placeholder': 'コマンド、モジュール、ファイル、ウィンドウを検索...',
    'spotlight.apps': 'アプリケーション & ウィンドウ',
    'spotlight.commands': 'システムコマンド',
    'spotlight.units': '知識クオンタとトピック',
    'spotlight.noResults': '見つかりませんでした',

    // Spaced Repetition
    'srs.title': '間隔反復学習 (SuperMemo-2)',
    'srs.flip': '答えを表示 (スペースキー)',
    'srs.again': 'もう一度 (<1分)',
    'srs.hard': '難しい (1日)',
    'srs.good': '普通 (3日)',
    'srs.easy': '簡単 (7日)',
    'srs.completed': '本日のカードはすべて復習完了しました！',

    // Profile & Diagnostics
    'profile.title': '受講者プロフィール',
    'profile.level': 'レベル',
    'profile.xp': 'XPポイント',
    'profile.streak': '連続学習',
    'profile.days': '日',
    'profile.stats': '学習統計',
    'profile.badges': '獲得バッジ',
    'profile.edit': 'プロフィール編集',
    'survey.title': '適応型スキル診断',
    'survey.subtitle': '現状のレベルを診断し、最適なDAG学習軌道を構築します',
    'survey.start': '診断を開始',
    'survey.generating': 'AI が学習軌道を生成中...',
    'survey.ready': 'プランが完成しました！',

    // Splash, Dock & Interactive Tools
    'splash.sessionActive': 'セッション有効',
    'splash.hello': 'こんにちは',
    'splash.ready': 'ワークスペースの準備完了',
    'splash.skipPrompt': 'クリックまたはスペースキーで開始',
    'dock.aiOperator': 'AIオペレーター: 個人チューター&ファシリテーター',
    'dock.openPeerChat': 'パートナーとのチャットを開く',
    'dock.communityGroups': 'P2P チャット & 学習グループ: コミュニティを開く',
    'dock.whiteboardTooltip': 'インタラクティブホワイトボード (White Screen)',
    'dock.chatWith': 'パートナーチャット',
    'dock.communityChat': '学習グループ・コミュニティチャット',
    'dock.tasksTooltip': '今週のスプリントタスク',
    'whiteboard.title': 'ホワイトボード (White Screen)',
    'whiteboard.partner': 'パートナー',
    'whiteboard.partnerActive': 'パートナー稼働中',
    'whiteboard.demoPartner': 'デモパートナー',
    'whiteboard.save': '保存',
    'whiteboard.clear': 'ボードをクリア',
    'whiteboard.grid': 'グリッド',
    'whiteboard.pen': 'ペン',
    'whiteboard.eraser': '消しゴム',
    'whiteboard.text': 'テキスト',
    'whiteboard.shapes': '図形',
    'whiteboard.export': 'エクスポート',
    'hero.badge': '初期アルファ版。',
    'hero.subtitle': '脳と記憶のメカニズムに沿って学ぶ',
    'hero.desc': 'トピックを知識グラフへ、各モジュールをポートフォリオ実績へと昇華させる学習OS。',
  },
};

// AI Language Directives for Gemini API
export const AI_LANGUAGE_DIRECTIVES: Record<SupportedLanguage, string> = {
  kk: 'МАҢЫЗДЫ ТАЛАП: Сіз қолданушымен тек таза ҚАЗАҚ ТІЛІНДЕ (Kazakh language) сөйлесуіңіз керек. Барлық түсіндірмелер, сократтық сұрақтар мен кері байланыс қазақша берілсін.',
  uk: 'ВАЖЛИВА ВИМОГА: Ви повинні відповідати та спілкуватися з користувачем виключно УКРАЇНСЬКОЮ МОВОЮ (Ukrainian language). Всі пояснення, сократичні запитання та аналіз надавайте українською.',
  ru: 'ТРЕБОВАНИЕ: Отвечайте и ведите весь диалог с пользователем на РУССКОМ ЯЗЫКЕ (Russian language).',
  en: 'CRITICAL REQUIREMENT: You MUST interact and respond strictly in ENGLISH (English language). All explanations and feedback must be in fluent English.',
  ja: '重要指示: ユーザーへの返信・解説・ソクラテス式問いかけ・フィードバックは、すべて流暢な日本語 (Japanese language) で行ってください。',
};

class I18nService {
  private currentLanguage: SupportedLanguage = 'ru';
  private listeners: Array<(lang: SupportedLanguage) => void> = [];
  private isAutoDetected = false;

  constructor() {
    this.initLanguage();
  }

  private async initLanguage() {
    const saved = localStorage.getItem('pinkinau_lang') as SupportedLanguage;
    if (saved && (['kk', 'uk', 'ru', 'en', 'ja'] as SupportedLanguage[]).includes(saved)) {
      this.currentLanguage = saved;
      this.notify();
      return;
    }
    await this.detectLanguageFromEnvironment();
  }

  public async detectLanguageFromEnvironment(): Promise<SupportedLanguage> {
    if (this.isAutoDetected) return this.currentLanguage;

    try {
      const res = await fetch('/api/geo/lang', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        if (data?.lang && (['kk', 'uk', 'ru', 'en', 'ja'] as SupportedLanguage[]).includes(data.lang)) {
          this.setLanguage(data.lang, false);
          this.isAutoDetected = true;
          return data.lang;
        }
      }
    } catch {}

    const browserLang = (navigator.language || (navigator as any).userLanguage || 'en').toLowerCase();
    let detected: SupportedLanguage = 'en';

    if (browserLang.startsWith('kk') || browserLang.startsWith('kz')) {
      detected = 'kk';
    } else if (browserLang.startsWith('uk') || browserLang.startsWith('ua')) {
      detected = 'uk';
    } else if (browserLang.startsWith('ru') || browserLang.startsWith('be') || browserLang.startsWith('ky')) {
      detected = 'ru';
    } else if (browserLang.startsWith('ja') || browserLang.startsWith('jp')) {
      detected = 'ja';
    } else {
      detected = 'en';
    }

    this.setLanguage(detected, false);
    this.isAutoDetected = true;
    return detected;
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public setLanguage(lang: SupportedLanguage, save = true) {
    if (this.currentLanguage === lang) return;
    this.currentLanguage = lang;
    if (save) {
      localStorage.setItem('pinkinau_lang', lang);
    }
    this.notify();
  }

  public t(key: string, defaultText?: string): string {
    const langDict = DICTIONARY[this.currentLanguage] || DICTIONARY.ru;
    return langDict[key] || DICTIONARY.ru[key] || DICTIONARY.en[key] || defaultText || key;
  }

  public getAppTitle(appId: string): string {
    return this.t(`app.${appId}`, appId);
  }

  public getWidgetTitle(type: string): string {
    return this.t(`widget.${type}`, type);
  }

  public getAiDirective(): string {
    return AI_LANGUAGE_DIRECTIVES[this.currentLanguage] || AI_LANGUAGE_DIRECTIVES.ru;
  }

  public subscribe(cb: (lang: SupportedLanguage) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.currentLanguage);
      } catch (err) {
        console.error('[i18n] listener error:', err);
      }
    });
  }
}

export const i18n = new I18nService();

export function useI18n() {
  const [lang, setLang] = useState<SupportedLanguage>(() => i18n.getLanguage());

  useEffect(() => {
    return i18n.subscribe((newLang) => {
      setLang(newLang);
    });
  }, []);

  return {
    lang,
    t: (key: string, defaultText?: string) => i18n.t(key, defaultText),
    getAppTitle: (appId: string) => i18n.getAppTitle(appId),
    getWidgetTitle: (type: string) => i18n.getWidgetTitle(type),
    setLanguage: (newLang: SupportedLanguage) => i18n.setLanguage(newLang),
    languages: SUPPORTED_LANGUAGES,
    aiDirective: i18n.getAiDirective(),
  };
}
