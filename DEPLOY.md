# Deploy: Next.js + Neon + Vercel

## 1. Create Neon database (free)

1. Go to https://neon.tech → New Project → "ukrexport"
2. Copy the **Connection string** (starts with `postgresql://...`)

## 2. Set up environment

```bash
cp .env.example .env.local
# Paste your Neon connection string into DATABASE_URL
```

## 3. Install & push schema

```bash
npm install
npx prisma db push
```

## 4. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

## 5. Seed demo data

After the app is running, call:
```
POST http://localhost:3000/api/seed
```
Or in browser: open DevTools → Console → run:
```js
fetch('/api/seed', { method: 'POST' }).then(r => r.json()).then(console.log)
```

## 6. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or push to GitHub → connect repo on vercel.com → add env vars:
- `DATABASE_URL` — Neon connection string
- `NEXTAUTH_SECRET` — run `openssl rand -base64 32`
- `NEXTAUTH_URL` — your Vercel domain (e.g. https://ukrexport.vercel.app)

Vercel auto-deploys on every push to main.

## Demo accounts (after seed)

| Role   | Email                        | Password  |
|--------|------------------------------|-----------|
| Buyer  | buyer@demo.com               | demo1234  |
| Vendor | agro-lviv@demo.com           | demo1234  |
| Vendor | metal-dnipro@demo.com        | demo1234  |

## Pages

| URL                          | Description                     |
|------------------------------|---------------------------------|
| `/`                          | Home / landing page             |
| `/manufacturers`             | Vendor grid with filters        |
| `/manufacturer/agro-lviv`   | Vendor profile with products    |
| `/rfq/new`                  | 3-step RFQ builder              |
| `/calculator`               | Import duty calculator          |
| `/dashboard`                | Buyer dashboard                 |

## API Routes

| Method | URL                                   | Description            |
|--------|---------------------------------------|------------------------|
| GET    | `/api/vendors`                        | List vendors           |
| GET    | `/api/vendors/:slug`                  | Vendor detail          |
| POST   | `/api/rfq`                            | Create RFQ             |
| GET    | `/api/rfq`                            | List RFQs              |
| GET    | `/api/compliance/hs-search?q=wheat`  | HS code search         |
| GET    | `/api/compliance/duty-estimate`       | Calculate duties       |
| POST   | `/api/seed`                           | Seed demo data         |
