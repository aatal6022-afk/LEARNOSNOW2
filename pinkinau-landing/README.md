# 🌸 PinkInAu Technologies — Corporate Landing & Subdomain Bundle

Этот репозиторий / папка `pinkinau-landing` содержит автономный, готовый к размещению на основном домене (например `pinkinau.space`) или поддомене лендинг компании **PinkInAu**.

## 🚀 Назначение:
- **О компании PinkInAu**: миссия, принципы и ценности.
- **Продуктовая экосистема**: 
  - ⭐ **Learning OS (Флагман)** — при клике перенаправляет пользователя на **`https://learn.pinkinau.space`**.
  - Epistemic Ledger (аналитика инвариантов).
  - Zero-Fluency Socratic Proctor (слепая проверка).
  - P2P Collab Canvas (совместный белый экран).
- **Безопасность**: Cloudflare Turnstile интеграция.

## 📦 Размещение на хостинге / Cloudflare / Vercel / Nginx:

### 1. Cloudflare Pages / Vercel / Netlify:
Просто укажите папку `pinkinau-landing` в качестве корневой директории (Root Directory) для вашего проекта на домене `pinkinau.space` или `about.pinkinau.space`.

### 2. Nginx конфигурация (пример):
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name pinkinau.space www.pinkinau.space;

    root /var/www/pinkinau-landing;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3. Docker / Caddy:
Файл `index.html` полностью самодостаточен и загружает Tailwind CSS и шрифты через защищенный CDN.
