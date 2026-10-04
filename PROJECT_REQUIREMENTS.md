# VCMAS Project Requirements Document

**Project:** Veterinary Clinic Management and Appointment System (VCMAS)  
**Document:** Project Requirements Document (PRD)  
**Version:** 1.0  
**Status:** Baseline for all future revisions  

**Implementation progress:** P0-01 through P0-05 are complete. P0-06 and P0-07 now have the XAMPP PHP session API, Angular authentication service, session restoration, and route guards implemented. P0-08 is partially implemented through typed API services and credentials handling. P0-09 now supports database-backed inventory item creation, editing, soft deletion, transaction recording, recent transaction history, stock-in, patient usage, returns, wastage, and corrections through the adjustment UI. P0-11 has row locking, negative-stock protection, idempotency, and billable patient-usage invoice creation; reconciliation verification remains active. P0-10 now has server-calculated invoice creation, payment, void, refund, payment history, invoice creation UI, void controls, and refund interaction; reconciliation verification remains active. P0-12 now supports patient search, clinical visit recording, and visit history; vaccinations, laboratories, medications, attachments, and audit UI remain active. Scheduling now loads client and pet selectors, creates validated appointments, edits status, checks in, marks in progress/completed, and cancels appointments through MariaDB endpoints. The P1-02 client landing page is implemented with the approved clinic details and responsive shared palette. P0-13 and P0-14 have an initial global responsive/focus baseline, but every route still requires verification. P0-15 and all remaining P1/P2 work remain active until their acceptance criteria are verified.
**Date:** 2026-10-04

## 1. Purpose

This document is the source of truth for the VCMAS revisions. Every future feature, UI change, refactor, and bug fix must satisfy the requirements and priority gates in this document. A change is not complete until its acceptance criteria are met and the affected requirements are verified.

VCMAS is a web application for a veterinary clinic. It supports clinic staff and veterinarians in managing patients, appointments, electronic medical records (EMR), inventory, billing, administration, and a client portal for pet owners.

## 2. Current project baseline

The current application is an Angular 22 standalone application with these existing areas:

- Staff login and dashboard
- Appointment scheduling
- Inventory management
- Administration dashboard
- Client login, registration, and client dashboard
- Client-facing landing page requirement for public clinic information and client entry points
- Placeholder Billing, EMR, client appointments, client profile, and client notifications components

The current implementation contains mock data, incomplete routes, placeholder actions, and no completed authentication or API integration. The priority requirements below are therefore mandatory stabilization work before the application is treated as production-ready.

## 3. Goals

VCMAS must:

1. Protect clinic and client information through authenticated, role-based access.
2. Provide one consistent data source for patients, appointments, EMR records, inventory, and billing.
3. Keep inventory quantities and financial amounts synchronized through auditable transactions.
4. Give veterinarians a complete EMR view of the clinic's pet patient records.
5. Give staff reliable tools for scheduling, inventory, billing, reporting, and administration.
6. Give clients reliable access to their own pets, appointments, notifications, and profile.
7. Meet the project's Angular, TypeScript, accessibility, security, and quality requirements.

## 4. Users and permissions

### 4.1 Clinic administrator

Can manage staff accounts, roles, clinic settings, service pricing, inventory permissions, billing settings, reports, and audit logs.

### 4.2 Veterinarian

Can view and update assigned patient EMR records, view appointments, record diagnoses and treatments, prescribe or record medication use, and review related billing information.

### 4.3 Receptionist or clinic staff

Can register clients and pets, schedule appointments, check patients in, manage permitted inventory transactions, create invoices, record payments, and view operational reports.

### 4.4 Client or pet owner

Can manage their own profile and pets, view their own appointments and notifications, request or reschedule appointments according to clinic rules, and view invoices and payment status for their pets.

### 4.5 Authorization rules

- Every protected route must require an authenticated session.
- Each API operation and page action must enforce the user's role on the server and in the client UI.
- A client must never be able to read or change another client's pets, EMR records, invoices, or notifications.
- EMR and billing access must be recorded in an audit log.
- Logout must invalidate or remove the active session and return the user to the correct login page.

