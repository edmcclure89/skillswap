# SkillSwap - Launch Guide

## You need: GitHub + Vercel + Supabase (all free)

---

## STEP 1: Set up Supabase database (5 min)

1. Go to supabase.com and open your project
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy everything from SUPABASE_SCHEMA.sql and paste it
5. Click "Run"
6. Done - your database is ready

---

## STEP 2: Push to GitHub (5 min)

1. Create a new repo on github.com (call it "skillswap")
2. Open Terminal on your computer and run:

```
git init
git add .
git commit -m "Initial SkillSwap launch"
git remote add origin https://github.com/YOUR_USERNAME/skillswap.git
git push -u origin main
```

---

## STEP 3: Deploy to Vercel (3 min)

1. Go to vercel.com
2. Click "Add New Project"
3. Import your skillswap GitHub repo
4. Click Deploy
5. Your app is live at skillswap.vercel.app

---

## STEP 4: Enable Google Login in Supabase (optional, 5 min)

1. Go to supabase.com > Authentication > Providers
2. Enable Google
3. Follow the instructions to add Google OAuth credentials

---

## You are live. Now go get users:

- Post on Reddit: r/Entrepreneur, r/sidehustle, r/frugal
- Post on LinkedIn with your story
- Post on X/Twitter
- Submit to Product Hunt

---

## File structure

```
skillswap/
  src/
    App.jsx          - Main app
    Auth.jsx         - Login and signup
    PostSkill.jsx    - Post a listing
    supabaseClient.js - Database connection
    index.js         - Entry point
  public/
    index.html
  package.json
  SUPABASE_SCHEMA.sql
```
