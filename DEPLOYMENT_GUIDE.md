# Vyoma OTT Platform - Enterprise Production Deployment Matrix

## 1. Core Architecture Recommendation
For superior scalability, global CDN coverage, and the minimum operational overhead, our team strictly recommends the following modern architecture over older manual AWS EC2 setups:

-   **Frontend/API Application**: Vercel (Next.js native provider) or **AWS Amplify Gen 2**.
-   **Database Platform**: **AWS RDS (PostgreSQL)** or **Supabase (Postgres)**.
    *   *Note: Your stack utilizes Prisma ORM. Moving from the current development SQLite to Production PostgreSQL only requires changing 1 line in `schema.prisma`.*

---

## 2. Phase 1: Migrating Database to Production Postgres
**Recommended: AWS RDS Postgres or Neon.tech / Supabase**

1.  Spin up a managed PostgreSQL Instance on AWS RDS.
2.  Copy the resulting Connection URI (e.g., `postgresql://USER:PASS@HOST:5432/dbname`).
3.  In `prisma/schema.prisma`, modify the provider:
    ```prisma
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
    ```
4.  Run push protocol to establish full relational parity:
    ```bash
    npx prisma db push
    ```

---

## 3. Phase 2: Environment Variable Configuration Matrix
Before pushing live, configure these securely inside your hosting provider's control panel:

| Variable Key | Value Description |
| :--- | :--- |
| `DATABASE_URL` | The production PostgreSQL connection URI obtained in Phase 1. |
| `NEXT_PUBLIC_APP_URL` | Your live website domain URL (e.g., `https://vyoma.tv`). |
| `ONESIGNAL_REST_API_KEY` | Derived from OneSignal portal dashboard. |
| `RAZORPAY_KEY_ID` | Live API key from your Razorpay merchant portal. |
| `RAZORPAY_KEY_SECRET` | Live Secret from your Razorpay merchant portal. |

---

## 4. Phase 3: One-Click Deployment via AWS / Vercel

### Option A: AWS Amplify (The Native AWS Route)
1.  Push this source folder to a **Private GitHub Repository**.
2.  Open AWS Console and navigate to **AWS Amplify**.
3.  Click **"Host a Web App"** and link your GitHub Repo.
4.  Select branch `main`.
5.  Enter the environment variables listed above in Step 3.
6.  Click **Deploy**. AWS will auto-detect Next.js, optimize your code, and provision an automated SSL cert and CloudFront CDN endpoints immediately.

### Option B: Vercel (Recommended & Easiest)
1.  Push source code to GitHub.
2.  Open Vercel Dashboard, click **New Project**, import the repo.
3.  Add your Environment Variables.
4.  Click **Deploy**. Done in ~2 minutes with zero server management required.

---

## 🚀 Post-Deployment Readiness Checklist
Once deployed, access your live URL and verify:
1. Log into `/admin` and initialize your System Settings (Razorpay/OneSignal).
2. Verify Dynamic Pricing accurately generates across the Subscription portal.
3. Deploy Test Campagne vectors to ensure notification webhooks transmit flawlessly.
