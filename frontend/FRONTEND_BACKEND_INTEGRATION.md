# Frontend-Backend API Integration Architecture

## 🔒 Security & Architecture Overview

Your frontend now has a **secure, organized bridge** to communicate with the backend. Here's how it works:

---

## 📊 Data Flow Architecture

```
React Component
      ↓
useAuth/useFetch/useApi (Custom Hooks)
      ↓
Service Layer (studentService, courseService, etc.)
      ↓
httpClient (Token Management + Error Handling)
      ↓
Fetch API (HTTP Request)
      ↓
Laravel Backend (Validation + Authorization)
      ↓
Database
```

---

## 🛡️ Security: Where It Actually Happens

### **Frontend (NOT secure, metadata only)**
```
❌ Validation (basic, for UX)
❌ Authorization checks (for UI display)
✓ Token management
✓ Error handling
```

### **Backend (ACTUALLY secure)**
```
✓ Validates all input
✓ Checks authorization on every request
✓ Protects database queries with Eloquent ORM
✓ Sanitizes responses
✓ Rate limiting (can be added)
✓ CORS configuration
```

**Important:** The frontend service layer is for **code organization**, not security. Security happens on the backend.

---

## 📁 File Structure

```
frontend/src/
├── services/
│   ├── httpClient.js              ← Core HTTP layer
│   ├── authService.js             ← Login/logout
│   ├── studentService.js          ← Student endpoints
│   ├── facultyService.js          ← Faculty endpoints
│   ├── courseService.js           ← Course endpoints
│   ├── analyticsService.js        ← Analytics endpoints
│   └── index.js                   ← Export all services
├── hooks/
│   └── useApi.js                  ← Custom React hooks
├── routes/
│   └── AppRoutes.jsx              ← Route definitions
├── pages/
│   ├── LoginPage.jsx              ← Login example
│   ├── CoursesPage.jsx            ← List/CRUD example
│   ├── DashboardPage.jsx          ← Dashboard example
│   └── ...other pages
└── App.jsx                         ← Main app component
```

---

## 🔧 How Each Layer Works

### **1. httpClient.js** - Core Communication Layer

**Responsibility:**
- Make HTTP requests (GET, POST, PUT, DELETE)
- Manage authentication tokens automatically
- Handle network errors
- Redirect to login on unauthorized (401)

```javascript
// Automatically adds: Authorization: Bearer <token>
const response = await httpClient.get('/courses');
```

**Security Features:**
- Tokens stored in localStorage (frontend)
- Backend validates token on every request
- Automatic logout on expired token

---

### **2. Service Layer** - Domain Logic

**Each service handles one domain:**
- `authService` - Login, logout, setup password
- `studentService` - Student CRUD, profile, skills
- `courseService` - Course CRUD
- `analyticsService` - Dashboard data
- etc.

**Responsibility:**
- Format API requests
- Handle specific domain logic
- Consistent parameter naming
- Clear method signatures

```javascript
// Student service example
await studentService.create({
  student_number: '2024001',
  first_name: 'John',
  email: 'john@example.com',
  program_id: 1,
});
```

**Why?**
- Reusable across multiple components
- Easy to test
- Single place to update API logic
- Consistent naming conventions

---

### **3. Custom Hooks** - React Integration

**Hooks provided:**

1. **useFetch** - Fetch data on component mount
```javascript
const { data, loading, error, refetch } = useFetch('/courses');
```

2. **useApi** - Execute API operations (create, update, delete)
```javascript
const { execute: createCourse, loading } = useApi(courseService.create);
await createCourse(courseData);
```

3. **useAuth** - Authentication operations
```javascript
const { login, logout, user, loading } = useAuth();
await login(email, password, role);
```

4. **usePagination** - Handle paginated data
```javascript
const { data, currentPage, nextPage } = usePagination(apiFunction);
```

---

### **4. Routes** - URL Mapping

```javascript
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route 
    path="/students" 
    element={
      <ProtectedRoute>
        <StudentsPage />
      </ProtectedRoute>
    } 
  />
</Routes>
```

**ProtectedRoute Component:**
- Checks if user has auth token
- Redirects to `/login` if not
- Renders component if authenticated

---

## 🚀 Practical Examples

### **Example 1: Login**

```javascript
// pages/LoginPage.jsx
import { useAuth } from '../hooks/useApi';

function LoginPage() {
  const { login, loading, error } = useAuth();

  const handleSubmit = async (email, password) => {
    const result = await login(email, password, 'student');
    
    if (result.success) {
      // Token automatically stored in localStorage
      // User data stored in localStorage
      navigate('/dashboard');
    } else {
      showError(result.message);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**What happens:**
1. User fills form in React
2. `handleSubmit` calls `useAuth().login()`
3. `useAuth` hook calls `authService.login()`
4. `authService` calls `httpClient.post('/login', data)`
5. `httpClient` makes HTTP request
6. Backend validates credentials + generates token
7. Token sent back to frontend
8. Frontend stores token in localStorage
9. Component redirects to `/dashboard`

---

### **Example 2: Fetch Courses**

```javascript
// pages/CoursesPage.jsx
import { useFetch } from '../hooks/useApi';

