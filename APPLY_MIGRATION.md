# Apply Onboarding Migration - Quick Guide

## ⚡ Quick Steps (2 minutes)

### 1. Open Supabase SQL Editor
Click this link: **[Open SQL Editor](https://supabase.com/dashboard/project/vgwpacvlmxfiypgcmczm/sql)**

### 2. Copy the SQL
The SQL is ready in: `supabase/migrations/fix_calculate_onboarding_progress.sql`

Or copy this:

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

### 3. Run in Supabase
1. Paste the SQL in the editor
2. Click **RUN** (or press Ctrl+Enter)
3. You should see: "Success. No rows returned"

### 4. Test
```bash
npm run dev
```

Then visit: http://localhost:3001/login

Login with:
- Email: `intern@testing.test`
- Password: `TestingIntern12`

Should redirect to `/dashboard/onboarding` **without errors**!

---

## What This Fixes

- ❌ Before: "column reference required_completed is ambiguous"
- ❌ Before: "cannot drop function because other objects depend on it"
- ✅ After: Function recreated with qualified column references
- ✅ After: View dependency properly managed with CASCADE
- ✅ After: Onboarding checklist loads successfully

## Troubleshooting

If you still see errors:
1. Check the Supabase SQL Editor for error messages
2. Verify the function was created: `SELECT * FROM pg_proc WHERE proname = 'calculate_onboarding_progress'`
3. Restart dev server after applying migration

## Files Changed

Application code (already fixed):
- ✅ `middleware.ts`
- ✅ `lib/onboarding.ts`

Database (needs manual update):
- ⚠️ Run SQL migration above
