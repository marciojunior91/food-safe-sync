-- Phase 3: Daily Routine, Training, Enhanced Users, and Notifications/Chat modules

-- ============================================
-- DAILY ROUTINE MODULE
-- ============================================

CREATE TABLE public.daily_routines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  frequency text NOT NULL DEFAULT 'daily',
  assigned_role app_role,
  organization_id uuid,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view routines in their organization"
ON public.daily_routines FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Managers and admins can manage routines"
ON public.daily_routines FOR ALL
USING (
  (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )) AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'manager', 'leader_chef']::app_role[])
);

CREATE TABLE public.routine_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id uuid NOT NULL REFERENCES public.daily_routines(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  description text,
  task_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.routine_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks for their organization routines"
ON public.routine_tasks FOR SELECT
USING (routine_id IN (
  SELECT id FROM daily_routines WHERE organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Managers and admins can manage routine tasks"
ON public.routine_tasks FOR ALL
USING (routine_id IN (
  SELECT id FROM daily_routines WHERE organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ) AND public.has_any_role(auth.uid(), ARRAY['admin', 'manager', 'leader_chef']::app_role[])
));

CREATE TABLE public.routine_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id uuid NOT NULL REFERENCES public.daily_routines(id) ON DELETE CASCADE,
  completed_by uuid NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  task_statuses jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE public.routine_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view completions in their organization"
ON public.routine_completions FOR SELECT
USING (routine_id IN (
  SELECT id FROM daily_routines WHERE organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Staff can create completions"
ON public.routine_completions FOR INSERT
WITH CHECK (
  auth.uid() = completed_by AND
  routine_id IN (
    SELECT id FROM daily_routines WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- TRAINING MODULE
-- ============================================

CREATE TABLE public.training_courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  content jsonb DEFAULT '[]'::jsonb,
  duration_minutes integer,
  organization_id uuid,
  created_by uuid NOT NULL,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view published courses in their organization"
ON public.training_courses FOR SELECT
USING (
  (is_published = true AND organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )) OR
  created_by = auth.uid()
);

CREATE POLICY "Managers and admins can manage courses"
ON public.training_courses FOR ALL
USING (
  (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )) AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'manager', 'leader_chef']::app_role[])
);

CREATE TABLE public.training_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  progress integer DEFAULT 0,
  enrolled_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  UNIQUE(course_id, user_id)
);

ALTER TABLE public.training_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enrollments"
ON public.training_enrollments FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Managers can view all enrollments in their organization"
ON public.training_enrollments FOR SELECT
USING (
  course_id IN (
    SELECT id FROM training_courses WHERE organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  ) AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
);

CREATE POLICY "Users can enroll themselves"
ON public.training_enrollments FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own enrollment progress"
ON public.training_enrollments FOR UPDATE
USING (user_id = auth.uid());

-- ============================================
-- ENHANCED USERS/PEOPLE MODULE
-- ============================================

CREATE TABLE public.departments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  organization_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view departments in their organization"
ON public.departments FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Managers and admins can manage departments"
ON public.departments FOR ALL
USING (
  (organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )) AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
);

CREATE TABLE public.certifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  issuer text,
  issue_date date,
  expiry_date date,
  document_url text,
  organization_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own certifications"
ON public.certifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Managers can view all certifications in their organization"
ON public.certifications FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ) AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
);

CREATE POLICY "Managers can manage certifications"
ON public.certifications FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  ) AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'manager']::app_role[])
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hire_date date;

-- ============================================
-- NOTIFICATIONS/CHAT MODULE
-- ============================================

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  action_url text,
  organization_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE TABLE public.chat_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'group',
  organization_id uuid,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chat_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  last_read_at timestamp with time zone,
  UNIQUE(channel_id, user_id)
);

ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view channels they are members of"
ON public.chat_channels FOR SELECT
USING (
  id IN (
    SELECT channel_id FROM chat_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create channels in their organization"
ON public.chat_channels FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view members of their channels"
ON public.chat_members FOR SELECT
USING (
  channel_id IN (
    SELECT channel_id FROM chat_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Channel creators can add members"
ON public.chat_members FOR INSERT
WITH CHECK (
  channel_id IN (
    SELECT id FROM chat_channels WHERE created_by = auth.uid()
  )
);

CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their channels"
ON public.chat_messages FOR SELECT
USING (
  channel_id IN (
    SELECT channel_id FROM chat_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their channels"
ON public.chat_messages FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  channel_id IN (
    SELECT channel_id FROM chat_members WHERE user_id = auth.uid()
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;