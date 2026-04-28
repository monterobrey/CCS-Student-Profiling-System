<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Event extends Model
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
        'date'       => 'date:Y-m-d',
        'visible_to' => 'array',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
