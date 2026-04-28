<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Student;
use App\Models\UniversityOrganization;
use App\Models\StudentOrganization;

class AssignDefaultOrganizations extends Command
{
    protected $signature = 'students:assign-default-orgs';
    protected $description = 'Assign default organizations to all students based on their program';

    public function handle()
    {
        $this->info('Assigning default organizations to students...');

        // Get the default organizations
        $sitOrg = UniversityOrganization::where('organization_name', 'Society of Information Technology Students')->first();
        $acsOrg = UniversityOrganization::where('organization_name', 'Association of Computer Science Students')->first();

        if (!$sitOrg || !$acsOrg) {
            $this->error('Default organizations not found in database. Please seed them first.');
            return 1;
        }

        $students = Student::with('program')->get();
        $assigned = 0;

        foreach ($students as $student) {
            $programCode = $student->program?->program_code;
            
            // Determine which org based on program
            $orgId = null;
            if (str_contains($programCode, 'IT')) {
                $orgId = $sitOrg->id;
            } elseif (str_contains($programCode, 'CS')) {
                $orgId = $acsOrg->id;
            }

            if (!$orgId) continue;

            // Check if already assigned
            $exists = StudentOrganization::where('student_id', $student->id)
                ->where('org_id', $orgId)
                ->exists();

            if ($exists) continue;

            // Assign the default org
            StudentOrganization::create([
                'student_id' => $student->id,
                'org_id'     => $orgId,
                'role'       => 'Member',
                'dateJoined' => $student->created_at ?? now(),
                'dateLeft'   => null,
            ]);

            $assigned++;
        }

        $this->info("✓ Assigned default organizations to {$assigned} students.");
        return 0;
    }
}
