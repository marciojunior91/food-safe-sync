-- ============================================================================
-- TRAINING CENTER - TABLES AND POLICIES
-- ============================================================================
-- Purpose: Training modules, courses, enrollments, and certification tracking
-- Dependencies: profiles table
-- Author: Day 8 - Training Center Implementation
-- Date: January 25, 2026
-- ============================================================================

-- ============================================================================
-- 1. TRAINING COURSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Course Information
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '[]'::jsonb, -- Array of course content sections
  
  -- Metadata
  category TEXT, -- food_safety, haccp, allergen_awareness, etc.
  difficulty TEXT, -- beginner, intermediate, advanced
  duration_minutes INTEGER,
  
  -- Requirements
  is_published BOOLEAN DEFAULT false,
  is_required BOOLEAN DEFAULT false, -- Is this course mandatory?
  passing_score INTEGER, -- Minimum score to pass (0-100)
  renewal_months INTEGER, -- Months until renewal required (e.g., 12 for annual)
  
  -- Certificate
  certificate_template TEXT, -- URL or template ID for certificate generation
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_courses_org 
  ON public.training_courses(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_courses_published 
  ON public.training_courses(is_published);
CREATE INDEX IF NOT EXISTS idx_training_courses_category 
  ON public.training_courses(category);

-- RLS Policies
DROP POLICY IF EXISTS "Users can view published courses in their org" ON public.training_courses;
CREATE POLICY "Users can view published courses in their org"
  ON public.training_courses FOR SELECT
  USING (
    is_published = true AND 
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage courses" ON public.training_courses;
CREATE POLICY "Admins can manage courses"
  ON public.training_courses FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid()
    ) AND
    public.has_any_role(auth.uid(), ARRAY['admin', 'owner', 'manager']::app_role[])
  );

-- ============================================================================
-- 2. TRAINING ENROLLMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Progress tracking
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  score INTEGER CHECK (score >= 0 AND score <= 100), -- Quiz/assessment score
  
  -- Timestamps
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ,
  
  -- Certification
  certificate_url TEXT, -- S3/Storage URL for generated certificate
  expires_at DATE, -- For annual renewals
  
  -- Unique constraint: one enrollment per user per course
  UNIQUE(course_id, user_id)
);

-- Enable RLS
ALTER TABLE public.training_enrollments ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_enrollments_user 
  ON public.training_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_course 
  ON public.training_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_completed 
  ON public.training_enrollments(completed_at);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_expires 
  ON public.training_enrollments(expires_at);

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.training_enrollments;
CREATE POLICY "Users can view their own enrollments"
  ON public.training_enrollments FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Managers can view all enrollments in their org" ON public.training_enrollments;
CREATE POLICY "Managers can view all enrollments in their org"
  ON public.training_enrollments FOR SELECT
  USING (
    course_id IN (
      SELECT id FROM training_courses 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    ) AND
    public.has_any_role(auth.uid(), ARRAY['admin', 'owner', 'manager']::app_role[])
  );

DROP POLICY IF EXISTS "Users can enroll themselves" ON public.training_enrollments;
CREATE POLICY "Users can enroll themselves"
  ON public.training_enrollments FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own enrollment progress" ON public.training_enrollments;
CREATE POLICY "Users can update their own enrollment progress"
  ON public.training_enrollments FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================================
-- 3. UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_training_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS training_courses_updated_at ON public.training_courses;
CREATE TRIGGER training_courses_updated_at
  BEFORE UPDATE ON public.training_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_training_courses_updated_at();

-- ============================================================================
-- 4. LAST_ACTIVITY TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_training_enrollment_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS training_enrollments_activity ON public.training_enrollments;
CREATE TRIGGER training_enrollments_activity
  BEFORE UPDATE ON public.training_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_training_enrollment_activity();

-- ============================================================================
-- 5. SEED SAMPLE TRAINING COURSES
-- ============================================================================

DO $$
DECLARE
  v_org_id UUID;
  v_admin_id UUID;
  v_course_id UUID;
BEGIN
  -- Get first organization and admin
  SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
  SELECT user_id INTO v_admin_id FROM public.profiles 
    WHERE organization_id = v_org_id 
    LIMIT 1;

  IF v_org_id IS NOT NULL AND v_admin_id IS NOT NULL THEN
    
    -- 1. Food Safety Basics
    INSERT INTO public.training_courses (
      organization_id, created_by, title, description, category, difficulty,
      duration_minutes, is_published, is_required, passing_score, renewal_months,
      content
    ) VALUES (
      v_org_id, v_admin_id,
      'Food Safety Basics',
      'Essential food safety principles for all food handlers. Learn proper hygiene, temperature control, and cross-contamination prevention.',
      'food_safety',
      'beginner',
      45,
      true,
      true,
      80,
      12,
      jsonb_build_array(
        jsonb_build_object('type', 'text', 'title', 'Introduction', 'text', 'Food safety is critical in preventing foodborne illnesses.'),
        jsonb_build_object('type', 'video', 'title', 'Proper Hand Washing', 'url', 'https://example.com/handwashing', 'duration_minutes', 5),
        jsonb_build_object('type', 'quiz', 'title', 'Knowledge Check')
      )
    ) RETURNING id INTO v_course_id;

    -- 2. HACCP Principles
    INSERT INTO public.training_courses (
      organization_id, created_by, title, description, category, difficulty,
      duration_minutes, is_published, is_required, passing_score, renewal_months
    ) VALUES (
      v_org_id, v_admin_id,
      'HACCP Principles',
      'Hazard Analysis and Critical Control Points - systematic preventive approach to food safety.',
      'haccp',
      'intermediate',
      90,
      true,
      true,
      85,
      12
    );

    -- 3. Allergen Awareness
    INSERT INTO public.training_courses (
      organization_id, created_by, title, description, category, difficulty,
      duration_minutes, is_published, is_required, passing_score
    ) VALUES (
      v_org_id, v_admin_id,
      'Allergen Awareness & Management',
      'Identify common food allergens, understand cross-contact risks, and learn proper labeling procedures.',
      'allergen_awareness',
      'beginner',
      30,
      true,
      true,
      90
    );

    -- 4. Temperature Control
    INSERT INTO public.training_courses (
      organization_id, created_by, title, description, category, difficulty,
      duration_minutes, is_published, is_required
    ) VALUES (
      v_org_id, v_admin_id,
      'Temperature Control & Monitoring',
      'Master proper temperature zones, cooling procedures, and monitoring techniques to prevent bacterial growth.',
      'temperature_control',
      'intermediate',
      60,
      true,
      true
    );

    -- 5. Cleaning Procedures
    INSERT INTO public.training_courses (
      organization_id, created_by, title, description, category, difficulty,
      duration_minutes, is_published
    ) VALUES (
      v_org_id, v_admin_id,
      'Cleaning & Sanitization Procedures',
      'Learn effective cleaning methods, chemical safety, and sanitation schedules for food preparation areas.',
      'cleaning_procedures',
      'beginner',
      40,
      true
    );

    -- 6. Personal Hygiene
    INSERT INTO public.training_courses (
      organization_id, created_by, title, description, category, difficulty,
      duration_minutes, is_published, is_required
    ) VALUES (
      v_org_id, v_admin_id,
      'Personal Hygiene for Food Handlers',
      'Essential personal hygiene practices including proper attire, hand washing, and illness policies.',
      'personal_hygiene',
      'beginner',
      25,
      true,
      true
    );

  END IF;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Training Center tables created successfully';
  RAISE NOTICE '✅ Sample courses seeded';
  RAISE NOTICE '📚 6 training courses available';
END $$;
