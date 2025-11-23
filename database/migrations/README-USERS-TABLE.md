# Users Table Migration Guide

## Quick Start

### 1. Run the Migration

Connect to your MySQL database and run the migration:

```bash
mysql -h ahmad_mysql-database -u sg_sow_user -p socialgarden_sow < database/migrations/create-users-table.sql
```

Or using the connection string from EasyPanel:

```bash
mysql -h ahmad_mysql-database -u sg_sow_user -p'SG_sow_2025_SecurePass!' socialgarden_sow < database/migrations/create-users-table.sql
```

### 2. Verify Table Creation

```sql
USE socialgarden_sow;
SHOW TABLES LIKE 'users';
DESCRIBE users;
```

### 3. Create Your First Admin User

```sql
INSERT INTO users (id, username, email, role) 
VALUES (UUID(), 'admin', 'admin@socialgarden.com.au', 'admin');
```

### 4. Test the Role API

The `/api/user/role` endpoint will now:
- Query the `users` table for the user's role
- Return the role if found
- Default to `viewer` if user not found

---

## User Management

### Add a New User

```sql
INSERT INTO users (id, username, email, role) 
VALUES (UUID(), 'username', 'email@example.com', 'editor');
```

### Update User Role

```sql
UPDATE users SET role = 'admin' WHERE username = 'username';
```

### List All Users

```sql
SELECT id, username, email, role, created_at FROM users;
```

### Delete a User

```sql
DELETE FROM users WHERE username = 'username';
```

---

## Role Values

- `admin` - Full access (delete, admin pages, rate card management)
- `editor` - Can create/edit, cannot delete
- `viewer` - Read-only access

---

## Integration with RBAC System

Once the `users` table exists, the role-based access control system will:

1. **Query user role** from `/api/user/role` endpoint
2. **Check permissions** using `useUserRole` hook
3. **Conditionally render** UI elements with `RoleGuard` component
4. **Protect admin pages** with role checks
5. **Hide delete buttons** for non-admin users

---

## Troubleshooting

### Table Already Exists

If you get an error that the table already exists:

```sql
-- Check if table exists
SHOW TABLES LIKE 'users';

-- If it exists but missing role column, add it:
ALTER TABLE users ADD COLUMN role ENUM('admin', 'editor', 'viewer') DEFAULT 'viewer';
```

### User Not Found

If the API returns `viewer` role for all users:

1. Check if user exists in database:
   ```sql
   SELECT * FROM users WHERE username = 'your-username';
   ```

2. Verify the `x-user-id` header matches the user's `id` or `username` in the database

3. Check API logs for errors

---

## Security Notes

⚠️ **Important:** 
- Never commit passwords or sensitive data
- Use environment variables for database credentials
- Implement proper authentication before using this in production
- Consider adding password hashing and session management

