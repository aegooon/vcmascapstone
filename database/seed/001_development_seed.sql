-- VCMAS development seed data only.
-- Do not run this file against a production database.
-- All people, pets, appointments, and medical details below are fictional.
-- Development login password for all seeded users: DevOnly!ChangeMe123

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO clinic_settings
  (id, clinic_name, address, mobile_number, telephone_number, opening_time, closing_time, timezone)
VALUES
  (1, 'VCMAS Veterinary Clinic', '195 Rt. Aglipay St., Brgy. Poblacion, Mandaluyong City',
   '09311318670', '86717479', '09:00:00', '18:30:00', 'Asia/Manila')
ON DUPLICATE KEY UPDATE
  clinic_name = VALUES(clinic_name), address = VALUES(address),
  mobile_number = VALUES(mobile_number), telephone_number = VALUES(telephone_number),
  opening_time = VALUES(opening_time), closing_time = VALUES(closing_time),
  timezone = VALUES(timezone);

INSERT IGNORE INTO users
  (id, role_id, email, password_hash, full_name, phone, status)
SELECT '00000000-0000-4000-8000-000000000001', id,
  'admin@example.test', '$2y$10$yCgknzFQYcgZHOLHwSDhM.4VLoI1gbbAVpa4piHenO.F5iKhV409W',
  'Demo Administrator', '09000000001', 'active'
FROM roles WHERE code = 'administrator';

INSERT IGNORE INTO users
  (id, role_id, email, password_hash, full_name, phone, status)
SELECT '00000000-0000-4000-8000-000000000002', id,
  'vet@example.test', '$2y$10$yCgknzFQYcgZHOLHwSDhM.4VLoI1gbbAVpa4piHenO.F5iKhV409W',
  'Dr. Demo Veterinarian', '09000000002', 'active'
FROM roles WHERE code = 'veterinarian';

INSERT IGNORE INTO users
  (id, role_id, email, password_hash, full_name, phone, status)
SELECT '00000000-0000-4000-8000-000000000003', id,
  'staff@example.test', '$2y$10$yCgknzFQYcgZHOLHwSDhM.4VLoI1gbbAVpa4piHenO.F5iKhV409W',
  'Demo Clinic Staff', '09000000003', 'active'
FROM roles WHERE code = 'staff';

INSERT IGNORE INTO users
  (id, role_id, email, password_hash, full_name, phone, status)
SELECT '00000000-0000-4000-8000-000000000004', id,
  'client@example.test', '$2y$10$yCgknzFQYcgZHOLHwSDhM.4VLoI1gbbAVpa4piHenO.F5iKhV409W',
  'Demo Pet Owner', '09000000004', 'active'
FROM roles WHERE code = 'client';

INSERT IGNORE INTO clients
  (id, user_id, full_name, email, phone, address)
VALUES
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004',
   'Demo Pet Owner', 'client@example.test', '09000000004', 'Fictional Demo Address');

INSERT IGNORE INTO services (id, code, name, description, category, price, tax_rate, active) VALUES
  ('20000000-0000-4000-8000-000000000001', 'consultation', 'Consultation', 'General veterinary consultation.', 'clinical', 500.00, 0.00, TRUE),
  ('20000000-0000-4000-8000-000000000002', 'vaccination-deworming', 'Vaccination & Deworming', 'Preventive vaccination and deworming services.', 'preventive', 750.00, 0.00, TRUE),
  ('20000000-0000-4000-8000-000000000003', 'grooming', 'Grooming', 'Basic pet grooming service.', 'care', 600.00, 0.00, TRUE);

INSERT IGNORE INTO pets
  (id, client_id, name, species, breed, sex, date_of_birth, weight_kg, status, allergies, chronic_conditions)
VALUES
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   'Demo Bella', 'Dog', 'Golden Retriever', 'female', '2022-05-10', 24.500, 'active',
   'None recorded', 'None recorded');

INSERT IGNORE INTO inventory_items
  (id, sku, name, category, unit, supplier_name, quantity_on_hand, reorder_level, unit_cost, client_price, chargeable, active)
