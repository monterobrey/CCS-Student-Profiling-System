<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $orgs = [
            [
                'organization_name' => 'Society of Information Technology Students',
                'organization_type' => 'Academic',
                'description'       => 'Official organization for BSIT students of the College of Computing Studies.',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
            [
                'organization_name' => 'Association of Computer Science Students',
                'organization_type' => 'Academic',
                'description'       => 'Official organization for BSCS students of the College of Computing Studies.',
                'created_at'        => now(),
                'updated_at'        => now(),
            ],
        ];

        foreach ($orgs as $org) {
            // Insert only if not already present (idempotent)
            $exists = DB::table('university_organizations')
                ->where('organization_name', $org['organization_name'])
                ->exists();

            if (!$exists) {
                DB::table('university_organizations')->insert($org);
            }
        }
    }

    public function down(): void
    {
        DB::table('university_organizations')->whereIn('organization_name', [
            'Society of Information Technology Students',
            'Association of Computer Science Students',
        ])->delete();
    }
};
