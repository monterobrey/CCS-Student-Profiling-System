<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalendarEvent extends Model
{
    protected $fillable = [
        'created_by',
        'title',
        'description',
        'date',
        'start_time',
        'end_time',
        'location',
        'type',
        'visible_to',
    ];

    protected $casts = [
        'visible_to' => 'array',
        'date'       => 'date:Y-m-d',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
