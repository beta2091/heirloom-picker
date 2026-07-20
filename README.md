# Evenkeep

The fair, kind way for families to divide a loved one's belongings — divide what
matters with love and fairness.

## Tech Stack
- React + TypeScript (Vite)
- Express.js backend
- PostgreSQL (Drizzle ORM)
- Tailwind CSS + shadcn/ui

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set environment variables
Create a `.env` file:
```
DATABASE_URL=your_neon_postgres_url
OWNER_PASSWORD=your_secret_owner_password
```

### 3. Run database migrations
```bash
npm run db:push
```

### 4. Development
```bash
npm run dev
```

### 5. Build for production
```bash
npm run build
```

## Deployment (Vercel)

1. Push this repo to GitHub
2. Import the repo in Vercel
3. Add environment variables: `DATABASE_URL` and `OWNER_PASSWORD`
4. Deploy — Vercel auto-builds on every push

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (use Neon for free hosting) |
| `OWNER_PASSWORD` | Secret password for app owner bypass access |
| `SESSION_SECRET` | Signs organizer session cookies — set a long random value in production |
| `STRIPE_SECRET_KEY` | Enables per-estate billing. Omit to keep billing inert. |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhook signatures |
| `STRIPE_PRICE_ID` | Optional — a fixed Stripe Price to charge for activation |
| `STRIPE_ACTIVATION_AMOUNT` | Optional — inline activation amount in cents (default `9900`) |
| `BLOB_READ_WRITE_TOKEN` | Enables object storage for photos/audio (Vercel Blob). Omit to fall back to base64-in-DB. |

## Multi-tenancy

The app is multi-tenant: each **estate** is an isolated family draft, owned by an
**organizer** account (email/password, sign up at `/account`). Existing
single-family data is automatically migrated into a "default estate", so no
manual migration is needed. See [`MONETIZATION.md`](./MONETIZATION.md) for the
full release/monetization strategy and roadmap.
