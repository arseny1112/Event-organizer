<?php
session_start();

if (isset($_GET['error'])) {
    header('Location: http://localhost:5173/auth?error=vk_cancelled');
    exit;
}

$code     = $_GET['code']      ?? '';
$state    = $_GET['state']     ?? '';
$deviceId = $_GET['device_id'] ?? '';

if (!$code) die('No code. Params: ' . print_r($_GET, true));

error_log('VK Callback - device_id: ' . $deviceId);

// Сохраняем device_id в сессии
$_SESSION['vk_device_id'] = $deviceId;
$_SESSION['vk_code']      = $code;

// Редиректим на фронтенд только с кодом и state
$url = "http://localhost:5173/auth#vk_code=" . urlencode($code)
     . "&state=" . urlencode($state);

header('Location: ' . $url);
exit;