## 5. Mandatory priority revisions

The following revisions are release gates. They must be completed before lower-priority polish is accepted.

### P0-1: Authentication and route protection

- Implement an authentication service and typed API client.
- Add staff and client credential forms with validation, loading state, server errors, and successful-session handling.
- Store only the minimum required session information and handle token expiry.
- Add role-aware route guards for staff, veterinarian, administrator, and client areas.
- Prevent direct access to dashboards, EMR, inventory, billing, scheduling, and administration without authorization.
- Make logout clear the session and navigate to the correct login route.

**Acceptance criteria:** Invalid credentials remain on the login page with an accessible error. A valid user reaches only the pages allowed by their role. An unauthenticated deep link redirects to login. Logout prevents access to previously protected pages.

### P0-2: Routing and navigation integrity

- Register every page that appears in navigation.
- Choose and consistently use one route scheme for the client portal. The recommended scheme is `/client/dashboard`, `/client/profile`, `/client/appointments`, and `/client/notifications`.
- Register `/billing` and `/emr` and replace their placeholders with the required features below.
- Remove links that silently use `href="#"`; every action must have a real destination or an implemented command.
- Use lazy `loadComponent` or lazy feature routes for non-entry pages.
- Add active navigation state and a deliberate not-found route.

**Acceptance criteria:** Every visible navigation item reaches the intended page. No application route relies on the wildcard redirect for normal navigation. Direct navigation and browser refresh work for every supported route.

### P0-3: Shared domain data and API layer

- Replace component-local mock arrays with typed services and a shared state layer.
- Add typed models for users, clients, pets, appointments, patient records, inventory items, inventory transactions, invoices, invoice lines, payments, and audit entries.
- The backend/API is part of the required implementation. It must provide authenticated endpoints, server-side authorization, persistence, validation, transaction handling, and audit logging for these models.
- The client must consume the API through typed Angular services; feature components must not treat hard-coded arrays or browser storage as the source of truth.
- Centralize loading, error, empty, and retry states.
- Keep API errors out of `console.log`; show safe, actionable UI feedback.
- Make updates optimistic only when rollback is defined; otherwise update state after the server confirms the transaction.

**Acceptance criteria:** A change made on one page is visible on other authorized pages after the server confirms it. Refreshing the page does not erase persisted records. Unauthorized API requests are rejected server-side. Stock and billing changes are committed atomically and leave an audit record.

### P0-4: Inventory and Billing integration

Inventory and billing must use a common transaction model. The inventory page and billing page must not maintain independent totals.

#### Inventory requirements

Each inventory item must have:

- A stable identifier and optional SKU
- Name, category, unit of measure, and supplier information
- Current quantity
- Reorder level
- Unit cost (clinic purchase cost)
- Client charge price (billable price, when the item is chargeable)
- Active/inactive status
- Created and updated timestamps

Every quantity change must create an immutable inventory transaction with:

- Item identifier
- Quantity delta and resulting balance
- Transaction type: `purchase`, `patient-usage`, `return`, `wastage`, or `correction`
- Unit cost or charge price as applicable
- Linked patient, appointment, invoice, or purchase reference when applicable
- User, timestamp, reason, and audit metadata

The system must reject negative resulting stock unless an authorized administrator records a correction. Quantity, cost, and price inputs must be validated as finite non-negative values.

#### Billing requirements

Billing must show:

- Invoice number, client, patient, appointment, status, dates, subtotal, tax, discount, total, amount paid, and balance due
- Itemized service and inventory lines with quantity, unit price, and line total
- Payment status: draft, issued, partially paid, paid, void, or refunded
- A visible link to the inventory transaction and EMR/appointment context when a charge came from patient care

#### Required synchronization behavior

