<?php
// backend/auth/me.php

header('Content-Type: application/json');
require_once '../db.php';

$token = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = str_replace('Bearer ', '', $token);

if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'No token']);
    exit;
}

$stmt = $pdo->prepare('SELECT id, name, email, role FROM users WHERE api_token = ?');
$stmt->execute([$token]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token']);
    exit;
}

echo json_encode($user);