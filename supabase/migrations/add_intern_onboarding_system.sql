-- =====================================================
-- Intern Onboarding Checklist System Migration
-- =====================================================
-- This migration adds a comprehensive onboarding checklist system for interns
-- with admin-configurable templates and individual progress tracking.

-- =====================================================
-- 1. ENUMS
-- =====================================================

-- Checklist item types
CREATE TYPE checklist_item_type AS ENUM (
  'profile_update',      -- Complete profile information (bio, emergency contact, etc.)
  'handbook_review',     -- Review specific handbook content
  'task_completion',     -- Complete a specific task (generic)
  'quiz',                -- Complete and pass a quiz
  'manager_qa',          -- Attend manager Q&A session
  'verification'         -- Requires admin/manager verification (e.g., desk setup, equipment)
);

-- Manager Q&A session status
CREATE TYPE qa_session_status AS ENUM (
  'not_scheduled',
  'scheduled',
  'completed',
  'cancelled'
);

-- =====================================================
-- 2. CORE TABLES
-- =====================================================

-- Checklist template items (admin-managed)
CREATE TABLE onboarding_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  item_type checklist_item_type NOT NULL,

  -- Ordering and requirements
  display_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,

  -- Type-specific configuration (JSONB for flexibility)
  -- Examples:
  --   quiz type: {"quiz_id": "uuid", "passing_score": 80}
  --   handbook_review: {"content_item_id": "uuid"}
  --   profile_update: {"required_fields": ["bio", "emergency_contact", "profile_picture"]}
  --   verification: {"verification_type": "equipment_check", "verifier_role": "admin"}
  config JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived BOOLEAN DEFAULT false,

  -- Ensure unique ordering
  CONSTRAINT unique_display_order UNIQUE (display_order)
);

-- Individual intern progress through checklist
CREATE TABLE intern_checklist_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES onboarding_checklist_items(id) ON DELETE CASCADE,

  -- Progress tracking
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  -- Verification workflow (for items requiring approval)
  requires_verification BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES user_profiles(id),
  verified_at TIMESTAMPTZ,

  -- Feedback and notes
  notes TEXT,
  intern_notes TEXT, -- Intern can add notes/comments

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_item UNIQUE (user_id, checklist_item_id),
  CONSTRAINT completed_at_required_when_completed
    CHECK (completed = false OR completed_at IS NOT NULL),
  CONSTRAINT verified_at_required_when_verified
    CHECK (verified = false OR verified_at IS NOT NULL),
  CONSTRAINT verified_by_required_when_verified
    CHECK (verified = false OR verified_by IS NOT NULL)
);

-- Intern profile data (structured storage for profile completion)
CREATE TABLE intern_profile_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Profile information
  bio TEXT,
  phone_number TEXT,

  -- Emergency contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,

  -- Profile picture (Supabase Storage URL)
  profile_picture_url TEXT,

  -- Additional info
  start_date DATE,
  department TEXT DEFAULT 'Art Department',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manager Q&A sessions
CREATE TABLE manager_qa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links
  intern_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  -- Session details
  status qa_session_status DEFAULT 'not_scheduled',
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 30,

  -- Notes
  agenda TEXT,
  session_notes TEXT,
  intern_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT completed_requires_scheduled
    CHECK (status != 'completed' OR completed_at IS NOT NULL),
  CONSTRAINT scheduled_requires_time
    CHECK (status NOT IN ('scheduled', 'completed') OR scheduled_at IS NOT NULL)
);

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================

-- Progress lookups
CREATE INDEX idx_progress_user_id ON intern_checklist_progress(user_id);
CREATE INDEX idx_progress_user_completed ON intern_checklist_progress(user_id, completed);
CREATE INDEX idx_progress_verification ON intern_checklist_progress(user_id, requires_verification, verified);

-- Checklist ordering
CREATE INDEX idx_checklist_order ON onboarding_checklist_items(display_order) WHERE archived = false;
CREATE INDEX idx_checklist_type ON onboarding_checklist_items(item_type) WHERE archived = false;

-- Q&A sessions
CREATE INDEX idx_qa_intern ON manager_qa_sessions(intern_id, status);
CREATE INDEX idx_qa_manager ON manager_qa_sessions(manager_id, status);

-- =====================================================
-- 4. HELPER FUNCTIONS
-- =====================================================

