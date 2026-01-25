// ============================================================================
// TRAINING CENTER - TYPE DEFINITIONS
// ============================================================================

export type TrainingCategory = 
  | 'food_safety'
  | 'haccp'
  | 'allergen_awareness'
  | 'temperature_control'
  | 'cross_contamination'
  | 'cleaning_procedures'
  | 'personal_hygiene'
  | 'documentation'
  | 'operations'
  | 'other';

export type TrainingDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ContentType = 'video' | 'pdf' | 'quiz' | 'text' | 'mixed';

export interface TrainingCourse {
  id: string;
  title: string;
  description: string | null;
  content: TrainingContent[];
  duration_minutes: number | null;
  organization_id: string | null;
  created_by: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  // Extended fields
  category?: TrainingCategory;
  difficulty?: TrainingDifficulty;
  is_required?: boolean;
  certificate_template?: string;
  passing_score?: number; // Minimum score to pass (0-100)
  renewal_months?: number; // Months until renewal required (e.g., 12 for annual)
}

export interface TrainingContent {
  type: ContentType;
  title: string;
  url?: string;
  text?: string;
  duration_minutes?: number;
  quiz?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number; // Index of correct option
  explanation?: string;
}

export interface TrainingEnrollment {
  id: string;
  course_id: string;
  user_id: string;
  progress: number; // 0-100
  enrolled_at: string;
  completed_at: string | null;
  // Extended fields
  score?: number; // Quiz score (0-100)
  certificate_url?: string;
  expires_at?: string; // For annual renewals
  last_activity?: string;
}

export interface TrainingProgress {
  enrollment: TrainingEnrollment;
  course: TrainingCourse;
  user?: {
    id: string;
    email: string;
    display_name: string | null;
  };
}

export interface TeamTrainingStats {
  total_members: number;
  total_courses: number;
  required_courses: number;
  completed_count: number;
  in_progress_count: number;
  not_started_count: number;
  average_completion: number;
  expiring_soon: number; // Certificates expiring in 30 days
}

export interface CertificateData {
  course_title: string;
  user_name: string;
  completion_date: string;
  score: number;
  certificate_id: string;
  expires_at?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TRAINING_CATEGORY_LABELS: Record<TrainingCategory, string> = {
  food_safety: 'Food Safety',
  haccp: 'HACCP',
  allergen_awareness: 'Allergen Awareness',
  temperature_control: 'Temperature Control',
  cross_contamination: 'Cross-Contamination Prevention',
  cleaning_procedures: 'Cleaning Procedures',
  personal_hygiene: 'Personal Hygiene',
  documentation: 'Documentation',
  operations: 'Operations',
  other: 'Other'
};

export const TRAINING_CATEGORY_COLORS: Record<TrainingCategory, string> = {
  food_safety: 'bg-red-500',
  haccp: 'bg-orange-500',
  allergen_awareness: 'bg-yellow-500',
  temperature_control: 'bg-blue-500',
  cross_contamination: 'bg-purple-500',
  cleaning_procedures: 'bg-green-500',
  personal_hygiene: 'bg-pink-500',
  documentation: 'bg-gray-500',
  operations: 'bg-indigo-500',
  other: 'bg-slate-500'
};

export const TRAINING_DIFFICULTY_LABELS: Record<TrainingDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced'
};

export const TRAINING_DIFFICULTY_COLORS: Record<TrainingDifficulty, string> = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const calculateCourseProgress = (enrollment: TrainingEnrollment | undefined): number => {
  return enrollment?.progress || 0;
};

export const isCourseCompleted = (enrollment: TrainingEnrollment | undefined): boolean => {
  return !!enrollment?.completed_at;
};

export const isCourseExpiringSoon = (enrollment: TrainingEnrollment | undefined): boolean => {
  if (!enrollment?.expires_at) return false;
  
  const expiryDate = new Date(enrollment.expires_at);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
};

export const isCourseExpired = (enrollment: TrainingEnrollment | undefined): boolean => {
  if (!enrollment?.expires_at) return false;
  
  const expiryDate = new Date(enrollment.expires_at);
  return expiryDate < new Date();
};

export const formatDuration = (minutes: number | null | undefined): string => {
  if (!minutes) return 'Duration not specified';
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
};

export const getExpiryStatus = (enrollment: TrainingEnrollment | undefined): 
  'valid' | 'expiring_soon' | 'expired' | 'not_completed' => {
  if (!enrollment?.completed_at) return 'not_completed';
  if (isCourseExpired(enrollment)) return 'expired';
  if (isCourseExpiringSoon(enrollment)) return 'expiring_soon';
  return 'valid';
};
