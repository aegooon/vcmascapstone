<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
$config = require __DIR__ . '/config.php';
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && $origin === ($config['allowed_origin'] ?? '')) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    header('Vary: Origin');
}
if ($origin !== '' && $origin !== ($config['allowed_origin'] ?? '')) {
    http_response_code(403);
    echo json_encode(['error' => ['code' => 'ORIGIN_DENIED', 'message' => 'Origin is not allowed.']]);
    exit;
}
session_name((string) $config['session_name']);
session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off']);
session_start();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_SLASHES);
    exit;
}

function input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function db(array $config): PDO
{
    static $pdo;
    if ($pdo instanceof PDO) return $pdo;
    $pdo = new PDO($config['db']['dsn'], $config['db']['user'], $config['db']['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

function user(PDO $pdo): ?array
{
    $id = $_SESSION['user_id'] ?? null;
    if (!is_string($id)) return null;
    $stmt = $pdo->prepare('SELECT u.id, u.email, u.full_name, u.phone, r.code AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = :id AND u.status = "active"');
    $stmt->execute(['id' => $id]);
    return $stmt->fetch() ?: null;
}

function requireUser(PDO $pdo): array
{
    $current = user($pdo);
    if ($current === null) respond(401, ['error' => ['code' => 'UNAUTHENTICATED', 'message' => 'Authentication is required.']]);
    return $current;
}

function uuid(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
}

try {
    $pdo = db($config);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $path = trim(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/', '/');
    $parts = explode('/', $path);
    $resource = $parts[count($parts) - 1] ?? '';

    if ($method === 'POST' && $resource === 'login') {
        $data = input();
        $email = strtolower(trim((string) ($data['email'] ?? $data['username'] ?? '')));
        $password = (string) ($data['password'] ?? '');
        $stmt = $pdo->prepare('SELECT u.*, r.code AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE LOWER(u.email) = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $record = $stmt->fetch();
        if (!$record || $record['status'] !== 'active' || !password_verify($password, $record['password_hash'])) {
            respond(401, ['error' => ['code' => 'INVALID_CREDENTIALS', 'message' => 'The email or password is incorrect.']]);
        }
        session_regenerate_id(true);
        $_SESSION['user_id'] = $record['id'];
        $pdo->prepare('UPDATE users SET last_login_at = UTC_TIMESTAMP(6) WHERE id = :id')->execute(['id' => $record['id']]);
        unset($record['password_hash'], $record['role_id'], $record['status']);
        respond(200, ['data' => ['user' => $record]]);
    }

    if ($method === 'POST' && $resource === 'register') {
        $data = input();
        $name = trim((string) ($data['fullName'] ?? $data['full_name'] ?? ''));
        $email = strtolower(trim((string) ($data['email'] ?? '')));
        $password = (string) ($data['password'] ?? '');
        $phone = trim((string) ($data['phone'] ?? ''));
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
            respond(422, ['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Name, valid email, and an eight-character password are required.']]);
        }
        $pdo->beginTransaction();
        $roleId = (int) $pdo->query("SELECT id FROM roles WHERE code = 'client'")->fetchColumn();
        $id = uuid();
        $pdo->prepare('INSERT INTO users (id, role_id, email, password_hash, full_name, phone) VALUES (:id, :role, :email, :hash, :name, :phone)')->execute(['id' => $id, 'role' => $roleId, 'email' => $email, 'hash' => password_hash($password, PASSWORD_DEFAULT), 'name' => $name, 'phone' => $phone ?: null]);
        $pdo->prepare('INSERT INTO clients (id, user_id, full_name, email, phone) VALUES (:id, :user, :name, :email, :phone)')->execute(['id' => uuid(), 'user' => $id, 'name' => $name, 'email' => $email, 'phone' => $phone ?: null]);
        $pdo->commit();
        respond(201, ['data' => ['message' => 'Registration successful.']]);
    }

    if ($method === 'POST' && $resource === 'logout') {
        $_SESSION = [];
        session_destroy();
        respond(200, ['data' => ['message' => 'Signed out.']]);
    }

    if ($method === 'GET' && $resource === 'me') respond(200, ['data' => ['user' => requireUser($pdo)]]);

    if ($method === 'GET' && $resource === 'clinic') {
        $settings = $pdo->query('SELECT clinic_name, address, mobile_number, telephone_number, opening_time, closing_time, timezone FROM clinic_settings WHERE id = 1')->fetch();
        respond(200, ['data' => ['clinic' => $settings ?: null]]);
    }

    $activeUser = requireUser($pdo);
    if ($activeUser['role'] === 'client' && !($method === 'GET' && $resource === 'invoices')) {
        respond(403, ['error' => ['code' => 'FORBIDDEN', 'message' => 'Staff access is required.']]);
    }

    if ($method === 'GET' && $resource === 'clients') {
        requireUser($pdo);
        $rows = $pdo->query('SELECT c.id, c.full_name, c.email FROM clients c ORDER BY c.full_name')->fetchAll();
        respond(200, ['data' => ['clients' => $rows]]);
    }

    if ($method === 'GET' && $resource === 'pets') {
        requireUser($pdo);
        $rows = $pdo->query('SELECT p.id, p.client_id, p.name, p.species, p.breed FROM pets p WHERE p.status = "active" ORDER BY p.name')->fetchAll();
        respond(200, ['data' => ['pets' => $rows]]);
    }

    if ($method === 'GET' && $resource === 'appointments') {
        requireUser($pdo);
        $rows = $pdo->query('SELECT a.id, DATE_FORMAT(a.starts_at, "%Y-%m-%d") AS appointment_date, DATE_FORMAT(a.starts_at, "%h:%i %p") AS appointment_time, p.name AS pet_name, p.breed, c.full_name AS owner_name, COALESCE(a.reason, "General appointment") AS reason, COALESCE(a.room, "Unassigned") AS room, a.status FROM appointments a JOIN pets p ON p.id = a.pet_id JOIN clients c ON c.id = a.client_id ORDER BY a.starts_at')->fetchAll();
        respond(200, ['data' => ['appointments' => $rows]]);
    }

    if ($method === 'POST' && $resource === 'appointments') {
        $current = requireUser($pdo);
        $data = input();
        $clientId = trim((string) ($data['client_id'] ?? ''));
        $petId = trim((string) ($data['pet_id'] ?? ''));
        $startsAt = trim((string) ($data['starts_at'] ?? ''));
        $endsAt = trim((string) ($data['ends_at'] ?? ''));
        $reason = trim((string) ($data['reason'] ?? ''));
        if ($clientId === '' || $petId === '' || $startsAt === '' || $endsAt === '') respond(422, ['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Client, patient, start time, and end time are required.']]);
        $start = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $startsAt, new DateTimeZone('Asia/Manila'));
        $end = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $endsAt, new DateTimeZone('Asia/Manila'));
        if (!$start || !$end || $start >= $end) respond(422, ['error' => ['code' => 'INVALID_TIME_RANGE', 'message' => 'Appointment start must be before appointment end.']]);
        $clinic = $pdo->query('SELECT opening_time, closing_time FROM clinic_settings WHERE id = 1')->fetch();
        if ($clinic && ($start->format('H:i:s') < $clinic['opening_time'] || $end->format('H:i:s') > $clinic['closing_time'])) respond(422, ['error' => ['code' => 'OUTSIDE_CLINIC_HOURS', 'message' => 'The appointment is outside clinic hours.']]);
        $pet = $pdo->prepare('SELECT id FROM pets WHERE id = :pet AND client_id = :client AND status = "active"');
        $pet->execute(['pet' => $petId, 'client' => $clientId]);
        if (!$pet->fetchColumn()) respond(422, ['error' => ['code' => 'INVALID_PATIENT_OWNER', 'message' => 'The patient does not belong to the selected client.']]);
        $vetId = trim((string) ($data['veterinarian_id'] ?? '')) ?: null;
        $conflictQuery = 'SELECT id FROM appointments WHERE status NOT IN ("cancelled", "no_show") AND starts_at < :ends_at AND ends_at > :starts_at';
        $conflictParams = ['starts_at' => $start->format('Y-m-d H:i:s'), 'ends_at' => $end->format('Y-m-d H:i:s')];
        if ($vetId !== null) { $conflictQuery .= ' AND veterinarian_id = :vet'; $conflictParams['vet'] = $vetId; }
        $conflict = $pdo->prepare($conflictQuery . ' LIMIT 1');
        $conflict->execute($conflictParams);
        if ($conflict->fetch()) respond(409, ['error' => ['code' => 'SCHEDULE_CONFLICT', 'message' => 'The requested time conflicts with an existing appointment.']]);
        $id = uuid();
        $pdo->prepare('INSERT INTO appointments (id, client_id, pet_id, veterinarian_id, service_id, room, starts_at, ends_at, status, reason, created_by) VALUES (:id, :client, :pet, :vet, :service, :room, :starts, :ends, "requested", :reason, :created_by)')->execute(['id' => $id, 'client' => $clientId, 'pet' => $petId, 'vet' => $vetId, 'service' => trim((string) ($data['service_id'] ?? '')) ?: null, 'room' => trim((string) ($data['room'] ?? '')) ?: null, 'starts' => $start->format('Y-m-d H:i:s'), 'ends' => $end->format('Y-m-d H:i:s'), 'reason' => $reason ?: null, 'created_by' => $current['id']]);
        respond(201, ['data' => ['appointment_id' => $id, 'status' => 'requested']]);
    }

    if ($method === 'PATCH' && ($parts[count($parts) - 2] ?? '') === 'appointments') {
        requireUser($pdo);
        $appointmentId = $resource;
        $data = input();
        $allowed = ['requested', 'scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'];
        $status = (string) ($data['status'] ?? '');
        if (!in_array($status, $allowed, true)) respond(422, ['error' => ['code' => 'INVALID_STATUS', 'message' => 'Unsupported appointment status.']]);
        $stmt = $pdo->prepare('UPDATE appointments SET status = :status, cancellation_reason = :reason WHERE id = :id AND status NOT IN ("completed", "cancelled", "no_show")');
        $stmt->execute(['id' => $appointmentId, 'status' => $status, 'reason' => $status === 'cancelled' ? trim((string) ($data['cancellation_reason'] ?? '')) : null]);
        if ($stmt->rowCount() === 0) respond(409, ['error' => ['code' => 'STATUS_TRANSITION_REJECTED', 'message' => 'This appointment cannot move to the requested status.']]);
        respond(200, ['data' => ['appointment_id' => $appointmentId, 'status' => $status]]);
    }

    if ($method === 'DELETE' && ($parts[count($parts) - 2] ?? '') === 'appointments') {
        requireUser($pdo);
        $appointmentId = $resource;
        $stmt = $pdo->prepare('UPDATE appointments SET status = "cancelled", cancellation_reason = :reason WHERE id = :id AND status NOT IN ("completed", "cancelled", "no_show")');
        $stmt->execute(['id' => $appointmentId, 'reason' => trim((string) (input()['reason'] ?? 'Cancelled by staff'))]);
        if ($stmt->rowCount() === 0) respond(409, ['error' => ['code' => 'CANNOT_CANCEL', 'message' => 'This appointment cannot be cancelled.']]);
        respond(200, ['data' => ['appointment_id' => $appointmentId, 'status' => 'cancelled']]);
    }

    if ($method === 'GET' && $resource === 'inventory') {
        requireUser($pdo);
        $rows = $pdo->query('SELECT id, sku, name, category, unit, quantity_on_hand, reorder_level, unit_cost, client_price, chargeable, active, updated_at FROM inventory_items WHERE active = 1 ORDER BY name')->fetchAll();
        respond(200, ['data' => ['items' => $rows]]);
    }

    if (($resource === 'items' && $method === 'POST') || ($method === 'PATCH' && ($parts[count($parts) - 2] ?? '') === 'items')) {
        requireUser($pdo);
        $data = input();
        $name = trim((string) ($data['name'] ?? ''));
        $category = (string) ($data['category'] ?? 'other');
        $unit = trim((string) ($data['unit'] ?? ''));
        $quantity = (float) ($data['quantity_on_hand'] ?? 0);
        $reorder = (float) ($data['reorder_level'] ?? 0);
        $cost = (float) ($data['unit_cost'] ?? 0);
        $price = (float) ($data['client_price'] ?? 0);
        $categories = ['drugs', 'medical_items', 'laboratory_equipment', 'pet_food', 'pet_supplies', 'other'];
        if ($name === '' || $unit === '' || !in_array($category, $categories, true) || $quantity < 0 || $reorder < 0 || $cost < 0 || $price < 0) respond(422, ['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Name, category, unit, and non-negative quantities and prices are required.']]);
        if ($method === 'POST') {
            $id = uuid();
            $pdo->prepare('INSERT INTO inventory_items (id, sku, name, category, unit, supplier_name, quantity_on_hand, reorder_level, unit_cost, client_price, chargeable, active) VALUES (:id, :sku, :name, :category, :unit, :supplier, :quantity, :reorder, :cost, :price, :chargeable, 1)')->execute(['id' => $id, 'sku' => trim((string) ($data['sku'] ?? '')) ?: null, 'name' => $name, 'category' => $category, 'unit' => $unit, 'supplier' => trim((string) ($data['supplier_name'] ?? '')) ?: null, 'quantity' => $quantity, 'reorder' => $reorder, 'cost' => $cost, 'price' => $price, 'chargeable' => !empty($data['chargeable']) ? 1 : 0]);
            respond(201, ['data' => ['id' => $id]]);
        }
        $id = $parts[count($parts) - 2] ?? '';
        $stmt = $pdo->prepare('UPDATE inventory_items SET name = :name, category = :category, unit = :unit, quantity_on_hand = :quantity, reorder_level = :reorder, unit_cost = :cost, client_price = :price WHERE id = :id AND active = 1');
        $stmt->execute(['id' => $id, 'name' => $name, 'category' => $category, 'unit' => $unit, 'quantity' => $quantity, 'reorder' => $reorder, 'cost' => $cost, 'price' => $price]);
        if ($stmt->rowCount() === 0) respond(404, ['error' => ['code' => 'ITEM_NOT_FOUND', 'message' => 'The inventory item was not found.']]);
        respond(200, ['data' => ['id' => $id]]);
    }

    if ($method === 'DELETE' && $resource !== '' && count($parts) >= 2 && ($parts[count($parts) - 2] ?? '') === 'items') {
        requireUser($pdo);
        $id = $resource;
        $stmt = $pdo->prepare('UPDATE inventory_items SET active = 0 WHERE id = :id AND active = 1');
        $stmt->execute(['id' => $id]);
        if ($stmt->rowCount() === 0) respond(404, ['error' => ['code' => 'ITEM_NOT_FOUND', 'message' => 'The inventory item was not found.']]);
        respond(200, ['data' => ['id' => $id, 'deleted' => true]]);
    }

    if ($method === 'POST' && $resource === 'transactions') {
        $current = requireUser($pdo);
        $data = input();
        $itemId = trim((string) ($data['inventory_item_id'] ?? ''));
        $type = (string) ($data['type'] ?? '');
        $quantity = (float) ($data['quantity'] ?? 0);
        $reason = trim((string) ($data['reason'] ?? ''));
        $requestId = trim((string) ($data['client_request_id'] ?? ''));
        $allowedTypes = ['purchase', 'patient_usage', 'return', 'wastage', 'correction'];
        if ($itemId === '' || !in_array($type, $allowedTypes, true) || $quantity <= 0 || $reason === '' || $requestId === '') {
            respond(422, ['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Item, transaction type, positive quantity, reason, and client_request_id are required.']]);
        }
        $existing = $pdo->prepare('SELECT id, invoice_id FROM inventory_transactions WHERE client_request_id = :request_id');
        $existing->execute(['request_id' => $requestId]);
        if ($duplicate = $existing->fetch()) respond(200, ['data' => ['transaction_id' => $duplicate['id'], 'invoice_id' => $duplicate['invoice_id'], 'idempotent' => true]]);

        $pdo->beginTransaction();
        $itemStmt = $pdo->prepare('SELECT * FROM inventory_items WHERE id = :id AND active = 1 FOR UPDATE');
        $itemStmt->execute(['id' => $itemId]);
        $item = $itemStmt->fetch();
        if (!$item) { $pdo->rollBack(); respond(404, ['error' => ['code' => 'ITEM_NOT_FOUND', 'message' => 'The inventory item was not found.']]); }
        $delta = in_array($type, ['purchase', 'return'], true) ? $quantity : -$quantity;
        if ($type === 'correction') $delta = (float) ($data['quantity_delta'] ?? 0);
        $before = (float) $item['quantity_on_hand'];
        $after = $before + $delta;
        if ($after < 0) { $pdo->rollBack(); respond(409, ['error' => ['code' => 'INSUFFICIENT_STOCK', 'message' => 'The transaction would create negative stock.']]); }
        $patientId = trim((string) ($data['patient_id'] ?? '')) ?: null;
        if ($type === 'patient_usage' && $patientId === null) { $pdo->rollBack(); respond(422, ['error' => ['code' => 'PATIENT_REQUIRED', 'message' => 'Patient usage must identify a patient.']]); }
        $invoiceId = null;
        if ($type === 'patient_usage' && (bool) $item['chargeable']) {
            $clientStmt = $pdo->prepare('SELECT client_id FROM pets WHERE id = :pet');
            $clientStmt->execute(['pet' => $patientId]);
            $clientId = $clientStmt->fetchColumn();
            if (!$clientId) { $pdo->rollBack(); respond(422, ['error' => ['code' => 'PATIENT_NOT_FOUND', 'message' => 'The patient was not found.']]); }
            $invoiceId = uuid();
            $invoiceNumber = 'INV-' . gmdate('YmdHis') . '-' . strtoupper(bin2hex(random_bytes(2)));
            $pdo->prepare('INSERT INTO invoices (id, invoice_number, client_id, pet_id, status, subtotal, total, balance_due, created_by) VALUES (:id, :number, :client, :pet, "issued", :total, :total, :total, :user)')->execute(['id' => $invoiceId, 'number' => $invoiceNumber, 'client' => $clientId, 'pet' => $patientId, 'total' => round($quantity * (float) $item['client_price'], 2), 'user' => $current['id']]);
        }
        $transactionId = uuid();
        $pdo->prepare('INSERT INTO inventory_transactions (id, inventory_item_id, type, quantity_delta, quantity_before, quantity_after, unit_cost, client_price, patient_id, invoice_id, reason, client_request_id, created_by) VALUES (:id, :item, :type, :delta, :before, :after, :cost, :price, :patient, :invoice, :reason, :request_id, :user)')->execute(['id' => $transactionId, 'item' => $itemId, 'type' => $type, 'delta' => $delta, 'before' => $before, 'after' => $after, 'cost' => $item['unit_cost'], 'price' => $item['client_price'], 'patient' => $patientId, 'invoice' => $invoiceId, 'reason' => $reason, 'request_id' => $requestId, 'user' => $current['id']]);
        if ($invoiceId !== null) {
            $lineTotal = round($quantity * (float) $item['client_price'], 2);
            $pdo->prepare('INSERT INTO invoice_lines (id, invoice_id, line_type, description, inventory_transaction_id, quantity, unit_price, line_total) VALUES (:id, :invoice, "inventory", :description, :transaction, :quantity, :price, :total)')->execute(['id' => uuid(), 'invoice' => $invoiceId, 'description' => $item['name'], 'transaction' => $transactionId, 'quantity' => $quantity, 'price' => $item['client_price'], 'total' => $lineTotal]);
        }
        $pdo->prepare('UPDATE inventory_items SET quantity_on_hand = :quantity WHERE id = :id')->execute(['quantity' => $after, 'id' => $itemId]);
        $pdo->commit();
        respond(201, ['data' => ['transaction_id' => $transactionId, 'invoice_id' => $invoiceId, 'quantity_after' => $after, 'idempotent' => false]]);
    }

    if ($method === 'GET' && $resource === 'transactions') {
        requireUser($pdo);
        $rows = $pdo->query('SELECT t.id, t.type, t.quantity_delta, t.quantity_before, t.quantity_after, t.reason, t.created_at, i.name AS item_name, t.invoice_id FROM inventory_transactions t JOIN inventory_items i ON i.id = t.inventory_item_id ORDER BY t.created_at DESC LIMIT 100')->fetchAll();
        respond(200, ['data' => ['transactions' => $rows]]);
    }

    if ($method === 'GET' && $resource === 'invoices') {
        $current = requireUser($pdo);
        if ($current['role'] === 'client') {
            $stmt = $pdo->prepare('SELECT i.id, i.invoice_number, i.status, i.subtotal, i.tax_total, i.discount_total, i.total, i.amount_paid, i.balance_due, i.created_at FROM invoices i JOIN clients c ON c.id = i.client_id WHERE c.user_id = :user ORDER BY i.created_at DESC');
            $stmt->execute(['user' => $current['id']]);
            $rows = $stmt->fetchAll();
        } else {
            $rows = $pdo->query('SELECT id, invoice_number, status, subtotal, tax_total, discount_total, total, amount_paid, balance_due, created_at FROM invoices ORDER BY created_at DESC')->fetchAll();
        }
        respond(200, ['data' => ['invoices' => $rows]]);
    }

    if ($method === 'POST' && $resource === 'invoices') {
        $current = requireUser($pdo);
        $data = input();
        $clientId = trim((string) ($data['client_id'] ?? ''));
        $petId = trim((string) ($data['pet_id'] ?? '')) ?: null;
        $lines = $data['lines'] ?? [];
        if ($clientId === '' || !is_array($lines) || count($lines) === 0) respond(422, ['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'A client and at least one invoice line are required.']]);
        $clientStmt = $pdo->prepare('SELECT id FROM clients WHERE id = :id');
        $clientStmt->execute(['id' => $clientId]);
        if (!$clientStmt->fetchColumn()) respond(422, ['error' => ['code' => 'CLIENT_NOT_FOUND', 'message' => 'The selected client was not found.']]);
        if ($petId !== null) {
            $petStmt = $pdo->prepare('SELECT id FROM pets WHERE id = :pet AND client_id = :client AND status = "active"');
            $petStmt->execute(['pet' => $petId, 'client' => $clientId]);
            if (!$petStmt->fetchColumn()) respond(422, ['error' => ['code' => 'INVALID_PATIENT_OWNER', 'message' => 'The patient does not belong to the selected client.']]);
        }
        $pdo->beginTransaction();
        $subtotal = 0.0;
        $taxTotal = 0.0;
        $normalized = [];
        foreach ($lines as $line) {
            $description = trim((string) ($line['description'] ?? ''));
            $quantity = (float) ($line['quantity'] ?? 0);
            $unitPrice = (float) ($line['unit_price'] ?? 0);
            $taxRate = (float) ($line['tax_rate'] ?? 0);
            if ($description === '' || $quantity <= 0 || $unitPrice < 0 || $taxRate < 0 || $taxRate > 100) { $pdo->rollBack(); respond(422, ['error' => ['code' => 'INVALID_LINE', 'message' => 'Invoice lines must have valid descriptions, quantities, prices, and tax rates.']]); }
            $lineSubtotal = round($quantity * $unitPrice, 2);
            $lineTax = round($lineSubtotal * ($taxRate / 100), 2);
            $subtotal += $lineSubtotal;
            $taxTotal += $lineTax;
            $normalized[] = [$description, $quantity, $unitPrice, $lineTax, $lineSubtotal + $lineTax, $line['service_id'] ?? null];
        }
        $discount = max(0.0, (float) ($data['discount_total'] ?? 0));
        if ($discount > $subtotal + $taxTotal) { $pdo->rollBack(); respond(422, ['error' => ['code' => 'INVALID_DISCOUNT', 'message' => 'Discount cannot exceed the invoice amount.']]); }
        $total = round($subtotal + $taxTotal - $discount, 2);
        $invoiceId = uuid();
        $number = 'INV-' . gmdate('YmdHis') . '-' . strtoupper(bin2hex(random_bytes(2)));
        $pdo->prepare('INSERT INTO invoices (id, invoice_number, client_id, pet_id, status, subtotal, tax_total, discount_total, total, balance_due, created_by) VALUES (:id, :number, :client, :pet, "issued", :subtotal, :tax, :discount, :total, :total, :user)')->execute(['id' => $invoiceId, 'number' => $number, 'client' => $clientId, 'pet' => $petId, 'subtotal' => $subtotal, 'tax' => $taxTotal, 'discount' => $discount, 'total' => $total, 'user' => $current['id']]);
        foreach ($normalized as [$description, $quantity, $unitPrice, $lineTax, $lineTotal, $serviceId]) {
            $pdo->prepare('INSERT INTO invoice_lines (id, invoice_id, line_type, description, service_id, quantity, unit_price, tax_amount, line_total) VALUES (:id, :invoice, :type, :description, :service, :quantity, :price, :tax, :total)')->execute(['id' => uuid(), 'invoice' => $invoiceId, 'type' => $serviceId ? 'service' : 'adjustment', 'description' => $description, 'service' => $serviceId ?: null, 'quantity' => $quantity, 'price' => $unitPrice, 'tax' => $lineTax, 'total' => $lineTotal]);
        }
        $pdo->commit();
        respond(201, ['data' => ['invoice_id' => $invoiceId, 'invoice_number' => $number, 'subtotal' => $subtotal, 'tax_total' => $taxTotal, 'discount_total' => $discount, 'total' => $total, 'balance_due' => $total]]);
    }

    if ($method === 'POST' && $resource === 'payments') {
        $current = requireUser($pdo);
        $data = input();
        $invoiceId = trim((string) ($data['invoice_id'] ?? ''));
        $amount = (float) ($data['amount'] ?? 0);
        $methodName = (string) ($data['method'] ?? '');
        if ($invoiceId === '' || $amount <= 0 || !in_array($methodName, ['cash', 'card', 'bank_transfer', 'gcash', 'other'], true)) respond(422, ['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Invoice, positive amount, and supported payment method are required.']]);
        $pdo->beginTransaction();
        $invoiceStmt = $pdo->prepare('SELECT * FROM invoices WHERE id = :id FOR UPDATE');
        $invoiceStmt->execute(['id' => $invoiceId]);
        $invoice = $invoiceStmt->fetch();
        if (!$invoice || in_array($invoice['status'], ['void', 'refunded'], true)) { $pdo->rollBack(); respond(404, ['error' => ['code' => 'INVOICE_UNAVAILABLE', 'message' => 'The invoice is unavailable for payment.']]); }
        if ($amount > (float) $invoice['balance_due']) { $pdo->rollBack(); respond(422, ['error' => ['code' => 'OVERPAYMENT', 'message' => 'Payment cannot exceed the outstanding balance.']]); }
        $paymentId = uuid();
        $pdo->prepare('INSERT INTO payments (id, invoice_id, amount, method, status, reference, paid_at, received_by) VALUES (:id, :invoice, :amount, :method, "completed", :reference, UTC_TIMESTAMP(6), :user)')->execute(['id' => $paymentId, 'invoice' => $invoiceId, 'amount' => $amount, 'method' => $methodName, 'reference' => trim((string) ($data['reference'] ?? '')) ?: null, 'user' => $current['id']]);
        $paid = round((float) $invoice['amount_paid'] + $amount, 2);
        $balance = round((float) $invoice['total'] - $paid, 2);
        $status = $balance <= 0 ? 'paid' : 'partially_paid';
        $pdo->prepare('UPDATE invoices SET amount_paid = :paid, balance_due = :balance, status = :status WHERE id = :id')->execute(['paid' => $paid, 'balance' => max(0, $balance), 'status' => $status, 'id' => $invoiceId]);
        $pdo->commit();
        respond(201, ['data' => ['payment_id' => $paymentId, 'invoice_id' => $invoiceId, 'amount_paid' => $paid, 'balance_due' => max(0, $balance), 'status' => $status]]);
    }

    if ($method === 'GET' && $resource === 'payments') {
        requireUser($pdo);
        $rows = $pdo->query('SELECT p.id, p.invoice_id, i.invoice_number, p.amount, p.method, p.status, p.reference, p.paid_at FROM payments p JOIN invoices i ON i.id = p.invoice_id ORDER BY p.paid_at DESC LIMIT 100')->fetchAll();
        respond(200, ['data' => ['payments' => $rows]]);
    }

    if ($method === 'POST' && $resource === 'void' && count($parts) >= 2) {
        $current = requireUser($pdo);
        $invoiceId = $parts[count($parts) - 2];
        $stmt = $pdo->prepare('UPDATE invoices SET status = "void", balance_due = 0 WHERE id = :id AND status NOT IN ("paid", "refunded")');
        $stmt->execute(['id' => $invoiceId]);
        if ($stmt->rowCount() === 0) respond(409, ['error' => ['code' => 'CANNOT_VOID', 'message' => 'Only unpaid invoices can be voided.']]);
        respond(200, ['data' => ['invoice_id' => $invoiceId, 'status' => 'void', 'updated_by' => $current['id']]]);
    }

    if ($method === 'POST' && $resource === 'refund' && count($parts) >= 2) {
        $current = requireUser($pdo);
        $paymentId = $parts[count($parts) - 2];
        $data = input();
        $amount = (float) ($data['amount'] ?? 0);
        $reason = trim((string) ($data['reason'] ?? ''));
        $requestId = trim((string) ($data['client_request_id'] ?? ''));
        if ($amount <= 0 || $reason === '' || $requestId === '') respond(422, ['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Positive amount, reason, and client_request_id are required.']]);
        $duplicate = $pdo->prepare('SELECT id FROM refunds WHERE client_request_id = :request_id');
        $duplicate->execute(['request_id' => $requestId]);
        $duplicateId = $duplicate->fetchColumn();
        if ($duplicateId) respond(200, ['data' => ['refund_id' => $duplicateId, 'idempotent' => true]]);
        $pdo->beginTransaction();
        $paymentStmt = $pdo->prepare('SELECT p.*, i.id AS invoice_id FROM payments p JOIN invoices i ON i.id = p.invoice_id WHERE p.id = :id AND p.status = "completed" FOR UPDATE');
        $paymentStmt->execute(['id' => $paymentId]);
        $payment = $paymentStmt->fetch();
        if (!$payment || $amount > (float) $payment['amount']) { $pdo->rollBack(); respond(422, ['error' => ['code' => 'INVALID_REFUND', 'message' => 'Refund exceeds the completed payment.']]); }
        $refundId = uuid();
        $pdo->prepare('INSERT INTO refunds (id, payment_id, amount, reason, client_request_id, recorded_by) VALUES (:id, :payment, :amount, :reason, :request_id, :user)')->execute(['id' => $refundId, 'payment' => $paymentId, 'amount' => $amount, 'reason' => $reason, 'request_id' => $requestId, 'user' => $current['id']]);
        $pdo->prepare('UPDATE payments SET status = "refunded" WHERE id = :id')->execute(['id' => $paymentId]);
        $pdo->prepare('UPDATE invoices SET amount_paid = GREATEST(0, amount_paid - :amount), balance_due = LEAST(total, balance_due + :amount), status = "partially_paid" WHERE id = :id')->execute(['amount' => $amount, 'id' => $payment['invoice_id']]);
        $pdo->commit();
        respond(201, ['data' => ['refund_id' => $refundId, 'payment_id' => $paymentId, 'amount' => $amount, 'idempotent' => false]]);
    }

    if ($method === 'GET' && $resource === 'emr') {
        requireUser($pdo);
        $count = (int) $pdo->query('SELECT COUNT(*) FROM pets WHERE status = "active"')->fetchColumn();
        $rows = $pdo->query('SELECT p.id, p.name, p.species, p.breed, c.full_name AS client_name, MAX(v.visited_at) AS last_visit FROM pets p JOIN clients c ON c.id = p.client_id LEFT JOIN emr_visits v ON v.pet_id = p.id WHERE p.status = "active" GROUP BY p.id, p.name, p.species, p.breed, c.full_name ORDER BY p.name')->fetchAll();
        respond(200, ['data' => ['patient_count' => $count, 'patients' => $rows]]);
    }

    if ($method === 'POST' && $resource === 'visits') {
        $current = requireUser($pdo);
        $data = input();
        $petId = trim((string) ($data['pet_id'] ?? ''));
        $notes = trim((string) ($data['clinical_notes'] ?? ''));
        if ($petId === '' || $notes === '') respond(422, ['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Patient and clinical notes are required.']]);
        $pet = $pdo->prepare('SELECT id FROM pets WHERE id = :id AND status = "active"');
        $pet->execute(['id' => $petId]);
        if (!$pet->fetchColumn()) respond(404, ['error' => ['code' => 'PATIENT_NOT_FOUND', 'message' => 'The patient was not found.']]);
        $visitId = uuid();
        $pdo->prepare('INSERT INTO emr_visits (id, pet_id, author_id, visited_at, weight_kg, temperature_c, clinical_notes, diagnosis, treatment_plan, follow_up_instructions) VALUES (:id, :pet, :author, COALESCE(:visited_at, UTC_TIMESTAMP(6)), :weight, :temperature, :notes, :diagnosis, :treatment, :follow_up)')->execute(['id' => $visitId, 'pet' => $petId, 'author' => $current['id'], 'visited_at' => trim((string) ($data['visited_at'] ?? '')) ?: null, 'weight' => ($data['weight_kg'] ?? null) !== null ? (float) $data['weight_kg'] : null, 'temperature' => ($data['temperature_c'] ?? null) !== null ? (float) $data['temperature_c'] : null, 'notes' => $notes, 'diagnosis' => trim((string) ($data['diagnosis'] ?? '')) ?: null, 'treatment' => trim((string) ($data['treatment_plan'] ?? '')) ?: null, 'follow_up' => trim((string) ($data['follow_up_instructions'] ?? '')) ?: null]);
        respond(201, ['data' => ['visit_id' => $visitId, 'pet_id' => $petId]]);
    }

    if ($method === 'GET' && $resource === 'visits' && ($parts[count($parts) - 3] ?? '') === 'pets') {
        requireUser($pdo);
        $petId = $parts[count($parts) - 2];
        $stmt = $pdo->prepare('SELECT v.id, v.visited_at, v.clinical_notes, v.diagnosis, v.treatment_plan, v.follow_up_instructions, u.full_name AS author_name FROM emr_visits v JOIN users u ON u.id = v.author_id WHERE v.pet_id = :pet ORDER BY v.visited_at DESC');
        $stmt->execute(['pet' => $petId]);
        respond(200, ['data' => ['visits' => $stmt->fetchAll()]]);
    }

    if ($method === 'GET' && ($parts[count($parts) - 2] ?? '') === 'attachments') {
        $attachmentId = $resource;
        $stmt = $pdo->prepare('SELECT original_name, media_type, storage_path FROM emr_attachments WHERE id = :id');
        $stmt->execute(['id' => $attachmentId]);
        $attachment = $stmt->fetch();
        if (!$attachment) respond(404, ['error' => ['code' => 'NOT_FOUND', 'message' => 'Attachment not found.']]);
        $uploadRoot = realpath((string) $config['upload_dir']);
        $filePath = realpath((string) $attachment['storage_path']);
        if (!$uploadRoot || !$filePath || !str_starts_with($filePath, $uploadRoot . DIRECTORY_SEPARATOR) || !is_file($filePath)) {
            respond(404, ['error' => ['code' => 'FILE_MISSING', 'message' => 'Attachment file is unavailable.']]);
        }
        header('Content-Type: ' . $attachment['media_type']);
        header('Content-Disposition: attachment; filename="' . str_replace(['"', "\r", "\n"], '', basename($attachment['original_name'])) . '"');
        header('Content-Length: ' . filesize($filePath));
        readfile($filePath);
        exit;
    }

    if ($method === 'POST' && $resource === 'attachments' && ($parts[count($parts) - 3] ?? '') === 'pets') {
        $petId = $parts[count($parts) - 2];
        $file = $_FILES['file'] ?? null;
        if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || ($file['size'] ?? 0) < 1 || $file['size'] > 5 * 1024 * 1024) {
            respond(422, ['error' => ['code' => 'INVALID_FILE', 'message' => 'Select a file smaller than 5 MB.']]);
        }
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        $extensions = ['application/pdf' => 'pdf', 'image/png' => 'png', 'image/jpeg' => 'jpg'];
        if (!isset($extensions[$mime])) respond(422, ['error' => ['code' => 'INVALID_FILE_TYPE', 'message' => 'Only PDF, PNG, and JPEG files are supported.']]);
        $petStmt = $pdo->prepare('SELECT id FROM pets WHERE id = :id');
        $petStmt->execute(['id' => $petId]);
        if (!$petStmt->fetchColumn()) respond(404, ['error' => ['code' => 'PATIENT_NOT_FOUND', 'message' => 'Patient not found.']]);
        $uploadDir = (string) $config['upload_dir'];
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0700, true) && !is_dir($uploadDir)) throw new RuntimeException('Unable to create attachment directory.');
        $attachmentId = uuid();
        $storagePath = rtrim($uploadDir, '/\\') . DIRECTORY_SEPARATOR . $attachmentId . '.' . $extensions[$mime];
        if (!move_uploaded_file($file['tmp_name'], $storagePath)) throw new RuntimeException('Unable to store attachment.');
        try {
            $pdo->beginTransaction();
            $pdo->prepare('INSERT INTO emr_attachments (id, pet_id, storage_path, original_name, media_type, size_bytes, uploaded_by) VALUES (:id, :pet, :path, :name, :mime, :size, :user)')->execute(['id' => $attachmentId, 'pet' => $petId, 'path' => $storagePath, 'name' => substr(basename((string) $file['name']), 0, 255), 'mime' => $mime, 'size' => $file['size'], 'user' => $activeUser['id']]);
            $pdo->prepare('INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id, metadata) VALUES (:id, :user, "uploaded", "emr_attachment", :pet, :metadata)')->execute(['id' => uuid(), 'user' => $activeUser['id'], 'pet' => $petId, 'metadata' => json_encode(['attachment_id' => $attachmentId], JSON_THROW_ON_ERROR)]);
            $pdo->commit();
        } catch (Throwable $exception) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            unlink($storagePath);
            throw $exception;
        }
        respond(201, ['data' => ['attachment_id' => $attachmentId]]);
    }

    if (in_array($method, ['GET', 'POST'], true) && $resource === 'records' && ($parts[count($parts) - 3] ?? '') === 'pets') {
        $current = requireUser($pdo);
        $petId = $parts[count($parts) - 2];
        if ($method === 'GET') {
            $vaccinations = $pdo->prepare('SELECT id, vaccine_name, administered_at, next_due_at, batch_number, notes FROM emr_vaccinations WHERE pet_id = :pet ORDER BY administered_at DESC');
            $vaccinations->execute(['pet' => $petId]);
            $labs = $pdo->prepare('SELECT id, test_name, status, result_summary, ordered_at, reviewed_at FROM emr_laboratory_results WHERE pet_id = :pet ORDER BY ordered_at DESC');
            $labs->execute(['pet' => $petId]);
            $medications = $pdo->prepare('SELECT id, medication_name, dosage, route, frequency, starts_on, ends_on, instructions FROM emr_medications WHERE pet_id = :pet ORDER BY starts_on DESC');
            $medications->execute(['pet' => $petId]);
            $attachments = $pdo->prepare('SELECT id, original_name, media_type, size_bytes, created_at FROM emr_attachments WHERE pet_id = :pet ORDER BY created_at DESC');
            $attachments->execute(['pet' => $petId]);
            $audit = $pdo->prepare('SELECT action, entity_type, metadata, created_at FROM audit_events WHERE entity_id = :pet ORDER BY created_at DESC LIMIT 50');
            $audit->execute(['pet' => $petId]);
            respond(200, ['data' => ['vaccinations' => $vaccinations->fetchAll(), 'laboratories' => $labs->fetchAll(), 'medications' => $medications->fetchAll(), 'attachments' => $attachments->fetchAll(), 'audit' => $audit->fetchAll()]]);
        }
        $data = input();
        $type = (string) ($data['type'] ?? '');
        $recordId = uuid();
        if ($type === 'vaccination' && trim((string) ($data['vaccine_name'] ?? '')) !== '') {
            $pdo->prepare('INSERT INTO emr_vaccinations (id, pet_id, vaccine_name, administered_at, next_due_at, batch_number, administered_by, notes) VALUES (:id, :pet, :name, COALESCE(:date, UTC_TIMESTAMP(6)), :next_due, :batch, :user, :notes)')->execute(['id' => $recordId, 'pet' => $petId, 'name' => trim((string) $data['vaccine_name']), 'date' => trim((string) ($data['administered_at'] ?? '')) ?: null, 'next_due' => trim((string) ($data['next_due_at'] ?? '')) ?: null, 'batch' => trim((string) ($data['batch_number'] ?? '')) ?: null, 'user' => $current['id'], 'notes' => trim((string) ($data['notes'] ?? '')) ?: null]);
        } elseif ($type === 'laboratory' && trim((string) ($data['test_name'] ?? '')) !== '') {
            $pdo->prepare('INSERT INTO emr_laboratory_results (id, pet_id, test_name, status, result_summary, ordered_at) VALUES (:id, :pet, :name, :status, :summary, COALESCE(:date, UTC_TIMESTAMP(6)))')->execute(['id' => $recordId, 'pet' => $petId, 'name' => trim((string) $data['test_name']), 'status' => in_array(($data['status'] ?? ''), ['ordered', 'collected', 'available', 'reviewed', 'cancelled'], true) ? $data['status'] : 'ordered', 'summary' => trim((string) ($data['result_summary'] ?? '')) ?: null, 'date' => trim((string) ($data['ordered_at'] ?? '')) ?: null]);
        } elseif ($type === 'medication' && trim((string) ($data['medication_name'] ?? '')) !== '') {
            $pdo->prepare('INSERT INTO emr_medications (id, pet_id, medication_name, dosage, route, frequency, starts_on, ends_on, instructions, prescribed_by) VALUES (:id, :pet, :name, :dosage, :route, :frequency, :starts, :ends, :instructions, :user)')->execute(['id' => $recordId, 'pet' => $petId, 'name' => trim((string) $data['medication_name']), 'dosage' => trim((string) ($data['dosage'] ?? '')) ?: null, 'route' => trim((string) ($data['route'] ?? '')) ?: null, 'frequency' => trim((string) ($data['frequency'] ?? '')) ?: null, 'starts' => trim((string) ($data['starts_on'] ?? '')) ?: null, 'ends' => trim((string) ($data['ends_on'] ?? '')) ?: null, 'instructions' => trim((string) ($data['instructions'] ?? '')) ?: null, 'user' => $current['id']]);
        } else respond(422, ['error' => ['code' => 'INVALID_RECORD', 'message' => 'A valid vaccination, laboratory, or medication record is required.']]);
        $pdo->prepare('INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id, metadata) VALUES (:id, :user, :action, :type, :entity, :metadata)')->execute(['id' => uuid(), 'user' => $current['id'], 'action' => 'created', 'type' => 'emr_' . $type, 'entity' => $petId, 'metadata' => json_encode(['record_id' => $recordId], JSON_THROW_ON_ERROR)]);
        respond(201, ['data' => ['record_id' => $recordId, 'type' => $type]]);
    }

    respond(404, ['error' => ['code' => 'NOT_FOUND', 'message' => 'The requested endpoint does not exist.']]);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log($exception->getMessage());
    respond(500, ['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'The server could not complete the request.']]);
}
