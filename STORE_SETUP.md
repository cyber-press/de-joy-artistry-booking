# DE_JOY self-hosted store

This repository contains the customer storefront, owner admin, API, PostgreSQL schema, and image storage. It uses a familiar Shopify-style catalogue/order workflow, but does not depend on Shopify, Supabase, or another hosted commerce backend.

## Owner-controlled features

- Products: create, edit, draft/publish/archive, categories, pricing, inventory and featured status.
- Media: upload multiple JPEG, PNG, WebP, or AVIF product images (8 MB each).
- Shopping: catalogue, product detail, persistent cart, checkout and stock-safe order creation.
- Orders: customer/contact/delivery details and fulfilment status management.
- Settings: announcement, contact details and offline payment instructions.
- Security: one-time owner creation, bcrypt passwords, database-backed sessions, secure cookies and same-origin mutation protection.

## Production deployment (owned infrastructure)

1. Install Docker Engine and Compose on a VPS controlled by PressCreates LLC.
2. Copy `.env.example` to `.env`. Set long, unrelated, random values for `POSTGRES_PASSWORD` (URL-safe) and `SETUP_TOKEN`.
3. Run `docker compose up -d --build`.
4. Put a TLS reverse proxy such as Caddy or Nginx in front of port 3000 and connect the production domain.
5. Visit `/admin` once, enter the setup token, and create the owner email/password. Once an owner exists, setup is permanently closed.
6. Open Store Settings and enter the final offline-payment instructions.

Back up both Docker volumes: `dejoy_database` contains customers/orders/catalogue, and `dejoy_uploads` contains product media. Keep `.env` and backups out of Git.

## Local development

Provide `DATABASE_URL`, `DATABASE_SSL=false`, and `SETUP_TOKEN`, then run `npm install` and `npm run dev`. Vite proxies API and upload requests to Express on port 3000.

## Payment boundary

Checkout records an order and reserves inventory. It does not charge a card. Bank-transfer or cash instructions are controlled from Admin → Settings.

## Ownership

The application-specific source, schema, interface, and deployment configuration are prepared for PressCreates LLC. Third-party packages, fonts, and photography retain their respective licences; replace remote stock photography with brand-owned/licensed assets before commercial launch if required.
