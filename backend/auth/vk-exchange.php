<?php
session_start();

// 🔥 Важно: заголовки с указанием кодировки
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { 
    http_response_code(204); 
    exit; 
}

// 🔥 Устанавливаем внутреннюю кодировку PHP
mb_internal_encoding('UTF-8');

require_once '../db.php';
require_once '../helpers.php';

if (!function_exists('respond')) {
    function respond($data, $code = 200) {
        http_response_code($code);
        // 🔥 JSON_UNESCAPED_UNICODE сохраняет кириллицу
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

$input        = json_decode(file_get_contents('php://input'), true);
$code         = $input['code']          ?? '';
$codeVerifier = $input['code_verifier'] ?? '';

$deviceId = $_SESSION['vk_device_id'] ?? '';

if (!$code || !$codeVerifier || !$deviceId) {
    respond(['error' => 'Missing params'], 400);
}

$vkClientId  = '54526807';
$redirectUri = 'http://localhost/event_organizer/backend/auth/vk-callback.php';

$tokenParams = [
    'grant_type'    => 'authorization_code',
    'client_id'     => $vkClientId,
    'code'          => $code,
    'redirect_uri'  => $redirectUri,
    'code_verifier' => $codeVerifier,
    'device_id'     => $deviceId,
];

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => 'https://id.vk.com/oauth2/auth',
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query($tokenParams),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded; charset=utf-8'],
]);
$tokenResponse = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$tokenData = json_decode($tokenResponse, true);

if (!isset($tokenData['access_token'])) {
    respond(['error' => 'VK token error', 'details' => $tokenData], 400);
}

$vkAccessToken = $tokenData['access_token'];
$vkUserId      = $tokenData['user_id'];
$email         = $tokenData['email'] ?? null;

// Получаем данные пользователя из VK
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => 'https://api.vk.com/method/users.get?user_ids=' . $vkUserId . '&fields=first_name,last_name,photo_100&access_token=' . $vkAccessToken . '&v=5.131&lang=ru',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    // 🔥 Запрашиваем ответ в нужной кодировке
    CURLOPT_HTTPHEADER     => ['Accept-Charset: utf-8'],
]);
$userResponse = curl_exec($ch);
curl_close($ch);

$userData = json_decode($userResponse, true);
$vkUser   = $userData['response'][0] ?? null;

// 🔥 Правильная обработка имени с кириллицей
if ($vkUser) {
    $firstName = $vkUser['first_name'] ?? '';
    $lastName  = $vkUser['last_name'] ?? '';
    
    // Принудительно конвертируем в UTF-8 (на случай если VK вернёт в другой кодировке)
    $firstName = mb_convert_encoding($firstName, 'UTF-8', 'auto');
    $lastName  = mb_convert_encoding($lastName, 'UTF-8', 'auto');
    
    $name = trim($firstName . ' ' . $lastName);
} else {
    $name = 'Пользователь VK';
}

$photo = $vkUser['photo_100'] ?? null;

// Ищем или создаём пользователя
$user = null;
if ($email) {
    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
}
if (!$user) {
    $tempEmail = $email ?? "vk{$vkUserId}@temp.local";
    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$tempEmail]);
    $user = $stmt->fetch();
}
if (!$user) {
    $pdo->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)')
        ->execute([$name, $email ?? "vk{$vkUserId}@temp.local", password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT), 'user']);
    $userId = $pdo->lastInsertId();
} else {
    $userId = $user['id'];
}

$ourToken = bin2hex(random_bytes(32));
$pdo->prepare('UPDATE users SET vk_token=?, last_login=NOW(), avatar=?, vk_id=? WHERE id=?')
    ->execute([$ourToken, $photo, $vkUserId, $userId]);

unset($_SESSION['vk_device_id'], $_SESSION['vk_code']);

$stmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
$stmt->execute([$userId]);
$currentUser = $stmt->fetch();

respond([
    'token' => $ourToken,
    'name'  => $name,  // 🔥 Теперь имя будет на русском
    'email' => $email ?? '',
    'role'  => $currentUser['role'] ?? 'user',
]);