# VCMAS PHP API

This is the XAMPP-compatible PHP REST entry point. Copy `config.example.php` to
`config.local.php` when local database credentials differ from the defaults, then
place the project under `C:\xampp\htdocs` or configure Apache to point at it.

Before starting Apache, create the `vcmas` database and apply the migration and
development seed in `database/migrations` and `database/seed`. The API uses secure
HTTP-only session cookies and exposes `/api/v1/auth/login`, `/api/v1/auth/register`,
`/api/v1/auth/logout`, `/api/v1/auth/me`, and `/api/v1/clinic`.
