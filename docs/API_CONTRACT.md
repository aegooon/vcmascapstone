# VCMAS PHP/MySQL API Contract

**Version:** 1.0  
**Status:** Baseline for P0-02  
**Hosting target:** XAMPP Apache + PHP + MySQL  
**Base path:** `/api/v1`

This contract defines the first backend boundary for the Angular application. PHP endpoints must validate authorization and business rules on the server. Angular components must call these endpoints through typed services and must not treat local mock data as persistent state.

## Transport and response rules

- Use HTTPS outside local development.
- Use JSON request and response bodies with `Content-Type: application/json`.
- Use an HttpOnly, Secure, SameSite session cookie for authentication. Do not store access credentials in local storage.
- Use ISO 8601 timestamps with an explicit timezone.
- Use PHP/MySQL transactions for every stock, invoice, payment, or EMR write that affects more than one record.
- Use decimal strings for monetary values in JSON, for example `"1250.00"`.
- Use stable string or UUID identifiers in API responses.
- Paginated list responses use `{ "data": [], "meta": { "page": 1, "pageSize": 25, "total": 0 } }`.
- Successful single-resource responses use `{ "data": { ... } }`.
- Mutations return the server-confirmed resource and any linked resources affected by the mutation.

## Error format

All errors use this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "fields": {
      "quantity": "Quantity must be greater than zero."
    },
    "requestId": "req_01J..."
  }
}
```

Required status mapping:

| Status | Use |
|---:|---|
| 400 | Malformed request or invalid business input |
| 401 | Missing or expired session |
| 403 | Authenticated user lacks permission |
| 404 | Resource does not exist or is outside the user's scope |
| 409 | Conflict, duplicate request, or stale version |
| 422 | Valid JSON with failed field validation |
| 500 | Unexpected server failure; do not expose stack traces |

## Authentication and current user

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Public | Authenticate a staff or client account and create a session. |
| POST | `/auth/register` | Public | Create a client account after validating email, password, and terms. |
| POST | `/auth/logout` | Authenticated | Invalidate the current session. |
| GET | `/auth/me` | Authenticated | Return the current user, role, and permitted clinic scope. |
| POST | `/auth/refresh` | Authenticated | Renew a valid session when the deployment uses rotating sessions. |

Login request:

```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

The response must not return a password or password hash. Passwords must be hashed using PHP's password hashing API and rate-limited on repeated failure.

## Clinic and public landing-page data

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| GET | `/clinic/public` | Public | Return the approved clinic name, services, hours, contact numbers, address, and public landing-page content. |
| GET | `/services` | Public/Authenticated | Return active services and their public descriptions. Staff roles may receive prices according to permission. |

The public response must contain the approved values:

- Consultation
- Vaccination & Deworming
- Surgeries
- Treatment Laboratories
- Grooming
- Pet Supplies
- Boarding
- Confinement
- 9:00 AM - 6:30 PM
- Mobile: 09311318670
- Telephone: 86717479
- 195 Rt. Aglipay St., Brgy. Poblacion, Mandaluyong City

## Clients, pets, and EMR

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| GET | `/clients` | Staff/Admin | Paginated client search. |
| POST | `/clients` | Staff/Admin | Create a client record. |
| GET | `/clients/{clientId}` | Staff/Admin/Owner | View a permitted client record. |
| GET | `/clients/{clientId}/pets` | Staff/Admin/Owner | List pets within the permitted owner scope. |
| POST | `/clients/{clientId}/pets` | Staff/Admin/Owner | Register a pet. |
| PATCH | `/pets/{petId}` | Staff/Admin/Owner | Update permitted pet fields. |
| GET | `/patients/summary` | Staff/Veterinarian/Admin | Return the clinic patient count and summary statistics. |
| GET | `/patients` | Staff/Veterinarian/Admin | Search and filter patient records with pagination. |
| GET | `/patients/{patientId}` | Staff/Veterinarian/Admin/Owner | Return a patient and permitted EMR summary. |
| GET | `/patients/{patientId}/visits` | Staff/Veterinarian/Admin | Return chronological visits. |
| POST | `/patients/{patientId}/visits` | Veterinarian/Staff | Create a visit, clinical notes, diagnoses, treatment, and follow-up. |
| PATCH | `/visits/{visitId}` | Veterinarian/Staff | Update an editable visit according to audit rules. |
| POST | `/patients/{patientId}/vaccinations` | Veterinarian/Staff | Record a vaccination or preventive-care event. |
| POST | `/patients/{patientId}/laboratory-results` | Veterinarian/Staff | Attach or record a laboratory result. |
| GET | `/patients/{patientId}/timeline` | Veterinarian/Staff/Admin | Return the complete authorized clinical timeline. |

