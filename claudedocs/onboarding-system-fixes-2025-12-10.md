# Onboarding System Fixes - December 10, 2025

## Issue Report
**User**: "The intern checklist and welcome page aren't working"

## Testing Summary

### Test Account Used
- **Email**: intern@testing.test
- **Password**: TestingIntern12
- **Role**: Intern
- **Expected Flow**: Login → Auto-redirect to `/dashboard/onboarding` → See welcome page & checklist

## Issues Found and Fixed

### Issue #1: Parameter Name Mismatch ✅ FIXED
**Error Message**:
```
Could not find the function public.calculate_onboarding_progress(p_user_id)
Hint: Perhaps you meant to call the function public.calculate_onboarding_progress(intern_user_id)
```

**Root Cause**:
- Database function expects parameter named `intern_user_id`
- Application code was calling it with parameter named `p_user_id`

**Locations Fixed** (`p_user_id` → `intern_user_id`):
1. `middleware.ts:109` - Middleware onboarding check
2. `lib/onboarding.ts:69` - GetOnboardingProgress function
3. `lib/onboarding.ts:255` - CheckOnboardingComplete function

**Files Modified**:
- ✅ `middleware.ts`
- ✅ `lib/onboarding.ts`

---

### Issue #2: Ambiguous SQL Column Reference ✅ FIXED
**Error Message**:
```
column reference "required_completed" is ambiguous
It could refer to either a PL/pgSQL variable or a table column
```

**Root Cause**:
- SQL function `calculate_onboarding_progress` had unqualified column references in SELECT statement
- PostgreSQL couldn't determine if `required_completed` referred to:
  - The CTE column alias (line 193)
  - The function return column (line 182)

**Fix Applied**:
- Qualified all column references with `checklist_stats.` prefix
- Updated function to explicitly reference CTE columns

**Files Modified**:
- ✅ `supabase/migrations/add_intern_onboarding_system.sql` (updated for future use)
- ✅ `supabase/migrations/fix_calculate_onboarding_progress.sql` (complete migration created)

**Migration Includes**:
- ✅ STEP 1: Drop dependent view with CASCADE
- ✅ STEP 2: Drop existing function
- ✅ STEP 3: Create fixed function with qualified column references
- ✅ STEP 4: Recreate the view with correct dependencies

**⚠️ REQUIRED ACTION**: User must run the complete SQL migration in Supabase SQL Editor

---

## Fix Instructions

### Step 1: Application Code Fixes (COMPLETED ✅)
The following files have been updated:
- `middleware.ts` - Parameter name corrected
- `lib/onboarding.ts` - Two function calls corrected

**NO ACTION NEEDED** - These fixes are ready in your code.

### Step 2: Database Fix (⚠️ USER ACTION REQUIRED)

**You must run the following SQL in your Supabase SQL Editor**:

1. Go to https://supabase.com/dashboard
2. Open your project
3. Navigate to **SQL Editor**
4. Open the file: `supabase/migrations/fix_calculate_onboarding_progress.sql`
5. Copy the entire contents
6. Paste into Supabase SQL Editor
7. Click **Run**

**Alternative**: If you prefer, run this single SQL command in Supabase SQL Editor:

