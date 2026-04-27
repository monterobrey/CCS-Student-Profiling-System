<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    public function creator()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }
}