EMR writes must include the authenticated author, timestamp, patient identifier, and audit event. Client responses must omit restricted clinical fields.

## Appointments

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| GET | `/appointments` | Staff/Veterinarian/Admin/Owner | Search appointments within the caller's scope. |
| POST | `/appointments` | Staff/Admin/Owner | Request or create an appointment according to role rules. |
| GET | `/appointments/{appointmentId}` | Authorized | View appointment details and linked patient/client context. |
| PATCH | `/appointments/{appointmentId}` | Staff/Veterinarian/Admin/Owner | Reschedule, assign, check in, complete, or cancel. |
| POST | `/appointments/{appointmentId}/check-in` | Staff | Check in a patient. |

The server must validate clinic hours, room/provider conflicts, status transitions, and client ownership.

## Inventory

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| GET | `/inventory/items` | Staff/Veterinarian/Admin | Search and filter inventory items. |
| POST | `/inventory/items` | Staff/Admin | Create an item. |
| PATCH | `/inventory/items/{itemId}` | Staff/Admin | Update item metadata, reorder level, cost, or client price. |
| GET | `/inventory/items/{itemId}/transactions` | Staff/Admin | View immutable stock movement history. |
| POST | `/inventory/transactions` | Staff/Admin/Veterinarian | Record a validated stock movement and its financial effect. |
| GET | `/inventory/summary` | Staff/Admin | Return stock totals, low-stock count, and inventory value. |

Inventory transaction request:

```json
{
  "itemId": "inv_123",
  "type": "patient-usage",
  "quantity": "2.000",
  "unitCost": "15.00",
  "patientId": "pat_123",
  "appointmentId": "apt_123",
  "invoiceId": null,
  "reason": "Rabies vaccination",
  "clientRequestId": "client-unique-id"
}
```

Rules:

- `purchase` increases stock and creates an internal expense/payable record.
- `patient-usage` decreases stock and creates or updates a billable invoice line using the approved client price.
- `return` creates a compensating movement and updates the linked purchase or invoice as applicable.
- `wastage` and `correction` update stock and audit history without creating a client charge.
- The server rejects a negative resulting balance unless the caller has correction permission.
- Duplicate `clientRequestId` values return the original result without repeating the transaction.

## Billing and payments

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| GET | `/billing/invoices` | Staff/Admin/Owner | List invoices within the caller's scope. |
| POST | `/billing/invoices` | Staff/Admin | Create a draft invoice. |
| GET | `/billing/invoices/{invoiceId}` | Authorized | View invoice lines, linked inventory transactions, payments, and balance. |
| PATCH | `/billing/invoices/{invoiceId}` | Staff/Admin | Edit a draft invoice or issue it. |
| POST | `/billing/invoices/{invoiceId}/payments` | Staff/Admin/Owner | Record an approved payment. |
| POST | `/billing/invoices/{invoiceId}/void` | Admin | Void an invoice through an audit-preserving reversal. |
| POST | `/billing/invoices/{invoiceId}/refunds` | Admin | Record a refund and compensating financial entries. |
| GET | `/billing/reconciliation` | Admin | Compare inventory movements, expenses, invoice lines, payments, and reversals. |

The server calculates subtotal, tax, discount, total, amount paid, and balance. The Angular client may display calculations for usability, but the server response is authoritative.

## Audit events and administration

| Method | Endpoint | Roles | Purpose |
|---|---|---|---|
| GET | `/audit-events` | Admin | Search security, EMR, inventory, billing, payment, and configuration events. |
| GET | `/admin/users` | Admin | Manage staff and client account status and roles. |
| PATCH | `/admin/users/{userId}` | Admin | Change account status or role with an audit event. |
| GET | `/admin/settings` | Admin | Read clinic, hours, service, tax, and billing settings. |
| PATCH | `/admin/settings` | Admin | Update settings with validation and audit history. |

## API implementation acceptance criteria

- PHP endpoints run under the selected XAMPP Apache configuration and connect to MySQL using environment/configuration values outside source control.
- All protected endpoints reject unauthenticated and unauthorized requests server-side.
- All write endpoints validate input and return the documented error shape.
- Inventory usage, invoice lines, payments, and EMR visits preserve stable links and audit events.
- Inventory and Billing changes use one MySQL transaction where atomicity is required.
- API integration tests cover authorization boundaries, validation, duplicate requests, rollback, and the required inventory-to-Billing flows.
- Angular services can consume the contract without feature components knowing PHP or MySQL implementation details.
