<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SetupPasswordNotification extends Notification
{
    use Queueable;

    protected $token;

    /**
     * Create a new notification instance.
     */
    public function __construct($token)
    {
        $this->token = $token;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $path = $notifiable->isFacultyMember() ? '/setup-password-faculty' : '/setup-password';
        $frontendBaseUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/');
        $url = $frontendBaseUrl . $path . '?' . http_build_query([
            'token' => $this->token,
            'email' => $notifiable->email,
        ]);
        $name = trim((string) ($notifiable->name ?? ''));
        $greetingName = $name !== '' ? $name : 'there';
        $studentNumber = trim((string) ($notifiable->student_number ?? ''));
        $isFaculty = $notifiable->isFacultyMember();

        $mail = (new MailMessage)
                    ->subject($isFaculty ? 'Welcome to CCS — Set Up Your Employee Portal Access' : 'Welcome! Set Your Portal Password')
                    ->greeting('Dear ' . $greetingName . ',')
                    ->line('Greetings from the College of Computing Studies.')
                    ->when(!$isFaculty && $studentNumber !== '', function (MailMessage $message) use ($studentNumber) {
                        return $message->line('Student Number: ' . $studentNumber);
                    })
                    ->line($isFaculty
                        ? 'Your employee account for the **CCS Student Profiling System** has been created. To activate your access to the faculty portal and secure your account, please set your password using the button below:'
                        : 'Your account for the **Student Profiling System** has been successfully created. To activate your account, please set your initial password by clicking the button below:'
                    )
                    ->action('Set Password', $url)
                    ->line('For security purposes, this link is intended for one-time use and will allow you to create your password and sign in to the system.')
                    ->line('If you are unable to click the button, you may copy and paste the following link into your web browser:')
                    ->line($url)
                    ->line($isFaculty
                        ? 'Please do not share this link. If you did not expect this email, please contact the CCS administrator or your department office.'
                        : 'Please note that this link is intended only for your use. Do not share it with others to protect your account security.'
                    )
                    ->line($isFaculty
                        ? 'If you believe this message was sent in error, please notify the CCS system administrator.'
                        : 'If you did not expect this email or believe it was sent in error, please contact the system administrator immediately.'
                    )
                    ->line('Thank you.')
                    ->salutation("Sincerely,\nCollege of Computing Studies");

        return $mail;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
