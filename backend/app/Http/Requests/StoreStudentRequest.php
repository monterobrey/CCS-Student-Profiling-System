<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form request for creating a new student account.
 */
class StoreStudentRequest extends FormRequest
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
            'student_number' => 'required|string|unique:users,student_number',
            'email' => 'required|email|unique:users,email',
            'program_id' => 'required|exists:programs,id',
            'section_id' => 'required|exists:sections,id',
            'year_level' => 'required|integer|between:1,4',
            'guardian.first_name' => 'nullable|string|max:255',
            'guardian.last_name' => 'nullable|string|max:255',
            'guardian.contact_number' => 'nullable|string',
            'guardian.relationship' => 'nullable|string',
        ];
    }

    public function messages()
    {
        return [
            'first_name.required' => 'First name is required',
            'last_name.required' => 'Last name is required',
            'student_number.unique' => 'This student number already exists',
            'email.unique' => 'This email is already registered',
            'year_level.between' => 'Year level must be between 1 and 4',
        ];
    }
}
