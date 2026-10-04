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

    respond(404, ['error' => ['code' => 'NOT_FOUND', 'message' => 'The requested endpoint does not exist.']]);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log($exception->getMessage());
    respond(500, ['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'The server could not complete the request.']]);
}
