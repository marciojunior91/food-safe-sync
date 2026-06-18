// Training Center. Data-driven (no mocks).
//
// Tabs: Courses (browse + enroll), My Progress (resume), Achievements (real
// certificates from completed enrollments), and Manage (admin-only course CRUD).
// All data flows through src/hooks/useTraining.ts; the course player persists
// progress + completion, and certificates render client-side via jsPDF.

import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Trophy, BookOpen, Clock, Users, CheckCircle, Star, Play, Award, Plus,
  Download, Loader2, Pencil, AlertCircle, BarChart3, UserCog, Target,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import { useUserContext } from '@/hooks/useUserContext';
import {
  useTrainingCourses,
  useTrainingEnrollments,
  useEnrollmentActions,
  useTrainingObligations,
  categoryIcon,
  difficultyColor,
  type TrainingCourse,
  type TrainingEnrollment,
} from '@/hooks/useTraining';
import { useTeamMemberSelection } from '@/hooks/useTeamMemberSelection';
import { UserSelectionDialog } from '@/components/labels/UserSelectionDialog';
import { CourseEditorDialog } from '@/components/training/CourseEditorDialog';
import { CoursePlayerDialog } from '@/components/training/CoursePlayerDialog';
import { CourseObligationsDialog } from '@/components/training/CourseObligationsDialog';
import { TrainingReport } from '@/components/training/TrainingReport';
import { generateCertificatePdf } from '@/utils/trainingCertificate';

