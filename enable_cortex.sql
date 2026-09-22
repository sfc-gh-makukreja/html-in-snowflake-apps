-- ============================================================================
-- Enable Cortex AI for Snowflake App Runtime (SAR)
-- ============================================================================
-- Run this script as ACCOUNTADMIN to enable Cortex LLM and ML functions
-- for the Sales Enablement application roles and warehouse.
-- ============================================================================

USE ROLE ACCOUNTADMIN;

-- 1. Grant Cortex User database role to application roles
GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE SALES_APP_DEPLOYER_ROLE;
GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE SALES_APP_VIEWER_ROLE;

-- 2. Ensure query warehouse has USAGE granted
GRANT USAGE ON WAREHOUSE APPS_WH TO ROLE SALES_APP_DEPLOYER_ROLE;
GRANT USAGE ON WAREHOUSE APPS_WH TO ROLE SALES_APP_VIEWER_ROLE;

-- 3. Enable cross-region Cortex model availability (e.g., Claude 3.5 Sonnet, Llama 3)
-- Options: 'ANY_REGION', 'AWS_US', 'AWS_EU', or specific cloud regions
ALTER ACCOUNT SET CORTEX_ENABLED_CROSS_REGION = 'ANY_REGION';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Test Cortex COMPLETE with Claude 3.5 Sonnet:
SELECT SNOWFLAKE.CORTEX.COMPLETE(
  'claude-3-5-sonnet',
  'Respond with a 1-sentence confirmation that Cortex AI is operational.'
) AS CORTEX_STATUS;

-- Test Cortex COMPLETE with Llama 3.1 70B:
SELECT SNOWFLAKE.CORTEX.COMPLETE(
  'llama3.1-70b',
  'Respond with "Llama 3.1 is ready."'
) AS LLAMA_STATUS;