1. **Inventory addition / stock-in:** When inventory is increased because the clinic purchased or received stock, the system records an inventory purchase transaction. Billing must show the corresponding clinic expense or payable amount in the inventory/purchases view. This is an internal financial amount and must not automatically charge a client.
2. **Inventory reduction / patient usage:** When stock is reduced for a patient visit, the system records a patient-usage transaction and creates or updates a billable invoice line using the item's client charge price. The invoice must show quantity, unit price, and total amount.
3. **Non-billable reduction:** Wastage, expiry, correction, and other non-billable reductions must affect stock and audit history but must not create a client charge.
4. **Returns and reversals:** A returned or reversed transaction must create a compensating transaction and update the linked invoice or expense record without deleting the original audit entry.
5. **Atomicity:** The stock change and its linked financial change must succeed together or be rolled back together. The UI must show a clear failure state if either side cannot be saved.
6. **Idempotency:** Retrying a request must not duplicate stock movement, invoice lines, expenses, or payments.
7. **Reconciliation:** Administrators must be able to compare inventory movement totals with billing and purchase totals for a selected date range.

**Acceptance criteria:** Adding stock updates quantity and the internal purchase amount. Reducing stock for a patient updates quantity and the patient's invoice. Wastage does not charge a client. Refreshing inventory and billing shows the same server-confirmed transaction. Every change can be traced to a user and source record.

### P0-5: EMR and patient records

The EMR page is the veterinarian's patient-record workspace. It must show the number of pet patient records owned by or registered with the clinic and allow authorized staff to find and review the underlying records.

Each patient record must support:

- Patient identifier, name, species, breed, sex, date of birth or age, weight, photo, and status
- Owner/client identity and contact details
- Allergies, chronic conditions, and important alerts
- Vaccination and preventive-care history
- Visit history linked to appointments
- Clinical notes, vital signs, diagnosis, treatment plan, procedures, and follow-up instructions
- Medication and prescription records
- Attachments such as laboratory results or relevant documents
- Inventory items used during care, linked to the corresponding billing line when chargeable
- Created/updated metadata and author information

The EMR page must provide:

- Total patient count
- Search by patient, owner, species, breed, or identifier
- Filters for active/inactive patients and species
- Pagination or virtualized loading for large record sets
- A patient detail view with chronological clinical history
- Clear empty, loading, error, and unauthorized states
- Role-based read/write permissions and an audit trail for edits

**Acceptance criteria:** A veterinarian can see the current patient count, open a patient, review the clinical history, record a visit, and see inventory usage and related billing context. A client can see only the client-facing information permitted for their own pets.

## 6. Functional requirements by module

### 6.1 Staff dashboard

- Show server-backed patient, appointment, pending-record, and revenue summaries.
- Link schedule entries to appointment details.
- Provide working appointment and patient registration flows.
- Replace browser `alert` calls with accessible in-app feedback or dialogs.

### 6.2 Scheduling

- Create, edit, cancel, check in, and complete appointments.
- Validate date, time, patient, owner, service, room, and assigned veterinarian.
- Prevent conflicting appointments according to clinic scheduling rules.
- Link each appointment to a patient, client, EMR visit, and invoice where applicable.
- Use clinic-local dates and times consistently instead of comparing UTC date strings to local dates.

### 6.3 Client landing page

The client side must have a public, responsive landing page that introduces the veterinary clinic before a client signs in. The page must use the same visual language as the rest of VCMAS: the existing blue and navy brand colors, teal accents, slate text and surfaces, white cards, subtle borders and shadows, and the existing red accent where it is already used. The page must feel like part of the same product as the staff and client portal screens.

#### Required clinic information

The landing page must present these clinic services as clear, scannable service cards or sections:

- Consultation
- Vaccination & Deworming
- Surgeries
- Treatment Laboratories
- Grooming
- Pet Supplies
- Boarding
- Confinement

The page must also show the following contact information in a prominent contact or clinic-information section and in the footer:

- **Clinic hours:** 9:00 AM - 6:30 PM
- **Mobile:** 09311318670
- **Telephone:** 86717479
- **Address:** 195 Rt. Aglipay St., Brgy. Poblacion, Mandaluyong City

