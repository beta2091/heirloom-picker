# Heirloom Picker

A fair family inheritance draft app — divide belongings with love and fairness.

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
