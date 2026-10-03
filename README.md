<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Learning OS — Инструкция по деплою на Vercel

Полнофункциональная платформа адаптивного обучения (Vite React SPA + Serverless API на Express).

---

## 🚀 Пошаговый деплой на Vercel

### Шаг 1. Импорт репозитория в Vercel
1. Загрузите код проекта в свой GitHub / GitLab / Bitbucket.
2. Перейдите в [vercel.com/new](https://vercel.com/new) и выберите ваш репозиторий.
3. Vercel автоматически считает настройки из готового файла `vercel.json`:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

---

### Шаг 2. Добавление переменных окружения (Environment Variables)

В панели настройки проекта перед нажатием **Deploy** (или в разделе **Settings → Environment Variables**) добавьте следующие переменные:

#### 1. Основной ИИ-движок (Обязательно)
| Имя переменной | Значение / Описание |
| :--- | :--- |
| `GEMINI_API_KEY` | Ваш API-ключ Google AI Studio ([получить бесплатно в aistudio.google.com](https://aistudio.google.com/app/apikey)) |
| `GEMINI_MODEL` | `gemini-3.8-flash` (по умолчанию, высокая скорость) |

#### 2. База данных Firebase & Авторизация
Конфигурация уже встроена в `firebase-applet-config.json`, но при необходимости переопределения на собственный проект Firebase добавьте:
| Имя переменной | Значение |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | API-ключ веб-приложения Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project-id.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ID вашего проекта Firebase |
| `VITE_FIREBASE_APP_ID` | `1:xxx:web:xxx` |
| `VITE_FIREBASE_DATABASE_ID` | ID базы Firestore (по умолчанию `(default)`) |

#### 3. Академические парсеры (Опционально)
| Имя переменной | Описание |
| :--- | :--- |
| `OPENALEX_API_KEY` | Опциональный ключ OpenAlex для ускоренного парсинга научных статей |
| `APIFY_API_TOKEN` | Опциональный токен Apify для глубокого скрейпинга Wikibooks |

---

### Шаг 3. Деплой
1. Нажмите **Deploy**.
2. Vercel соберет фронтенд и поднимет Serverless API роуты (`/api/*`).
3. Приложение будет доступно по вашему домену `https://your-project.vercel.app`.

---

## 📚 Гарантия честности парсинга учебников (No-Hallucination)

1. **Реальные парсеры**: При запросе литературы система в реальном времени обращается к открытым академическим библиотекам: **OpenAlex, Crossref, DOAB, OpenStax, Wikibooks**.
2. **Запрет на выдумку**: Если по узкой теме в открытых базах учебников не найдено, ИИ-тьютор **прямо сообщает об этом** и предлагает обратиться к официальной технической документации, полностью исключая галлюцинации и вымышленные книги.

