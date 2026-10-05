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
  // --------------------------------------------------------------------------
  // 1. Қазақша (Kazakh)
  // --------------------------------------------------------------------------
  kk: {
    // Navigation & Actions
    'app.title': 'Learning OS',
    'app.subtitle': 'Когнитивті оқытудың операциялық жүйесі',
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

    // Landing Hero
    'hero.badge': 'PinkInAu Компаниясы • Когнитивті платформалар',
    'hero.title': 'PinkInAu',
    'hero.subtitle': 'Адамға арналған цифрлық өнімдер мен операциялық орталарды әзірлейміз',
    'hero.desc': 'Күрделі инженерлік пәндерді, бағдарламалауды және ғылымды терең меңгеруге арналған DAG-графтары бар толыққанды оқу операциялық жүйесі.',
    'hero.cta.start': 'Learning OS бастау',
    'hero.cta.explore': 'Барлық өнімдер',

    // Landing Features
    'features.dag.title': 'DAG Траекториясы',
    'features.dag.desc': 'Білімдер бағытталған ациклдік граф түрінде құрылады — қажетті түсініктерді біртіндеп меңгеру.',
    'features.blank.title': '«Таза парақ» режимі',
    'features.blank.desc': 'Сынақсыз және подсказкасыз жадтан өз бетінше жаңғырту арқылы терең тексеру.',
    'features.sparring.title': 'Сократтық диалог',
    'features.sparring.desc': 'Дайын жауап бермейтін, ойландыратын қарсы сұрақтар қоятын ИИ-спарринг.',
    'features.collab.title': 'P2P Тақтасы',
    'features.collab.desc': 'Нақты уақыттағы жұптық кодтау және архитектуралық сұлбаларды бірлесіп сызу.',

    // Products
    'products.title': 'Компания өнімдері',
    'products.subtitle': 'PinkInAu тәуелсіз цифрлық экожүйесі',
    'products.learnos.badge': 'Флагмандық жүйе',
    'products.learnos.status': 'Қолжетімді',
    'products.learnos.desc': 'Күрделі инженерлік білімді игеруге арналған модульдік оқу операциялық веб-ортасы.',
    'products.studio.title': 'PinkInAu Studio',
    'products.studio.desc': 'Интерактивті оқу материалдары мен графо-құрылымдарды әзірлеу ортасы.',
    'products.core.title': 'PinkInAu Core',
    'products.core.desc': 'Инфрақұрылымдық қауіпсіз деректер мен API шлюзі.',
    'products.labs.title': 'PinkInAu Labs',
    'products.labs.desc': 'Интерфейстер мен алгоритмдердің зерттеу зертханасы.',

    // OS Desktop UI
    'os.menu.apple': 'Learning OS',
    'os.menu.file': 'Файл',
    'os.menu.edit': 'Өңдеу',
    'os.menu.view': 'Көрініс',
    'os.menu.window': 'Терезе',
    'os.menu.help': 'Анықтама',
    'os.dock.dag': 'Оқу графы',
    'os.dock.blank': 'Таза парақ',
    'os.dock.sparring': 'ИИ Спарринг',
    'os.dock.collab': 'Бірлескен тақта',
    'os.dock.portfolio': 'Портфолио',
    'os.dock.widgets': 'Виджеттер',
    'os.dock.terminal': 'Терминал',
    'os.dock.admin': 'Басқару',
    'os.pomo.start': 'Фокус бастау',
    'os.pomo.stop': 'Үзіліс',
    'os.lang.select': 'Тілді таңдау',
    'os.search.placeholder': 'Команданы, модульді немесе терезені іздеу...',
  },

  // --------------------------------------------------------------------------
  // 2. Українська (Ukrainian)
  // --------------------------------------------------------------------------
  uk: {
    // Navigation & Actions
    'app.title': 'Learning OS',
    'app.subtitle': 'Операційна система когнітивного навчання',
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

    // Landing Hero
    'hero.badge': 'Компанія PinkInAu • Платформи нового покоління',
    'hero.title': 'PinkInAu',
    'hero.subtitle': 'Створюємо цифрові продукти та операційні середовища для людини',
    'hero.desc': 'Повноцінна навчальна операційна система з DAG-графами, сліпою перевіркою пам’яті та сократичним спарингом для глибокого освоєння інженерії.',
    'hero.cta.start': 'Відкрити Learning OS',
    'hero.cta.explore': 'Всі продукти',

    // Landing Features
    'features.dag.title': 'DAG Траєкторія',
    'features.dag.desc': 'Знання будуються у вигляді напрямленого ациклічного графа без прогалин у базових поняттях.',
    'features.blank.title': 'Режим «Чистий аркуш»',
    'features.blank.desc': 'Справжня перевірка розуміння через вільне відтворення концепцій по пам’яті без підказок.',
    'features.sparring.title': 'Сократичний діалог',
    'features.sparring.desc': 'ШІ-спаринг не дає готових відповідей, а ставить глибокі зустрічні запитання для виявлення дефіцитів.',
    'features.collab.title': 'P2P Дошка',
    'features.collab.desc': 'Парна співпраця в реальному часі зі спільними дзеркальними курсорами та синхронізацією.',

    // Products
    'products.title': 'Продукти компанії',
    'products.subtitle': 'Екосистема прикладних цифрових рішень PinkInAu',
    'products.learnos.badge': 'Флагманський продукт',
    'products.learnos.status': 'Доступно зараз',
    'products.learnos.desc': 'Модульне освітнє веб-середовище для глибокого вивчення інженерних і продуктових дисциплін.',
    'products.studio.title': 'PinkInAu Studio',
    'products.studio.desc': 'Середовище створення та верстки інтерактивних графічних курсів.',
    'products.core.title': 'PinkInAu Core',
    'products.core.desc': 'Інфраструктурний шар та захищений API-шлюз.',
    'products.labs.title': 'PinkInAu Labs',
    'products.labs.desc': 'R&D підрозділ дослідження інтерфейсів та алгоритмів.',

    // OS Desktop UI
    'os.menu.apple': 'Learning OS',
    'os.menu.file': 'Файл',
    'os.menu.edit': 'Редагувати',
    'os.menu.view': 'Вигляд',
    'os.menu.window': 'Вікно',
    'os.menu.help': 'Довідка',
    'os.dock.dag': 'Граф навчання',
    'os.dock.blank': 'Чистий аркуш',
    'os.dock.sparring': 'ШІ Спаринг',
    'os.dock.collab': 'Спільна дошка',
    'os.dock.portfolio': 'Портфоліо',
    'os.dock.widgets': 'Віджети',
    'os.dock.terminal': 'Термінал',
    'os.dock.admin': 'Консоль',
    'os.pomo.start': 'Старт фокусу',
    'os.pomo.stop': 'Пауза',
    'os.lang.select': 'Оберіть мову',
    'os.search.placeholder': 'Пошук команди, модуля або вікна...',
  },

  // --------------------------------------------------------------------------
  // 3. Русский (Russian)
  // --------------------------------------------------------------------------
  ru: {
    // Navigation & Actions
    'app.title': 'Learning OS',
    'app.subtitle': 'Операционная система когнитивного обучения',
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

    // Landing Hero
    'hero.badge': 'Компания PinkInAu • Технологические платформы',
    'hero.title': 'PinkInAu',
    'hero.subtitle': 'Создаем цифровые продукты и операционные среды для человека',
    'hero.desc': 'Полноценная модульная обучающая операционная среда с DAG-графами, методикой слепого воспроизведения и сократическим спаррингом.',
    'hero.cta.start': 'Запустить Learning OS',
    'hero.cta.explore': 'Все продукты',

    // Landing Features
    'features.dag.title': 'DAG Траектория',
    'features.dag.desc': 'Знания строятся в виде направленного графа зависимостей без пробелов в базовых понятиях.',
    'features.blank.title': 'Режим «Чистый лист»',
    'features.blank.desc': 'Слепая проверка понятий через извлечение по памяти без подсказок и тестов.',
    'features.sparring.title': 'Сократический спарринг',
    'features.sparring.desc': 'ИИ-партнер задает глубокие встречные вопросы, выявляя слабые места в ментальной модели.',
    'features.collab.title': 'P2P Полотно',
    'features.collab.desc': 'Синхронизация совместной работы в реальном времени со скрытыми зеркальными курсорами.',

    // Products
    'products.title': 'Продукты компании',
    'products.subtitle': 'Экосистема прикладных решений PinkInAu',
    'products.learnos.badge': 'Флагманский продукт',
    'products.learnos.status': 'Доступно сейчас',
    'products.learnos.desc': 'Модульная операционная веб-среда для глубокого освоения сложных инженерных дисциплин.',
    'products.studio.title': 'PinkInAu Studio',
    'products.studio.desc': 'Среда верстки и дистрибуции интерактивных курсов и схем.',
    'products.core.title': 'PinkInAu Core',
    'products.core.desc': 'Инфраструктурный слой и распределенные сервисы платформы.',
    'products.labs.title': 'PinkInAu Labs',
    'products.labs.desc': 'R&D подразделение прототипирования интерфейсов и алгоритмов.',

    // OS Desktop UI
    'os.menu.apple': 'Learning OS',
    'os.menu.file': 'Файл',
    'os.menu.edit': 'Правка',
    'os.menu.view': 'Вид',
    'os.menu.window': 'Окно',
    'os.menu.help': 'Справка',
    'os.dock.dag': 'Граф обучения',
    'os.dock.blank': 'Чистый лист',
    'os.dock.sparring': 'ИИ Спарринг',
    'os.dock.collab': 'P2P Доска',
    'os.dock.portfolio': 'Портфолио',
    'os.dock.widgets': 'Виджеты',
    'os.dock.terminal': 'Терминал',
    'os.dock.admin': 'Консоль',
    'os.pomo.start': 'Старт фокуса',
    'os.pomo.stop': 'Пауза',
    'os.lang.select': 'Выбор языка',
    'os.search.placeholder': 'Поиск команды, модуля или окна...',
  },

  // --------------------------------------------------------------------------
  // 4. English (English)
  // --------------------------------------------------------------------------
  en: {
    // Navigation & Actions
    'app.title': 'Learning OS',
    'app.subtitle': 'Cognitive Learning Operating System',
    'nav.launch': 'Launch Learning OS',
    'nav.products': 'Products',
    'nav.about': 'About Company',
    'nav.principles': 'Principles',
    'nav.login': 'Sign In',
    'nav.startFree': 'Start Free',
    'nav.demo': 'Demo Desktop',
    'nav.logout': 'Sign Out',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',
    'nav.changelog': 'Changelog',

    // Landing Hero
    'hero.badge': 'PinkInAu Technologies • Digital Platforms',
    'hero.title': 'PinkInAu',
    'hero.subtitle': 'Building digital products and operating environments for the future',
    'hero.desc': 'A full-featured modular learning operating system with dynamic DAG trajectories, blind blank-page recall, and Socratic sparring.',
    'hero.cta.start': 'Launch Learning OS',
    'hero.cta.explore': 'Explore Products',

    // Landing Features
    'features.dag.title': 'DAG Trajectory',
    'features.dag.desc': 'Knowledge compiled as a directed acyclic graph, ensuring zero foundational gaps.',
    'features.blank.title': 'Blank Page Recall',
    'features.blank.desc': 'Rigorous assessment through active recall from memory with no multiple-choice illusions.',
    'features.sparring.title': 'Socratic Sparring',
    'features.sparring.desc': 'AI tutor asks counter-probing questions to reveal edge-case misconceptions.',
    'features.collab.title': 'P2P Collab Canvas',
    'features.collab.desc': 'Real-time collaborative whiteboard with mirrored cursor synchronization.',

    // Products
    'products.title': 'Company Products',
    'products.subtitle': 'The PinkInAu Digital Ecosystem',
    'products.learnos.badge': 'Flagship Product',
    'products.learnos.status': 'Live Now',
    'products.learnos.desc': 'Modular desktop learning environment for mastery of complex engineering disciplines.',
    'products.studio.title': 'PinkInAu Studio',
    'products.studio.desc': 'Interactive course authoring and visual schema compiler.',
    'products.core.title': 'PinkInAu Core',
    'products.core.desc': 'Infrastructure services, real-time sync, and secure API gateways.',
    'products.labs.title': 'PinkInAu Labs',
    'products.labs.desc': 'R&D division prototyping frontier interfaces and cognitive models.',

    // OS Desktop UI
    'os.menu.apple': 'Learning OS',
    'os.menu.file': 'File',
    'os.menu.edit': 'Edit',
    'os.menu.view': 'View',
    'os.menu.window': 'Window',
    'os.menu.help': 'Help',
    'os.dock.dag': 'Learning DAG',
    'os.dock.blank': 'Blank Page',
    'os.dock.sparring': 'AI Sparring',
    'os.dock.collab': 'Collab Canvas',
    'os.dock.portfolio': 'Portfolio',
    'os.dock.widgets': 'Widgets',
    'os.dock.terminal': 'Terminal',
    'os.dock.admin': 'Admin Console',
    'os.pomo.start': 'Start Focus',
    'os.pomo.stop': 'Pause',
    'os.lang.select': 'Select Language',
    'os.search.placeholder': 'Search command, module, or window...',
  },

  // --------------------------------------------------------------------------
  // 5. 日本語 (Japanese)
  // --------------------------------------------------------------------------
  ja: {
    // Navigation & Actions
    'app.title': 'Learning OS',
    'app.subtitle': '認知的学習オペレーティングシステム',
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

    // Landing Hero
    'hero.badge': 'PinkInAu Technologies • 次世代プラットフォーム',
    'hero.title': 'PinkInAu',
    'hero.subtitle': '人間の知性を拡張するデジタルプロダクトと動作環境を創造する',
    'hero.desc': 'DAGグラフによる体系的カリキュラム、白紙想起テスト、ソクラテス式AI対話を備えたモジュール型学習オペレーティングシステム。',
    'hero.cta.start': 'Learning OS を開く',
    'hero.cta.explore': '全プロダクトを見る',

    // Landing Features
    'features.dag.title': 'DAG学習軌道',
    'features.dag.desc': '知識を有向非巡回グラフとして体系化し、前提知識の抜け漏れをゼロにします。',
    'features.blank.title': '白紙想起モード',
    'features.blank.desc': '選択肢に頼らず、記憶から自分の言葉で論理を再構築する厳格な理解度検証。',
    'features.sparring.title': 'ソクラテス式対話',
    'features.sparring.desc': '答えを教えず、本質を突く問いかけによって深い思考力を引き出すAIスパーリング。',
    'features.collab.title': 'P2P コラボボード',
    'features.collab.desc': 'リアルタイムでカーソルと手書きボードを同期するペアワーク環境。',

    // Products
    'products.title': 'プロダクト一覧',
    'products.subtitle': 'PinkInAu デジタルエコシステム',
    'products.learnos.badge': 'フラッグシップ',
    'products.learnos.status': '公開中',
    'products.learnos.desc': '高度な工学・専門知識を深く習得するためのWebデスクトップ型学習環境。',
    'products.studio.title': 'PinkInAu Studio',
    'products.studio.desc': 'インタラクティブな教材とグラフ構造を作成・配信するスタジオ環境。',
    'products.core.title': 'PinkInAu Core',
    'products.core.desc': '安全な認証とリアルタイム通信を支えるバックエンド基盤。',
    'products.labs.title': 'PinkInAu Labs',
    'products.labs.desc': '新しいUI/UXと認知的アルゴリズムを研究開発する実験部門。',

    // OS Desktop UI
    'os.menu.apple': 'Learning OS',
    'os.menu.file': 'ファイル',
    'os.menu.edit': '編集',
    'os.menu.view': '表示',
    'os.menu.window': 'ウィンドウ',
    'os.menu.help': 'ヘルプ',
    'os.dock.dag': '学習DAG',
    'os.dock.blank': '白紙想起',
    'os.dock.sparring': 'AI対話',
    'os.dock.collab': '共有ボード',
    'os.dock.portfolio': 'ポートフォリオ',
    'os.dock.widgets': 'ウィジェット',
    'os.dock.terminal': 'ターミナル',
    'os.dock.admin': '管理コンソール',
    'os.pomo.start': '集中開始',
    'os.pomo.stop': '一時停止',
    'os.lang.select': '言語を選択',
    'os.search.placeholder': 'コマンド、モジュール、ウィンドウを検索...',
  },
};

