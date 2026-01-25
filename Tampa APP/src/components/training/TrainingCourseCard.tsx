import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Play, CheckCircle, AlertTriangle, Clock, Award } from "lucide-react";
import { 
  TrainingCourse, 
  TrainingEnrollment,
  TRAINING_CATEGORY_LABELS,
  TRAINING_DIFFICULTY_LABELS,
  TRAINING_DIFFICULTY_COLORS,
  formatDuration,
  getExpiryStatus
} from "@/types/training";

interface TrainingCourseCardProps {
  course: TrainingCourse;
  enrollment?: TrainingEnrollment;
  onEnroll: (courseId: string) => void;
  onContinue: (courseId: string) => void;
  onViewCertificate?: (enrollment: TrainingEnrollment) => void;
}

export default function TrainingCourseCard({
  course,
  enrollment,
  onEnroll,
  onContinue,
  onViewCertificate
}: TrainingCourseCardProps) {
  const isEnrolled = !!enrollment;
  const isCompleted = !!enrollment?.completed_at;
  const expiryStatus = getExpiryStatus(enrollment);

  const renderExpiryBadge = () => {
    if (!enrollment?.completed_at) return null;

    switch (expiryStatus) {
      case 'expired':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Expired - Renewal Required
          </Badge>
        );
      case 'expiring_soon':
        return (
          <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700 dark:text-yellow-400">
            <Clock className="h-3 w-3" />
            Expiring Soon
          </Badge>
        );
      case 'valid':
        return enrollment.certificate_url ? (
          <Badge variant="outline" className="gap-1 border-green-500 text-green-700 dark:text-green-400">
            <Award className="h-3 w-3" />
            Certified
          </Badge>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
          <div className="flex flex-wrap gap-1">
            {course.is_required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
            {course.category && (
              <Badge variant="secondary" className="text-xs">
                {TRAINING_CATEGORY_LABELS[course.category]}
              </Badge>
            )}
            {course.difficulty && (
              <Badge className={`text-xs ${TRAINING_DIFFICULTY_COLORS[course.difficulty]}`}>
                {TRAINING_DIFFICULTY_LABELS[course.difficulty]}
              </Badge>
            )}
          </div>
        </div>
        
        <CardTitle className="text-lg">{course.title}</CardTitle>
        
        {course.description && (
          <CardDescription className="line-clamp-2">
            {course.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-3">
          {course.duration_minutes && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(course.duration_minutes)}</span>
            </div>
          )}

          {isEnrolled && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{enrollment.progress}%</span>
                </div>
                <Progress value={enrollment.progress || 0} className="h-2" />
              </div>

              {enrollment.score !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Score</span>
                  <span className="font-medium">{enrollment.score}%</span>
                </div>
              )}

              {renderExpiryBadge()}
            </>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {!isEnrolled ? (
          <Button 
            onClick={() => onEnroll(course.id)} 
            className="w-full"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Enroll Now
          </Button>
        ) : isCompleted ? (
          <div className="w-full space-y-2">
            {enrollment.certificate_url && onViewCertificate && (
              <Button 
                onClick={() => onViewCertificate(enrollment)} 
                variant="outline"
                className="w-full"
              >
                <Award className="mr-2 h-4 w-4" />
                View Certificate
              </Button>
            )}
            {expiryStatus === 'expired' && (
              <Button 
                onClick={() => onContinue(course.id)} 
                className="w-full"
                variant="destructive"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Renew Certification
              </Button>
            )}
            {expiryStatus !== 'expired' && (
              <Button 
                onClick={() => onContinue(course.id)} 
                variant="outline"
                className="w-full"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Review Course
              </Button>
            )}
          </div>
        ) : (
          <Button 
            onClick={() => onContinue(course.id)} 
            className="w-full"
          >
            <Play className="mr-2 h-4 w-4" />
            Continue Learning
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
