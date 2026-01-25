import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Users } from "lucide-react";
import TrainingStats from "@/components/training/TrainingStats";
import TrainingCourseCard from "@/components/training/TrainingCourseCard";
import TrainingFilters, { TrainingFilter } from "@/components/training/TrainingFilters";
import { 
  TrainingCourse, 
  TrainingEnrollment, 
  TrainingCategory, 
  TrainingDifficulty,
  TeamTrainingStats,
  getExpiryStatus,
  isCourseExpiringSoon
} from "@/types/training";

export default function Training() {
  // State
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [enrollments, setEnrollments] = useState<Map<string, TrainingEnrollment>>(new Map());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'team'>('courses');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TrainingFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<TrainingCategory | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<TrainingDifficulty | 'all'>('all');
  
  const { toast } = useToast();

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const [coursesRes, enrollmentsRes] = await Promise.all([
        supabase
          .from("training_courses")
          .select("*")
          .eq("is_published", true)
          .order("title"),
        supabase
          .from("training_enrollments")
          .select("*")
          .eq("user_id", user.id)
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (enrollmentsRes.error) throw enrollmentsRes.error;

      setCourses(coursesRes.data || []);
      
      const enrollmentMap = new Map();
      (enrollmentsRes.data || []).forEach((enrollment) => {
        enrollmentMap.set(enrollment.course_id, enrollment);
      });
      setEnrollments(enrollmentMap);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load training courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const enrollInCourse = async (courseId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("training_enrollments")
        .insert({
          course_id: courseId,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Enrolled in course successfully",
      });

      fetchData();
    } catch (error) {
      console.error("Error enrolling:", error);
      toast({
        title: "Error",
        description: "Failed to enroll in course",
        variant: "destructive",
      });
    }
  };

  const continueCourse = (courseId: string) => {
    // TODO: Navigate to course detail page
    toast({
      title: "Coming Soon",
      description: "Course viewer will be implemented in next phase",
    });
  };

  const viewCertificate = (enrollment: TrainingEnrollment) => {
    if (enrollment.certificate_url) {
      window.open(enrollment.certificate_url, '_blank');
    }
  };

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = course.title.toLowerCase().includes(query);
        const matchesDescription = course.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription) return false;
      }

      // Status filter
      const enrollment = enrollments.get(course.id);
      switch (statusFilter) {
        case 'required':
          if (!course.is_required) return false;
          break;
        case 'enrolled':
          if (!enrollment) return false;
          break;
        case 'completed':
          if (!enrollment?.completed_at) return false;
          break;
        case 'expiring':
          if (!isCourseExpiringSoon(enrollment)) return false;
          break;
      }

      // Category filter
      if (categoryFilter !== 'all' && course.category !== categoryFilter) {
        return false;
      }

      // Difficulty filter
      if (difficultyFilter !== 'all' && course.difficulty !== difficultyFilter) {
        return false;
      }

      return true;
    });
  }, [courses, enrollments, searchQuery, statusFilter, categoryFilter, difficultyFilter]);

  // Stats calculation
  const stats = useMemo((): TeamTrainingStats => {
    const totalCourses = courses.length;
    const requiredCourses = courses.filter(c => c.is_required).length;
    const enrolledCourses = Array.from(enrollments.values());
    
    const completedCount = enrolledCourses.filter(e => e.completed_at).length;
    const inProgressCount = enrolledCourses.filter(e => !e.completed_at && e.progress > 0).length;
    const notStartedCount = enrolledCourses.filter(e => e.progress === 0).length;
    
    const averageCompletion = enrolledCourses.length > 0
      ? enrolledCourses.reduce((sum, e) => sum + e.progress, 0) / enrolledCourses.length
      : 0;
    
    const expiringSoon = enrolledCourses.filter(e => 
      isCourseExpiringSoon(e)
    ).length;

    return {
      total_members: 1, // Current user only
      total_courses: totalCourses,
      required_courses: requiredCourses,
      completed_count: completedCount,
      in_progress_count: inProgressCount,
      not_started_count: notStartedCount,
      average_completion: averageCompletion,
      expiring_soon: expiringSoon
    };
  }, [courses, enrollments]);

  // Render
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <GraduationCap className="h-12 w-12 animate-pulse mx-auto text-primary" />
          <p className="text-muted-foreground">Loading training courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            Training Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Enhance your skills with our training programs
          </p>
        </div>
      </div>

      {/* Stats */}
      <TrainingStats stats={stats} loading={loading} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'courses' | 'team')}>
        <TabsList>
          <TabsTrigger value="courses" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            My Courses
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2" disabled>
            <Users className="h-4 w-4" />
            Team Progress (Coming Soon)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6 mt-6">
          {/* Filters */}
          <TrainingFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            difficultyFilter={difficultyFilter}
            onDifficultyFilterChange={setDifficultyFilter}
            resultCount={filteredCourses.length}
          />

          {/* Course Grid */}
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No courses found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || difficultyFilter !== 'all'
                  ? "Try adjusting your filters"
                  : "No training courses are available yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <TrainingCourseCard
                  key={course.id}
                  course={course}
                  enrollment={enrollments.get(course.id)}
                  onEnroll={enrollInCourse}
                  onContinue={continueCourse}
                  onViewCertificate={viewCertificate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="team">
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Team Progress Dashboard</h3>
            <p className="text-muted-foreground">
              This feature will be available in the next update
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