VALUES
  ('40000000-0000-4000-8000-000000000001', 'DEMO-RABIES-01', 'Rabies Vaccine (Demo)', 'drugs', 'vial', 'Demo Supplier', 19.000, 5.000, 180.00, 350.00, TRUE, TRUE),
  ('40000000-0000-4000-8000-000000000002', 'DEMO-GAUZE-01', 'Sterile Gauze (Demo)', 'medical_items', 'pack', 'Demo Supplier', 50.000, 10.000, 30.00, 0.00, FALSE, TRUE);

INSERT IGNORE INTO appointments
  (id, client_id, pet_id, veterinarian_id, service_id, room, starts_at, ends_at, status, reason, created_by)
VALUES
  ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   '30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002',
   '20000000-0000-4000-8000-000000000002', 'ROOM 1', '2026-10-15 09:00:00', '2026-10-15 09:30:00',
   'scheduled', 'Annual preventive care visit', '00000000-0000-4000-8000-000000000003');

INSERT IGNORE INTO emr_visits
  (id, pet_id, appointment_id, author_id, visited_at, weight_kg, temperature_c, chief_complaint, clinical_notes, diagnosis, treatment_plan, follow_up_instructions)
VALUES
  ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001',
   '50000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002',
   '2026-10-15 09:05:00', 24.500, 38.5, 'Routine preventive visit',
   'Fictional seed record for development and UI testing.', 'No acute findings',
   'Administer preventive care and observe for adverse reaction.', 'Return for annual preventive care.');

INSERT IGNORE INTO emr_vaccinations
  (id, pet_id, visit_id, vaccine_name, administered_at, next_due_at, batch_number, administered_by, notes)
VALUES
  ('61000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001',
   '60000000-0000-4000-8000-000000000001', 'Demo Rabies Vaccine', '2026-10-15 09:10:00',
   '2027-10-15', 'DEMO-BATCH-001', '00000000-0000-4000-8000-000000000002', 'Fictional seed record.');

INSERT IGNORE INTO invoices
  (id, invoice_number, client_id, pet_id, appointment_id, status, subtotal, tax_total, discount_total, total, amount_paid, balance_due, issued_at, created_by)
VALUES
  ('70000000-0000-4000-8000-000000000001', 'DEMO-INV-0001',
   '10000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001',
   '50000000-0000-4000-8000-000000000001', 'issued', 1100.00, 0.00, 0.00, 1100.00,
   0.00, 1100.00, '2026-10-15 09:15:00', '00000000-0000-4000-8000-000000000003');

INSERT IGNORE INTO inventory_transactions
  (id, inventory_item_id, type, quantity_delta, quantity_before, quantity_after, unit_cost, client_price, patient_id, visit_id, appointment_id, invoice_id, reason, client_request_id, created_by)
VALUES
  ('80000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001',
   'patient_usage', -1.000, 20.000, 19.000, 180.00, 350.00,
   '30000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001',
   '50000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001',
   'Fictional demo vaccination usage', 'demo-seed-usage-0001', '00000000-0000-4000-8000-000000000002');

INSERT IGNORE INTO invoice_lines
  (id, invoice_id, line_type, description, service_id, inventory_transaction_id, quantity, unit_price, tax_amount, line_total)
VALUES
  ('90000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001',
   'service', 'Vaccination & Deworming', '20000000-0000-4000-8000-000000000002', NULL, 1.000, 750.00, 0.00, 750.00),
  ('90000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000001',
   'inventory', 'Demo Rabies Vaccine (1 vial)', NULL, '80000000-0000-4000-8000-000000000001', 1.000, 350.00, 0.00, 350.00);

INSERT IGNORE INTO audit_events
  (id, actor_user_id, action, entity_type, entity_id, request_id, metadata)
VALUES
  ('a0000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'seed.created', 'patient', '30000000-0000-4000-8000-000000000001', 'demo-seed-0001', JSON_OBJECT('environment', 'development'));

INSERT IGNORE INTO schema_migrations (version) VALUES ('001_development_seed');
