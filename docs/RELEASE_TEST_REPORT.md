# Release test report

**Date:** 2026-10-04  
**Commit:** `513046c`  
**Environment:** Windows XAMPP MariaDB 10.4.32, PHP 8.2.12, temporary PHP API server, isolated `vcmas_release_test` database

## Passed

- PHP syntax check for `api/index.php`.
- Angular application and spec TypeScript checks.
- Angular compiler/template check.
- Angular production build to `dist/VCMAS-Capstone/browser`.
- MariaDB schema migration and anonymized seed import.
- Clinic profile endpoint returned the approved address, phone numbers, and opening hours.
- Staff login, session restoration, and role response.
- Inventory patient usage reduced stock from 19 to 17 and created a linked invoice.
- Retrying the same inventory request returned the original transaction and invoice with `idempotent: true`.
- EMR visit and vaccination creation, record retrieval, and audit history retrieval.
- Native PDO invoice parameter binding defect found during testing was fixed and pushed.

## Still required on the deployment machine

- Apache-served `/api/v1` smoke test after copying the build and API into the XAMPP document root.
- Browser viewport, keyboard, and axe accessibility review across all routes.
- Multipart EMR attachment upload/download check through the Apache deployment. The endpoint includes MIME, size, storage-path, and authenticated access checks; this specific multipart check must be recorded by the deployment tester.
- Backup/restore rehearsal and HTTPS configuration before real clinic data is imported.

The isolated test database was dropped after validation; no production or primary development database was modified.
