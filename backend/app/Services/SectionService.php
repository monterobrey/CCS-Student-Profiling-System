<?php

namespace App\Services;

use App\Models\Section;

/**
 * Service for section management.
 */
class SectionService
{
    /**
     * Get all sections with relationships.
     */
    public function getAllSections()
    {
        return Section::with(['program', 'department'])->get();
    }

    /**
     * Get a section by ID.
     */
    public function getSection($sectionId)
    {
        return Section::with(['program', 'department'])->findOrFail($sectionId);
    }
}
