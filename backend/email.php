<?php
require __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function sendEmail($to, $subject, $body): bool {
    $mail = new PHPMailer(true);
    
    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.mail.ru';        // 🔥 Mail.ru SMTP
        $mail->SMTPAuth   = true;
        $mail->Username   = 'gku.event@mail.ru';   // 🔥 Твоя почта
        $mail->Password   = '5A7czFomUVSiRxJLHAqE'; // 🔥 Пароль приложения
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom('gku.event@mail.ru', 'Event Organizer');
        $mail->addAddress($to);
        
        $mail->isHTML(false);
        $mail->Subject = $subject;
        $mail->Body    = $body;

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Email Error: {$mail->ErrorInfo}");
        return false;
    }
}
?>