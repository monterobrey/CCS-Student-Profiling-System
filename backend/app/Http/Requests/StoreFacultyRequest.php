<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form request for creating a new faculty member.
 */
class StoreFacultyRequest extends FormRequest
{
    public function authorize()
    {
        return $this->user()->isSecretary();
    }

    public function rules()
    {
        return [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:100',
            'email' => 'required|email|unique:users,email',
            'department_id' => 'required|exists:departments,id',
            'position' => 'required|string|max:255',
        ];
    }

    public function messages()
    {
        return [
            'first_name.required' => 'First name is required',
            'last_name.required' => 'Last name is required',
            'email.unique' => 'This email is already registered',
            'department_id.required' => 'Department is required',
            'position.required' => 'Position is required',
        ];
    }
}
