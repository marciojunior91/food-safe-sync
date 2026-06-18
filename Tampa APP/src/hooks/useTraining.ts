// Training Center data hooks.
//
// Mirrors the Knowledge Base hook layout (one hook per concern) so the page,
// the admin course editor, and the course player can compose them without
// prop-drilling:
//   - useTrainingCourses   → list courses (admins can include unpublished)
//   - useTrainingEnrollments → the current user's enrollments (+ joined course)
//   - useCourseMutations   → create / update / delete (admin gated by RLS)
//   - useEnrollmentActions → enroll / save progress / complete
//
// The course body lives in training_courses.content as a JSON array of
// sections (text / video / quiz). The player walks those sections in order.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationId } from './useUserContext';

// ── Content model ───────────────────────────────────────────────────────────
export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number; // index into options
}

export interface CourseSection {
  type: 'text' | 'video' | 'quiz';
  title: string;
  text?: string;            // text sections
  url?: string;             // video sections
  duration_minutes?: number;
  questions?: QuizQuestion[]; // quiz sections
}

export interface TrainingCourse {
  id: string;
  organization_id: string | null;
  created_by: string;
  title: string;
  description: string | null;
  content: CourseSection[];
  category: string | null;
  difficulty: string | null;
  duration_minutes: number | null;
  is_published: boolean;
  is_required: boolean;
  passing_score: number | null;
  renewal_months: number | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingEnrollment {
  id: string;
  course_id: string;
  user_id: string;
  team_member_id: string | null;
  organization_id: string | null;
  progress: number;
  score: number | null;
  enrolled_at: string;
  completed_at: string | null;
  last_activity: string | null;
  certificate_url: string | null;
  expires_at: string | null;
  course: TrainingCourse;
}

// A course a member is obliged to complete, by department or by individual.
export interface TrainingObligation {
  id: string;
  organization_id: string;
  course_id: string;
  department_id: string | null;
  team_member_id: string | null;
  created_at: string;
}

// Coerce the JSON `content` column into a typed section array.
function parseSections(content: unknown): CourseSection[] {
  if (!Array.isArray(content)) return [];
  return content.filter(
    (s): s is CourseSection =>
      !!s && typeof s === 'object' && typeof (s as CourseSection).type === 'string',
  );
}

function normalizeCourse(row: Record<string, unknown>): TrainingCourse {
  return {
    ...(row as unknown as TrainingCourse),
    content: parseSections(row.content),
  };
}

// ── Courses list ────────────────────────────────────────────────────────────
export function useTrainingCourses(opts: { includeUnpublished?: boolean } = {}): {
  courses: TrainingCourse[];
  loading: boolean;
  refetch: () => Promise<void>;
} {
  const { organizationId } = useOrganizationId();
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const includeUnpublished = !!opts.includeUnpublished;

  const refetch = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    let query = supabase
      .from('training_courses')
      .select('*')
      .eq('organization_id', organizationId)
      .order('title', { ascending: true });
    if (!includeUnpublished) query = query.eq('is_published', true);
    const { data } = await query;
    setCourses((data || []).map(normalizeCourse));
    setLoading(false);
  }, [organizationId, includeUnpublished]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { courses, loading, refetch };
}