// AI Language Directive mapping for Gemini
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
    // 1. Check local storage preference
    const saved = localStorage.getItem('pinkinau_lang') as SupportedLanguage;
    if (saved && (['kk', 'uk', 'ru', 'en', 'ja'] as SupportedLanguage[]).includes(saved)) {
      this.currentLanguage = saved;
      this.notify();
      return;
    }

    // 2. Auto-detect from IP and browser locale
    await this.detectLanguageFromEnvironment();
  }

  public async detectLanguageFromEnvironment(): Promise<SupportedLanguage> {
    if (this.isAutoDetected) return this.currentLanguage;

    try {
      // Fast server-side geo check
      const res = await fetch('/api/geo/lang', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        if (data?.lang && (['kk', 'uk', 'ru', 'en', 'ja'] as SupportedLanguage[]).includes(data.lang)) {
          this.setLanguage(data.lang, false);
          this.isAutoDetected = true;
          return data.lang;
        }
      }
    } catch {
      // fallback to browser locale
    }

    // Fallback: Browser navigator locale detection
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

// React Hook for seamless component integration
import { useState, useEffect } from 'react';

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
    setLanguage: (newLang: SupportedLanguage) => i18n.setLanguage(newLang),
    languages: SUPPORTED_LANGUAGES,
    aiDirective: i18n.getAiDirective(),
  };
}
