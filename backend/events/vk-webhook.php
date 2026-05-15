<?php
// backend/events/vk-webhook.php

// 🔥 Читаем input ОДИН РАЗ в начале
$raw_input = file_get_contents('php://input');
$input = json_decode($raw_input, true);

// 🔥 Один лог-файл
$log_file = __DIR__ . '/vk_debug.log';

// Логируем запрос
file_put_contents($log_file, date('Y-m-d H:i:s') . " - REQUEST START\n", FILE_APPEND);
file_put_contents($log_file, "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n", FILE_APPEND);
file_put_contents($log_file, "Method: " . ($_SERVER['REQUEST_METHOD'] ?? 'unknown') . "\n", FILE_APPEND);
file_put_contents($log_file, "Input: " . json_encode($input) . "\n", FILE_APPEND);

// Если input пустой
if (!$input) {
    http_response_code(400);
    echo 'Invalid request';
    exit;
}

$type = $input['type'] ?? '';
$secret_key = 'aaQ13axAPQEcczQa';

// Confirmation — без проверки secret
if ($type === 'confirmation') {
    header('Content-Type: text/plain');
    echo '0c56c009'; // Твоя строка подтверждения
    exit;
}

// Проверка secret для остальных событий
if (!isset($input['secret']) || $input['secret'] !== $secret_key) {
    file_put_contents($log_file, "Wrong secret: " . ($input['secret'] ?? 'not set') . "\n", FILE_APPEND);
    http_response_code(403);
    echo 'Forbidden';
    exit;
}

// Подключаем БД
require_once __DIR__ . '/../db.php';

$object = $input['object'] ?? [];

// 🔥 ОБРАБОТКА НОВЫХ СООБЩЕНИЙ
if ($type === 'message_new') {
    $user_id = $object['from_id'] ?? 0;
    $text = trim(strtolower($object['text'] ?? ''));
    
    file_put_contents($log_file, "Message from $user_id: $text\n", FILE_APPEND);
    
    // 🔥 ОБРАБОТКА КОМАНДЫ ПРИВЯЗКИ
    if ($text === 'привязать уведомления') {
        try {
            // 1. Находим пользователя по vk_id в таблице users
            $stmt = $pdo->prepare("SELECT id FROM users WHERE vk_id = ?");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch();
            
            if ($user) {
                // 2. Обновляем vk_notify = 1 в таблице settings
                $stmt = $pdo->prepare("UPDATE settings SET vk_notify = 1 WHERE user_id = ?");
                $stmt->execute([$user['id']]);
                
                file_put_contents($log_file, "✅ User {$user['id']} bound VK notifications\n", FILE_APPEND);
                
                // 3. Отправляем подтверждение
                sendVkMessage($user_id, "✅ Отлично! Уведомления привязаны. Теперь вы будете получать напоминания о мероприятиях здесь.");
            } else {
                file_put_contents($log_file, "❌ User with vk_id $user_id not found in users table\n", FILE_APPEND);
            }
        } catch (PDOException $e) {
            file_put_contents($log_file, "❌ DB Error: " . $e->getMessage() . "\n", FILE_APPEND);
        }
    }
    
    echo 'ok';
    exit;
}

// Пользователь разрешил сообщения
if ($type === 'message_allow') {
    $user_id = $object['user_id'] ?? 0;
    file_put_contents($log_file, "User $user_id allowed messages\n", FILE_APPEND);
    echo 'ok';
    exit;
}

// Пользователь запретил сообщения
if ($type === 'message_deny') {
    $user_id = $object['user_id'] ?? 0;
    file_put_contents($log_file, "User $user_id denied messages\n", FILE_APPEND);
    echo 'ok';
    exit;
}

echo 'ok';

// Функция отправки сообщений
function sendVkMessage(int $userId, string $text): void {
    global $pdo;
    
    $access_token = 'vk1.a.6jpksTBxf8rTJn0xNYsLSPA48UXGWgBxwx716enHwfkZeIfla3N0amoZYD9myOYouIp5qE5rHZ-ysN9ifcf6FuqygHivPa9o4407Xrplxiy3_W8qFoRVe_y4AV3rEgQMj6aMX2Yf-AVK6X19kX7cwUJxUhFFtXLgl7AZAvo1lNfkEHi3UsYb7oPNvD2JYEhegqbNP3iYDmcPC0a2vRI8jQ';
    $groupId = '238638283';
    
    $params = [
        'user_id' => $userId,
        'message' => $text,
        'random_id' => rand(0, 1000000000),
        'group_id' => $groupId,
        'access_token' => $access_token,
        'v' => '5.199'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://api.vk.com/method/messages.send");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    
    $result = json_decode($response, true);
    if (isset($result['error'])) {
        file_put_contents(__DIR__ . '/vk_debug.log', "Send error: " . json_encode($result['error']) . "\n", FILE_APPEND);
    }
}
?>