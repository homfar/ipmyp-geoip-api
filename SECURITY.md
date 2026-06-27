# Security Policy

## Secrets

Never commit `.env`, MaxMind credentials, Redis passwords, API keys, or production configuration files. Use `.env.example` as a public template only.

## Deployment

Run the API behind a trusted reverse proxy such as Nginx, Cloudflare, or ArvanCloud. Do not expose the Node.js container directly to the public internet unless you fully understand the risk.

## Trusted Proxy Headers

`TRUST_PROXY=false` is the secure default. Enable `TRUST_PROXY=true` only when the service is behind a trusted reverse proxy that correctly sets `X-Real-IP`, `X-Forwarded-For`, `CF-Connecting-IP`, or `AR-Real-IP`.

## JSONP

JSONP is disabled by default. Enable it only for legacy integrations and keep callback validation enabled.

## Batch Endpoint

Set `MAX_BATCH_SIZE` according to your infrastructure capacity. The default is intentionally conservative.
