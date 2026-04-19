<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    protected string $token;
    protected string $type; // 'student' | 'faculty'

    public function __construct(string $token, string $type)
    {
        $this->token = $token;
        $this->type  = $type;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendBase = rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/');
        $url = $frontendBase . '/reset-password?' . http_build_query([
            'token' => $this->token,
            'email' => $notifiable->email,
            'type'  => $this->type,
        ]);

        $name = trim((string) ($notifiable->name ?? ''));
        $greeting = $name !== '' ? $name : 'there';

        return (new MailMessage)
            ->subject('CCS Portal — Password Reset Request')
            ->greeting('Hi ' . $greeting . ',')
            ->line('We received a request to reset your password for the CCS Student Profiling System.')
            ->action('Reset Password', $url)
            ->line('This link will expire in **60 minutes**. If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.')
            ->line('For security, do not share this link with anyone.')
            ->salutation("Sincerely,\nCollege of Computing Studies");
    }

    public function toArray(object $notifiable): array
    {
        return [];
    }
}
