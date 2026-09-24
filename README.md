# Covering Plant · Delivery Forecast (v2.0 Enterprise)

An enterprise-grade, C-Level delivery forecast and demand velocity analytics platform for Covering Plant operations. Built with **Next.js 14**, **React**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL)**.

---

## 🚀 Key Features

1. **Persistent Cloud Database (Supabase PostgreSQL)**:
   - All uploaded forecasts are stored permanently in Supabase.
   - Anyone across the executive and operations teams can access real-time forecasts simultaneously without re-uploading spreadsheets.
   - Shows the exact **Last Updated Date & Time** and the uploader badge on the dashboard.

2. **Direct (Export) vs Indirect (Local) Customer Engine**:
   - Customer master registry with 100+ classified accounts (`DIRECT` vs `INDIRECT`).
   - One-click global filter bar (`All Customers` | `Direct (Export)` | `Indirect (Local)`).
   - Dynamically calculates separate KPIs, volumes, values, demand shares, and delivery dates.

3. **ERP Resilience (Dynamic Column Mapping)**:
   - Automatically identifies columns by header names (case-insensitive fuzzy alias matching).
   - Never breaks if ERP report column orders change between exports.

4. **Interactive Missing Customer Detection**:
   - When an uploaded file contains an unrecognized customer name, an interactive prompt modal pops up asking the Admin to classify them (`Direct` vs `Indirect`).
   - The new customer is automatically saved permanently into the database before the forecast is committed.

5. **5 Executive Analytics Tabs**:
   - **Pivot Matrix**: Sticky multi-dimensional grid (Customer rows × Delivery Date columns) with sticky Totals column, sticky Totals row, and real-time customer search.
   - **Summary Analysis**: Customer Demand Share (%) and Delivery Date Velocity (%) progress visualizers.
   - **Trend Analysis**: Overdue Backlog, Current Month Daily Load (days 1 to end of month), Future Pipeline cards & column charts.
   - **Customer wise TA**: Individual customer deep-dive selector with daily load charts and horizon breakdowns.
   - **Summary Tables**: Customer Volume Summary & Date Wise Load Summary tables.

6. **Executive Excel Export**:
   - Download multi-sheet formatted Excel workbooks (`Covering_Plant_Forecast_Report.xlsx`) mirroring the active filter.

7. **Role-Based Access Control**:
   - **Admin Mode**: Upload new forecast files, modify customer classifications, manage master data.
   - **Viewer Mode**: Clean read-only presentation dashboard for top management and decision makers.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, Server & Client Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Plus Jakarta Sans, JetBrains Mono
- **Database**: Supabase PostgreSQL (Connection Pooling)
- **Spreadsheet Engine**: SheetJS (`xlsx`)
- **Icons**: Lucide React
- **Deployment**: Vercel & GitHub CI/CD

---

## ⚙️ Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Isuru-cyber/del-forecast-cp.git
   cd del-forecast-cp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file:
   ```env
   DATABASE_URL="postgresql://postgres.gljwhjmftlcimsuhxcnc:9tGjUes8DO5Xwfmz@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://gljwhjmftlcimsuhxcnc.supabase.co"
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deploying to Vercel

1. Push your repository to GitHub (`main` branch).
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import the `del-forecast-cp` repository.
4. Under **Environment Variables**, add:
   - `DATABASE_URL`: `postgresql://postgres.gljwhjmftlcimsuhxcnc:9tGjUes8DO5Xwfmz@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres`
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://gljwhjmftlcimsuhxcnc.supabase.co`
5. Click **Deploy**. Your app will be live on a production URL in ~1 minute!
