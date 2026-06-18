# EduFlick AI Mentor — Vapi Voice AI Prototype
**Task 10 · Tomatrix Technologies Internship · June 2026**

A working Voice AI prototype that adds a live in-browser AI Mentor to the EduFlick learning platform, built with **Vapi** (WebRTC), **Next.js**, and **Supabase**.

---

## What This Does

Students on EduFlick's roadmap page can click a microphone button and have a **real two-way voice conversation** with an AI Mentor that knows:
- Their name
- Their current lesson and module
- Their learning track
- Their overall progress percentage

The AI Mentor answers questions, explains concepts, and guides the student — entirely in the browser, no phone call required.

---

## Demo Requirements Checklist (Task 10)

| Requirement | How it's met |
|---|---|
| ✅ Real voice exchange | Vapi WebRTC — two-way live audio in browser |
| ✅ EduFlick context | AI speaks as EduFlick Mentor; knows student's lesson, module, track |
| ✅ End-to-end flow | Connect → AI greets → student speaks → AI responds → session ends cleanly |
| ✅ Framework-specific feature | Vapi function calling: `/api/vapi/student-context` fetches live Supabase data mid-conversation |

---

## Tech Stack

```
Browser (Next.js + React)
    └── @vapi-ai/web SDK  ←→  Vapi Cloud (STT + LLM + TTS)
                                    ↕ webhook
              /api/vapi/student-context  →  Supabase (profiles, lesson_progress)
              /api/vapi/call-log         →  Supabase (call_logs, transcripts)
```

---

## Project Structure

```
eduflick-vapi-mentor/
├── components/
│   ├── MicrophoneButton.tsx   # Core voice UI — Vapi session lifecycle
│   └── StudentCard.tsx        # Student progress display
├── pages/
│   ├── _app.tsx               # Next.js app wrapper
│   ├── index.tsx              # Main roadmap page with AI Mentor
│   └── api/vapi/
│       ├── student-context.ts # Webhook: fetch student data for Vapi
│       └── call-log.ts        # Webhook: save transcript to Supabase
├── lib/
│   └── supabase.ts            # Supabase client setup
├── styles/
│   └── globals.css            # Global CSS variables + base styles
├── supabase-schema.sql        # Run once to create all DB tables
├── .env.local.example         # Environment variables template
└── README.md
```

---

## Setup Guide

### Step 1 — Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/eduflick-vapi-mentor
cd eduflick-vapi-mentor
npm install
```

### Step 2 — Create a Vapi account

1. Go to [vapi.ai](https://vapi.ai) and sign up (free — you get $10 in credits)
2. In the dashboard → **Account** → **API Keys**, copy your **Public Key**
3. Optionally create an Assistant in the dashboard and copy its **Assistant ID**
   - If you skip this, the app uses an inline assistant config (works fine for demo)

### Step 3 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project
2. In the dashboard → **SQL Editor** → paste and run `supabase-schema.sql`
3. Go to **Settings → API** and copy:
   - **Project URL**
   - **anon/public key**
   - **service_role key**

### Step 4 — Set environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_assistant_id   # optional
VAPI_SECRET_KEY=your_vapi_secret_key

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 5 — Configure Vapi webhooks

In your Vapi dashboard → **Assistant** → **Advanced** → **Server URL**, set:
```
https://your-deployed-url.vercel.app/api/vapi/student-context
```

For call logs, add a second webhook:
```
https://your-deployed-url.vercel.app/api/vapi/call-log
```

> **Local testing:** Use [ngrok](https://ngrok.com) to expose your local server:
> ```bash
> ngrok http 3000
> # Then set webhook to: https://your-ngrok-url.ngrok.io/api/vapi/student-context
> ```

### Step 6 — Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Running the Live Demo

1. Open the app in Chrome or Firefox
2. Click the **microphone button**
3. Allow microphone access when prompted
4. Wait 1–2 seconds for "Live" status
5. Say: *"Hi, can you explain neural networks to me?"*
6. The AI Mentor responds in real time
7. Click the **red button** to end the session

**What to show for Task 10 requirements:**
- **Real voice exchange:** Talk and hear the AI respond live
- **EduFlick context:** AI knows "Arjun", "Introduction to Neural Networks", "Module 3"
- **End-to-end flow:** Connect → greet → conversation → clean end
- **Vapi-specific feature:** Function calling — show the `/api/vapi/student-context` webhook fetching Supabase data mid-call

---

## Deploying to Vercel (for live demo URL)

```bash
npm install -g vercel
vercel
```

Add all `.env.local` variables in Vercel → Project → Settings → Environment Variables.

---

## Cost Estimate

| Component | Cost |
|---|---|
| Vapi voice calls | $0.13–0.25/min (covered by $10 free credit) |
| Supabase | Free tier (500MB DB, enough for demo) |
| Vercel hosting | Free hobby tier |
| **Demo total (5 min call)** | **~$0.65–$1.25** |

---

## Implementation Notes

### What worked well
- `@vapi-ai/web` SDK is extremely simple — `vapi.start()` and `vapi.stop()` handle everything
- Inline assistant config (no dashboard setup) works great for quick demos
- Vapi's `volume-level` event enables real-time visual feedback on the mic button
- `message` events with `transcript` type give live subtitles during the call

### What was tricky
- First call sometimes takes 2–3 seconds to connect — added a "Connecting…" state to manage user expectations
- Microphone permissions need to be requested before `vapi.start()` — handled automatically by the SDK
- The `NEXT_PUBLIC_` prefix is required for env vars used in browser code

### What we'd do differently
- Add proper Supabase auth so the student context is fetched from the real logged-in user
- Use Vapi Squads to hand off between a greeter agent and a subject-specialist agent
- Add Langfuse for call monitoring and prompt iteration tracking

---

## Framework-Specific Feature: Vapi Function Calling

The AI Mentor can call `get-student-context` mid-conversation, which triggers our `/api/vapi/student-context` webhook. This fetches the student's live Supabase data and injects it into the AI's context — so if a student's progress changes during a session, the AI always has up-to-date information.

This is **unique to Vapi** — other platforms require pre-loading all context at session start.

---

*Task 10 · Voice AI for EduFlick · Tomatrix Technologies · June 2026*
