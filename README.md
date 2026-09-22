# Sales Enablement & Opportunity Qualification App (Snowflake App Runtime)

A turnkey, customizable boilerplate for hosting and sharing interactive **Sales Education & Opportunity Qualification** assets inside **Snowflake App Runtime (SAR)** with optional **Cortex AI** deal intelligence.

---

## 🚀 Deployment Guide (Cortex Code Desktop)

Deploying to Snowflake App Runtime (SAR) is completely streamlined when using [**Cortex Code Desktop**](https://www.snowflake.com/en/product/snowflake-coco/downloads/).

### Step 1: Provision Snowflake Infrastructure & Roles

In Cortex Code Desktop, execute the provisioning script [`setup.sql`](./setup.sql) against your Snowflake connection (or run in a Snowsight SQL Worksheet as `ACCOUNTADMIN`):

```sql
-- 1. Run setup.sql to create warehouse, database, schema, and RBAC roles
-- (See setup.sql for full DDL)

-- 2. Grant deployer privileges to your development user:
GRANT ROLE SALES_APP_DEPLOYER_ROLE TO USER <YOUR_USERNAME>;

-- 3. Grant viewer privileges to your sales team or specific users:
GRANT ROLE SALES_APP_VIEWER_ROLE TO ROLE <YOUR_SALES_TEAM_ROLE>;
-- Or grant directly to individual users:
GRANT ROLE SALES_APP_VIEWER_ROLE TO USER <SALES_REP_USERNAME>;
```

---

### Step 2: Deploy with 1 Command

Open the integrated terminal in **Cortex Code Desktop** and run:

```bash
# 1. Install local dependencies
npm install

# 2. Deploy directly to Snowflake App Runtime
snow app deploy
```

Snowflake App Runtime will automatically package your application, upload the assets to your schema's stage, build the container image in the remote builder service, and launch the `APPLICATION SERVICE` (`APPS_DB.SALES_APPS.SALES_EDUCATION_APP`).

Once deployment completes, the CLI outputs your direct secure application endpoint:
```text
Application deployed successfully!
Endpoint URL: https://<endpoint-id>-<org>-<account>.snowflakecomputing.app
Example: https://a5bjcf-sfseapac-makukreja-aws-us-west-2.snowflakecomputing.app
```

---

## 🤖 Optional: Enable Cortex AI Deal Intelligence

This boilerplate includes built-in backend APIs (`/api/cortex/qualify` and `/api/cortex/complete`) that execute **Snowflake Cortex LLM** functions (Claude 3.5 Sonnet, Llama 3.1) directly using the container's session token.

### 1. Enable Cortex Permissions in Snowflake
Run [`enable_cortex.sql`](./enable_cortex.sql) as `ACCOUNTADMIN`:
```sql
-- Grants Cortex User role to your app roles and enables cross-region models
USE ROLE ACCOUNTADMIN;
GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE SALES_APP_DEPLOYER_ROLE;
GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE SALES_APP_VIEWER_ROLE;
ALTER ACCOUNT SET CORTEX_ENABLED_CROSS_REGION = 'ANY_REGION';
```

### 2. Add AI Intelligence to `qualifier.html`
See [`cortex_feature_snippet.js`](./cortex_feature_snippet.js) for an easy copy-paste frontend integration:
- Adds a **"🤖 Analyze Opportunity with Cortex AI"** button.
- Posts form answers and notes to `/api/cortex/qualify`.
- Renders fit score (1-100), key solution pillars, custom opening pitch hooks, and objection handling guidance in real time.

---

## 📱 Accessing & Sharing the App in Snowsight

End users access and interact with the application directly from the **Snowsight UI** or via direct URL with single sign-on (SSO).

```
Snowsight Navigation:
┌────────────────────────────────────────────┐
│  Snowflake                                 │
│                                            │
│  Projects                                  │
│  Apps  ──►  [ All Apps | My apps ]         │
│  Data           ┌────────────────────────┐ │
│                 │ SALES_EDUCATION_APP    │ │
│                 │ Status: RUNNING        │ │
│                 │ Installed from: ...    │ │
│                 │ [...]  [ Open App ]    │ │
│                 └────────────────────────┘ │
└────────────────────────────────────────────┘
```

### 1. Where to Find the App in Snowsight
1. In the Snowsight left sidebar navigation, click on **Apps** (URL: `#/apps/applications`).
2. Under the **"My apps"** or **"All Apps"** tab, locate **`SALES_EDUCATION_APP`** (installed from `APPS_DB.SALES_APPS.SALES_EDUCATION_APP`).
3. Click on the app card or click **Open App** to launch the enablement tool.

### 2. Sharing the App with Teams & Users (Role-Based Access Control)
Snowflake App Runtime applications are shared using Snowflake's **Role-Based Access Control (RBAC)**:

1. In Snowsight under **Apps** (`#/apps/applications`), find **`SALES_EDUCATION_APP`**.
2. Click the three dots (**`...`**) next to the application and select **Share**.
3. In the **"Share SALES_EDUCATION_APP"** modal:
   - Click **Account roles** dropdown.
   - Select **`SALES_APP_VIEWER_ROLE`** (or your team's designated business role).
   - Click **Save**.
4. **Assign Users to the Role**:
   Because Snowflake shares apps via roles, administrators/deployers give individual users access by assigning them to the role:
   ```sql
   USE ROLE ACCOUNTADMIN;
   GRANT ROLE SALES_APP_VIEWER_ROLE TO USER <username>;
   ```
   Users granted this role will immediately see the app under their **Apps** menu upon signing into Snowsight.

---

## 🎯 How It Works & Dynamic Routing

This application is built around the **Two-Asset Sales Enablement Pattern**:
1. **Education / Overview Asset** (`*education*.html` / `*overview*.html`): Strategic sales overview, value proposition, objection busters, conversation cues, and attach motions.
2. **Qualifier / Lead Assessment Tool** (`*qualifier*.html` / `*quiz*.html`): Interactive decision tree, prospect scoring, and instant lead referral generation.

### Dynamic Routing
The built-in Express server inspects `html_assets/` at runtime and automatically routes requests without hardcoded partner names:
- **Root URL (`/`)**: Automatically detects and loads the primary education/overview asset.
- **Clean Routes**:
  - `/` or `/education` $\rightarrow$ Serves the primary education asset.
  - `/qualifier` $\rightarrow$ Serves the interactive prospect qualification tool.
  - Direct file access (e.g. `/<filename>.html`) and clean slugs (e.g. `/<slug>`) work automatically.
- **Backend API Routes**:
  - `POST /api/cortex/qualify`: Generates deal intelligence analysis with Cortex LLMs.
  - `POST /api/cortex/complete`: Direct prompt completion via `SNOWFLAKE.CORTEX.COMPLETE`.
  - `GET /api/health`: Health status and asset count.

---

## 📁 Repository Structure

```text
.
├── html_assets/                    # 👈 Place your 2 HTML files here
│   ├── education.html              # Primary sales overview & enablement guide
│   └── qualifier.html              # Interactive prospect qualifier tool
├── enable_cortex.sql               # 🤖 Script to enable Cortex AI permissions
├── cortex_feature_snippet.js       # 🤖 Client-side feature snippet for qualifier.html
├── snowflake.yml                   # Snowflake CLI 3.20.0 project definition
├── app.yml                         # Container build & run configuration
├── package.json                    # Node.js dependencies & scripts
├── server.js                       # Dynamic asset discovery, routing & Cortex API server
├── setup.sql                       # ❄️ Snowflake account & RBAC provisioning script
└── README.md
```

---

## 🛠 Local Development & Preview

To run and preview the app locally before deploying:

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
- **Role-Based Access Control:** Access is governed entirely by `SALES_APP_VIEWER_ROLE`. End users do not require elevated privileges.
- **Zero Hardcoding:** Drop in any 2 HTML files into `html_assets/`, and the server dynamically indexes and routes them.
