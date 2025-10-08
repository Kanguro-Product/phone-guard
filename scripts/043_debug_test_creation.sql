-- ========================================
-- Debug Test Creation
-- Check if tests exist and troubleshoot
-- ========================================

-- 1. Check current user
SELECT 
    'Current User' as check_type,
    auth.uid() as user_id,
    CASE 
        WHEN auth.uid() IS NULL THEN '❌ No user logged in'
        ELSE '✅ User logged in'
    END as status;

-- 2. Check if tests table exists
SELECT 
    'Tests Table' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tests') 
        THEN '✅ Table exists'
        ELSE '❌ Table does not exist'
    END as status;

-- 3. Check if any tests exist for current user
SELECT 
    'User Tests' as check_type,
    COUNT(*) as test_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Tests found'
        ELSE '❌ No tests found'
    END as status
FROM tests 
WHERE owner_user_id = auth.uid();

-- 4. Show all tests for current user (if any)
SELECT 
    'Test Details' as check_type,
    test_key,
    full_id,
    name,
    status,
    created_at
FROM tests 
WHERE owner_user_id = auth.uid()
ORDER BY created_at DESC;

-- 5. Check if test_metrics table exists
SELECT 
    'Metrics Table' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_metrics') 
        THEN '✅ Table exists'
        ELSE '❌ Table does not exist'
    END as status;

-- 6. Check if calculate_kpis function exists
SELECT 
    'KPI Function' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'calculate_kpis') 
        THEN '✅ Function exists'
        ELSE '❌ Function does not exist'
    END as status;