#### Required page structure and actions

- A clear hero section with the clinic name, a short value statement, and calls to action for Client Login, Client Registration, and appointment access.
- A services section containing all eight required services with concise descriptions and meaningful icons or decorative illustrations.
- A clinic-hours and contact section that allows users to select the phone numbers on mobile devices and copy or use the address easily.
- A responsive footer containing the address, hours, contact numbers, and links to client login and registration.
- A visible route and navigation path that does not require authentication.
- Content must be configurable through typed clinic settings so contact details do not need to be duplicated across templates.

#### UI/UX and responsive requirements

- Reuse the project's blue/navy, teal, slate, white, and red-accent palette and existing typography scale.
- Match the rounded cards, restrained shadows, spacing, button treatments, and visual hierarchy used throughout the current project.
- Use a mobile-first layout that works at small phone widths, tablet widths, and desktop widths without horizontal scrolling.
- Collapse navigation into an accessible mobile menu at narrow widths.
- Keep primary calls to action visible without covering content or forcing unnecessary scrolling.
- Preserve readable line lengths, clear spacing, and adequate touch target sizes.
- Provide loading, error, and empty states if clinic content is later loaded from the API.
- Respect `prefers-reduced-motion` and avoid decorative animation that interferes with reading or interaction.

#### Accessibility requirements

- Use one page-level `h1` and an ordered heading hierarchy.
- Use semantic `header`, `nav`, `main`, `section`, and `footer` landmarks.
- Give every navigation link, button, icon, and service card action an accessible name.
- Ensure phone numbers use `tel:` links and the address is available as selectable text.
- Maintain WCAG 2.2 AA contrast for text, buttons, service labels, and status information.
- Ensure keyboard users can reach and operate every navigation item and call to action.
- Ensure the mobile menu has expanded state, Escape handling, visible focus, and focus restoration.

**Acceptance criteria:** An unauthenticated visitor can open the client landing page, identify all eight services, see the exact clinic hours, mobile number, telephone number, and address, and reach client login or registration. The page remains usable and readable on mobile, tablet, and desktop viewports, uses the project palette, and passes the project's accessibility checks.

### 6.4 Client portal

- Provide working client registration and login.
- Allow clients to manage their own profile and pets.
- Display appointments, notifications, invoices, and allowed EMR summaries.
- Keep all client navigation paths consistent with the router.
- Provide accessible dialogs for pet editing, appointment details, and rescheduling.

### 6.5 Administration

- Manage users, roles, clinic details, operating hours, service catalog, billing settings, and inventory permissions.
- Provide working report export and purchase-order workflows.
- Show audit events for security-sensitive and financial actions.

### 6.6 Billing

- Create invoices from services and billable inventory usage.
- Display inventory purchase expenses separately from client charges.
- Support payment recording, partial payment, void, refund, and reconciliation workflows.
- Prevent edits to finalized invoices except through controlled reversal or adjustment records.

## 7. Data and business rules

- Currency is Philippine peso (PHP/₱) unless clinic settings specify otherwise.
- Monetary values must be stored using a safe decimal representation on the server; do not use binary floating-point arithmetic for persisted totals.
- Invoice and inventory totals must be calculated from line items and server-validated quantities.
- Patient, EMR, billing, and payment records require timestamps and authorship.
- Deletion of clinical or financial records must be replaced by archive, void, or reversal workflows where retention is required.
- Server time, clinic timezone, and display timezone must be explicit.
- All financial and stock-changing operations require an audit entry.

## 8. Accessibility and usability requirements

The application must meet WCAG 2.2 AA and pass automated axe checks plus keyboard and screen-reader review.

### 8.1 Project-wide responsive requirements

Responsiveness applies to every public page and every authenticated module, including the client landing page, login and registration, client portal, staff dashboard, scheduling, inventory, Billing, EMR, and administration. A page is not complete if it works only at desktop width.

