# How to Use Backend Services in Your Existing Pages

## Quick Summary

You now have a clean **services layer** that connects your React pages to the Laravel backend:

```
Your Page Component
    ↓
imports service + hook
    ↓
service.method()  ← calls backend
    ↓
Backend validates & returns data
```

---

## 🚀 Using Services in Your Existing Pages

### Option 1: Fetch Data on Page Mount

```javascript
// In any of your page components:
import { useFetch } from '../hooks/useApi';

function YourPage() {
  // Automatically fetches data when component loads
  const { data, loading, error } = useFetch('/courses');

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      {data?.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Option 2: Execute API Operation (Create, Update, Delete)

```javascript
// In any of your page components:
import { useApi } from '../hooks/useApi';
import { studentService } from '../services';

function YourPage() {
  // Create a function to call the backend
  const { execute: createStudent, loading } = useApi(studentService.create);

  const handleSubmit = async (formData) => {
    const response = await createStudent(formData);
    
    if (response.success) {
      console.log('Created!', response.data);
    } else if (response.errors) {
      console.log('Validation errors:', response.errors);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit({/* form data */});
    }}>
      {/* your form */}
    </form>
  );
}
```

### Option 3: Login/Logout

```javascript
// In your login page:
import { useAuth } from '../hooks/useApi';

function StudentLoginPage() {
  const { login, loading, error } = useAuth();

  const handleLogin = async (email, password) => {
    const result = await login(email, password, 'student');
    
    if (result.success) {
      // Token automatically stored
      // Redirect to dashboard
      navigate('/dashboard');
    } else {
      // Show error
    }
  };

  return (
    <form onSubmit={() => handleLogin(email, password)}>
      {/* your form */}
    </form>
  );
}
```

---

## 📚 Available Services

### **authService** - Authentication
```javascript
import { authService } from '../services';

// Login
authService.login(email, password, role)

// Setup password (first login)
authService.setupPassword(email, token, password, passwordConfirmation)

// Logout
authService.logout()

// Get current user
authService.getCurrentUser()
```

### **studentService** - Student Operations
```javascript
import { studentService } from '../services';

studentService.getAll()           // Get all students
studentService.getById(id)        // Get student details
studentService.getProfile()       // Get logged-in student profile
studentService.create(data)       // Create new student
studentService.update(id, data)   // Update student
studentService.updateProfile(data) // Update your profile
studentService.delete(id)         // Delete student
studentService.importFromCSV(file) // Import from CSV
studentService.addSkill(studentId, skillData) // Add skill
studentService.removeSkill(studentId, skillId) // Remove skill
studentService.getViolations(studentId) // Get violations
```

### **facultyService** - Faculty Operations
```javascript
import { facultyService } from '../services';

facultyService.getAll()           // Get all faculty
facultyService.getById(id)        // Get faculty details
facultyService.create(data)       // Create new faculty
facultyService.update(id, data)   // Update faculty
facultyService.delete(id)         // Delete faculty
facultyService.getMyStudents()    // Get your students (as faculty)
facultyService.getMyViolations()  // Get violations you reported
facultyService.reportViolation(data) // Report violation
facultyService.importFromCSV(file) // Import from CSV
```

### **courseService** - Course Operations
```javascript
import { courseService } from '../services';

courseService.getAll(programId)   // Get all courses (optional filter)
courseService.getById(id)         // Get course details
courseService.create(data)        // Create course
courseService.update(id, data)    // Update course
courseService.delete(id)          // Delete course
```

### **analyticsService** - Dashboard Data
```javascript
import { analyticsService } from '../services';

analyticsService.getDeanSummary()          // Dean dashboard
analyticsService.getFacultySummary()       // Faculty dashboard
analyticsService.getAcademicPerformance()  // Academic stats
analyticsService.getProfiling(filters)     // Student profiling
```

---

## 🛡️ Protected Pages

To protect pages that require login:

```javascript
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('auth_token');
  return token ? children : <Navigate to="/login" />;
};