```sql
CREATE OR REPLACE FUNCTION calculate_onboarding_progress(intern_user_id UUID)
RETURNS TABLE (
  total_items INTEGER,
  completed_items INTEGER,
  required_items INTEGER,
  required_completed INTEGER,
  overall_percentage NUMERIC,
  required_percentage NUMERIC,
  is_complete BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH checklist_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE oci.archived = false) AS total,
      COUNT(*) FILTER (WHERE oci.is_required = true AND oci.archived = false) AS required,
      COUNT(*) FILTER (WHERE icp.completed = true) AS completed,
      COUNT(*) FILTER (WHERE oci.is_required = true AND icp.completed = true) AS required_completed
    FROM onboarding_checklist_items oci
    LEFT JOIN intern_checklist_progress icp
      ON oci.id = icp.checklist_item_id
      AND icp.user_id = intern_user_id
    WHERE oci.archived = false
  )
  SELECT
    checklist_stats.total::INTEGER,
    checklist_stats.completed::INTEGER,
    checklist_stats.required::INTEGER,
    checklist_stats.required_completed::INTEGER,
    CASE
      WHEN checklist_stats.total > 0 THEN ROUND((checklist_stats.completed::NUMERIC / checklist_stats.total::NUMERIC) * 100, 2)
      ELSE 0
    END AS overall_percentage,
    CASE
      WHEN checklist_stats.required > 0 THEN ROUND((checklist_stats.required_completed::NUMERIC / checklist_stats.required::NUMERIC) * 100, 2)
      ELSE 0
    END AS required_percentage,
    CASE
      WHEN checklist_stats.required > 0 THEN checklist_stats.required_completed >= checklist_stats.required
      ELSE checklist_stats.completed >= checklist_stats.total
    END AS is_complete
  FROM checklist_stats;
END;
$$ LANGUAGE plpgsql STABLE;
```

### Step 3: Verify the Fix

After running the SQL migration:

1. Restart the Next.js dev server:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. Test the intern flow:
   - Navigate to http://localhost:3001/login
   - Log in with:
     - Email: `intern@testing.test`
     - Password: `TestingIntern12`
   - Should automatically redirect to `/dashboard/onboarding`
   - Should see the welcome page and checklist (no errors!)

---

## Technical Details

### Function Fix Changes

**Before** (Ambiguous):
```sql
SELECT
  total::INTEGER,
  completed::INTEGER,
  required::INTEGER,
  required_completed::INTEGER,
  -- ... rest of SELECT
FROM checklist_stats;
```

**After** (Qualified):
```sql
SELECT
  checklist_stats.total::INTEGER,
  checklist_stats.completed::INTEGER,
  checklist_stats.required::INTEGER,
  checklist_stats.required_completed::INTEGER,
  -- ... rest of SELECT with checklist_stats. prefix
FROM checklist_stats;
```

### Why This Error Occurred

PostgreSQL requires explicit qualification when:
1. A CTE column has the same name as a function return column
2. The column is referenced in calculations or conditions

The fix adds `checklist_stats.` prefix to all column references, making it clear we're referencing the CTE columns, not the function return columns.

---

## Testing Evidence

### Test Session Details
- **Date**: December 10, 2025
- **Browser**: Chrome DevTools
- **Port**: 3001
- **User Flow**: Login → Auto-redirect → Onboarding page

### Error Progression
1. ✅ First error (p_user_id parameter) - Fixed in code
2. ⚠️ Second error (ambiguous column) - Fixed in SQL, **needs database update**

### Current Status
- **Application Code**: ✅ Fixed and ready
- **Database**: ⚠️ Awaiting SQL migration
- **Once Both Fixed**: ✅ Onboarding system will work perfectly

---

## Related Files

### Modified Files
- `middleware.ts`
- `lib/onboarding.ts`
- `supabase/migrations/add_intern_onboarding_system.sql`

### New Files
- `supabase/migrations/fix_calculate_onboarding_progress.sql`
- `claudedocs/onboarding-system-fixes-2025-12-10.md` (this document)

---

## Preventive Measures

### Code Review Checklist
- [ ] Always check parameter names match between function definition and caller
- [ ] Qualify all SQL column references in functions with CTEs
- [ ] Test with actual database before deploying

### Documentation Updates
- [ ] Update `ONBOARDING_QUICKSTART.md` with migration requirement
- [ ] Add troubleshooting section for common SQL errors
- [ ] Document parameter naming conventions

---

## Success Criteria

The onboarding system will be **fully functional** when:

1. ✅ Intern logs in successfully
2. ✅ Automatic redirect to `/dashboard/onboarding` works
3. ✅ Welcome page displays without errors
4. ✅ Checklist items load and display
5. ✅ Progress tracking functions correctly
6. ✅ No console errors in browser
7. ✅ No server errors in Next.js logs

**Next Step**: Run the SQL migration in Supabase SQL Editor
