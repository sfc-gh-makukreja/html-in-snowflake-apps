# Sales Enablement & Opportunity Qualification App (Snowflake App Runtime)

A turnkey, customizable application for hosting and sharing interactive **Sales Education & Opportunity Qualification** assets inside **Snowflake App Runtime (SAR)**.

---

## 🎯 How It Works

This application is built around the **Two-Asset Sales Enablement Pattern**:
1. **Education / Overview Asset** (`*education*.html` / `*overview*.html`): Strategic sales overview, value proposition, objection busters, conversation cues, and attach motions.
2. **Qualifier / Lead Assessment Tool** (`*qualifier*.html` / `*quiz*.html`): Interactive decision tree, prospect scoring, and instant lead referral generation.

### Dynamic Routing
- **Root URL (`/`)**: Automatically detects and loads your primary education/overview asset.
- **Clean Routes**:
  - `/` or `/education` $\rightarrow$ Serves the primary education asset.
  - `/qualifier` $\rightarrow$ Serves the interactive prospect qualification tool.
  - Direct file access (e.g. `/<filename>.html`) and clean slugs (e.g. `/<slug>`) work automatically.

---

## 📁 Repository Structure

```text
.
├── html_assets/                    # 👈 Place your 2 HTML files here
│   ├── education.html              # Primary sales overview & enablement guide
│   └── qualifier.html              # Interactive prospect qualifier tool
├── app.yml                         # Snowflake App Runtime (SAR) v2 deployment manifest
├── package.json                    # Node.js dependencies & scripts
├── server.js                       # Dynamic asset discovery & routing server
├── setup.sql                       # ❄️ Snowflake account & RBAC provisioning script
└── README.md
```

---

## ❄️ Step-by-Step Deployment Guide in Snowsight

You can deploy and manage this entire application directly inside the **Snowsight Web UI** without installing any local tools.

---

### Step 1: Provision Account Infrastructure in Snowsight

1. Sign in to **Snowsight**.
2. Open a **SQL Worksheet** (click **Projects** $\rightarrow$ **Worksheets** $\rightarrow$ **+ Worksheet**).
3. Switch your role to **`ACCOUNTADMIN`** in the top right selector.
4. Copy and paste the contents of [`setup.sql`](./setup.sql) into the worksheet and click **Run All** (Cmd/Ctrl + Shift + Enter).
5. Grant the created roles to your developer user and your sales team:
   ```sql
   -- Grant deployer role to yourself:
   GRANT ROLE SALES_APP_DEPLOYER_ROLE TO USER <YOUR_SNOWFLAKE_USERNAME>;

   -- Grant viewer access to your sales team's role or specific users:
   GRANT ROLE SALES_APP_VIEWER_ROLE TO ROLE <YOUR_SALES_TEAM_ROLE>;
   ```

---

### Step 2: Deploy the App via Snowsight Workspaces

1. In Snowsight, navigate to the left navigation menu: **Projects** $\rightarrow$ **Workspaces**.
2. Click **+ Workspace** $\rightarrow$ select **From Git repository**.
   - **Repository URL**: Paste your Git repository URL.
   - **Branch**: Select `main`.
   - **Role**: Select `SALES_APP_DEPLOYER_ROLE`.
   - **Warehouse**: Select `APPS_WH`.
3. Click **Create Workspace**.
4. Once the workspace opens in Snowsight:
   - If your HTML files were not in the Git repository, upload them into the `html_assets/` folder by clicking the **+** icon next to `html_assets` and choosing **Upload File**.
   - Snowsight automatically detects `app.yml` in the root folder.
5. In the top right corner of the workspace header, click the **Deploy** button.
6. Snowsight will automatically package the application, build the container, and launch the `APPLICATION SERVICE`.
7. Once deployment finishes (approx. 1–2 minutes):
   - A **Live Preview** tab will open right inside Snowsight.
   - An **App URL** (e.g. `https://<account-id>.snowflakecomputing.app/...`) will be generated for your organization.

---

### Step 3: Share the Application with Your Team

1. In Snowsight, go to **Projects** $\rightarrow$ **Application Services** (or open the deployed app from your workspace).
2. Click the **Share** button in the top right corner.
3. Select the role(s) you want to give access to (e.g., `SALES_APP_VIEWER_ROLE` or your team's role) and click **Save**.
4. Copy the Application URL and share it with your team.

---

## 💻 Alternative: Deploying via Snowflake CLI

If you prefer deploying from your local terminal:

```bash
# 1. Install dependencies
npm install

# 2. Deploy to Snowflake
snow app deploy
```

---

## 🛠 Local Development & Preview

To run and test the app locally before deploying:

```bash
# 1. Install dependencies
npm install

# 2. Start local server
npm start

# 3. Open in your browser:
# http://localhost:8080            -> Loads Education asset
# http://localhost:8080/qualifier  -> Loads Qualifier tool
```

---

## 🔐 Security & Access Control

- **Enterprise Authentication:** Users authenticate seamlessly via your organization's Snowflake single sign-on (SSO / Okta / Entra ID / Snowflake credentials).
- **Role-Based Access Control:** Only users with roles granted `SALES_APP_VIEWER_ROLE` (or roles granted `USAGE` on the service) can open the application.
- **Zero Hardcoding:** Drop in any 2 HTML files into `html_assets/`, and the server dynamically indexes and routes them.