// ── Enrollments for the selected team member ────────────────────────────────
// Pass the team_member_id of the person using the (shared) tablet. When null,
// nothing is loaded — a member must be selected first.
export function useTrainingEnrollments(teamMemberId?: string | null): {
  enrollments: TrainingEnrollment[];
  loading: boolean;
  refetch: () => Promise<void>;
} {
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!teamMemberId) { setEnrollments([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('training_enrollments')
      .select('*, course:training_courses(*)')
      .eq('team_member_id', teamMemberId)
      .order('enrolled_at', { ascending: false });
    const rows = (data || [])
      .filter(r => r.course) // drop orphans if a course was deleted
      .map(r => ({
        ...(r as unknown as TrainingEnrollment),
        course: normalizeCourse((r as Record<string, unknown>).course as Record<string, unknown>),
      }));
    setEnrollments(rows);
    setLoading(false);
  }, [teamMemberId]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { enrollments, loading, refetch };
}

// ── Admin mutations ─────────────────────────────────────────────────────────
export interface CourseInput {
  title: string;
  description: string;
  category: string | null;
  difficulty: string;
  duration_minutes: number | null;
  passing_score: number | null;
  renewal_months: number | null;
  is_required: boolean;
  is_published: boolean;
  content: CourseSection[];
}

export function useCourseMutations() {
  const { organizationId } = useOrganizationId();

  const createCourse = useCallback(async (input: CourseInput): Promise<TrainingCourse | null> => {
    if (!organizationId) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('training_courses')
      .insert({
        organization_id: organizationId,
        created_by: user.id,
        title: input.title,
        description: input.description || null,
        category: input.category,
        difficulty: input.difficulty,
        duration_minutes: input.duration_minutes,
        passing_score: input.passing_score,
        renewal_months: input.renewal_months,
        is_required: input.is_required,
        is_published: input.is_published,
        content: input.content as unknown as never,
      })
      .select()
      .single();
    if (error) throw error;
    return normalizeCourse(data as Record<string, unknown>);
  }, [organizationId]);

  const updateCourse = useCallback(async (
    id: string, input: CourseInput,
  ): Promise<TrainingCourse | null> => {
    const { data, error } = await supabase
      .from('training_courses')
      .update({
        title: input.title,
        description: input.description || null,
        category: input.category,
        difficulty: input.difficulty,
        duration_minutes: input.duration_minutes,
        passing_score: input.passing_score,
        renewal_months: input.renewal_months,
        is_required: input.is_required,
        is_published: input.is_published,
        content: input.content as unknown as never,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return normalizeCourse(data as Record<string, unknown>);
  }, []);

  const deleteCourse = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from('training_courses').delete().eq('id', id);
    if (error) throw error;
  }, []);

  return { createCourse, updateCourse, deleteCourse };
}

// ── Enrollment actions (per team member) ────────────────────────────────────
export function useEnrollmentActions() {
  const { organizationId } = useOrganizationId();

  // Enrol the selected team member. user_id stays the (shared) auth account;
  // team_member_id is the individual whose progress this tracks.
  const enroll = useCallback(async (courseId: string, teamMemberId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in');
    if (!teamMemberId) throw new Error('No team member selected');
    const { error } = await supabase
      .from('training_enrollments')
      .insert({
        course_id: courseId,
        user_id: user.id,
        team_member_id: teamMemberId,
        organization_id: organizationId,
        progress: 0,
      });
    if (error) throw error;
  }, [organizationId]);

  const saveProgress = useCallback(async (
    enrollmentId: string, progress: number,
  ): Promise<void> => {
    const { error } = await supabase
      .from('training_enrollments')
      .update({ progress: Math.max(0, Math.min(100, Math.round(progress))) })
      .eq('id', enrollmentId);
    if (error) throw error;
  }, []);

  const completeCourse = useCallback(async (
    enrollmentId: string, score: number, renewalMonths: number | null,
  ): Promise<void> => {
    const now = new Date();
    let expiresAt: string | null = null;
    if (renewalMonths && renewalMonths > 0) {
      const exp = new Date(now);
      exp.setMonth(exp.getMonth() + renewalMonths);
      expiresAt = exp.toISOString().slice(0, 10); // DATE column
    }
    const { error } = await supabase
      .from('training_enrollments')
      .update({
        progress: 100,
        score: Math.max(0, Math.min(100, Math.round(score))),
        completed_at: now.toISOString(),
        expires_at: expiresAt,
      })
      .eq('id', enrollmentId);
    if (error) throw error;
  }, []);

  return { enroll, saveProgress, completeCourse };
}

// ── Course obligations (admin) ──────────────────────────────────────────────
export function useTrainingObligations() {
  const { organizationId } = useOrganizationId();
  const [obligations, setObligations] = useState<TrainingObligation[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    const { data } = await supabase
      .from('training_obligations')
      .select('*')
      .eq('organization_id', organizationId);
    setObligations((data || []) as unknown as TrainingObligation[]);
    setLoading(false);
  }, [organizationId]);

  useEffect(() => { void refetch(); }, [refetch]);

  const addObligation = useCallback(async (
    courseId: string,
    target: { departmentId?: string | null; teamMemberId?: string | null },
  ): Promise<void> => {
    if (!organizationId) return;
    const { error } = await supabase.from('training_obligations').insert({
      organization_id: organizationId,
      course_id: courseId,
      department_id: target.departmentId ?? null,
      team_member_id: target.teamMemberId ?? null,
    });
    if (error) throw error;
    await refetch();
  }, [organizationId, refetch]);

  const removeObligation = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from('training_obligations').delete().eq('id', id);
    if (error) throw error;
    await refetch();
  }, [refetch]);

  return { obligations, loading, refetch, addObligation, removeObligation };
}

// ── All org enrollments with member info (admin report) ─────────────────────
export interface EnrollmentWithMember extends TrainingEnrollment {
  member: { id: string; display_name: string | null; department_id: string | null } | null;
}

export function useAllEnrollments() {
  const { organizationId } = useOrganizationId();
  const [enrollments, setEnrollments] = useState<EnrollmentWithMember[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    const { data } = await supabase
      .from('training_enrollments')
      .select('*, course:training_courses(*), member:team_members(id, display_name, department_id)')
      .eq('organization_id', organizationId);
    const mapped = (data || [])
      .filter(r => r.course)
      .map(r => ({
        ...(r as unknown as EnrollmentWithMember),
        course: normalizeCourse((r as Record<string, unknown>).course as Record<string, unknown>),
      }));
    setEnrollments(mapped);
    setLoading(false);
  }, [organizationId]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { enrollments, loading, refetch };
}

// ── Shared metadata helpers (used by page, editor, player) ──────────────────
export const COURSE_CATEGORIES: { value: string; label: string; icon: string }[] = [
  { value: 'food_safety', label: 'Food Safety', icon: '🛡️' },
  { value: 'haccp', label: 'HACCP', icon: '🔬' },
  { value: 'allergen_awareness', label: 'Allergen Awareness', icon: '⚠️' },
  { value: 'temperature_control', label: 'Temperature Control', icon: '🌡️' },
  { value: 'cleaning_procedures', label: 'Cleaning Procedures', icon: '🧽' },
  { value: 'personal_hygiene', label: 'Personal Hygiene', icon: '🧼' },
  { value: 'other', label: 'Other', icon: '📚' },
];

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

export function categoryIcon(category: string | null): string {
  return COURSE_CATEGORIES.find(c => c.value === category)?.icon ?? '📚';
}

export function difficultyColor(difficulty: string | null): string {
  switch (difficulty) {
    case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
}
