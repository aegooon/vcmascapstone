# VCMAS release testing checklist

Run these checks from the repository root before a release candidate is accepted.

## Automated checks

```powershell
& 'C:\xampp\php\php.exe' -l api/index.php
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
node_modules/.bin/ngc.cmd -p tsconfig.app.json --noEmit
npm run build
```

The production bundle is written to `dist/VCMAS-Capstone/browser` and must be copied into the Apache document root only after the checks pass.

## XAMPP smoke test

1. Start Apache and MariaDB from the XAMPP control panel.
2. Apply the migration and anonymized seed in order.
3. Copy `api/config.example.php` to `api/config.local.php`, set local credentials, and create `C:\xampp\vcmas-storage\emr` with write access for Apache.
4. Verify `GET /api/v1/clinic` returns the configured clinic profile.
5. Log in with a seeded staff account and verify session restoration with `GET /api/v1/me`.
6. Create an inventory patient-usage transaction and confirm the response contains an invoice identifier; refresh Billing and verify the invoice line and balance.
7. Retry the same transaction request identifier and confirm no duplicate stock movement or invoice is created.
8. Create an EMR visit, vaccination, laboratory, and medication record; upload one allowed attachment and download it through the authenticated attachment endpoint.
9. Verify unauthorized routes return 401/403, negative stock is rejected, and audit history records the changed entities.

## Browser acceptance

Check `/`, `/login`, `/client`, `/dashboard`, `/scheduling`, `/inventory`, `/billing`, `/emr`, and `/admin` at 320px, 375px, 768px, 1024px, and 1440px. Confirm keyboard focus, labelled controls, dialog Escape/close behavior, readable tables, no horizontal page overflow, and visible live status/error messages. Run axe against each changed route.

The release is ready for controlled deployment only after the manual XAMPP and browser checks are recorded with date, tester, environment, and any approved exceptions.
