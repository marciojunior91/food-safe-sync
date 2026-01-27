import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, BookOpen, Clock, Users, CheckCircle, Star, Play, Award, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration_minutes: number;
  is_required: boolean;
  passing_score: number;
}

interface Enrollment {
  id: string;
  progress: number;
  score: number | null;
  completed_at: string | null;
  course_id: string;
  course: Course;
}

export default function Training() {
  const [activeTab, setActiveTab] = useState("courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch available courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('training_courses')
        .select('*')
        .eq('is_published', true)
        .order('title');

      if (coursesError) throw coursesError;

      // Fetch user enrollments with course details
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('training_enrollments')
        .select(`
          *,
          course:training_courses(*)
        `)
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;

      setCourses(coursesData || []);
      setEnrollments(enrollmentsData || []);
    } catch (error) {
      console.error('Error fetching training data:', error);
      toast.error('Failed to load training data');
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('training_enrollments')
        .insert([{ 
          course_id: courseId,
          user_id: (await supabase.auth.getUser()).data.user?.id || ''
        }]);

      if (error) throw error;

      toast.success('Successfully enrolled in course');
      fetchData();
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error('Failed to enroll in course');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food_safety': return '🛡️';
      case 'haccp': return '🔬';
      case 'allergen_awareness': return '⚠️';
      case 'temperature_control': return '🌡️';
      case 'cleaning_procedures': return '🧽';
      case 'personal_hygiene': return '🧼';
      default: return '📚';
    }
  };

  const completedCourses = enrollments.filter(e => e.completed_at);
  const inProgressCourses = enrollments.filter(e => !e.completed_at && e.progress > 0);
  const totalEnrolled = enrollments.length;
  const averageScore = completedCourses.length > 0 
    ? Math.round(completedCourses.reduce((sum, e) => sum + (e.score || 0), 0) / completedCourses.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Center</h1>
          <p className="text-muted-foreground">
            Comprehensive training and certification management
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Enrolled</p>
                <p className="text-2xl font-bold">{totalEnrolled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedCourses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressCourses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold">{averageScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            My Progress
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Manage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const enrollment = enrollments.find(e => e.course_id === course.id);
              const isEnrolled = !!enrollment;
              const isCompleted = enrollment?.completed_at;

              return (
                <Card key={course.id} className="relative">
                  {course.is_required && (
                    <Badge className="absolute top-2 right-2 bg-red-100 text-red-800">
                      Required
                    </Badge>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getCategoryIcon(course.category)}</span>
                        <div>
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <Badge className={getDifficultyColor(course.difficulty)}>
                            {course.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {course.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration_minutes}m
                      </div>
                      {course.passing_score && (
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          {course.passing_score}% to pass
                        </div>
                      )}
                    </div>

                    {isEnrolled ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{enrollment.progress}%</span>
                        </div>
                        <Progress value={enrollment.progress} className="h-2" />
                        {isCompleted ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Completed</span>
                            {enrollment.score && (
                              <span className="text-sm">({enrollment.score}%)</span>
                            )}
                          </div>
                        ) : (
                          <Button size="sm" className="w-full">
                            <Play className="h-4 w-4 mr-2" />
                            Continue Learning
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => enrollInCourse(course.id)}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Enroll Now
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">My Enrollments</h3>
            
            {enrollments.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Enrollments Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start learning by enrolling in your first course.
                </p>
                <Button onClick={() => setActiveTab("courses")}>
                  Browse Courses
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {enrollments.map((enrollment) => (
                  <Card key={enrollment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl">{getCategoryIcon(enrollment.course.category)}</span>
                            <div>
                              <h4 className="font-medium">{enrollment.course.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {enrollment.course.duration_minutes} minutes
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{enrollment.progress}%</span>
                            </div>
                            <Progress value={enrollment.progress} className="h-2" />
                          </div>
                        </div>
                        
                        <div className="ml-4 text-right">
                          {enrollment.completed_at ? (
                            <div className="text-green-600">
                              <CheckCircle className="h-5 w-5 mx-auto mb-1" />
                              <p className="text-sm font-medium">Completed</p>
                              {enrollment.score && (
                                <p className="text-sm">Score: {enrollment.score}%</p>
                              )}
                            </div>
                          ) : (
                            <Button size="sm">
                              <Play className="h-4 w-4 mr-1" />
                              Continue
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 mx-auto text-yellow-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Achievements System</h3>
            <p className="text-muted-foreground mb-4">
              Complete courses to earn badges and certificates!
            </p>
            
            {completedCourses.length > 0 && (
              <div className="mt-8">
                <h4 className="font-medium mb-4">Your Achievements</h4>
                <div className="flex flex-wrap justify-center gap-4">
                  {completedCourses.map((enrollment) => (
                    <Card key={enrollment.id} className="w-48">
                      <CardContent className="p-4 text-center">
                        <Award className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                        <p className="font-medium text-sm">{enrollment.course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Completed with {enrollment.score}%
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Course Management</h3>
            <p className="text-muted-foreground">
              Advanced course creation and team management features coming soon.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}