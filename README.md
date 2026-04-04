# WhatsThatAI

A modern AI tools discovery app built with Next.js 14, Tailwind CSS, Framer Motion, React Three Fiber, and Prisma.

## What is configured

- Next.js app structure with Tailwind/PostCSS config
- Path aliases through `jsconfig.json`
- Prisma + SQLite database
- Seeded `Tool` records for local development
- Database-backed `/api/tools` route

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment variables:
   ```bash
   copy .env.example .env
   ```
3. Create the local database and Prisma client:
   ```bash
   npm run db:push
   npm run db:generate
   npm run db:seed
   ```
4. Start the app:
   ```bash
   npm run dev
   ```

## Environment variables

- `DATABASE_URL`: Prisma connection string. Local SQLite is configured by default.
- `OPENAI_API_KEY`: Optional for future video-analysis features.
- `NEXT_PUBLIC_APP_URL`: Public app URL for local or deployed environments.
