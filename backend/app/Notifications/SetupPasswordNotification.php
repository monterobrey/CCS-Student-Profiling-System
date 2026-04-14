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
    protected $email;

    /**
     * Create a new notification instance.
     */
    public function __construct($token, $email)
    {
        $this->token = $token;
        $this->email = $email;
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
        $url = env('FRONTEND_URL', 'http://localhost:5173') . $path . '?token=' . $this->token . '&email=' . urlencode($this->email);

        return (new MailMessage)
                    ->subject('Welcome! Set Your Portal Password')
                    ->greeting('Dear ' . $notifiable->name . ',')
                    ->line('Greetings from the College of Computing Studies.')
                    ->line('Your account for the **Student Profiling System** has been successfully created. To activate your account, please set your initial password by clicking the button below:')
                    ->action('Set Password', $url)
                    ->line('For security purposes, this link will allow you to create your password and gain access to the system.')
                    ->line('If you are unable to click the button, you may copy and paste the following link into your web browser:')
                    ->line($url)
                    ->line('Please note that this link is intended only for your use. Do not share it with others to protect your account security.')
                    ->line('If you did not expect this email or believe it was sent in error, please contact the system administrator immediately.')
                    ->line('Thank you.')
                    ->salutation("Sincerely,\nCollege of Computing Studies\nStudent Profiling System Administration");
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