export default function Training() {
  const { isAdmin } = useUserRole();
  const { context, organization } = useUserContext();
  // Shared-tablet identity: the individual using Training picks who they are.
  const {
    teamMember: selectedMember,
    isModalOpen: memberModalOpen,
    openModal: openMemberModal,
    closeModal: closeMemberModal,
    selectTeamMember,
  } = useTeamMemberSelection();
  const { courses, loading: coursesLoading, refetch: refetchCourses } =
    useTrainingCourses({ includeUnpublished: isAdmin });
  const { enrollments, loading: enrollLoading, refetch: refetchEnrollments } =
    useTrainingEnrollments(selectedMember?.id);
  const { enroll } = useEnrollmentActions();
  const { obligations } = useTrainingObligations();

  const [activeTab, setActiveTab] = useState('courses');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<TrainingCourse | null>(null);
  const [obligationsCourse, setObligationsCourse] = useState<TrainingCourse | null>(null);
  const [player, setPlayer] = useState<{ course: TrainingCourse; enrollment: TrainingEnrollment } | null>(null);

  // Course IDs this member is obliged to complete (by their dept or individually).
  const obligatedCourseIds = useMemo(() => {
    const memberDept = (selectedMember as any)?.department_id ?? null;
    const ids = new Set<string>();
    obligations.forEach(o => {
      if (o.team_member_id && o.team_member_id === selectedMember?.id) ids.add(o.course_id);
      if (o.department_id && memberDept && o.department_id === memberDept) ids.add(o.course_id);
    });
    return ids;
  }, [obligations, selectedMember]);

  const loading = coursesLoading || enrollLoading;
  const publishedCourses = useMemo(() => courses.filter(c => c.is_published), [courses]);

  const enrollmentByCourse = useMemo(() => {
    const m = new Map<string, TrainingEnrollment>();
    enrollments.forEach(e => m.set(e.course_id, e));
    return m;
  }, [enrollments]);

  // Stats
  const completed = enrollments.filter(e => e.completed_at);
  const inProgress = enrollments.filter(e => !e.completed_at && e.progress > 0);
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, e) => s + (e.score || 0), 0) / completed.length)
    : 0;

  const refetchAll = () => { refetchCourses(); refetchEnrollments(); };

  const handleEnroll = async (course: TrainingCourse) => {
    if (!selectedMember) { openMemberModal(); return; }
    setEnrollingId(course.id);
    try {
      await enroll(course.id, selectedMember.id);
      await refetchEnrollments();
      toast.success(`Enrolled in ${course.title}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to enroll');
    } finally {
      setEnrollingId(null);
    }
  };

  const openPlayer = (course: TrainingCourse, enrollment: TrainingEnrollment) =>
    setPlayer({ course, enrollment });

  const downloadCertificate = (e: TrainingEnrollment) => {
    generateCertificatePdf({
      recipientName: selectedMember?.display_name || context?.display_name || 'Team member',
      courseTitle: e.course.title,
      organizationName: organization?.name || context?.organization_name || 'Tampa',
      score: e.score,
      completedAt: e.completed_at!,
      expiresAt: e.expires_at,
    });
  };

  const tabCount = isAdmin ? 5 : 3;

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Training Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Courses, certification tracking, and team training compliance.
          </p>
        </div>
        {/* Shared-tablet identity */}
        <Button
          variant={selectedMember ? 'outline' : 'default'}
          size="sm"
          className="gap-2"
          onClick={openMemberModal}
        >
          <UserCog className="h-4 w-4" />
          {selectedMember ? selectedMember.display_name : 'Who are you?'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} color="text-blue-600" label="Enrolled" value={enrollments.length} />
        <StatCard icon={CheckCircle} color="text-green-600" label="Completed" value={completed.length} />
        <StatCard icon={Clock} color="text-orange-600" label="In Progress" value={inProgress.length} />
        <StatCard icon={Star} color="text-yellow-600" label="Avg Score" value={`${avgScore}%`} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList
          className="w-full justify-start overflow-x-auto h-auto p-1"
          style={{ display: 'grid', gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}
        >
          <TabsTrigger value="courses" className="gap-2"><BookOpen className="h-4 w-4" /> Courses</TabsTrigger>
          <TabsTrigger value="progress" className="gap-2"><Clock className="h-4 w-4" /> My Progress</TabsTrigger>
          <TabsTrigger value="achievements" className="gap-2"><Award className="h-4 w-4" /> Achievements</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="manage" className="gap-2"><Users className="h-4 w-4" /> Manage</TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="report" className="gap-2"><BarChart3 className="h-4 w-4" /> Report</TabsTrigger>
          )}
        </TabsList>

        {/* ── Courses ── */}
        <TabsContent value="courses" className="space-y-6 mt-6">
          {loading ? (
            <Loading />
          ) : publishedCourses.length === 0 ? (
            <Empty icon={BookOpen} title="No courses available"
              hint={isAdmin ? 'Use the Manage tab to create your first course.' : 'Your admin hasn\'t published any courses yet.'} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedCourses.map(course => {
                const enrollment = enrollmentByCourse.get(course.id);
                const isCompleted = !!enrollment?.completed_at;
                return (
                  <Card key={course.id} className="relative flex flex-col">
                    {(course.is_required || obligatedCourseIds.has(course.id)) && (
                      <Badge className="absolute top-2 right-2 bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                        {obligatedCourseIds.has(course.id) ? 'Required for you' : 'Required'}
                      </Badge>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{categoryIcon(course.category)}</span>
                        <div className="min-w-0">
                          <CardTitle className="text-lg leading-tight">{course.title}</CardTitle>
                          {course.difficulty && (
                            <Badge className={`mt-1 ${difficultyColor(course.difficulty)}`}>
                              {course.difficulty}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 mt-auto">
                      {course.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">{course.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {course.duration_minutes != null && (
                          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{course.duration_minutes}m</span>
                        )}
                        {course.passing_score != null && (
                          <span className="flex items-center gap-1"><Award className="h-4 w-4" />{course.passing_score}% to pass</span>
                        )}
                      </div>

                      {enrollment ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span><span>{enrollment.progress}%</span>
                          </div>
                          <Progress value={enrollment.progress} className="h-2" />
                          {isCompleted ? (
                            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                              <CheckCircle className="h-4 w-4" /> Completed
                              {enrollment.score != null && <span>({enrollment.score}%)</span>}
                            </div>
                          ) : (
                            <Button size="sm" className="w-full gap-2" onClick={() => openPlayer(course, enrollment)}>
                              <Play className="h-4 w-4" /> {enrollment.progress > 0 ? 'Continue' : 'Start'} Learning
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button size="sm" className="w-full gap-2" disabled={enrollingId === course.id}
                          onClick={() => handleEnroll(course)}>
                          {enrollingId === course.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                          Enroll Now
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── My Progress ── */}
        <TabsContent value="progress" className="space-y-4 mt-6">
          {loading ? (
            <Loading />
          ) : enrollments.length === 0 ? (
            <Empty icon={BookOpen} title="No enrollments yet"
              hint="Start learning by enrolling in a course."
              action={<Button onClick={() => setActiveTab('courses')}>Browse Courses</Button>} />
          ) : (
            <div className="grid gap-4">
              {enrollments.map(e => (
                <Card key={e.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">{categoryIcon(e.course.category)}</span>
                        <div>
                          <h4 className="font-medium">{e.course.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {e.course.duration_minutes ?? 0} minutes
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span><span>{e.progress}%</span>
                        </div>
                        <Progress value={e.progress} className="h-2" />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {e.completed_at ? (
                        <div className="text-green-600">
                          <CheckCircle className="h-5 w-5 mx-auto mb-1" />
                          <p className="text-sm font-medium">Completed</p>
                          {e.score != null && <p className="text-sm">{e.score}%</p>}
                        </div>
                      ) : (
                        <Button size="sm" className="gap-1" onClick={() => openPlayer(e.course, e)}>
                          <Play className="h-4 w-4" /> {e.progress > 0 ? 'Continue' : 'Start'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Achievements ── */}
        <TabsContent value="achievements" className="space-y-4 mt-6">
          {completed.length === 0 ? (
            <Empty icon={Trophy} title="No certificates yet"
              hint="Complete a course to earn a downloadable certificate." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {completed.map(e => {
                const expired = e.expires_at && new Date(e.expires_at) < new Date();
                return (
                  <Card key={e.id} className="flex flex-col">
                    <CardContent className="p-5 text-center flex flex-col flex-1">
                      <Award className="h-10 w-10 mx-auto text-yellow-500 mb-3" />
                      <p className="font-medium">{e.course.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Completed {format(new Date(e.completed_at!), 'MMM d, yyyy')}
                        {e.score != null && ` · ${e.score}%`}
                      </p>
                      {e.expires_at && (
                        <p className={`text-xs mt-1 flex items-center justify-center gap-1 ${expired ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {expired && <AlertCircle className="h-3 w-3" />}
                          {expired ? 'Expired' : 'Valid until'} {format(new Date(e.expires_at), 'MMM d, yyyy')}
                        </p>
                      )}
                      <Button variant="outline" size="sm" className="gap-2 mt-4"
                        onClick={() => downloadCertificate(e)}>
                        <Download className="h-4 w-4" /> Certificate
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Manage (admin only) ── */}
        {isAdmin && (
          <TabsContent value="manage" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Course Management</h3>
                <p className="text-sm text-muted-foreground">Create, edit, publish, and remove courses.</p>
              </div>
              {/* Create is restricted to admin-type auth users only */}
              {isAdmin && (
                <Button className="gap-2" onClick={() => { setEditingCourse(null); setEditorOpen(true); }}>
                  <Plus className="h-4 w-4" /> New Course
                </Button>
              )}
            </div>

            {courses.length === 0 ? (
              <Empty icon={Users} title="No courses yet" hint="Create your first course to get started." />
            ) : (
              <div className="grid gap-3">
                {courses.map(course => (
                  <Card key={course.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl">{categoryIcon(course.category)}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">{course.title}</p>
                            {!course.is_published && (
                              <Badge variant="outline" className="text-amber-600 border-amber-300">Draft</Badge>
                            )}
                            {course.is_required && (
                              <Badge variant="secondary">Required</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {course.content.length} section{course.content.length === 1 ? '' : 's'}
                            {course.duration_minutes != null && ` · ${course.duration_minutes}m`}
                            {course.difficulty && ` · ${course.difficulty}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" className="gap-2"
                          onClick={() => setObligationsCourse(course)}>
                          <Target className="h-4 w-4" /> Assign
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2"
                          onClick={() => { setEditingCourse(course); setEditorOpen(true); }}>
                          <Pencil className="h-4 w-4" /> Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* ── Report (admin only) ── */}
        {isAdmin && (
          <TabsContent value="report" className="space-y-4 mt-6">
            <TrainingReport />
          </TabsContent>
        )}
      </Tabs>

      {isAdmin && (
        <CourseEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          course={editingCourse}
          onSaved={refetchAll}
        />
      )}

      {player && (
        <CoursePlayerDialog
          open={!!player}
          onOpenChange={open => { if (!open) setPlayer(null); }}
          course={player.course}
          enrollment={player.enrollment}
          onChanged={refetchEnrollments}
        />
      )}

      {/* Shared-tablet identity picker */}
      <UserSelectionDialog
        open={memberModalOpen}
        onOpenChange={(open) => { if (!open) closeMemberModal(); }}
        onSelectUser={selectTeamMember}
        title="Who are you?"
        description="Select your name to track your training"
      />

      {isAdmin && obligationsCourse && (
        <CourseObligationsDialog
          open={!!obligationsCourse}
          onOpenChange={(open) => { if (!open) setObligationsCourse(null); }}
          course={obligationsCourse}
        />
      )}
    </div>
  );
}

// ── Small presentational helpers ────────────────────────────────────────────
function StatCard({
  icon: Icon, color, label, value,
}: { icon: React.ComponentType<{ className?: string }>; color: string; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className={`h-8 w-8 ${color}`} />
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function Empty({
  icon: Icon, title, hint, action,
}: { icon: React.ComponentType<{ className?: string }>; title: string; hint: string; action?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">
        <Icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">{title}</p>
        <p className="text-sm mt-1">{hint}</p>
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}