-- Function to calculate intern onboarding progress percentage
CREATE OR REPLACE FUNCTION calculate_onboarding_progress(intern_user_id UUID)
RETURNS TABLE (
  total_items INTEGER,
  completed_items INTEGER,
  required_items INTEGER,
  required_completed INTEGER,
  overall_percentage NUMERIC,
  required_percentage NUMERIC
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
    END AS required_percentage
  FROM checklist_stats;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if a quiz-type item is completed
CREATE OR REPLACE FUNCTION check_quiz_completion(
  intern_user_id UUID,
  quiz_uuid UUID,
  required_score INTEGER DEFAULT 80
)
RETURNS BOOLEAN AS $$
DECLARE
  quiz_passed BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM quiz_attempts qa
    WHERE qa.user_id = intern_user_id
      AND qa.quiz_id = quiz_uuid
      AND qa.score >= required_score
      AND qa.completed_at IS NOT NULL
  ) INTO quiz_passed;

  RETURN COALESCE(quiz_passed, false);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to auto-create progress entries for new interns
CREATE OR REPLACE FUNCTION initialize_intern_checklist(intern_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Create progress entries for all active checklist items
  INSERT INTO intern_checklist_progress (user_id, checklist_item_id, requires_verification)
  SELECT
    intern_user_id,
    oci.id,
    CASE
      WHEN oci.item_type = 'verification' THEN true
      ELSE false
    END
  FROM onboarding_checklist_items oci
  WHERE oci.archived = false
  ON CONFLICT (user_id, checklist_item_id) DO NOTHING;

  -- Create profile data entry
  INSERT INTO intern_profile_data (user_id, start_date)
  VALUES (intern_user_id, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create Q&A session entry
  INSERT INTO manager_qa_sessions (intern_id)
  VALUES (intern_user_id)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON onboarding_checklist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at
  BEFORE UPDATE ON intern_checklist_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_data_updated_at
  BEFORE UPDATE ON intern_profile_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qa_sessions_updated_at
  BEFORE UPDATE ON manager_qa_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-set completed_at when item is marked complete
CREATE OR REPLACE FUNCTION set_completion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND OLD.completed = false THEN
    NEW.completed_at = NOW();
  ELSIF NEW.completed = false THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_completed_at
  BEFORE UPDATE ON intern_checklist_progress
  FOR EACH ROW EXECUTE FUNCTION set_completion_timestamp();

-- Auto-set verified_at when item is verified
CREATE OR REPLACE FUNCTION set_verification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verified = true AND OLD.verified = false THEN
    NEW.verified_at = NOW();
  ELSIF NEW.verified = false THEN
    NEW.verified_at = NULL;
    NEW.verified_by = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_verified_at
  BEFORE UPDATE ON intern_checklist_progress
  FOR EACH ROW EXECUTE FUNCTION set_verification_timestamp();

-- =====================================================
-- 6. VIEWS FOR EASY QUERYING
-- =====================================================

-- Comprehensive view of intern onboarding status
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

-- Detailed checklist item view with progress
CREATE OR REPLACE VIEW intern_checklist_detail AS
SELECT
  up.id AS user_id,
  up.full_name,
  oci.id AS checklist_item_id,
  oci.title,
  oci.description,
  oci.item_type,
  oci.display_order,
  oci.is_required,
  oci.config,

  -- Progress
  COALESCE(icp.completed, false) AS completed,
  icp.completed_at,
  icp.requires_verification,
  COALESCE(icp.verified, false) AS verified,
  icp.verified_at,
  verifier.full_name AS verified_by_name,
  icp.notes AS admin_notes,
  icp.intern_notes,

  -- Special handling for quiz items
  CASE
    WHEN oci.item_type = 'quiz' AND oci.config->>'quiz_id' IS NOT NULL
    THEN check_quiz_completion(
      up.id,
      (oci.config->>'quiz_id')::UUID,
      COALESCE((oci.config->>'passing_score')::INTEGER, 80)
    )
    ELSE NULL
  END AS quiz_passed

FROM user_profiles up
CROSS JOIN onboarding_checklist_items oci
LEFT JOIN intern_checklist_progress icp
  ON up.id = icp.user_id AND oci.id = icp.checklist_item_id
LEFT JOIN user_profiles verifier
  ON icp.verified_by = verifier.id
WHERE up.role = 'intern'
  AND oci.archived = false
ORDER BY up.full_name, oci.display_order;

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE onboarding_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE intern_checklist_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE intern_profile_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_qa_sessions ENABLE ROW LEVEL SECURITY;

-- Checklist Items Policies
CREATE POLICY "Admins can manage checklist items"
  ON onboarding_checklist_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Everyone can view active checklist items"
  ON onboarding_checklist_items
  FOR SELECT
  TO authenticated
  USING (archived = false);

-- Progress Policies
CREATE POLICY "Interns can view their own progress"
  ON intern_checklist_progress
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'artist')
    )
  );

