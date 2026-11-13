This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Supabase Setup

This project uses Supabase for backend services. To set it up:

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Wait for the database to be set up

### 2. Get Your Project Credentials
1. Go to your project's API settings
2. Copy your Project URL and anon/public key

### 3. Set Up Environment Variables
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
AI_SETTINGS_SECRET=strong_secret_used_for_encrypting_ai_keys
```

For Vercel hosting, add the same variables in your Vercel project settings so production metadata and Supabase requests resolve correctly.

### 4. Set Up Database Schema
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the SQL commands from `supabase-schema.sql` to create tables and policies

### 5. Optional: Migrate Existing Data
If you want to migrate your current localStorage data to Supabase, you can use the admin panel to import articles, podcasts, and events.

## SIHU Agent Hosting

SIHU Agent now runs inside the Next.js app through server-side route handlers and `src/lib/agent/*`.

That means:
- no separate Python hosting is required
- Vercel can host the chat UI and the retrieval-first agent together
- Supabase stores articles, chat history, knowledge, and encrypted AI gateway settings

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
