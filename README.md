# Vyoma OTT Platform

> **Enterprise-grade Digital Sanskrit Learning & Over-The-Top (OTT) Streaming Architecture.**

Vyoma OTT is a modern, full-stack digital streaming and curriculum platform built on **Next.js 16 (App Router)**, **React 19**, **Prisma ORM**, and **PostgreSQL (AWS RDS)**. It delivers multi-format educational content—including 4K video lectures, interactive audiobooks, podcasts, e-books, and gamified learning activities—to global Sanskrit seekers.

---

## 🌟 Key Architecture & Capabilities

### 1. Multi-Format OTT Streaming Engine
* **Cinematic Video & Audio Players**: HLS video streaming with adaptive bitrate, deep-link timestamp routing (`?t=1m30s`), and interactive chapter navigation.
* **Granular Multi-Format Media**: Native support for Videos, Audiobooks, Podcasts, E-Books, and interactive HTML5 Sanskrit learning games.
* **Offline Downloads Manager**: In-browser client storage leveraging IndexedDB and Service Workers with server-side SSRF-protected media proxies.

### 2. Enterprise Security & Cryptographic Access Control
* **HMAC-SHA256 Signed Sessions**: Stateless HTTP-Only session cookies with timing-safe comparison (`crypto.timingSafeEqual`) to eliminate identity spoofing and timing attacks.
* **Role-Based Access Control (RBAC)**: Strict server-side route guards for `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `FINANCE`, and `USER` tiers.
* **Multi-Format Password Verification**: Salted scrypt password hashing with transparent runtime auto-upgrade for legacy SHA-256 and MD5 hashes.
* **Rate Limiting & Spam Shields**: In-memory login attempt throttling and anti-farming referral reward caps.

### 3. Monetization & Subscription Orchestration
* **Razorpay Subscriptions & One-Time Purchases**: Automated recurring subscription billing (Gold, Platinum tiers) and single-course lifetime passes.
* **Cryptographic Webhook Ingestion**: HMAC SHA-256 signature verification with idempotency protection against duplicate event delivery.
* **Multi-Currency Dynamic Geo-Pricing**: Automatic INR and USD currency mapping based on edge geolocation.

### 4. AI-Powered Knowledge Retrieval Engine
* **Context-Aware AI Chatbot**: Built-in conversational tutor powered by Google Gemini with multi-factor course search and contextual FAQ troubleshooting.
* **Live System Settings**: Dynamic administrative runtime toggles for AI models, system prompts, and custom directives stored in PostgreSQL.

### 5. Gamification & Community
* **Scholar Streaks & Coin Rewards**: Automated coin wallet rewarding video completions, profile updates, and quiz milestones.
* **Multiplayer Study Rooms & Cohort Indicators**: Live room presence and collaborative study notes.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Turbopack / Webpack) |
| **UI Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) on AWS RDS via [Prisma ORM 6](https://www.prisma.io/) |
| **Payment Gateway** | [Razorpay](https://razorpay.com/) Node.js SDK & Webhooks |
| **AI Engine** | [Google GenAI SDK](https://github.com/google-gemini/generative-ai-js) (Gemini Models) |
| **Search Engine** | [Meilisearch](https://www.meilisearch.com/) |
| **Email & Push** | Nodemailer (SMTP) & Web Push (VAPID) |
| **Icons & Design** | Lucide React, Glassmorphic CSS design system with Sanskrit Saffron palette |

---

## 📁 Repository Structure

```
vyoma-ott/
├── prisma/
│   └── schema.prisma             # PostgreSQL schema definition & models
├── public/                       # Static public assets, PWA icons, offline SW
├── scripts/
│   ├── debug/                    # Isolated administrative utilities & diagnostics
│   └── ...                       # Database migration and synchronization scripts
├── src/
│   ├── app/                      # Next.js App Router (pages, layouts, API routes)
│   │   ├── actions/              # Server Actions (auth, ott, plans, ai-agent, etc.)
│   │   ├── admin/                # Secure administrative dashboard & management panels
│   │   ├── api/                  # RESTful API endpoints & Webhooks
│   │   ├── watch/[id]/           # Main OTT video/curriculum player page
│   │   └── ...                   # Explore, profile, courses, and auth views
│   ├── components/               # Reusable React UI components
│   └── lib/                      # Core backend libraries (auth, prisma, mail, razorpay)
├── .env.example                  # Environment configuration template
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies & scripts
└── tsconfig.json                 # TypeScript strict compiler options
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v20.x` or higher
* **npm** or **pnpm**
* **PostgreSQL Database**: Local or hosted (AWS RDS recommended)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Vyoma-Linguistic-Labs-Foundation/vyoma-ott-platform.git
cd vyoma-ott-platform
npm install
```

### 2. Configure Environment Variables
Copy the template and fill in your credentials:
```bash
cp .env.example .env
```
*(Refer to `.env.example` for detailed documentation of each variable).*

### 3. Generate Database Client & Run Migrations
```bash
npx prisma generate
npx prisma db push
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Quality & Verification

Run strict TypeScript typechecking:
```bash
npx tsc --noEmit
```

Build for production:
```bash
npm run build
```

---

## 🔒 Security Best Practices

* **No Secrets in Source**: All API keys, database credentials, and passphrases are externalized to environment variables.
* **Cryptographic Signing**: User sessions use HMAC-SHA256 signatures with 30-day rotation and timing-safe byte equality comparisons.
* **Parameterized Queries**: All database queries execute via Prisma's prepared statements, mitigating SQL injection risks.
* **SSRF Mitigation**: Media proxies enforce strict hostname whitelisting against authorized CDN domains.

---

## 📄 License & Organization

Developed for **Vyoma Linguistic Labs Foundation** — dedicated to preserving and promoting Sanskrit through digital technology.
