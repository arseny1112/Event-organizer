<?php
// backend/uploads/auth/vk-auth.php
session_start();

$vkClientId = '54526807';
$redirectUri = 'http://localhost/event_organizer/backend/auth/vk-callback.php';

// Генерируем state для защиты от CSRF
$state = bin2hex(random_bytes(10));
$_SESSION['vk_state'] = $state;

$params = [
    'client_id'     => $vkClientId,
    'redirect_uri'  => $redirectUri,
    'response_type' => 'code',
    'scope'         => 'email',
    'state'         => $state,
    'v'             => '5.199',  // ← добавить это
];

$authUrl = 'https://oauth.vk.com/authorize?' . http_build_query($params);

header('Location: ' . $authUrl);
exit;