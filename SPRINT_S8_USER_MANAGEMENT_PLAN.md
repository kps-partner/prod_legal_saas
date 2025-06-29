# Sprint S8: User Management Implementation Plan

## Overview
Implementation of user management feature for LawFirm OS MVP, allowing Admin users to manage team members with role-based access control.

## Role Definitions
- **Admin**: Full access to all features (Settings, Case Management, Billing, Integrations)
- **Paralegal**: Limited access to Case Management features only (Dashboard, Cases, Timeline)

## Implementation Specifications

### User Requirements Clarifications
1. **Navigation**: Users tab in existing settings area
2. **User Deletion**: Soft delete (mark as inactive, preserve data)
3. **Self-Management**: 
   - ❌ No profile editing (name, email)
   - ✅ Yes password change capability
   - ✅ Yes view own role (read-only)
4. **Role Changes**: Force logout/re-login for immediate effect
5. **Data Compatibility**: No migration needed (handle existing "Admin" strings)
6. **UI Components**: Use shadcn/ui (Table, Dialog, Select, Alert Dialog)

## Backend Implementation Plan

### Step 1: Update Models & Schemas
**File**: `backend/app/shared/models.py`
- Add `UserRole` enum (Admin, Paralegal)
- Add `UserStatus` enum (active, inactive, pending_password_change)
- Update User model with status and password expiration fields
- Maintain backward compatibility with existing "Admin" role strings

**File**: `backend/app/modules/auth/schemas.py`
- `UserInvite` - for creating new users
- `UserUpdate` - for updating user roles/status
- `UserListResponse` - for listing users
- `PasswordChange` - for password updates

### Step 2: Create RBAC Dependencies
**File**: `backend/app/modules/auth/services.py`
- `require_admin_role()` - dependency ensuring only Admin users access certain endpoints
- `require_admin_or_paralegal()` - dependency for case management endpoints
- `generate_temporary_password()` - secure password generation
- Role validation and compatibility functions

### Step 3: Implement User Management Endpoints
**File**: `backend/app/modules/auth/router.py`
- `GET /api/v1/settings/users` - List all users in firm (Admin only)
- `POST /api/v1/settings/users/invite` - Create new user with temp password (Admin only)
- `PATCH /api/v1/settings/users/{userId}` - Update user role/status (Admin only)
- `DELETE /api/v1/settings/users/{userId}` - Soft delete user (Admin only)
- `POST /api/v1/auth/change-password` - Change own password (All users)

### Step 4: Apply RBAC to Existing Endpoints
- **Settings endpoints**: Admin only (billing, integrations, firm settings)
- **Case management endpoints**: Admin + Paralegal (cases, timeline, dashboard)

## Frontend Implementation Plan

### Step 1: Update API Client
**File**: `frontend/src/lib/api.ts`
- `getUsers()` - fetch all users in firm
- `inviteUser(email, name, role)` - create new user
- `updateUser(userId, updates)` - update user role/status
- `deleteUser(userId)` - soft delete user
- `changePassword(currentPassword, newPassword)` - change own password

### Step 2: Create User Management Page
**File**: `frontend/src/app/(app)/settings/users/page.tsx`
- **User List Table**: Display name, email, role, status using shadcn/ui Table
- **Invite User Button**: Opens modal for creating new users
- **Action Buttons**: Edit role, soft delete for each user
- **Role-based Access**: Only visible to Admin users

### Step 3: Implement Frontend RBAC
**Navigation Updates**:
- Hide "Settings" navigation link for Paralegal users
- Show case management features for both Admin and Paralegal
- Conditional rendering based on user role from AuthContext

### Step 4: Add Password Change Feature
**File**: `frontend/src/app/(app)/settings/password/page.tsx` (or modal)
- Password change form for all users
- Handle forced password changes for new users
- Password strength validation

## User Invite Process Flow

### Backend Process
1. Admin submits invite form (email, name, role)
2. System checks if email already exists
3. Generate secure 12-character temporary password
4. Create user record with `status: "pending_password_change"`
5. Set password expiration (7 days)
6. Return success response with temporary credentials

