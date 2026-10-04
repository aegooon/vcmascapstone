<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
$config = require __DIR__ . '/config.php';
session_name((string) $config['session_name']);
session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'secure' => false]);
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

    if ($method === 'GET' && $resource === 'inventory') {
        requireUser($pdo);
        $rows = $pdo->query('SELECT id, sku, name, category, unit, quantity_on_hand, reorder_level, unit_cost, client_price, chargeable, active, updated_at FROM inventory_items WHERE active = 1 ORDER BY name')->fetchAll();
        respond(200, ['data' => ['items' => $rows]]);
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

    if ($method === 'GET' && $resource === 'emr') {
        requireUser($pdo);
        $count = (int) $pdo->query('SELECT COUNT(*) FROM pets WHERE status = "active"')->fetchColumn();
        $rows = $pdo->query('SELECT p.id, p.name, p.species, p.breed, c.full_name AS client_name, MAX(v.visited_at) AS last_visit FROM pets p JOIN clients c ON c.id = p.client_id LEFT JOIN emr_visits v ON v.pet_id = p.id WHERE p.status = "active" GROUP BY p.id, p.name, p.species, p.breed, c.full_name ORDER BY p.name')->fetchAll();
        respond(200, ['data' => ['patient_count' => $count, 'patients' => $rows]]);
    }

    respond(404, ['error' => ['code' => 'NOT_FOUND', 'message' => 'The requested endpoint does not exist.']]);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log($exception->getMessage());
    respond(500, ['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'The server could not complete the request.']]);
}