// Usage in routes:
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <YourDashboardPage />
    </ProtectedRoute>
  } 
/>
```

---

## 💡 Common Patterns in Your Pages

### Pattern 1: Display List from Backend

```javascript
function YourListPage() {
  const { data, loading, error } = useFetch('/students');

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <table>
      <tbody>
        {data?.map(student => (
          <tr key={student.id}>
            <td>{student.first_name}</td>
            <td>{student.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Pattern 2: Form Submission to Backend

```javascript
import { useApi } from '../hooks/useApi';
import { studentService } from '../services';

function YourFormPage() {
  const { execute: createStudent, loading } = useApi(studentService.create);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await createStudent(formData);

    if (response.success) {
      alert('Success!');
      // Refresh list or redirect
    } else if (response.errors) {
      setErrors(response.errors); // Show validation errors
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="first_name" required />
      {errors.first_name && <span>{errors.first_name[0]}</span>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

### Pattern 3: Get User's Own Data

```javascript
import { useAuth } from '../hooks/useApi';

function YourProfilePage() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" />;

  return (
    <div>
      <h1>{user.first_name} {user.last_name}</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}
```

---

## 📋 Response Format from Backend

Every API call returns this format:

```javascript
// Success response (200-201)
{
  success: true,
  message: "Operation successful",
  data: { /* your data */ },
  code: 200
}

// Error response (4xx-5xx)
{
  success: false,
  message: "Error description",
  errors: null,
  code: 422
}

// Validation error (422)
{
  success: false,
  message: "Validation errors",
  errors: {
    email: ["Email is required"],
    name: ["Name must be 3+ characters"]
  },
  code: 422
}
```

---

## 🔍 Debugging

### Check Network Requests
1. Open Browser DevTools (F12)
2. Go to Network tab
3. Look for your API calls
4. Click on request to see:
   - Headers (check Authorization token)
   - Request body (what you sent)
   - Response (what backend returned)

### Check Token Status
```javascript
// In browser console
localStorage.getItem('auth_token')  // Show token
localStorage.getItem('user')        // Show user data
```

### Check Backend Logs
```bash
cd backend
tail -f storage/logs/laravel.log  # Watch logs in real-time
```

---

## ✅ Checklist

- [ ] Services created in `frontend/src/services/`
- [ ] Custom hooks created in `frontend/src/hooks/useApi.js`
- [ ] Backend running on `http://localhost:8000`
- [ ] Frontend running on `http://localhost:3000`
- [ ] AppRoutes.jsx has your page imports
- [ ] ProtectedRoute component used for secure pages
- [ ] Token stored after login: `localStorage.getItem('auth_token')`
- [ ] Pages use `useFetch` for GET requests
- [ ] Pages use `useApi` for POST/PUT/DELETE
- [ ] Frontend .env has `REACT_APP_API_URL=http://localhost:8000/api`

---

## 🚀 Next Steps

1. **Update your page components** to use the services:
   - Replace direct fetch calls with `useFetch` hook
   - Use `useApi` hook for form submissions
   - Use `useAuth` hook for login pages

2. **Update AppRoutes.jsx** with your actual page imports

3. **Test each page** by opening browser DevTools > Network tab and watching API calls

4. **Remove old code** that made direct fetch calls

---

## 📞 Quick Reference

```javascript
// Import hook
import { useFetch, useApi, useAuth } from '../hooks/useApi';

// Import service
import { studentService, courseService, analyticsService } from '../services';

// Fetch data
const { data, loading, error, refetch } = useFetch('/endpoint');

// Execute operation
const { execute, loading } = useApi(serviceFunction);
await execute(params);

// Handle login
const { login, logout, user } = useAuth();
await login(email, password, role);
```

That's it! Now you have a clean separation between frontend logic and backend API calls. 🎉

