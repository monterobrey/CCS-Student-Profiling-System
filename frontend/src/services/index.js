/**
 * API Services Index
 * Central export point for all API services
 * 
 * Usage in components:
 * import { authService, studentService, courseService } from '../services';
 * 
 * Or import individual services:
 * import { studentService } from '../services/studentService';
 */

export { default as httpClient } from './httpClient';
export { API_ENDPOINTS } from './apiEndpoints';
export { authService } from './authService';
export { studentService } from './studentService';
export { facultyService } from './facultyService';
export { courseService } from './courseService';
export { analyticsService } from './analyticsService';
export { curriculumService } from './curriculumService';
export { profilingService } from './profilingService';
export { violationService } from './violationService';
export { scheduleService } from './scheduleService';
