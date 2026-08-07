# Deploying CrediShield to Vercel

CrediShield is an AI-powered bank loan default risk and credit intelligence platform. Use this checklist for production deployment.

## Vercel CLI

```bash
npm install
npx prisma generate
vercel
vercel --prod
```

## Required Vercel environment variables

Set these in the Vercel project settings before production use:

- `DATABASE_URL`: Neon pooled PostgreSQL connection string.
- `GROQ_API_KEY`: Groq API key.

## Database migration

Run migrations against Neon before using the deployed app:

```bash
npx prisma migrate deploy
```

For local development, use:

```bash
npx prisma migrate dev
npm run seed
```