- Use a mobile-first layout that supports phone, tablet, laptop, and large desktop viewports.
- Test at minimum widths of 320px, 375px, 768px, 1024px, and 1440px, plus intermediate widths where layout breakpoints change.
- Prevent horizontal page scrolling caused by tables, modals, navigation, cards, charts, or long text.
- Use responsive navigation with an accessible mobile menu for layouts that cannot show the full sidebar.
- Reflow dashboard cards and multi-column sections into a readable single-column or stacked layout on narrow screens.
- Make tables usable on small screens through responsive columns, horizontal scrolling inside the table region, or an equivalent accessible card/list view.
- Keep dialogs within the viewport, allow internal scrolling for long forms, and ensure actions remain reachable on small screens and zoomed text.
- Maintain touch targets of at least 44px where practical and preserve visible focus indicators for keyboard users.
- Support browser zoom up to 200% without loss of content or functionality.
- Do not encode important information only through hover, fixed positioning, or color.
- Verify responsive behavior after every component or style change, including loading, error, empty, and populated states.

**Responsive acceptance criteria:** Every supported route remains readable and operable at the required viewport widths. No primary action, form field, table record, modal control, contact detail, EMR record, inventory transaction, or invoice total is clipped or unreachable. The responsive check passes keyboard navigation and WCAG 2.2 AA review.

- Every form control has a programmatic label, stable `id`, validation message, and error association.
- Every icon-only button has an accessible name and an appropriate pressed/expanded state.
- Dialogs use `role="dialog"`, `aria-modal="true"`, a labelled title, focus trapping, Escape handling, and focus restoration.
- Focus indicators remain visible and meet contrast requirements.
- Use semantic headings, landmarks, tables, and live regions for dynamic status messages.
- Do not rely on color alone for status.
- Respect reduced-motion preferences and support keyboard operation for menus, filters, tables, and dialogs.
- Verify color contrast for all text, badges, status indicators, and disabled states.

## 9. Angular and TypeScript standards

- Use standalone components without explicitly setting `standalone: true`.
- Use signals for local and shared reactive state; use `computed` for derived values.
- Use `input()` and `output()` for component APIs and `inject()` for dependency injection.
- Use native `@if`, `@for`, and `@switch` control flow.
- Use class/style bindings instead of `ngClass` and `ngStyle`.
- Avoid `any`; timer handles must use an explicit return type.
- Keep components focused; put API calls and domain transformations in services.
- Use lazy loading for feature routes.
- Use typed reactive or Signal Forms with schema validation for new forms.
- Use `NgOptimizedImage` for static images when images are introduced.

## 10. Testing and quality gates

Before a revision is accepted:

1. `npx tsc -p tsconfig.app.json --noEmit` passes.
2. `npx tsc -p tsconfig.spec.json --noEmit` passes.
3. The Angular production build passes.
4. Unit tests cover authentication, route guards, inventory transactions, billing calculations, EMR count/search/edit behavior, and key form validation.
5. Integration tests verify inventory-to-billing synchronization, reversal, retry/idempotency, and authorization boundaries.
6. Accessibility checks pass for all new or changed pages.
7. Formatting and lint checks pass.
8. No unresolved `TODO`, placeholder action, mock success path, or broken route remains in a released feature.

## 11. Mandatory revision order

The implementation must follow this order unless a later dependency is documented:

1. Repair route definitions and navigation paths.
2. Implement authentication, role model, guards, and logout.
3. Add shared typed services and replace local mock state.
4. Implement the EMR patient-record page and patient data model.
5. Implement inventory transaction history and validation.
6. Implement Billing and the atomic inventory-to-billing integration.
7. Complete scheduling, client portal, administration, reports, and remaining workflows.
8. Apply Angular standards, accessibility remediation, testing, and visual polish.

## 12. Definition of done

A requirement is complete only when:

- The behavior is implemented in the correct role boundary.
- Data is persisted through the typed API/state layer.
- Loading, empty, error, validation, and unauthorized states are handled.
- The route and navigation entry are registered and tested.
- Accessibility requirements are met.
- Relevant unit/integration tests pass.
- The implementation has no placeholder action or silent mock success path.
- The requirement's acceptance criteria and traceability entry are updated.

