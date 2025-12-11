-- Fix ambiguous column reference in calculate_onboarding_progress function
-- This fixes the "column reference required_completed is ambiguous" error

-- STEP 1: Drop the dependent view first
DROP VIEW IF EXISTS intern_onboarding_overview CASCADE;

-- STEP 2: Drop the existing function (return type changed)
DROP FUNCTION IF EXISTS calculate_onboarding_progress(UUID);

-- STEP 3: Create the fixed function version
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

COMMENT ON FUNCTION calculate_onboarding_progress IS
'Fixed version: Calculates onboarding progress statistics with qualified column references';

-- STEP 4: Recreate the dependent view
CREATE OR REPLACE VIEW intern_onboarding_overview AS
SELECT
  up.id AS user_id,
  up.full_name,
  up.email,
  ipd.start_date,
  ipd.profile_picture_url,

  -- Progress stats
  (SELECT total_items FROM calculate_onboarding_progress(up.id)) AS total_checklist_items,
  (SELECT completed_items FROM calculate_onboarding_progress(up.id)) AS completed_checklist_items,
  (SELECT overall_percentage FROM calculate_onboarding_progress(up.id)) AS progress_percentage,
  (SELECT required_percentage FROM calculate_onboarding_progress(up.id)) AS required_progress_percentage,

  -- Q&A session status
  mqa.status AS qa_session_status,
  mqa.scheduled_at AS qa_scheduled_at,
  mqa.completed_at AS qa_completed_at,

  -- Profile completion
  CASE
    WHEN ipd.bio IS NOT NULL
      AND ipd.phone_number IS NOT NULL
      AND ipd.emergency_contact_name IS NOT NULL
      AND ipd.emergency_contact_phone IS NOT NULL
      AND ipd.profile_picture_url IS NOT NULL
    THEN true
    ELSE false
  END AS profile_complete,

  -- Timestamps
  up.created_at AS onboarding_started_at,
  CASE
    WHEN (SELECT required_percentage FROM calculate_onboarding_progress(up.id)) = 100
    THEN (
      SELECT MAX(completed_at)
      FROM intern_checklist_progress
      WHERE user_id = up.id
    )
    ELSE NULL
  END AS onboarding_completed_at

FROM user_profiles up
LEFT JOIN intern_profile_data ipd ON up.id = ipd.user_id
LEFT JOIN manager_qa_sessions mqa ON up.id = mqa.intern_id
WHERE up.role = 'intern';

COMMENT ON VIEW intern_onboarding_overview IS
'Recreated view: Comprehensive view of intern onboarding status with fixed function dependency';
