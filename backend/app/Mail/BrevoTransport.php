<?php

namespace App\Mail;

use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\MessageConverter;
use Illuminate\Support\Facades\Http;

class BrevoTransport extends AbstractTransport
{
    protected string $apiKey;

    public function __construct(string $apiKey)
    {
        parent::__construct();
        $this->apiKey = $apiKey;
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        $from = $email->getFrom();
        $fromAddress = count($from) > 0 ? $from[0]->getAddress() : config('mail.from.address');
        $fromName = count($from) > 0 ? ($from[0]->getName() ?: config('mail.from.name')) : config('mail.from.name');

        $to = array_map(fn($addr) => [
            'email' => $addr->getAddress(),
            'name'  => $addr->getName() ?: $addr->getAddress(),
        ], $email->getTo());

        $payload = [
            'sender'      => ['email' => $fromAddress, 'name' => $fromName],
            'to'          => $to,
            'subject'     => $email->getSubject(),
            'htmlContent' => $email->getHtmlBody() ?? $email->getTextBody(),
            'textContent' => $email->getTextBody(),
        ];

        $response = Http::withHeaders([
            'api-key'      => $this->apiKey,
            'Content-Type' => 'application/json',
            'Accept'       => 'application/json',
        ])->post('https://api.brevo.com/v3/smtp/email', $payload);

        if ($response->failed()) {
            throw new \Exception('Brevo API error: ' . $response->body());
        }
    }

    public function __toString(): string
    {
        return 'brevo';
    }
}
