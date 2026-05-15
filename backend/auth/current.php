<?php
// backend/auth/current.php

header('Content-Type: application/json');
require_once '../db.php';

// Получаем токен из заголовка Authorization
$headers = apache_request_headers();
$authHeader = $headers['Authorization'] ?? '';

$token = '';
if (preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
    $token = $matches[1];
}

if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'No token provided']);
    exit;
}

// Ищем пользователя по токену
$stmt = $pdo->prepare('SELECT id, name, email, role FROM users WHERE api_token = ? LIMIT 1');
$stmt->execute([$token]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token']);
    exit;
}

echo json_encode($user);