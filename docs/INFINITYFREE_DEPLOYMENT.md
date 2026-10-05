# InfinityFree Deployment Guide

This project can run on InfinityFree for a low-traffic demonstration or school project. It uses Angular static files, a PHP API, PDO, MySQL/MariaDB, sessions, `.htaccess`, and small file uploads.

Do not upload real patient, clinic, or other sensitive production data to free hosting. Use fictional development data only.

## 1. Build the Angular application locally

Run these commands from the project directory:

```powershell
npm install
npm run build -- --base-href /vcmas/
```

The production files are generated in:

```text
dist/VCMAS-Capstone/browser
```

Do not upload `node_modules`, `src`, or the rest of the Angular source project.

## 2. Create the InfinityFree website

1. Create an InfinityFree account.
2. Create a free subdomain or connect your own domain.
3. Open the hosting account's Control Panel.
4. Open File Manager or connect with FTP.

InfinityFree serves website files from the domain's `htdocs` directory. Uploading files outside `htdocs` may result in them being deleted.

## 3. Upload the frontend

Create this directory:

```text
htdocs/vcmas
```

Upload the **contents** of `dist/VCMAS-Capstone/browser` into `htdocs/vcmas`.

The deployed frontend should contain files similar to:

```text
htdocs/vcmas/index.html
htdocs/vcmas/main-*.js
htdocs/vcmas/styles-*.css
htdocs/vcmas/.htaccess
```

The `/vcmas/` directory matches the `--base-href /vcmas/` build option.

## 4. Upload the API

Create:

```text
htdocs/api
```

Upload the API files from the project's `api` directory:

```text
index.php
config.php
config.example.php
.htaccess
```

Do not upload local XAMPP credentials to a public repository.

## 5. Create the InfinityFree database

In the InfinityFree Control Panel:

1. Open **MySQL Databases**.
2. Create a database.
3. Copy the exact database name, username, password, and MySQL hostname.

InfinityFree does not use `localhost` as the MySQL hostname. The hostname normally resembles `sql123.infinityfree.com`; use the exact hostname shown in the account.

## 6. Import the database

Open InfinityFree's phpMyAdmin, select the database you created, and import these files in order:

```text
database/migrations/001_initial_schema.up.sql
database/seed/001_development_seed.sql
```

The seed contains fictional development users and records. Do not use it for production data.

## 7. Create the production configuration

Create `api/config.local.php` locally with the following structure:

```php
<?php
declare(strict_types=1);

return [
    'db' => [
        'dsn' => 'mysql:host=sql123.infinityfree.com;port=3306;dbname=YOUR_FULL_DATABASE_NAME;charset=utf8mb4',
        'user' => 'YOUR_DATABASE_USERNAME',
        'password' => 'YOUR_DATABASE_PASSWORD',
    ],
    'session_name' => 'vcmas_session',
    'allowed_origin' => 'https://YOUR-DOMAIN.example',
    'upload_dir' => __DIR__ . '/storage/emr',
];
```

Replace every placeholder with the values from InfinityFree, then upload the file to:

```text
htdocs/api/config.local.php
```

The `allowed_origin` value must contain only the scheme and domain. Do not include `/vcmas` in it. For example:

```text
https://your-domain.example
```

Do not commit `config.local.php` to Git because it contains database credentials.

## 8. Create and protect the upload directory

Create:

```text
htdocs/api/storage/emr
```

Inside `htdocs/api/storage/emr`, create a file named `.htaccess`:

```apache
<IfModule mod_authz_core.c>
    Require all denied
</IfModule>

<IfModule !mod_authz_core.c>
    Deny from all
</IfModule>
```

This prevents direct browser access to stored attachments. Authorized downloads continue through the PHP API.

The application limits attachments to 5 MB, which is within InfinityFree's general 10 MB file limit.

## 9. Verify the rewrite files

`htdocs/vcmas/.htaccess` should contain:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule ^ /vcmas/index.html [L]
</IfModule>
```

`htdocs/api/.htaccess` should contain:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.php [QSA,L]
```

## 10. Enable HTTPS

Enable the SSL certificate provided by InfinityFree and use:

```text
https://your-domain.example/vcmas/
```

HTTPS is recommended because the API uses secure session cookies when HTTPS is enabled.

## 11. Test the deployment

Open the frontend:

```text
https://your-domain.example/vcmas/
```

Test a direct Angular route:

```text
https://your-domain.example/vcmas/login
```

Test the API session endpoint:

```text
https://your-domain.example/api/v1/auth/me
```

An unauthenticated request should return HTTP `401`. HTTP `500` usually indicates an incorrect database hostname, database name, username, password, or missing database tables.

After logging in, verify:

- Session restoration after refreshing the page
- Clinic and dashboard data loading
- Creating and updating records
- Uploading an allowed PDF, PNG, or JPEG attachment under 5 MB
- Downloading an attachment through the authenticated API endpoint

## InfinityFree limitations to remember

- Use the exact MySQL hostname from the Control Panel; do not use `localhost`.
- Build Angular locally; Node.js is not needed on the hosting account.
- Keep all website files inside `htdocs`.
- Free hosting is suitable for a low-traffic demonstration, not a production clinic system.
- Do not use the account as general file storage or upload real patient data.
