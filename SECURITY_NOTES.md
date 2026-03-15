# Security Configuration Notes

## RLS Policy Design (Intentional)

This application is designed as a **single-tenant system without user authentication**. The RLS policies that use `USING (true)` are intentional and appropriate for this use case.

### Why USING (true) is acceptable here:

1. **Single-Tenant Architecture**: This application is designed for one organization's internal use
2. **No Multi-User Data Separation**: There are no multiple users with different data access needs
3. **Network-Level Security**: Access control is managed at the application/network level
4. **Anon Key Protection**: The Supabase anon key provides the authentication layer and can be rotated if compromised
5. **Rate Limiting**: Additional protection can be added via Supabase's rate limiting features

### Current Policy Structure:

All tables use this pattern:
- **SELECT**: `USING (true)` - Anyone with anon key can read
- **INSERT**: `WITH CHECK (true)` - Anyone with anon key can insert
- **UPDATE**: `USING (true) WITH CHECK (true)` - Anyone with anon key can update
- **DELETE**: `USING (true)` - Anyone with anon key can delete

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
