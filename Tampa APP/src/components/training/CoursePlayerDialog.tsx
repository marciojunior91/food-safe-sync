// Course player. Walks an enrolled learner through a course's sections in
// order, persisting progress as they advance. Quiz sections are scored; on the
// final step the course is completed if the combined quiz score meets the
// course's passing threshold (courses with no quiz auto-pass at 100%).

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, ArrowRight, CheckCircle, FileText, PlayCircle, HelpCircle, Loader2, RotateCcw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useEnrollmentActions,
  type CourseSection,
  type TrainingCourse,
  type TrainingEnrollment,
} from '@/hooks/useTraining';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: TrainingCourse;
  enrollment: TrainingEnrollment;
  onChanged: () => void;
}

const sectionIcon = (type: CourseSection['type']) =>
  type === 'video' ? PlayCircle : type === 'quiz' ? HelpCircle : FileText;

export function CoursePlayerDialog({ open, onOpenChange, course, enrollment, onChanged }: Props) {
  const { toast } = useToast();
  const { saveProgress, completeCourse } = useEnrollmentActions();

  const sections = course.content;
  const total = Math.max(sections.length, 1);
  const [step, setStep] = useState(0);
  // answers keyed by `${sectionIndex}:${questionIndex}` → chosen option index
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  useEffect(() => {
    if (!open) return;
    // Resume near where they left off (progress is a %).
    const resumed = Math.min(Math.floor((enrollment.progress / 100) * total), total - 1);
    setStep(Math.max(0, resumed));
    setAnswers({});
    setResult(null);
  }, [open, enrollment.progress, total]);

  const section = sections[step] as CourseSection | undefined;
  const passingScore = course.passing_score ?? 0;

  // Quiz gating: every question in the current quiz section must be answered.
  const currentQuizAnswered = useMemo(() => {
    if (!section || section.type !== 'quiz' || !section.questions) return true;
    return section.questions.every((_, qi) => answers[`${step}:${qi}`] !== undefined);
  }, [section, answers, step]);

  const isLast = step >= sections.length - 1;

  const persistProgress = async (nextStep: number) => {
    const pct = Math.round(((nextStep) / total) * 100);
    try { await saveProgress(enrollment.id, pct); } catch { /* non-blocking */ }
  };

  const handleNext = async () => {
    if (step < sections.length - 1) {
      const next = step + 1;
      setStep(next);
      await persistProgress(next);
      onChanged();
    }
  };

  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const scoreQuiz = (): number => {
    let correct = 0;
    let asked = 0;
    sections.forEach((s, si) => {
      if (s.type === 'quiz' && s.questions) {
        s.questions.forEach((q, qi) => {
          asked += 1;
          if (answers[`${si}:${qi}`] === q.answer) correct += 1;
        });
      }
    });
    if (asked === 0) return 100; // no quiz → completion-based pass
    return Math.round((correct / asked) * 100);
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const score = scoreQuiz();
      const passed = score >= passingScore;
      setResult({ score, passed });
      if (passed) {
        await completeCourse(enrollment.id, score, course.renewal_months);
        toast({ title: 'Course completed', description: `${course.title} — ${score}%` });
        onChanged();
      } else {
        await saveProgress(enrollment.id, 100);
        onChanged();
      }
    } catch (e) {
      toast({
        title: 'Could not save completion',
        description: e instanceof Error ? e.message : String(e),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => {
    setResult(null);
    setAnswers({});
    setStep(0);
  };

  const Icon = section ? sectionIcon(section.type) : FileText;
  const viewedPct = Math.round((Math.min(step + 1, total) / total) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-6">{course.title}</DialogTitle>
        </DialogHeader>

        {/* Progress header */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Section {Math.min(step + 1, total)} of {total}</span>
            <span>{viewedPct}%</span>
          </div>
          <Progress value={viewedPct} className="h-2" />
        </div>

        {/* Result screen */}
        {result ? (
          <div className="py-8 text-center space-y-3">
            {result.passed ? (
              <>
                <CheckCircle className="h-14 w-14 mx-auto text-green-600" />
                <h3 className="text-xl font-semibold">Course completed!</h3>
                <p className="text-muted-foreground">You scored {result.score}%.</p>
                <p className="text-sm text-muted-foreground">
                  Your certificate is available on the Achievements tab.
                </p>
                <Button className="mt-2" onClick={() => onOpenChange(false)}>Done</Button>
              </>
            ) : (
              <>
                <HelpCircle className="h-14 w-14 mx-auto text-amber-500" />
                <h3 className="text-xl font-semibold">Not quite there</h3>
                <p className="text-muted-foreground">
                  You scored {result.score}%. You need {passingScore}% to pass.
                </p>
                <Button className="mt-2 gap-2" onClick={retry}>
                  <RotateCcw className="h-4 w-4" /> Retry course
                </Button>
              </>
            )}
          </div>
        ) : !section ? (
          <div className="py-10 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>This course has no content yet.</p>
          </div>
        ) : (
          <div className="py-2 space-y-4 min-h-[200px]">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">{section.title || 'Untitled section'}</h3>
              <Badge variant="secondary" className="ml-auto capitalize">{section.type}</Badge>
            </div>

            {section.type === 'text' && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {section.text}
              </p>
            )}

            {section.type === 'video' && (
              <div className="space-y-2">
                <div className="aspect-video rounded-lg border bg-muted flex items-center justify-center">
                  <PlayCircle className="h-12 w-12 text-muted-foreground" />
                </div>
                {section.url && (
                  <a href={section.url} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-primary underline">
                    Open video in new tab
                  </a>
                )}
              </div>
            )}

            {section.type === 'quiz' && section.questions && (
              <div className="space-y-5">
                {section.questions.map((q, qi) => (
                  <div key={qi} className="space-y-2">
                    <p className="font-medium text-sm">{qi + 1}. {q.question}</p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => {
                        const key = `${step}:${qi}`;
                        const checked = answers[key] === oi;
                        return (
                          <label key={oi}
                            className={`flex items-center gap-2 rounded-md border p-2 text-sm cursor-pointer transition-colors ${
                              checked ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                            }`}>
                            <input type="radio" name={key} checked={checked}
                              onChange={() => setAnswers(a => ({ ...a, [key]: oi }))} />
                            {opt}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nav footer */}
        {!result && section && (
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={handleBack} disabled={step === 0} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {isLast ? (
              <Button onClick={handleFinish} disabled={!currentQuizAnswered || submitting} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Finish course
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!currentQuizAnswered} className="gap-2">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