function CoursesPage() {
  const { data: courses, loading, error } = useFetch('/courses');

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {courses?.map(course => (
        <div key={course.id}>{course.course_name}</div>
      ))}
    </div>
  );
}
```

**What happens:**
1. Component mounts
2. `useFetch` hook triggers
3. Calls `httpClient.get('/courses')`
4. Automatically adds token header
5. Backend receives request with valid token
6. Backend validates and checks authorization
7. Backend returns courses
8. `useFetch` updates `courses` state
9. Component re-renders with data

---

### **Example 3: Create Student**

```javascript
// pages/StudentForm.jsx
import { useApi } from '../hooks/useApi';
import { studentService } from '../services';

function StudentForm() {
  const { execute: createStudent, loading } = useApi(studentService.create);

  const handleSubmit = async (formData) => {
    const response = await createStudent(formData);
    
    if (response.success) {
      alert('Student created!');
      // response.data contains new student
    } else if (response.errors) {
      // Show validation errors
      showErrors(response.errors);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**What happens:**
1. User fills form
2. `handleSubmit` calls `createStudent(data)`
3. `useApi` hook calls `studentService.create(data)`
4. `studentService` calls `httpClient.post('/students', data)`
5. Backend receives request with token
6. Backend validates data
7. Backend checks authorization (is user admin?)
8. Backend creates student in database
9. Returns created student object
10. Frontend shows success message

---

## 📋 API Response Format

All backend responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* your data */ },
  "code": 200
}
```

Your service layer and hooks automatically handle this format.

---

## 🔑 Token Management

### **How it works:**

1. **After Login:**
```javascript
response.data.token  // <- Backend sends this
localStorage.setItem('auth_token', token)  // <- Frontend stores
```

2. **Every Request:**
```javascript
const token = localStorage.getItem('auth_token');
headers: { Authorization: `Bearer ${token}` }
```

3. **On Logout:**
```javascript
localStorage.removeItem('auth_token');
localStorage.removeItem('user');
// httpClient will no longer add token to requests
```

4. **When Token Expires (401):**
```javascript
// httpClient detects 401 response
localStorage.removeItem('auth_token');
window.location.href = '/login';  // Redirect to login
```

---

## ✅ Best Practices

### **1. Always use services, never direct fetch**
```javascript
// ❌ Bad
fetch('http://localhost:8000/api/courses')
  .then(res => res.json())
  .then(data => setCourses(data));

// ✅ Good
const { data: courses } = useFetch('/courses');
```

### **2. Use custom hooks for data fetching**
```javascript
// ❌ Bad
useEffect(() => {
  httpClient.get('/courses').then(res => ...);
}, []);

// ✅ Good
const { data } = useFetch('/courses');
```

### **3. Handle validation errors from backend**
```javascript
const response = await createStudent(data);

if (response.errors) {
  // Backend validation errors: { field: ['error message'] }
  Object.entries(response.errors).forEach(([field, messages]) => {
    showFieldError(field, messages[0]);
  });
}
```

### **4. Never expose backend logic in frontend**
```javascript
// ❌ Bad - This should be on backend
if (user.role === 'admin' && course.capacity > 50) {
  // allow delete
}

// ✅ Good - Backend handles authorization
const response = await courseService.delete(courseId);
if (response.success) { /* deleted */ }
```

### **5. Always check response.success**
```javascript
// ❌ Bad
const response = await fetchData();
doSomething(response.data);  // What if response.success is false?

// ✅ Good
const response = await fetchData();
if (response.success) {
  doSomething(response.data);
} else {
  showError(response.message);
}
```

---

## 🔐 Security Checklist

| Item | Where | Status |
|------|-------|--------|
| Input Validation | Backend | ✅ |
| Authorization | Backend | ✅ |
| Token Management | Frontend | ✅ |
| CORS Configuration | Backend | ✅ |
| SQL Injection Protection | Backend (Eloquent) | ✅ |
| HTTPS in Production | Both | 📋 |
| Rate Limiting | Backend | 📋 |
| Secure Headers | Backend | 📋 |

---

## 🎓 Summary

Your frontend-backend bridge provides:

1. **✅ Organized Code** - All API calls in one place
2. **✅ Security** - Backend validates everything
3. **✅ Reusability** - Same services used across components
4. **✅ Easy Maintenance** - Change API in one place
5. **✅ Better UX** - Proper loading states and error handling
6. **✅ Token Management** - Handles login/logout automatically

**Remember:** This structure is for code organization. Real security happens on the backend with validation, authorization, and database protection.

