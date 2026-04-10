# Frontend Environment Configuration

## Environment Variables Setup

### 1. Create `.env` file in frontend root

```bash
# frontend/.env

# API Configuration
REACT_APP_API_URL=http://localhost:8000/api

# Optional: Add more environments as needed
REACT_APP_APP_NAME=CCS Student Profiling System
REACT_APP_VERSION=1.0.0
```

### 2. Create `.env.development` (Development)

```bash
# frontend/.env.development

REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_DEBUG=true
```

### 3. Create `.env.production` (Production)

```bash
# frontend/.env.production

REACT_APP_API_URL=https://api.your-domain.com/api
REACT_APP_DEBUG=false
```

### 4. Update httpClient.js to use env variable

The httpClient.js already handles this:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
```

---

## CORS Configuration (Backend)

Your Laravel backend should have CORS configured in `config/cors.php`:

```php
<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:3000',  // React dev server
        'http://localhost:3001',  // Alternative port
        'https://your-domain.com', // Production frontend
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

---

## Running Frontend & Backend

### Terminal 1: Start Backend
```bash
cd backend
php artisan serve
# Runs on http://localhost:8000
```

### Terminal 2: Start Frontend
```bash
cd frontend
npm install  # First time only
npm start    # Runs on http://localhost:3000
```

---

## API Testing

### Using Postman

1. **Set up environment variable:**
   - Key: `token`
   - Value: (will be set after login)

2. **Login Request:**
```
POST http://localhost:8000/api/login
Body (JSON):
{
  "email": "student@example.com",
  "password": "password123",
  "role": "student"
}
```

3. **In response, copy token:**
```
Authorization: Bearer <paste-token-here>
```

4. **Use for next requests:**
```
GET http://localhost:8000/api/courses
Headers:
  Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Using cURL

```bash
# Login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123","role":"student"}'

# Get Courses (with token)
curl -X GET http://localhost:8000/api/courses \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

---

## Troubleshooting

### CORS Error: "Access to XMLHttpRequest blocked by CORS"

**Problem:** Browser blocks request due to CORS

**Solution:**
1. Check backend CORS config has your frontend URL
2. Ensure backend is running on correct port
3. Check `httpClient.js` has correct API_BASE_URL

```javascript
// frontend/src/services/httpClient.js - Line 10
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
```

### Token Error: "Unauthenticated"

**Problem:** Token is invalid or missing

**Solution:**
1. Check token is stored: `localStorage.getItem('auth_token')`
2. Login again to get new token
3. Check token hasn't expired

### "Cannot POST /students" Error

**Problem:** Backend endpoint doesn't exist

**Solution:**
1. Check route exists in `backend/routes/api.php`
2. Check endpoint URL is correct in service
3. Verify controller has the method

---

## Development Workflow

### Step 1: Create Backend Endpoint

In `backend/routes/api.php`:
```php
Route::post('/courses', [CourseController::class, 'store']);
```

In `backend/app/Http/Controllers/Functions/CourseController.php`:
```php
public function store(Request $request)
{
    // ...your logic...
    return ApiResponse::success($data);
}
```

### Step 2: Create Frontend Service

In `frontend/src/services/courseService.js`:
```javascript
export const courseService = {
  create: async (courseData) => {
    return httpClient.post('/courses', courseData);
  },
};
```

### Step 3: Use in Component

In `frontend/src/pages/CoursesPage.jsx`:
```javascript
import { courseService } from '../services';
import { useApi } from '../hooks/useApi';

function CoursesPage() {
  const { execute: createCourse } = useApi(courseService.create);
  
  const handleCreate = async (data) => {
    const response = await createCourse(data);
    if (response.success) {
      // Success
    }
  };
}
```

---

## Performance Tips

1. **Cache API responses** where appropriate
```javascript
const { data, refetch } = useFetch('/courses', true);
// Refetch when needed: refetch()
```

2. **Use lazy loading for pagination**
```javascript
const { data, nextPage } = usePagination(apiFunction);
// Load more: nextPage()
```

3. **Avoid duplicate requests**
```javascript
// ❌ Bad - Requests twice
useEffect(() => { getData(); }, []);
useEffect(() => { getData(); }, []);

// ✅ Good - Request once
useEffect(() => { getData(); }, []);
```

4. **Debounce search queries**
```javascript
const [search, setSearch] = useState('');
const debouncedSearch = useCallback(
  debounce((query) => searchCourses(query), 300),
  []
);
```

---

## Deployment

### Frontend Deployment (Vercel/Netlify)

```bash
# Build for production
npm run build

# This creates optimized build in 'build/' folder
# Set REACT_APP_API_URL to production backend URL
```

### Environment Variables (in deployment platform)
```
REACT_APP_API_URL=https://api.your-domain.com/api
```

---

## Debugging

### Check Network Requests
1. Open Browser DevTools (F12)
2. Go to Network tab
3. Make API request
4. Click on request to see:
   - Headers (Authorization token)
   - Request body (what you sent)
   - Response (what backend returned)
   - Status code (success or error)

### Check Console for Errors
1. Open Browser DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Check localStorage for token: `localStorage.getItem('auth_token')`

### Backend Debugging
1. Check Laravel logs: `tail -f storage/logs/laravel.log`
2. Use `dd()` in controllers to dump variables
3. Check request validation with `$request->validate()`

---

