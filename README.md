# DE_JOY ARTISTRY Booking Site

A mobile-first booking enquiry website for DE_JOY ARTISTRY in Abuja, Nigeria. Customers can select a service, nail shape, length, design style and preferred date. The site creates a formatted booking request that can be copied and sent to Joy AD on WhatsApp for availability and final pricing.

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

## Add direct WhatsApp chat later

WhatsApp direct links require the business phone number in international format. Once available, the copy button can be replaced with a `https://wa.me/NUMBER?text=...` link. Until then, the site copies the complete request so the customer can paste it into the Joy AD chat.

## Images

The live gallery uses remotely hosted editorial nail images. Before commercial launch, replace them with photos owned or licensed by DE_JOY ARTISTRY and store them under `public/images`.
