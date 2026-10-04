# VCMAS database setup

The XAMPP installation on this computer provides MariaDB 10.4.32 through the Control Panel service labelled **MySQL**. The migration and seed scripts are compatible with that installation.

## Development setup

1. Start **Apache** and **MySQL** from the XAMPP Control Panel.
2. Create a database in phpMyAdmin or the MariaDB client:

   ```sql
   CREATE DATABASE vcmas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. Run `migrations/001_initial_schema.up.sql` against the selected `vcmas` database.
4. Run `seed/001_development_seed.sql` only for a development environment.
5. Configure the PHP API with the database host, port, database name, username, and password through environment or local configuration values outside source control.

Example command from the XAMPP MariaDB client:

```powershell
Get-Content .\database\migrations\001_initial_schema.up.sql -Raw |
  C:\xampp\mysql\bin\mysql.exe -u root vcmas

Get-Content .\database\seed\001_development_seed.sql -Raw |
  C:\xampp\mysql\bin\mysql.exe -u root vcmas
```

The development seed creates fictional accounts and records. All seeded accounts use the password `DevOnly!ChangeMe123`; change or remove these accounts before any shared or production deployment.

## Migration rules

- Select the intended database before running a migration.
- Record applied versions in `schema_migrations`.
- Review the destructive `001_initial_schema.down.sql` file before using it; it drops all application tables and data.
- Do not run the development seed or rollback migration against a production database.
- Never commit database passwords, API secrets, real patient data, or exported production data.
