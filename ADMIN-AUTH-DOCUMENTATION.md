# MCNmart Admin Authentication Documentation

## Overview

This document explains the admin authentication system implemented for the MCNmart admin panel. The solution resolves the redirect loop issue that was occurring on the admin login page by properly separating admin authentication layouts and routes.

## Architecture

### Route Structure

The admin routes are organized as follows:

```
/src/app/admin/
├── (auth)/                  # Route group for auth pages (no auth check)
│   ├── layout.tsx           # Simple layout without auth checks
│   ├── login/               # Admin login page
│   │   └── page.tsx
│   └── register/            # Admin registration page
│       └── page.tsx
├── layout.tsx               # Protected layout with auth check
├── page.tsx                 # Admin dashboard
└── [other admin routes]     # Other protected admin pages
```

### Authentication Flow

1. **Protected Admin Layout (`/admin/layout.tsx`)**:
   - Server component that checks authentication using `getServerSession`
   - Redirects unauthenticated or non-admin users to `/admin/login`
   - Renders the admin sidebar and layout for authenticated admin users

2. **Auth Pages Layout (`/admin/(auth)/layout.tsx`)**:
   - Simple layout without authentication checks
   - Used for login and register pages
   - Prevents redirect loops by not checking auth status server-side

3. **Login/Register Pages**:
   - Client components that check session status client-side
   - Redirect authenticated admin users to the dashboard
   - Handle form submission and authentication

## Key Components

### 1. Admin Layout (`/admin/layout.tsx`)

```tsx
// Server component that protects all admin pages
export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  // Redirect if not authenticated or not an admin
  if (!session || !session.user?.isAdmin) {
    redirect('/admin/login');
  }
  
  // Render the admin layout with sidebar
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebarWrapper />
      <main className="flex-1 overflow-auto p-6 lg:ml-64">
        {children}
      </main>
    </div>
  );
}
```

### 2. Auth Layout (`/admin/(auth)/layout.tsx`)

```tsx
// Simple layout for auth pages without authentication checks
export default function AdminAuthLayout({ children }: AdminAuthLayoutProps) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
```

### 3. Login Page (`/admin/(auth)/login/page.tsx`)

```tsx
// Client component with client-side session check
export default function AdminLoginPage() {
  // Check if user is already authenticated as admin
  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session?.user?.isAdmin) {
        router.replace('/admin');
      }
    };
    
    checkSession();
  }, [router]);

  // Login form and submission logic
  // ...
}
```

## Solution to Redirect Loop

The previous implementation had several issues that caused redirect loops:

1. **Mixed Authentication Checks**: The admin layout was performing server-side authentication checks for all routes, including login/register pages.

2. **Path Detection Issues**: Attempts to conditionally apply auth checks based on the current path using Next.js headers API led to TypeScript and runtime issues.

3. **Improper Route Separation**: Login/register pages were not properly separated from protected admin routes.

The solution implements:

1. **Route Groups**: Using Next.js route groups to separate auth pages from protected admin pages.

2. **Separate Layouts**: Different layouts for auth pages vs. protected admin pages.

3. **Client vs. Server Authentication**: Server-side auth checks for protected pages, client-side session checks for auth pages.

## Authentication Logic

1. **Protected Pages**:
   - Server-side authentication check using `getServerSession`
   - Redirects unauthenticated users to login page
   - Renders admin layout with sidebar for authenticated users

2. **Auth Pages**:
   - No server-side authentication check
   - Client-side session check using `getSession`
   - Redirects authenticated users to admin dashboard
   - Renders login/register forms for unauthenticated users

## Demo Credentials

- **Email**: demouser@example.com
- **Password**: Demo@123456
- **Role**: Admin user with full privileges

## Security Considerations

1. **Admin Flag**: Users must have the `isAdmin` flag set to `true` in their session to access admin pages.

2. **Credential Validation**: Admin login uses credentials provider with explicit `loginType: 'admin'` flag.

3. **Registration Code**: Admin registration requires a special code (`MCNMART2024`).

4. **Session Management**: NextAuth.js handles secure session management.

## Testing

The admin authentication flow has been tested to ensure:

1. Unauthenticated users are redirected to the login page
2. Authenticated non-admin users cannot access admin pages
3. Authenticated admin users can access protected admin pages
4. No redirect loops occur on login/register pages
5. Admin sidebar renders correctly on protected pages
