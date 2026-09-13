# DE_JOY ARTISTRY Booking Site

A mobile-first luxury booking website for DE_JOY ARTISTRY in Abuja, Nigeria. Customers can select a service, nail shape, length, design style and preferred date. The site creates a formatted request and opens a direct WhatsApp conversation with Joy for availability and final pricing.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Deploy

This application must run as a **web service**, not a static site. The storefront, API, owner authentication, PostgreSQL migrations, product management, orders, and uploaded media are served together by Express.

For Render, create or sync the root `render.yaml` Blueprint. It provisions:

- the Docker web service;
- private PostgreSQL connectivity;
- a persistent product-media disk;
- health monitoring at `/api/health`;
- automatic deployment from `main`.

A static-only deployment can display the public interface, but it cannot provide persistent products, administrator login, uploads, or orders.

## WhatsApp booking

The production booking and floating chat actions use `+234 708 777 7511`. Update the `whatsappNumber` constant in `src/main.tsx` if the business number changes.

## Routes

- `/` executive landing page
- `/services` service and inspiration catalogue
- `/book` six-step booking configurator
- `/privacy` privacy notice
- `/terms` website terms

## Images

The live gallery uses remotely hosted editorial nail images. Before commercial launch, replace them with photos owned or licensed by DE_JOY ARTISTRY and store them under `public/images`.
