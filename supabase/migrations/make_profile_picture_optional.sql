-- Make profile picture optional in onboarding profile completion check
-- This migration updates the intern_onboarding_overview view to not require profile_picture_url

-- Drop and recreate the view with updated profile completion logic
DROP VIEW IF EXISTS intern_onboarding_overview CASCADE;

CREATE OR REPLACE VIEW intern_onboarding_overview AS
SELECT
  up.id AS user_id,
  up.email,
  up.full_name,

  -- Profile data
  ipd.start_date,
  ipd.bio,
  ipd.phone_number,
  ipd.emergency_contact_name,
  ipd.emergency_contact_phone,
  ipd.profile_picture_url,

  -- Progress stats
  stats.total_items,
  stats.completed_items,
  stats.required_items,
  stats.required_completed AS completed_required_items,
  stats.overall_percentage AS completion_percentage,
  stats.required_percentage,
  stats.is_complete,

  -- Manager Q&A status
  mqa.status AS qa_session_status,
  mqa.scheduled_at AS qa_scheduled_at,
  mqa.completed_at AS qa_completed_at,

  -- Profile completion (profile_picture_url is now OPTIONAL)
  CASE
    WHEN ipd.bio IS NOT NULL
      AND ipd.phone_number IS NOT NULL
      AND ipd.emergency_contact_name IS NOT NULL
      AND ipd.emergency_contact_phone IS NOT NULL
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
CROSS JOIN LATERAL (
  SELECT *
  FROM calculate_onboarding_progress(up.id)
) AS stats
WHERE up.role = 'intern'
ORDER BY up.created_at DESC;

-- Add helpful comment
COMMENT ON VIEW intern_onboarding_overview IS
'Complete onboarding overview for interns. Profile picture is optional - only bio, phone, emergency contact name, and emergency contact phone are required for profile completion.';
