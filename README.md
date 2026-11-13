<p align="center">
  <img src="public/images/logo-main.png" alt="Sango Information Hub (SIHU)" width="420" />
</p>

# Sango Information Hub (SIHU)

**We care about Lake Victoria.** SIHU is a community media and knowledge platform for environmental protection and development across the Lake Victoria Basin, based in Busia, Kenya. It brings together news, podcasts and events, the SIHU AI assistant, community media, the SIHU DApp, Play and Verify.

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

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Brand assets

- `public/images/logo-main.png`: the official SIHU wordmark, shown in the header and footer
- `public/images/logo-300x300.jpg`: the official SIH wave mark (source for the icons)
- `public/images/sihu-mark.png`, `public/icons/*`, `src/app/favicon.ico`, `src/app/icon.png`, `src/app/apple-icon.png`: icons generated from the wave mark
- `src/components/brand/SihuLogo.tsx`: use this component to show the logo in the UI

## Deployment

The site is hosted on Vercel. Add the environment variables above in the project settings before deploying.
