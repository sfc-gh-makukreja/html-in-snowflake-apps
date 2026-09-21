-- =====================================================================
-- Snowflake App Runtime (SAR) Setup Script
-- Application: Sales Education & Qualifier App (html-in-snowflake-apps)
-- =====================================================================

-- Step 1: Use administrative role to provision database, schema, and roles
USE ROLE ACCOUNTADMIN;

-- Step 2: Create or use dedicated Warehouse
CREATE WAREHOUSE IF NOT EXISTS APPS_WH
  WAREHOUSE_SIZE = 'XSMALL'
  AUTO_SUSPEND = 300
  AUTO_RESUME = TRUE
  INITIALLY_SUSPENDED = TRUE
  COMMENT = 'Warehouse for Snowflake App Runtime services';

-- Step 3: Create shared Database and Schema for Apps
CREATE DATABASE IF NOT EXISTS APPS_DB
  COMMENT = 'Shared database for team applications and services';

CREATE SCHEMA IF NOT EXISTS APPS_DB.SALES_APPS
  COMMENT = 'Schema hosting Sales Education & Qualifier apps';

-- Step 4: Create Roles (Deployer Role & Consumer Role)
CREATE ROLE IF NOT EXISTS SALES_APP_DEPLOYER_ROLE
  COMMENT = 'Role with permissions to build, deploy, and manage Sales apps';

CREATE ROLE IF NOT EXISTS SALES_APP_VIEWER_ROLE
  COMMENT = 'Consumer role for business users accessing the Sales Education app';

-- Step 5: Grant Warehouse Usage
GRANT USAGE ON WAREHOUSE APPS_WH TO ROLE SALES_APP_DEPLOYER_ROLE;
GRANT USAGE ON WAREHOUSE APPS_WH TO ROLE SALES_APP_VIEWER_ROLE;

-- Step 6: Grant Container Privileges to Deployer Role
GRANT USAGE ON DATABASE APPS_DB TO ROLE SALES_APP_DEPLOYER_ROLE;
GRANT ALL PRIVILEGES ON SCHEMA APPS_DB.SALES_APPS TO ROLE SALES_APP_DEPLOYER_ROLE;

-- Step 7: Grant App Runtime Creation Privileges to Deployer Role
GRANT CREATE APPLICATION SERVICE ON SCHEMA APPS_DB.SALES_APPS TO ROLE SALES_APP_DEPLOYER_ROLE;
GRANT CREATE ARTIFACT REPOSITORY ON SCHEMA APPS_DB.SALES_APPS TO ROLE SALES_APP_DEPLOYER_ROLE;
GRANT BIND SERVICE ENDPOINT ON ACCOUNT TO ROLE SALES_APP_DEPLOYER_ROLE;

-- Step 8: Grant Viewer Access to the App and Container
GRANT USAGE ON DATABASE APPS_DB TO ROLE SALES_APP_VIEWER_ROLE;
GRANT USAGE ON SCHEMA APPS_DB.SALES_APPS TO ROLE SALES_APP_VIEWER_ROLE;

-- Automatically grant USAGE on any current and future Application Services created in this schema
GRANT INHERITED USAGE ON ALL APPLICATION SERVICES IN SCHEMA APPS_DB.SALES_APPS TO ROLE SALES_APP_VIEWER_ROLE;

-- Step 9: Grant Roles to Users / Groups
-- Replace <DEVELOPER_USER> and <SALES_USER_GROUP_ROLE> with your organization's user/role names:
-- GRANT ROLE SALES_APP_DEPLOYER_ROLE TO USER <YOUR_SNOWFLAKE_USERNAME>;
-- GRANT ROLE SALES_APP_VIEWER_ROLE TO ROLE <YOUR_SALES_TEAM_ROLE>;

SELECT 'Setup completed successfully. You can now deploy the app using: snow app deploy' AS status;
