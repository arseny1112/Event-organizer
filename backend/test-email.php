<?php
// backend/test-email.php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/email.php';

// 🔥 Замени на свою реальную почту
$to = 'gku.event@mail.ru'; 

$result = sendEmail($to, '🧪 Тест SMTP', 'Если ты это читаешь — PHPMailer настроен верно!');

echo $result ? '✅ Письмо отправлено!' : '❌ Ошибка отправки (смотри error_log)';
?>