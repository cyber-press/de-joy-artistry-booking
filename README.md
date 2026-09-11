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

Import this repository into Vercel, Netlify or Cloudflare Pages. Use `npm run build` as the build command and `dist` as the output directory.

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
