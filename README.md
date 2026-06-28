# IPMYP GeoIP API | Self-hosted IP Geolocation API with Docker, Redis and MaxMind

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-rate%20limiting-DC382D?logo=redis&logoColor=white)
![MaxMind](https://img.shields.io/badge/MaxMind-GeoLite2-blue)
![License](https://img.shields.io/badge/License-MIT-green)

**IPMYP GeoIP API** is a lightweight, production-oriented, self-hosted IP geolocation microservice built with **Node.js**, **Express**, **Redis**, **Docker**, and **MaxMind GeoLite2**. It provides IP address lookup, domain-to-IP resolution, GeoIP location data, ASN/ISP details, Redis-backed rate limiting, health checks, readiness checks, controlled CORS, optional whitelist protection, and batch lookup support.

This repository can be used as a deployable infrastructure component for IP lookup platforms, network tools, monitoring systems, security dashboards, SaaS products, and internal automation services.

---

## Language / زبان

- [English Documentation](#english-documentation)
- [مستندات فارسی](#مستندات-فارسی)

---

# English Documentation

## Overview

IPMYP GeoIP API is a **self-hosted GeoIP API** for developers, DevOps engineers, network administrators, SaaS teams, and infrastructure platforms that need fast IP geolocation lookup without depending on an external public API for every request.

The service accepts an IP address, a domain name, or the current client request, resolves the target to an IP address when needed, and returns a structured JSON response containing country, region, city, latitude, longitude, timezone, ISP, organization, ASN, and related metadata.

For a public web-based IP lookup experience, visit [IPMYP.com](https://ipmyp.com/) — an online IP lookup and network tools platform.

## Features

- **IP geolocation lookup** for IPv4 and IPv6 addresses
- **Current client IP detection** through `/json`
- **Domain-to-IP resolution** before GeoIP lookup
- **ASN and ISP lookup** using MaxMind GeoLite2 ASN
- **City, country, region, timezone and coordinates** using MaxMind GeoLite2 City
- **Batch lookup endpoint** with configurable maximum batch size
- **Redis-backed rate limiting** with in-memory fallback
- **Per-IP rate limit override support** for trusted clients
- **Health and readiness endpoints** for Docker, monitoring and orchestration
- **Secure-by-default JSONP handling** with JSONP disabled unless explicitly enabled
- **Controlled CORS** for browser-based integrations
- **Origin and IP whitelist support** for restricted deployments
- **Production-friendly Docker and Docker Compose setup**
- **Non-root container user**
- **Structured JSON logs**
- **Reverse proxy ready** for Nginx, Cloudflare, ArvanCloud or similar edge services
- **GitHub Actions CI workflow** for syntax checks and Docker build validation

## Architecture

```text
Client / Browser / Internal Service
        |
        v
Reverse Proxy / CDN / Load Balancer
Nginx, Cloudflare, ArvanCloud, Traefik, HAProxy
        |
        v
IPMYP GeoIP API - Node.js / Express
        |
        +--> Redis - rate limiting backend
        |
        +--> MaxMind GeoLite2 City database
        |
        +--> MaxMind GeoLite2 ASN database
```

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| HTTP Framework | Express.js |
| Rate Limiting | Redis + in-memory fallback |
| GeoIP Database | MaxMind GeoLite2 City |
| ASN Database | MaxMind GeoLite2 ASN |
| Containerization | Docker |
| Local/Production Runtime | Docker Compose |
| CI | GitHub Actions |

## API Endpoints

### Health Check

```http
GET /health
GET /v1/health
```

Example response:

```json
{
  "status": "ok",
  "service": "ipmyp-geoip-api",
  "env": "production",
  "geoip": "loaded",
  "uptime": 120
}
```

### Readiness Check

```http
GET /ready
GET /v1/ready
```

Example response:

```json
{
  "status": "ready",
  "service": "ipmyp-geoip-api",
  "geoip": "loaded",
  "redis": "connected"
}
```

Use readiness checks for monitoring systems, container orchestration, reverse proxy upstream validation, and deployment automation.

### Lookup Current Client IP

```http
GET /json
```

This endpoint returns GeoIP information for the detected client IP address.

> Important: client IP headers are trusted only when `TRUST_PROXY=true`. Keep it disabled when the service is directly exposed to the internet.

### Lookup Specific IP Address

```http
GET /json/8.8.8.8
```

Example response:

```json
{
  "status": "success",
  "continent": "North America",
  "continentCode": "NA",
  "country": "United States",
  "countryCode": "US",
  "region": null,
  "regionName": null,
  "city": null,
  "district": null,
  "zip": null,
  "lat": 37.751,
  "lon": -97.822,
  "timezone": "America/Chicago",
  "offset": null,
  "currency": null,
  "isp": "Google LLC",
  "org": "Google LLC",
  "as": "AS15169 Google LLC",
  "asname": "Google LLC",
  "reverse": null,
  "mobile": false,
  "proxy": false,
  "hosting": false,
  "query": "8.8.8.8"
}
```

### Lookup Domain Name

```http
GET /json/example.com
```

The service resolves the domain with DNS first and then runs GeoIP lookup against the resolved IP address.

### Filter Response Fields

```http
GET /json/8.8.8.8?fields=status,country,countryCode,isp,as,query
```

Example response:

```json
{
  "status": "success",
  "country": "United States",
  "countryCode": "US",
  "isp": "Google LLC",
  "as": "AS15169 Google LLC",
  "query": "8.8.8.8"
}
```

### Batch Lookup

```http
POST /batch
Content-Type: application/json

[
  "8.8.8.8",
  "1.1.1.1",
  { "query": "example.com" }
]
```

`MAX_BATCH_SIZE` controls the maximum number of items per request. The default is `50`.

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/homfar/ipmyp-geoip-api.git
cd ipmyp-geoip-api
```

### 2. Create Environment File

```bash
cp .env.example .env
nano .env
```

Set your MaxMind credentials:

```env
MAXMIND_ACCOUNT_ID=your_maxmind_account_id
MAXMIND_LICENSE_KEY=your_maxmind_license_key
```

### 3. Start with Docker Compose

The `geolite2` package downloads MaxMind databases during dependency installation. Docker Compose passes MaxMind values from `.env` as build arguments. Keep them in `.env` locally and in encrypted CI/CD secrets in production pipelines.

```bash
docker compose up -d --build
```

### 4. Test the API

```bash
curl http://127.0.0.1:3010/health
curl http://127.0.0.1:3010/ready
curl http://127.0.0.1:3010/json/8.8.8.8
```

## Production Deployment

### Recommended Production Pattern

Do not expose the Node.js container directly to the public internet. Bind it to localhost and place Nginx, Cloudflare, ArvanCloud, Traefik, HAProxy, or another trusted reverse proxy in front of it.

The provided `docker-compose.yml` binds the API to localhost by default:

```yaml
ports:
  - "127.0.0.1:${PORT:-3010}:3010"
```

### Production Compose

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Nginx Reverse Proxy Example

A sample Nginx configuration is available in:

```text
docs/nginx.example.conf
```

Basic example:

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

When running behind a trusted reverse proxy, set:

```env
TRUST_PROXY=true
```

When directly exposed to the internet, keep:

```env
TRUST_PROXY=false
```

## Environment Variables

| Variable | Default | Description |
|---|---:|---|
| `NODE_ENV` | `production` | Runtime environment |
| `PORT` | `3010` | API listen port inside the container |
| `SERVICE_NAME` | `ipmyp-geoip-api` | Service name in logs and health responses |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |
| `RATE_LIMIT_WINDOW_SEC` | `60` | Rate limit window in seconds |
| `RATE_LIMIT_MAX_REQUESTS` | `45` | Maximum requests per window |
| `MAX_BATCH_SIZE` | `50` | Maximum items allowed in `/batch` |
| `TRUST_PROXY` | `false` | Trust reverse proxy IP headers |
| `ORIGIN_WHITELIST` | empty | Comma-separated allowed hostnames |
| `IP_WHITELIST` | empty | Comma-separated exact IP allowlist |
| `CORS_ALLOWED_ORIGINS` | IPMYP domains | Comma-separated allowed browser origins |
| `JSONP_ENABLED` | `false` | Enable JSONP support for legacy integrations |
| `MAXMIND_ACCOUNT_ID` | required | MaxMind account ID |
| `MAXMIND_LICENSE_KEY` | required | MaxMind license key |

## Rate Limiting

The API uses Redis for distributed rate limiting and falls back to an in-memory store if Redis is temporarily unavailable.

Default behavior:

```env
RATE_LIMIT_WINDOW_SEC=60
RATE_LIMIT_MAX_REQUESTS=45
```

Response headers:

```text
X-Rl: remaining requests
X-Ttl: seconds until reset
X-Limit-Max: configured request limit
X-Limit-Window: configured window in seconds
X-RateLimit-Backend: redis or memory
```

Per-IP exact overrides can be configured in:

```text
src/rateLimitConfig.js
```

Example:

```js
perIP: {
  '203.0.113.10': { max: 1200, windowSec: 60 },
}
```

## Security Notes

- The container runs as a non-root user.
- `TRUST_PROXY=false` is the secure default.
- JSONP is disabled by default.
- JSONP callback names are validated when JSONP is enabled.
- `/batch` is limited by `MAX_BATCH_SIZE`.
- CORS is explicit and not wildcard by default.
- The API should run behind a trusted reverse proxy in production.

## Roadmap

- Prometheus `/metrics` endpoint
- CIDR-based allowlist and rate limit policies
- API key authentication
- OpenAPI/Swagger documentation
- Kubernetes manifests
- Helm chart
- Multi-stage Docker image with pinned dependencies
- Automated image publishing to GitHub Container Registry

## Related Platform

This API can be used as a backend building block for IP lookup, network diagnostics, infrastructure monitoring, and SaaS network tools. For a public web interface and more network utilities, visit [IPMYP.com](https://ipmyp.com/).

---

# مستندات فارسی

## معرفی پروژه

**IPMYP GeoIP API** یک سرویس سبک، سریع و قابل استقرار برای **تشخیص موقعیت IP، کشور، شهر، ISP، سازمان و ASN** است که با **Node.js، Express، Redis، Docker و MaxMind GeoLite2** ساخته شده است.

این پروژه برای استفاده در ابزارهای شبکه، سایت‌های بررسی IP، داشبوردهای امنیتی، سیستم‌های مانیتورینگ، سرویس‌های SaaS، پروژه‌های DevOps و APIهای داخلی بسیار مناسب است. هدف اصلی آن این است که بدون وابستگی مداوم به APIهای خارجی، بتوانید یک **GeoIP API اختصاصی، Self-hosted و قابل کنترل** داشته باشید.

برای استفاده آنلاین از ابزار بررسی IP و ابزارهای شبکه، می‌توانید به [IPMYP.ir](https://ipmyp.ir/) مراجعه کنید.

## این پروژه دقیقاً چه کاری انجام می‌دهد؟

این سرویس یک IP، دامنه یا IP واقعی درخواست‌دهنده را دریافت می‌کند، در صورت نیاز دامنه را به IP تبدیل می‌کند، سپس با دیتابیس‌های MaxMind GeoLite2 اطلاعات جغرافیایی و ASN را استخراج می‌کند و خروجی JSON استاندارد برمی‌گرداند.

کاربردهای اصلی:

- نمایش IP فعلی کاربر
- تشخیص کشور و شهر IP
- تشخیص ISP و سازمان مالک IP
- بررسی ASN
- استفاده در ابزارهای شبکه
- استفاده در سیستم‌های مانیتورینگ و گزارش‌گیری
- استفاده به‌عنوان microservice در معماری SaaS
- جایگزین self-hosted برای APIهای عمومی GeoIP

## امکانات اصلی

- بررسی موقعیت IP برای IPv4 و IPv6
- تشخیص IP فعلی کاربر با endpoint `/json`
- تبدیل دامنه به IP و سپس انجام GeoIP lookup
- دریافت اطلاعات کشور، شهر، منطقه، مختصات و timezone
- دریافت اطلاعات ISP، سازمان و ASN
- endpoint گروهی `/batch`
- محدودیت تعداد آیتم‌های batch با `MAX_BATCH_SIZE`
- Rate Limit مبتنی بر Redis
- fallback داخلی در صورت قطعی Redis
- پشتیبانی از rate limit اختصاصی برای IPهای خاص
- endpointهای Health و Readiness برای مانیتورینگ و Docker
- CORS کنترل‌شده و امن
- Whitelist بر اساس IP یا Origin/Referer
- JSONP غیرفعال به‌صورت پیش‌فرض
- اعتبارسنجی callback در صورت فعال‌سازی JSONP
- Docker و Docker Compose آماده استفاده
- اجرای container با user غیر root
- لاگ‌های ساختاریافته JSON
- آماده استقرار پشت Nginx، Cloudflare، ArvanCloud، Traefik یا HAProxy
- GitHub Actions برای بررسی syntax و build Docker

## معماری پروژه

```text
کاربر / مرورگر / سرویس داخلی
        |
        v
Reverse Proxy / CDN / Load Balancer
Nginx, Cloudflare, ArvanCloud, Traefik, HAProxy
        |
        v
IPMYP GeoIP API - Node.js / Express
        |
        +--> Redis برای Rate Limit
        |
        +--> دیتابیس MaxMind GeoLite2 City
        |
        +--> دیتابیس MaxMind GeoLite2 ASN
```

## تکنولوژی‌های استفاده‌شده

| بخش | تکنولوژی |
|---|---|
| Runtime | Node.js 20+ |
| HTTP Framework | Express.js |
| Rate Limit | Redis + fallback داخلی |
| دیتابیس GeoIP | MaxMind GeoLite2 City |
| دیتابیس ASN | MaxMind GeoLite2 ASN |
| Container | Docker |
| اجرای محلی/Production | Docker Compose |
| CI | GitHub Actions |

## مسیرهای API

### بررسی سلامت سرویس

```http
GET /health
GET /v1/health
```

نمونه خروجی:

```json
{
  "status": "ok",
  "service": "ipmyp-geoip-api",
  "env": "production",
  "geoip": "loaded",
  "uptime": 120
}
```

### بررسی آماده بودن سرویس

```http
GET /ready
GET /v1/ready
```

نمونه خروجی:

```json
{
  "status": "ready",
  "service": "ipmyp-geoip-api",
  "geoip": "loaded",
  "redis": "connected"
}
```

از این endpointها می‌توان برای Docker Healthcheck، مانیتورینگ، Load Balancer و بررسی وضعیت سرویس استفاده کرد.

### بررسی IP فعلی کاربر

```http
GET /json
```

این مسیر اطلاعات GeoIP مربوط به IP درخواست‌دهنده را برمی‌گرداند.

نکته مهم: هدرهایی مثل `X-Forwarded-For` فقط وقتی معتبر در نظر گرفته می‌شوند که `TRUST_PROXY=true` باشد. اگر سرویس مستقیم روی اینترنت باز است، این گزینه باید `false` بماند.

### بررسی یک IP مشخص

```http
GET /json/8.8.8.8
```

### بررسی یک دامنه

```http
GET /json/example.com
```

در این حالت ابتدا دامنه با DNS به IP تبدیل می‌شود و سپس بررسی GeoIP انجام می‌شود.

### انتخاب فیلدهای خروجی

```http
GET /json/8.8.8.8?fields=status,country,countryCode,isp,as,query
```

نمونه خروجی:

```json
{
  "status": "success",
  "country": "United States",
  "countryCode": "US",
  "isp": "Google LLC",
  "as": "AS15169 Google LLC",
  "query": "8.8.8.8"
}
```

### بررسی گروهی IP و دامنه

```http
POST /batch
Content-Type: application/json

[
  "8.8.8.8",
  "1.1.1.1",
  { "query": "example.com" }
]
```

حداکثر تعداد آیتم‌ها با متغیر زیر کنترل می‌شود:

```env
MAX_BATCH_SIZE=50
```

## نصب و راه‌اندازی سریع

### 1. دریافت پروژه

```bash
git clone https://github.com/homfar/ipmyp-geoip-api.git
cd ipmyp-geoip-api
```

### 2. ساخت فایل تنظیمات

```bash
cp .env.example .env
nano .env
```

اطلاعات MaxMind را وارد کنید:

```env
MAXMIND_ACCOUNT_ID=your_maxmind_account_id
MAXMIND_LICENSE_KEY=your_maxmind_license_key
```

### 3. اجرای پروژه با Docker Compose

پکیج `geolite2` دیتابیس‌های MaxMind را هنگام نصب dependencyها دانلود می‌کند. Docker Compose مقدارهای MaxMind را از `.env` به‌صورت build argument به Dockerfile می‌دهد. این مقدارها را در پروژه عمومی commit نکنید و برای CI/CD از secretهای امن استفاده کنید.

```bash
docker compose up -d --build
```

### 4. تست سرویس

```bash
curl http://127.0.0.1:3010/health
curl http://127.0.0.1:3010/ready
curl http://127.0.0.1:3010/json/8.8.8.8
```

## استقرار Production

### الگوی پیشنهادی Production

در محیط Production بهتر است container نود مستقیم روی اینترنت باز نباشد. سرویس را روی `127.0.0.1` bind کنید و جلوی آن Nginx، Cloudflare، ArvanCloud، Traefik یا HAProxy قرار دهید.

در فایل compose فعلی، پورت به localhost محدود شده است:

```yaml
ports:
  - "127.0.0.1:${PORT:-3010}:3010"
```

### اجرای نسخه Production

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### نمونه تنظیم Nginx

فایل نمونه در مسیر زیر قرار دارد:

```text
docs/nginx.example.conf
```

نمونه ساده:

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

اگر پشت reverse proxy مطمئن اجرا می‌کنید:

```env
TRUST_PROXY=true
```

اگر سرویس مستقیم روی اینترنت باز است:

```env
TRUST_PROXY=false
```

## متغیرهای محیطی

| متغیر | مقدار پیش‌فرض | توضیح |
|---|---:|---|
| `NODE_ENV` | `production` | محیط اجرا |
| `PORT` | `3010` | پورت داخلی API |
| `SERVICE_NAME` | `ipmyp-geoip-api` | نام سرویس در لاگ و health check |
| `REDIS_URL` | `redis://redis:6379` | آدرس Redis |
| `RATE_LIMIT_WINDOW_SEC` | `60` | بازه زمانی Rate Limit برحسب ثانیه |
| `RATE_LIMIT_MAX_REQUESTS` | `45` | تعداد مجاز درخواست در هر بازه |
| `MAX_BATCH_SIZE` | `50` | حداکثر تعداد آیتم در `/batch` |
| `TRUST_PROXY` | `false` | اعتماد به هدرهای reverse proxy |
| `ORIGIN_WHITELIST` | خالی | لیست hostnameهای مجاز |
| `IP_WHITELIST` | خالی | لیست IPهای مجاز به‌صورت exact match |
| `CORS_ALLOWED_ORIGINS` | دامنه‌های IPMYP | Originهای مجاز برای مرورگر |
| `JSONP_ENABLED` | `false` | فعال‌سازی JSONP برای سیستم‌های قدیمی |
| `MAXMIND_ACCOUNT_ID` | ضروری | Account ID مکس‌مایند |
| `MAXMIND_LICENSE_KEY` | ضروری | License Key مکس‌مایند |

## Rate Limit

Rate Limit با Redis انجام می‌شود. اگر Redis موقتاً در دسترس نباشد، سرویس از حافظه داخلی استفاده می‌کند.

تنظیم پیش‌فرض:

```env
RATE_LIMIT_WINDOW_SEC=60
RATE_LIMIT_MAX_REQUESTS=45
```

هدرهای خروجی:

```text
X-Rl: تعداد درخواست باقی‌مانده
X-Ttl: زمان باقی‌مانده تا ریست شدن محدودیت
X-Limit-Max: سقف درخواست
X-Limit-Window: طول بازه زمانی
X-RateLimit-Backend: redis یا memory
```

برای تعریف Rate Limit اختصاصی برای یک IP، فایل زیر را ویرایش کنید:

```text
src/rateLimitConfig.js
```

مثال:

```js
perIP: {
  '203.0.113.10': { max: 1200, windowSec: 60 },
}
```

## نکات امنیتی مهم

- container با user غیر root اجرا می‌شود.
- `TRUST_PROXY=false` مقدار امن پیش‌فرض است.
- JSONP به‌صورت پیش‌فرض غیرفعال است.
- در صورت فعال‌سازی JSONP، callback اعتبارسنجی می‌شود.
- endpoint گروهی `/batch` با `MAX_BATCH_SIZE` محدود شده است.
- CORS به‌صورت wildcard نیست و فقط برای originهای مشخص فعال می‌شود.
- برای Production بهتر است سرویس پشت reverse proxy معتبر اجرا شود.

## مسیر توسعه

- افزودن endpoint متریک Prometheus با مسیر `/metrics`
- پشتیبانی از CIDR در whitelist و rate limit
- افزودن API Key یا HMAC authentication
- مستندات OpenAPI/Swagger
- manifestهای Kubernetes
- Helm Chart
- build و publish خودکار Docker image در GitHub Container Registry
- داشبورد Grafana برای نرخ درخواست، خطاها و latency

## ارتباط با IPMYP

این API می‌تواند به‌عنوان microservice بک‌اند برای ابزارهای بررسی IP، ابزارهای شبکه، مانیتورینگ و سرویس‌های SaaS استفاده شود. برای نسخه آنلاین فارسی و ابزارهای مرتبط، به [IPMYP.ir](https://ipmyp.ir/) مراجعه کنید.

---

## License

This project is released under the MIT License. See [LICENSE](LICENSE) for details.
