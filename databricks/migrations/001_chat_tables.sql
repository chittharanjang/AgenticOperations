-- Chat persistence tables for Databricks SQL.
-- Run this in your SQL Warehouse before using the app.
-- Adjust the catalog/schema prefix if using Unity Catalog
-- (e.g. CREATE TABLE my_catalog.my_schema.chat_sessions ...).
--
-- No column DEFAULTs: Delta requires delta.feature.allowColumnDefaults before
-- DEFAULT in DDL; the app sets ids/timestamps in INSERT/UPDATE SQL instead.

CREATE TABLE IF NOT EXISTS chat_sessions (
  id STRING NOT NULL,
  user_id STRING NOT NULL,
  title STRING,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id STRING NOT NULL,
  session_id STRING NOT NULL,
  role STRING NOT NULL,
  content STRING NOT NULL,
  tool_call STRING,
  created_at TIMESTAMP NOT NULL
);