## 13. Traceability to the current review

The initial revision baseline includes these known issues from the existing project:

- Missing `/billing` and `/emr` routes and inconsistent client route paths
- Unprotected dashboard, inventory, scheduling, admin, and client routes
- Login forms that do not bind or validate credentials
- Mock-only registration, appointments, inventory, administration, and client data
- Placeholder Billing, EMR, and client portal pages
- Stale component spec imports and outdated title assertion
- Eager route imports, explicit standalone flags, legacy structural directives, `ngClass`, constructor injection, `any` timer fields, and lack of signals
- Missing accessible names, label associations, modal semantics, focus management, and stable landmarks
- Missing inventory quantity/price validation and inconsistent date handling

These are tracked by the P0 and P1 requirements above and must be resolved before the corresponding module is considered complete.

## 14. Decisions to preserve during implementation

- Inventory additions represent clinic stock receipts or purchases and appear as internal expense/payable amounts.
- Inventory reductions become client charges only when the transaction type is patient usage or another explicitly billable type.
- Wastage, expiry, correction, and similar adjustments affect stock and audit history without charging a client.
- Inventory, billing, and EMR records are linked by stable transaction, patient, appointment, and invoice identifiers.
- The server is the authority for stock balances, invoice totals, authorization, and audit history.

## 15. Deployment and data readiness

### 15.1 XAMPP deployment

The Angular application can be hosted by XAMPP's Apache server after it is compiled into static production files. XAMPP is not currently part of the repository, and the current project does not contain a backend or database.

For an XAMPP deployment:

- Build the Angular application with the production configuration.
- Copy the generated browser output into an Apache document-root subfolder such as `htdocs/vcmas`.
- Configure Apache URL rewriting so application routes return `index.html`; direct visits to routes such as `/inventory`, `/emr`, and `/billing` must not return a 404.
- Set Angular's `base href` to `/` when hosted at the Apache root or to `/vcmas/` when hosted in the `vcmas` subfolder.
- Serve API requests from a same-origin `/api` path or configure an explicit development/production API URL and CORS policy.
- Enable HTTPS before handling real client, patient, EMR, payment, or staff data.

XAMPP will use the **XAMPP-native option: PHP REST API plus MySQL, served through Apache**. This keeps the frontend, API, and database within the requested local hosting environment. The Django option is no longer the implementation target for this project.

The API contract for the PHP implementation is defined in [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md). The PHP API and MySQL database must implement the authorization rules, inventory-to-billing transaction behavior, EMR model, and audit requirements defined in this document.

### 15.2 Data requirements

Real clinic data is not required to begin the UI, API, or database implementation. Development must start with clearly marked, anonymized seed data so workflows can be built and tested safely.

Before production use, the clinic must provide or approve the following data:

- Clinic profile, approved logo, address, hours, mobile number, telephone number, and contact channels
- Service catalog, descriptions, prices, taxes, discounts, and billing rules
- Staff accounts, roles, veterinarian assignments, operating hours, rooms, and permissions
- Client and pet records, subject to consent, privacy, and secure import procedures
- Inventory items, categories, suppliers, units, starting quantities, reorder levels, unit costs, and client prices
- Appointment types, scheduling rules, appointment history, and cancellation policies
- EMR field requirements, vaccination records, treatment templates, laboratory result formats, and retention rules
- Payment methods, invoice numbering, refund rules, and financial reporting requirements

No real patient, client, payment, or staff data may be placed in source files, mock fixtures committed to the repository, screenshots, or unsecured development databases. Imported records must be validated, deduplicated, access-controlled, backed up, and auditable.

The application must support a controlled seed-data workflow for development and a separate protected import workflow for approved clinic data. Missing clinic data should be represented by configuration or an explicit empty state, never by invented production records.

### 15.3 Data readiness acceptance criteria