### Frontend Process
1. Admin clicks "Invite User" button
2. Modal opens with form (email, name, role selection)
3. Form submission triggers API call
4. Success modal displays temporary credentials
5. Admin shares credentials securely with new user
6. New user logs in and is forced to change password

### First Login Experience
1. New user logs in with temporary credentials
2. System detects `pending_password_change` status
3. Redirect to password change form
4. After successful password change, status becomes "active"
5. User gains full access based on their role

## Security Features

### Access Control
- Role-based endpoint protection
- Firm-scoped user management (users can only manage users in their firm)
- Admin-only access to user management features

### Password Security
- Cryptographically secure temporary password generation
- Automatic password expiration (7 days)
- Forced password change on first login
- bcrypt password hashing

### Data Protection
- Soft delete preserves data integrity
- Audit trail for user management actions
- Role changes force immediate logout/re-login

## UI/UX Features

### User Management Interface
- Clean table layout with shadcn/ui components
- Search and filter capabilities
- Bulk actions support (future enhancement)
- Responsive design for mobile access

### Modal Interactions
- **Invite User Modal**: Form with validation and role selection
- **Success Modal**: Display temporary credentials with copy-to-clipboard
- **Confirmation Dialogs**: For destructive actions (delete, role changes)
- **Error Handling**: Clear error messages and recovery options

### Role-based Navigation
- Dynamic navigation based on user role
- Graceful handling of unauthorized access attempts
- Clear visual indicators of user permissions

## Database Schema Changes

### Users Collection Updates
```javascript
{
  // Existing fields...
  "role": "Admin", // or "Paralegal" - backward compatible with existing "Admin" strings
  "status": "active", // or "inactive", "pending_password_change"
  "password_expires_at": ISODate("2025-01-07T00:00:00Z"), // 7 days from creation
  "created_by": ObjectId("..."), // Admin who created this user
  "last_password_change": ISODate("2025-01-01T00:00:00Z"),
  "deleted_at": null // for soft delete functionality
}
```

## Testing Strategy

### Backend Testing
- Unit tests for RBAC dependencies
- Integration tests for user management endpoints
- Role-based access control validation
- Password security and expiration testing

### Frontend Testing
- Component testing for user management UI
- Role-based navigation testing
- Form validation and error handling
- User invite flow end-to-end testing

## Implementation Order

1. **Backend Models & Schemas** - Foundation for user management
2. **RBAC Dependencies** - Security layer implementation
3. **User Management Endpoints** - Core API functionality
4. **Frontend API Client** - Communication layer
5. **User Management UI** - Admin interface
6. **Frontend RBAC** - Role-based navigation and access
7. **Password Management** - User password change functionality
8. **Testing & Validation** - Comprehensive testing of all features

## Success Criteria

### Admin User Capabilities
- ✅ Access `/settings/users` page
- ✅ View list of all users in their firm
- ✅ Invite new users with Admin or Paralegal roles
- ✅ Change user roles (with forced logout/re-login)
- ✅ Soft delete users (mark as inactive)
- ✅ Access all application features

### Paralegal User Capabilities
- ✅ Access case management features (Dashboard, Cases, Timeline)
- ✅ Change their own password
- ✅ View their own role information
- ❌ Cannot access Settings navigation
- ❌ Cannot manage other users

### Security Validation
- ✅ Role-based endpoint protection working correctly
- ✅ Temporary passwords are secure and expire properly
- ✅ Forced password changes work on first login
- ✅ Soft delete preserves data integrity
- ✅ Role changes take immediate effect

### User Experience
- ✅ Intuitive user management interface
- ✅ Clear error messages and validation
- ✅ Smooth invite and onboarding process
- ✅ Responsive design across devices

## Future Enhancements (Post-MVP)

### Email-based Invitations
- Send invitation emails with secure tokens
- User-initiated password setting
- Email verification process

### Advanced User Management
- User groups and permissions
- Bulk user operations
- Advanced audit logging
- User activity monitoring

### Enhanced Security
- Two-factor authentication
- Single sign-on (SSO) integration
- Advanced password policies
- Session management improvements