-- Destructive rollback for migration 001; removes all application data.
-- Select only the intended VCMAS development database before executing.
-- Keep foreign-key checking enabled; drop dependents before their parents.
DROP TABLE IF EXISTS emr_attachments;
DROP TABLE IF EXISTS refunds;
DROP TABLE IF EXISTS auth_sessions;
DROP TABLE IF EXISTS audit_events;
DROP TABLE IF EXISTS client_notifications;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS inventory_expenses;
DROP TABLE IF EXISTS invoice_lines;
DROP TABLE IF EXISTS inventory_transactions;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS inventory_items;
DROP TABLE IF EXISTS emr_medications;
DROP TABLE IF EXISTS emr_laboratory_results;
DROP TABLE IF EXISTS emr_vaccinations;
DROP TABLE IF EXISTS emr_visits;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS pets;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS clinic_settings;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS schema_migrations;
