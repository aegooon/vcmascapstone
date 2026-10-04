# XAMPP deployment

## Local database

1. Start **Apache** and **MySQL** from the XAMPP control panel. XAMPP's MySQL service uses MariaDB in the bundled distribution.
2. Open phpMyAdmin and create a database named `vcmas` using `utf8mb4`.
3. Run [`database/migrations/001_initial_schema.up.sql`](../database/migrations/001_initial_schema.up.sql), then run [`database/seed/001_development_seed.sql`](../database/seed/001_development_seed.sql) for fictional development records.
4. Copy `api/config.example.php` to `api/config.local.php` and set the database credentials when they differ from the XAMPP defaults.

## Apache layout

Build the Angular application and copy the contents of `dist/VCMAS-Capstone/browser` into `C:\xampp\htdocs\vcmas`. Configure `/api/v1` to rewrite to `api/index.php`. The included `.htaccess` files require Apache `mod_rewrite`, `mod_headers`, and `AllowOverride All`.

```powershell
npm run build
```

The Angular application expects API requests at `/api/v1`. When the frontend and API use different origins, update `allowed_origin` in `api/config.local.php` and keep credentials enabled for the session cookie.

## Development accounts

The seed file contains fictional accounts for local testing only. Replace or remove these records before any real clinic deployment. Never commit real patient data or production credentials.

## Backups and updates

Export the `vcmas` database before applying a migration. Apply migrations in order, record the version in `schema_migrations`, and test a restore before updating the clinic installation. Keep uploaded EMR attachments outside the public web root.
