-- Migration 011: Audit Logs Table
-- Created: 2026-05-21
--
-- Records admin actions on sensitive tables for accountability and debugging.

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name  TEXT        NOT NULL,
  record_id   TEXT        NOT NULL,
  action      TEXT        NOT NULL CHECK (action IN ('CREATE','UPDATE','DELETE','ARCHIVE','RESTORE','ANONYMIZE')),
  changed_fields JSONB,                          -- { "fieldName": { "from": ..., "to": ... } }
  performed_by   TEXT     DEFAULT 'admin',       -- future: session / user id
  ip_address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name  ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id   ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON audit_logs(created_at DESC);
