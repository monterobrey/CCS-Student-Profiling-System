# Frontend Routing

## Overview

This project uses **React Router v6** with `BrowserRouter` as the routing strategy. Routes are split by role into separate files under `src/routes/` to keep the codebase organized and maintainable.

---

## Why BrowserRouter?

`BrowserRouter` uses the **HTML5 History API** (`pushState`, `replaceState`) to manage navigation. This gives the app clean, readable URLs:

```
✅ /dean/dashboard
✅ /student/profile
✅ /faculty/violations/5
```

Compared to the alternative `HashRouter`, which produces:

```
❌ /#/dean/dashboard
❌ /#/student/profile
```

### Reasons it is the standard choice

| Reason | Detail |
|---|---|
| **Clean URLs** | No `#` fragment in the URL — looks professional and is easier to read |
| **SEO friendly** | Search engines can index clean paths (relevant if the app ever has public pages) |
| **Industry standard** | Used by default in most React setups (Create React App, Vite, Next.js) |
| **Browser history support** | Back/forward navigation works naturally via the browser's built-in history stack |
| **Shareable links** | Users can copy and share a URL and land on the exact page |

> **Note:** BrowserRouter requires the server to be configured to serve `index.html` for all routes (a catch-all). This is already standard in development servers and most deployment setups (Nginx, Apache, Vercel, etc.).

---

## Route Structure

Routes are organized by role. Each file is self-contained — it owns its own imports and route definitions.

```
src/
├── App.jsx                  # Root: providers, public routes, layout wrapper
└── routes/
    ├── DeanRoutes.jsx       # All /dean/* routes
    ├── ChairRoutes.jsx      # All /department-chair/* routes
    ├── SecretaryRoutes.jsx  # All /secretary/* routes
    ├── FacultyRoutes.jsx    # All /faculty/* routes
    └── StudentRoutes.jsx    # All /student/* routes
```

---

## How It Works in App.jsx

```jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// BrowserRouter is aliased as Router for brevity.
// <Router> in JSX is the same as <BrowserRouter>.

function App() {
  return (
    <AuthProvider>
      <Router>                          {/* BrowserRouter — enables HTML5 routing */}
        <Routes>
          {/* Public routes — no auth required */}
          <Route path="/faculty/login" element={<FacultyLogin />} />
          <Route path="/students/login" element={<StudentLogin />} />

          {/* Protected layout — auth check wraps all role routes */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            {DeanRoutes}
            {ChairRoutes}
            {SecretaryRoutes}
            {FacultyRoutes}
            {StudentRoutes}
          </Route>

          {/* Fallback — redirect unknown paths to login */}
          <Route path="*" element={<Navigate to="/faculty/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

---

## Route Protection

Every protected route is wrapped in `<ProtectedRoute>` with an `allowedRoles` prop. If a user tries to access a route they are not authorized for, they are redirected automatically.

```jsx
<Route
  path="/dean/dashboard"
  element={
    <ProtectedRoute allowedRoles={[ROLES.DEAN]}>
      <DeanDashboard />
    </ProtectedRoute>
  }
/>
```

The outer `<ProtectedRoute>` on the layout checks that the user is authenticated at all. The inner `<ProtectedRoute allowedRoles={...}>` checks that the user has the correct role for that specific page.

---

## Adding a New Route

1. Identify which role the route belongs to.
2. Open the corresponding file in `src/routes/`.
3. Add the `<Route>` entry following the existing pattern.
4. Import the page component at the top of that file.

No changes to `App.jsx` are needed.