- The application runs with anonymized seed data when clinic data is unavailable.
- The database schema and API contract can be migrated without editing Angular templates.
- Clinic contact information and service catalog values are configurable.
- Real data import requires an authorized operator, validation results, an audit record, and a rollback or recovery plan.
- Production deployment documentation identifies where Angular, the API, MySQL, backups, environment secrets, and HTTPS are hosted.

## 16. Prioritized implementation task breakdown

The tasks below turn the requirements into an execution plan. Tasks in a priority group must be completed and accepted before the next group is treated as release-ready. A task may be developed in parallel only when its listed dependencies are complete.

### P0 — Release blockers and foundation

| ID | Task | Dependencies | Required deliverable and completion check |
|---|---|---|---|
| P0-01 | Confirm deployment stack | None | **Decision recorded:** use a PHP REST API plus MySQL inside XAMPP. Document local and production environment variables. |
| P0-02 | Establish the backend contract | P0-01 | Define typed request/response models and endpoint contracts for authentication, users, clients, pets, appointments, EMR, inventory, inventory transactions, invoices, invoice lines, payments, and audit events in [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md). |
| P0-03 | Create the database schema and migrations | P0-02 | Create normalized MySQL tables, keys, constraints, indexes, timestamps, audit fields, and migration/rollback scripts. The schema must support the inventory-to-billing links defined in P0-11. |
| P0-04 | Add anonymized seed data | P0-03 | Provide safe development records for staff, clients, pets, appointments, EMR entries, services, inventory, invoices, and payments. No real clinic data may be committed. |
| P0-05 | Repair route definitions and navigation | None | Register every visible destination, choose one client route scheme, add Billing and EMR routes, remove broken `href="#"` actions, and verify direct navigation and refresh. |
| P0-06 | Implement authentication | P0-02, P0-03 | Add staff and client login, registration, logout, session expiry, password handling, server errors, loading states, and safe session storage. |
| P0-07 | Implement authorization and route guards | P0-06 | Add server-side and client-side role checks for administrator, veterinarian, staff, and client areas. Verify that direct URLs cannot bypass permissions. |
| P0-08 | Build the shared Angular data layer | P0-02, P0-06 | Add typed API services, shared reactive state, loading/error/empty states, and environment-based API configuration. Remove feature reliance on local mock arrays. |
| P0-09 | Implement inventory transactions | P0-03, P0-08 | Add inventory item validation, stock-in, patient usage, return, wastage, correction, reorder levels, transaction history, authorization, and audit entries. Prevent unauthorized negative stock. |
| P0-10 | Implement Billing | P0-03, P0-08 | Add invoices, invoice lines, taxes, discounts, payment status, payments, voids, refunds, and server-calculated totals. Separate clinic purchase expenses from client charges. |
| P0-11 | Connect Inventory and Billing atomically | P0-09, P0-10 | Stock additions create internal expense/payable records; billable patient usage creates invoice lines; wastage and corrections do not charge clients. Retries are idempotent and failures roll back both sides. |
| P0-12 | Implement the EMR patient-record page | P0-03, P0-07, P0-08 | Show patient count, search/filter, patient details, clinical history, diagnoses, treatments, vaccinations, laboratory records, medications, attachments, authorship, and audit history. Link visits to appointments, inventory usage, and billing. |
| P0-13 | Apply project-wide responsive layout | P0-05, P0-08 | Make every route usable at 320px, 375px, 768px, 1024px, and 1440px. Remove horizontal overflow, reflow cards/tables, keep dialogs within the viewport, and verify keyboard/touch operation. |
| P0-14 | Establish accessibility baseline | P0-05, P0-13 | Add labels, accessible names, landmarks, dialog semantics, focus handling, visible focus styles, live errors, contrast compliance, and keyboard operation. Run axe checks on every P0 page. |
| P0-15 | Establish build and quality gates | P0-02 through P0-14 | Make application and spec type-checks, Angular production build, formatting, unit tests, integration tests, and responsive/accessibility checks pass. Fix stale specs and remove placeholder success paths. |

