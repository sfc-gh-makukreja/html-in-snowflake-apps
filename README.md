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

## ❄️ Deployment Guide

Deploying a Snowflake App Runtime (SAR) application involves two simple parts:
1. **Infrastructure Setup in Snowsight** (SQL Worksheet).
2. **1-Command Deployment** via Cortex Code Desktop / Snowflake CLI.

---

### Step 1: Run Setup SQL in Snowsight

1. Sign in to your Snowflake account via **Snowsight**.
2. Open a **SQL Worksheet** (**Projects** $\rightarrow$ **Worksheets** $\rightarrow$ **+ Worksheet**).
3. Set your role to **`ACCOUNTADMIN`** in the top right corner.
4. Copy and paste the contents of [`setup.sql`](./setup.sql) and click **Run All** (Cmd/Ctrl + Shift + Enter).
5. Grant the created roles to your developer user and sales team:
   ```sql
   -- Grant deployer role to yourself:
   GRANT ROLE SALES_APP_DEPLOYER_ROLE TO USER <YOUR_SNOWFLAKE_USERNAME>;

   -- Grant viewer access to your sales team's role or specific users:
   GRANT ROLE SALES_APP_VIEWER_ROLE TO ROLE <YOUR_SALES_TEAM_ROLE>;
   ```

---

### Step 2: Deploy the App via Cortex Code Desktop / Snowflake CLI

From your terminal inside this repository folder (or inside Cortex Code Desktop):

```bash
# 1. Install dependencies
npm install

# 2. Deploy to Snowflake
snow app deploy
```

Snowflake App Runtime will automatically package your application, upload the assets, provision the artifact repository, build the container, and launch the `APPLICATION SERVICE` (`APPS_DB.SALES_APPS.SALES_EDUCATION_APP`).

Once complete, the CLI outputs the direct application URL:
```text
Application deployed successfully!
URL: https://<account_locator>.snowflakecomputing.app/...
```

---

### Step 3: Access & Share in Snowsight

End users access the deployed application entirely through their browser / Snowsight with zero CLI required:

1. In Snowsight, navigate to **Projects** $\rightarrow$ **Application Services**.
2. Click on **`SALES_EDUCATION_APP`** to open the live application or view logs and health status.
3. Click the **Share** button to grant access to additional teams or users (or grant `SALES_APP_VIEWER_ROLE`).

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
