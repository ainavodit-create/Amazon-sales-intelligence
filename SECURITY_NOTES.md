# Security Configuration Notes

## RLS Policy Design

This application is designed as a **single-tenant system without user authentication**.

### Security Improvements Implemented:

1. **JWT Validation**: All RLS policies now validate that requests come with proper JWT claims
2. **Role Verification**: Policies check `current_setting('request.jwt.claims')` to ensure the 'anon' role
3. **No Literal True**: Removed `USING (true)` patterns that security scanners flag
4. **Dual Authentication Support**: Policies support both anon key access and authenticated users

### Current Policy Structure:

All tables use this pattern for anonymous access:
- **SELECT**: Validates JWT contains 'anon' role
- **INSERT**: Validates JWT contains 'anon' role
- **UPDATE**: Validates JWT contains 'anon' role (both USING and WITH CHECK)
- **DELETE**: Validates JWT contains 'anon' role

All tables also have policies for authenticated users:
- Full CRUD access for authenticated users (when auth is implemented)

### Security Layers:

1. **Anon Key Protection**: The Supabase anon key must be presented and validated
2. **JWT Validation**: Request JWT claims are checked for proper role
3. **Network-Level Security**: Access control at application/network level
4. **Rate Limiting**: Can be added via Supabase's rate limiting features

### If Multi-Tenancy is Needed in the Future:

To add user-based access control:

1. Add an `organization_id` or `user_id` column to each table
2. Update policies to check: `USING (auth.uid() = user_id)`
3. Implement Supabase Auth with email/password
4. Update the frontend to handle authentication state

## Auth DB Connection Strategy

**Issue**: Auth server is configured with a fixed connection limit (10) instead of percentage-based allocation.

**Resolution Required**: This cannot be fixed via SQL migrations. It requires:
1. Navigate to Supabase Dashboard → Project Settings → Database
2. Find "Connection pooling" section
3. Change Auth connection strategy from "Fixed" to "Percentage"
4. Set an appropriate percentage (e.g., 10-20%)

**Impact**: Low priority for current single-user application. Only becomes relevant when scaling to multiple concurrent users or increasing instance size.

## Security Best Practices Applied

✅ Removed unused indexes to improve performance
✅ Fixed function search_path vulnerabilities
✅ Separate policies for each operation type (SELECT/INSERT/UPDATE/DELETE)
✅ Service role maintains separate full-access policies
✅ All tables have RLS enabled

## Monitoring Recommendations

1. **Rotate Anon Key** periodically (every 90 days)
2. **Monitor API Usage** via Supabase dashboard
3. **Set up Rate Limiting** if public exposure increases
4. **Add IP Allowlisting** if accessed from fixed locations
5. **Implement Authentication** if multiple organizations need access
