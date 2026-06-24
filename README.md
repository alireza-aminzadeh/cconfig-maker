# V2Ray Config Maker

ابزار تک‌صفحه‌ای (Pure HTML/JS) برای ساخت، تست و مدیریت کانفیگ‌های **VMess** و **VLess** با IPهای Cloudflare.

## امکانات

### Config Maker
- پارس و تحلیل: **VMess · VLess · Trojan · Shadowsocks · Hysteria2 · Tuic**
- Import از **subscription** (Base64 decode + استخراج لینک‌ها)
- ویرایش فیلدها قبل از تولید (نام، پورت، host، path، SNI، **flow**)
- قالب نام‌گذاری: `{name}`, `{ip}`, `{index}`, `{port}`, `{latency}`
- گزینه **حفظ IP اصلی** در خروجی
- **Preset** و **History** کانفیگ (localStorage)
- تولید کانفیگ از رنج‌های Cloudflare یا ورودی دستی
- خروجی: TXT، CSV (با latency)، Subscription، QR، **Clash YAML**، **Sing-box JSON**
- Preview **Xray JSON** · تولید **Reality keys**
- دانلود خودکار (قابل غیرفعال‌سازی)

### مدیریت IP و تست تاخیر
- کتابخانه IP کلادفلر (رسمی، WARP، Clean، محبوب)
- لیست‌های شخصی (ذخیره در localStorage) — duplicate، undo حذف، import فایل/drag-drop
- **Blacklist** IPهای بد
- تست HTTP/HTTPS/TCP probe با URL قابل تنظیم (`{ip}` `{port}` `{path}` `{sni}`)
- **DNS resolve** دامنه‌ها (Cloudflare DoH)
- **Pipeline تست و تولید** · Pause/Resume · Retry · تخمین زمان
- فیلتر نتایج (تاخیر، فقط موفق) · نمودار توزیع latency
- خروجی TXT و CSV

### استخراج آدرس
- استخراج address یا **همه فیلدها** از چند کانفیگ
- Deduplicate بر اساس UUID · Diff · تبدیل VMess→VLess
- ارسال مستقیم به Config Maker

### UX
- تم **روشن/تاریک** · میانبر **Ctrl+Enter** · **PWA** (نصب آفلاین)
- جستجو در کانفیگ‌های تولیدشده · کپی فقط IPها

## اجرای محلی

فقط فایل `index.html` را در مرورگر باز کنید:

```bash
# Windows
start index.html

# یا با یک سرور ساده
npx serve .
```

> `index2.html` نسخه توسعه است؛ برای deploy از `index.html` استفاده می‌شود.

## Deploy روی GitHub Pages

### ۱. ساخت repository

```bash
git init
git add .
git commit -m "Initial commit: V2Ray Config Maker"
git branch -M main
git remote add origin https://github.com/YOUR_USER/cconfig-maker.git
git push -u origin main
```

### ۲. فعال‌سازی GitHub Pages

1. به **Settings → Pages** بروید
2. **Source**: `GitHub Actions` را انتخاب کنید
3. با push به `main`، workflow `.github/workflows/pages.yml` به‌صورت خودکار deploy می‌کند

آدرس نهایی:

```text
https://YOUR_USER.github.io/cconfig-maker/
```

### ۳. Custom domain (اختیاری)

فایل `CNAME` در root اضافه کنید:

```text
your-domain.com
```

## ساختار پروژه

```text
cconfig-maker/
├── index.html          # نسخه deploy (GitHub Pages)
├── index2.html         # نسخه توسعه (UI + منطق اصلی)
├── index2-features.js  # امکانات توسعه‌یافته
├── manifest.json       # PWA
├── sw.js               # Service Worker
├── .github/workflows/
│   └── pages.yml       # CI/CD برای GitHub Pages
├── .nojekyll           # جلوگیری از پردازش Jekyll
├── .gitignore
└── README.md
```

## نکات

- تمام داده‌ها در مرورگر (localStorage) ذخیره می‌شوند؛ سرور لازم نیست
- تست تاخیر از `fetch` با `no-cors` است و فقط دسترسی HTTP را می‌سنجد
- برای تست واقعی V2Ray/TLS به backend جداگانه نیاز است

## لایسنس

MIT
