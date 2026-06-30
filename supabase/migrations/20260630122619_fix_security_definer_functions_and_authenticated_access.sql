/*
  # Fix Security Issues

  ## Issues Fixed

  ### 1. SECURITY DEFINER Trigger Functions Callable via RPC (4 warnings)
  Functions update_returns_sources_updated_at() and update_updated_at_column() are trigger
  functions that should never be directly invocable via /rest/v1/rpc/. Fixes:
  - Revoke EXECUTE from PUBLIC (covers anon + authenticated)
  - Change to SECURITY INVOKER so they run as the calling user, not the owner

  ### 2. Authenticated Role Has Unnecessary SELECT on All Tables (4 warnings)
  This app has no authentication flow. The authenticated role should not have SELECT
  access since no user will ever be in an authenticated session.
  - Revoke SELECT from authenticated on all 4 tables
  - Drop the authenticated SELECT policies (they have no effect without the grant,
    but removing them keeps things clean)

  ## Remaining Accepted Warnings (4)
  The anon role SELECT on the 4 tables is intentional: this is a no-auth internal tool
  that uses the anon key for all data access. Revoking SELECT from anon would break
  the entire application. The data is protected by RLS policies which restrict access
  to requests carrying a valid anon JWT.
*/

-- ============================================================
-- Fix 1: SECURITY DEFINER trigger functions
-- Change to SECURITY INVOKER so they run as the calling role,
-- not as the function owner. This removes the privilege escalation risk.
-- ============================================================

ALTER FUNCTION public.update_updated_at_column() SECURITY INVOKER;
ALTER FUNCTION public.update_returns_sources_updated_at() SECURITY INVOKER;

-- Revoke direct RPC execution from all non-superuser roles
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_returns_sources_updated_at() FROM PUBLIC;

-- ============================================================
-- Fix 2: Revoke authenticated SELECT on all tables
-- The app has no login flow, so authenticated users should not
-- be able to SELECT from these tables.
-- ============================================================

REVOKE SELECT ON public.amazon_monthly_sales FROM authenticated;
REVOKE SELECT ON public.amazon_monthly_returns FROM authenticated;
REVOKE SELECT ON public.product_master_mapping FROM authenticated;
REVOKE SELECT ON public.returns_data_sources FROM authenticated;

-- Drop the now-useless authenticated SELECT policies on each table
-- (no SELECT grant = policy can never grant access anyway)
DROP POLICY IF EXISTS "Authenticated users can select monthly sales" ON public.amazon_monthly_sales;
DROP POLICY IF EXISTS "Authenticated users can read monthly sales" ON public.amazon_monthly_sales;
DROP POLICY IF EXISTS "select_own_monthly_sales" ON public.amazon_monthly_sales;

DROP POLICY IF EXISTS "Authenticated users can select returns" ON public.amazon_monthly_returns;
DROP POLICY IF EXISTS "Authenticated users can read returns" ON public.amazon_monthly_returns;
DROP POLICY IF EXISTS "select_own_returns" ON public.amazon_monthly_returns;

DROP POLICY IF EXISTS "Authenticated users can select product mapping" ON public.product_master_mapping;
DROP POLICY IF EXISTS "Authenticated users can read product mapping" ON public.product_master_mapping;
DROP POLICY IF EXISTS "select_own_product_mapping" ON public.product_master_mapping;

DROP POLICY IF EXISTS "Authenticated users can select returns sources" ON public.returns_data_sources;
DROP POLICY IF EXISTS "Authenticated users can read returns sources" ON public.returns_data_sources;
DROP POLICY IF EXISTS "select_own_returns_sources" ON public.returns_data_sources;
