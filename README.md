# THE EQUALS - Audit AI Platform (Production-Grade Prototype)

# 🧠 AUDIT AI — Real-Time Evaluation System

**Status: Production Ready** (Final UX Hardening & Logic Stabilization Complete)

---

A premium AI-powered due diligence platform designed specifically for founders. This system demonstrates production-level architecture patterns but is optimized for rapid evaluation and prototyping.

## Features
- **Dynamic Mentor Agents**: Launch specialized evaluations (Investor Lens, Tech Architect, Market Scout) customized through deep system instructions.
- **Dedicated Reporting Engine**: Structured historical reports summarizing complex "idea room" stress-tests.
- **Live Account Settings**: Real-time Firebase propagation for user preferences (Notifications, Integrations).
- **Self-Reflection AI Agent**: (Bonus) Embedded multi-step AI validation ensuring outputs are highly formatted and decisive.
- **Build-in-Public Hub**: (Bonus) Quick-generation metrics and social media sharing nodes.
- **AI Performance Tracking**: (Bonus) UI-based metrics for tokens tracking, latency, and request loops.

## Setup Instructions
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in your Firebase and AI Keys.
4. Run the development server using Turbopack:
   ```bash
   npm run dev
   ```

## Environment Variables
Refer to `.env.example`. For authentication to work in local and Vercel, set the full Firebase client set (`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`) and the Firebase Admin set (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).

## Deployment Steps (Vercel)
1. Push to GitHub.
2. Import project in Vercel.
3. Configure all parameters outlined in `.env.example` in Vercel's Environment Variables panel.
4. If you use a custom domain, add it in Firebase Console -> Authentication -> Settings -> Authorized domains.
5. Redeploy after any Vercel environment variable changes so the client bundle gets rebuilt with updated `NEXT_PUBLIC_*` values.

## Live Demo
[Insert Production Vercel Link Here]