CREATE POLICY "Interns can update their own progress"
  ON intern_checklist_progress
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    -- Prevent interns from self-verifying
    AND (verified = (SELECT verified FROM intern_checklist_progress WHERE id = intern_checklist_progress.id))
  );

CREATE POLICY "Admins can update all progress"
  ON intern_checklist_progress
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert progress entries"
  ON intern_checklist_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Controlled by application logic

-- Profile Data Policies
CREATE POLICY "Users can view their own profile data"
  ON intern_profile_data
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'artist')
    )
  );

CREATE POLICY "Users can update their own profile data"
  ON intern_profile_data
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Q&A Session Policies
CREATE POLICY "Interns can view their own Q&A sessions"
  ON manager_qa_sessions
  FOR SELECT
  TO authenticated
  USING (
    intern_id = auth.uid()
    OR manager_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Managers and admins can update Q&A sessions"
  ON manager_qa_sessions
  FOR UPDATE
  TO authenticated
  USING (
    manager_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 8. SEED DEFAULT CHECKLIST ITEMS
-- =====================================================

INSERT INTO onboarding_checklist_items (title, description, item_type, display_order, is_required, config) VALUES
  -- Profile Setup
  (
    'Complete Your Profile',
    'Add your bio, phone number, emergency contact, and upload a profile picture.',
    'profile_update',
    1,
    true,
    '{"required_fields": ["bio", "phone_number", "emergency_contact_name", "emergency_contact_phone", "profile_picture"]}'
  ),

  -- Handbook Reviews
  (
    'Review Employee Handbook',
    'Read through the complete employee handbook in the Knowledge Base.',
    'handbook_review',
    2,
    true,
    '{"category_name": "Employee Handbook"}'
  ),

  (
    'Review Art Department Guidelines',
    'Familiarize yourself with art department policies and procedures.',
    'handbook_review',
    3,
    true,
    '{"category_name": "Art Department"}'
  ),

  -- Safety Quiz
  (
    'Complete Safety Training Quiz',
    'Pass the workplace safety quiz with a score of 80% or higher.',
    'quiz',
    4,
    true,
    '{"quiz_id": null, "passing_score": 80}'
  ),

  -- Equipment & Workspace
  (
    'Workspace Setup Verification',
    'Manager verifies your desk, computer, and equipment are properly set up.',
    'verification',
    5,
    true,
    '{"verification_type": "equipment_check", "verifier_role": "admin"}'
  ),

  (
    'Software Access Verification',
    'Confirm access to all required design software and company systems.',
    'verification',
    6,
    true,
    '{"verification_type": "software_access", "verifier_role": "admin"}'
  ),

  -- Manager Q&A
  (
    'Attend Manager Q&A Session',
    'Schedule and complete a 30-minute session with your department manager.',
    'manager_qa',
    7,
    true,
    '{"duration_minutes": 30}'
  ),

  -- Department Tasks
  (
    'Shadow Senior Artist',
    'Spend at least 4 hours shadowing an experienced art department team member.',
    'task_completion',
    8,
    true,
    '{"task_type": "shadowing", "minimum_hours": 4}'
  ),

  (
    'Complete First Design Project',
    'Successfully complete and submit your first assigned design project.',
    'task_completion',
    9,
    true,
    '{"task_type": "design_project"}'
  ),

  -- Optional Items
  (
    'Meet the Team',
    'Introduce yourself to all art department team members.',
    'task_completion',
    10,
    false,
    '{"task_type": "team_introduction"}'
  ),

  (
    'Review Past Projects',
    'Browse the portfolio of previous screen printing projects in the archives.',
    'task_completion',
    11,
    false,
    '{"task_type": "portfolio_review"}'
  );

-- =====================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE onboarding_checklist_items IS
  'Admin-configurable template for onboarding checklist items';

COMMENT ON TABLE intern_checklist_progress IS
  'Tracks individual intern progress through onboarding checklist';

COMMENT ON TABLE intern_profile_data IS
  'Structured storage for intern profile information';

COMMENT ON TABLE manager_qa_sessions IS
  'Manages scheduling and completion of manager Q&A sessions';

COMMENT ON FUNCTION calculate_onboarding_progress IS
  'Calculates completion statistics for an intern''s onboarding progress';

COMMENT ON FUNCTION check_quiz_completion IS
  'Checks if an intern has passed a specific quiz';

COMMENT ON FUNCTION initialize_intern_checklist IS
  'Creates initial progress entries when a new intern is added';

COMMENT ON VIEW intern_onboarding_overview IS
  'High-level view of all intern onboarding statuses';

COMMENT ON VIEW intern_checklist_detail IS
  'Detailed view of checklist items with intern-specific progress';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
