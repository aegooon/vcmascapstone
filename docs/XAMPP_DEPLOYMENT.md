# XAMPP deployment

## Local database

1. Start **Apache** and **MySQL** from the XAMPP control panel. XAMPP's MySQL service uses MariaDB in the bundled distribution.
2. Open phpMyAdmin and create a database named `vcmas` using `utf8mb4`.
3. Run [`database/migrations/001_initial_schema.up.sql`](../database/migrations/001_initial_schema.up.sql), then run [`database/seed/001_development_seed.sql`](../database/seed/001_development_seed.sql) for fictional development records.
4. Copy `api/config.example.php` to `api/config.local.php` and set the database credentials when they differ from the XAMPP defaults. Set `allowed_origin` to the Angular origin used during local development.
5. Create the attachment directory configured by `upload_dir` (the default is `C:\xampp\vcmas-storage\emr`) and grant the Apache/PHP process write access. Keep this directory outside `htdocs`.

## Apache layout

Build the Angular application and copy the contents of `dist/VCMAS-Capstone/browser` into `C:\xampp\htdocs\vcmas`. Configure `/api/v1` to rewrite to `api/index.php`. The included `.htaccess` files require Apache `mod_rewrite`, `mod_headers`, and `AllowOverride All`.

```powershell
npm run build -- --base-href /vcmas/
```

Copy the generated browser files into `C:\xampp\htdocs\vcmas` and copy the `api` directory into `C:\xampp\htdocs\api`. The Angular subfolder rewrite serves direct routes such as `/vcmas/login` from `index.html`. The Angular application expects API requests at `/api/v1`. When the frontend and API use different origins, update `allowed_origin` in `api/config.local.php` and keep credentials enabled for the session cookie. The API rejects unapproved origins and sends no-store/security headers.

## Development accounts

The seed file contains fictional accounts for local testing only. Replace or remove these records before any real clinic deployment. Never commit real patient data or production credentials.

## Backups and updates

Export the `vcmas` database before applying a migration. Apply migrations in order, record the version in `schema_migrations`, and test a restore before updating the clinic installation. Keep uploaded EMR attachments outside the public web root. Attachment uploads accept PDF, PNG, and JPEG files up to 5 MB; the API validates MIME type, stores a UUID filename, and exposes downloads only to authenticated staff.
