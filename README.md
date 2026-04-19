# THE EQUALS - Audit AI Platform (Production-Grade Prototype)

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
Refer to `.env.example`. This application requires a valid `NEXT_PUBLIC_GEMINI_API_KEY` to function alongside a standard Firebase Admin SDK matrix.

## Deployment Steps (Vercel)
1. Push to GitHub.
2. Import project in Vercel.
3. Configure all parameters outlined in `.env.example` in Vercel's Environment Variables panel.
4. Deploy.

## Live Demo
[Insert Production Vercel Link Here]
