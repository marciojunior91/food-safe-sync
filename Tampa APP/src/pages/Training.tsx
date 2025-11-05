import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Play, CheckCircle } from "lucide-react";
interface Course {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  is_published: boolean;
}

interface Enrollment {
  id: string;
  course_id: string;
  progress: number;
  enrolled_at: string;
  completed_at: string | null;
}

export default function Training() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Map<string, Enrollment>>(new Map());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        supabase
          .from("training_courses")
          .select("*")
          .eq("is_published", true)
          .order("title"),
        supabase
          .from("training_enrollments")
          .select("*")
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Training Courses</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const enrollment = enrollments.get(course.id);
            const isEnrolled = !!enrollment;
            const isCompleted = enrollment?.completed_at;

            return (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {course.title}
                  </CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {course.duration_minutes && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Duration: {course.duration_minutes} minutes
                    </p>
                  )}

                  {isEnrolled ? (
                    <>
                      <Progress value={enrollment.progress || 0} className="mb-4" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Progress: {enrollment.progress || 0}%
                      </p>
                      <Button className="w-full" variant={isCompleted ? "outline" : "default"}>
                        {isCompleted ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Continue
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => enrollInCourse(course.id)} className="w-full">
                      Enroll Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
        })}
      </div>
    </div>
  );
}