**P0 exit criteria:** Users can authenticate, reach only authorized routes, view and update persisted EMR records, manage inventory, create billing records, and see the required inventory-to-billing result after a refresh. The complete P0 surface is responsive, accessible, auditable, and buildable.

### P1 — Core clinic workflows

| ID | Task | Dependencies | Required deliverable and completion check |
|---|---|---|---|
| P1-01 | Implement scheduling workflow | P0-06, P0-08, P0-12 | Create, edit, cancel, check in, and complete appointments with conflict validation and links to client, patient, EMR visit, veterinarian, room, and invoice. |
| P1-02 | Implement the client landing page | P0-05, P0-13, P0-14 | Add the eight approved services, clinic hours, mobile number, telephone number, address, shared palette, responsive layout, contact links, and login/registration calls to action. |
| P1-03 | Complete the client portal | P0-06, P0-07, P0-08, P1-01 | Complete client profile, pet management, appointments, notifications, invoices, and allowed EMR summaries with client data isolation. |
| P1-04 | Complete staff dashboard | P0-08, P1-01, P0-12 | Replace hard-coded statistics and activities with server-backed data and working appointment/patient actions. |
| P1-05 | Complete administration | P0-06, P0-07, P0-08 | Implement user/role management, clinic settings, operating hours, service catalog, permissions, purchase orders, reports, and audit-log views. |
| P1-06 | Complete payment and reconciliation workflows | P0-10, P0-11 | Record full and partial payments, refunds, voids, balances, payment methods, and inventory/billing reconciliation reports. |
| P1-07 | Implement controlled clinic-data import | P0-03, P0-06, P0-07 | Add authorized import for approved clinic data with validation, duplicate detection, preview, audit record, backup, and rollback/recovery procedure. |
| P1-08 | Add module-level tests | P1-01 through P1-07 | Cover scheduling rules, client isolation, EMR count/search/edit, inventory adjustments, billing totals, payment states, and data import behavior. |

**P1 exit criteria:** The clinic can operate its normal appointment, patient, EMR, inventory, billing, payment, administration, and client-portal workflows using persisted data.

### P2 — Hardening, maintainability, and release polish

| ID | Task | Dependencies | Required deliverable and completion check |
|---|---|---|---|
| P2-01 | Apply Angular architecture standards | P0-15 | Convert remaining state to signals, use `inject()`, native control flow, class/style bindings, typed timer handles, focused services, and lazy feature loading. |
| P2-02 | Improve performance | P1-08 | Review bundle size, lazy-load feature routes, optimize repeated calculations and tables, and verify acceptable loading on realistic clinic devices. |
| P2-03 | Complete security hardening | P1-07 | Add HTTPS deployment, secret management, secure headers, rate limits, session/token safeguards, input sanitization, backup checks, and audit review. |
| P2-04 | Complete accessibility review | P1-08 | Perform keyboard, screen-reader, zoom, reduced-motion, contrast, and axe review across all routes and fix remaining findings. |
| P2-05 | Complete XAMPP deployment documentation | P2-03 | Document Angular build output, Apache rewrite rules, base href, PHP or Django API startup, MySQL setup, migrations, seed data, backups, and environment configuration. |
| P2-06 | Remove prototype artifacts | P2-01 through P2-05 | Remove placeholder pages, debug logging, browser alerts/confirms, dead actions, stale comments, and unused code. |
| P2-07 | Conduct release review | P2-01 through P2-06 | Verify every PRD acceptance criterion, produce a traceability report, and record any approved exception before release. |

**P2 exit criteria:** The application is maintainable, secure, documented, performant, accessible, responsive, and ready for controlled clinic deployment.

### 16.1 Task tracking rules

- Every code change must reference one or more task IDs from this section.
- A task cannot be marked complete when it only changes the UI while its API, persistence, authorization, validation, or accessibility requirement is unfinished.
- Changes affecting inventory, Billing, EMR, patients, payments, or authentication require updated tests and audit consideration.
- Any blocked dependency must be recorded in the task rather than bypassed with hard-coded mock success behavior.
