# V2Ray Config Maker

ابزار تک‌صفحه‌ای (Pure HTML/JS) برای ساخت، تست و مدیریت کانفیگ‌های **VMess** و **VLess**.

- **مخزن:** [github.com/alireza-aminzadeh/cconfig-maker](https://github.com/alireza-aminzadeh/cconfig-maker)
- **نسخه آنلاین:** [alireza-aminzadeh.github.io/cconfig-maker](https://alireza-aminzadeh.github.io/cconfig-maker/)

## امکانات

### Config Maker
- پارس و تولید **VMess** و **VLess**
- پروتکل‌ها: **tcp · ws · grpc · h2 · httpupgrade · xhttp**
- امنیت: **tls · xtls · reality**
- ویرایش فیلدها قبل از تولید
- قالب نام‌گذاری با شماره، آدرس و تشخیص کشور
- تولید از رنج‌های ثبت‌شده یا ورودی دستی
- خروجی TXT، کپی همه، و **QR**

### مدیریت IP و تست تاخیر
- کتابخانه Cloudflare (رسمی، WARP، Clean، محبوب)
- کتابخانه سایر CDNها: **Fastly · Amazon CloudFront · Google Cloud**
- لیست‌های شخصی (ذخیره در localStorage)
- تست HTTP با URL و timeout قابل تنظیم
- فیلتر نتایج و ارسال به Config Maker
- خروجی TXT

### استخراج آدرس
- استخراج address از چند کانفیگ VMess / VLess
- ارسال مستقیم به Config Maker

### UX
- تم **روشن/تاریک** · **PWA** (نصب آفلاین)

## اجرای محلی

فقط فایل `index.html` را در مرورگر باز کنید:

```bash
# Windows
start index.html

# یا با یک سرور ساده
npx serve .
```

## Deploy روی GitHub Pages

1. به **Settings → Pages** بروید
2. **Source**: `GitHub Actions` را انتخاب کنید
3. با push به `main`، workflow `.github/workflows/pages.yml` به‌صورت خودکار deploy می‌کند

آدرس نهایی:

```text
https://alireza-aminzadeh.github.io/cconfig-maker/
```

## ساختار پروژه

```text
cconfig-maker/
├── index.html          # برنامه (GitHub Pages)
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
