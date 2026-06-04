// Admin-only course editor. Create or edit a training course, including its
// ordered content sections (text / video / quiz). Mirrors the Knowledge Base
// ArticleEditorDialog conventions. Delete lives here too (edit mode only).

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  COURSE_CATEGORIES,
  DIFFICULTIES,
  useCourseMutations,
  type CourseInput,
  type CourseSection,
  type TrainingCourse,
} from '@/hooks/useTraining';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: TrainingCourse | null;
  onSaved: () => void;
}

const emptySection = (type: CourseSection['type']): CourseSection => {
  if (type === 'quiz') {
    return { type, title: 'Knowledge Check', questions: [{ question: '', options: ['', ''], answer: 0 }] };
  }
  if (type === 'video') return { type, title: '', url: '', duration_minutes: 5 };
  return { type: 'text', title: '', text: '' };
};

export function CourseEditorDialog({ open, onOpenChange, course, onSaved }: Props) {
  const { toast } = useToast();
  const { createCourse, updateCourse, deleteCourse } = useCourseMutations();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('food_safety');
  const [difficulty, setDifficulty] = useState('beginner');
  const [duration, setDuration] = useState('30');
  const [passingScore, setPassingScore] = useState('80');
  const [renewalMonths, setRenewalMonths] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditing = !!course;

  useEffect(() => {
    if (!open) return;
    setTitle(course?.title ?? '');
    setDescription(course?.description ?? '');
    setCategory(course?.category ?? 'food_safety');
    setDifficulty(course?.difficulty ?? 'beginner');
    setDuration(course?.duration_minutes != null ? String(course.duration_minutes) : '30');
    setPassingScore(course?.passing_score != null ? String(course.passing_score) : '80');
    setRenewalMonths(course?.renewal_months != null ? String(course.renewal_months) : '');
    setIsRequired(course?.is_required ?? false);
    setIsPublished(course?.is_published ?? false);
    setSections(course?.content?.length ? course.content : [emptySection('text')]);
  }, [open, course]);

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  // ── Section editing helpers ──
  const updateSection = (i: number, patch: Partial<CourseSection>) =>
    setSections(prev => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const removeSection = (i: number) =>
    setSections(prev => prev.filter((_, idx) => idx !== i));

  const addSection = (type: CourseSection['type']) =>
    setSections(prev => [...prev, emptySection(type)]);

  const updateQuestion = (si: number, qi: number, patch: Partial<CourseSection['questions'][number]>) =>
    setSections(prev => prev.map((s, idx) => {
      if (idx !== si || !s.questions) return s;
      return { ...s, questions: s.questions.map((q, j) => (j === qi ? { ...q, ...patch } : q)) };
    }));

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      // Strip empty sections / questions so the player never shows blanks.
      const cleaned = sections
        .map(s => {
          if (s.type === 'quiz') {
            const questions = (s.questions ?? [])
              .filter(q => q.question.trim() && q.options.filter(o => o.trim()).length >= 2)
              .map(q => ({ ...q, options: q.options.filter(o => o.trim()) }));
            return { ...s, questions };
          }
          return s;
        })
        .filter(s =>
          (s.type === 'text' && (s.text?.trim() || s.title.trim())) ||
          (s.type === 'video' && s.url?.trim()) ||
          (s.type === 'quiz' && (s.questions?.length ?? 0) > 0),
        );

      const input: CourseInput = {
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
        duration_minutes: duration ? Number(duration) : null,
        passing_score: passingScore ? Number(passingScore) : null,
        renewal_months: renewalMonths ? Number(renewalMonths) : null,
        is_required: isRequired,
        is_published: isPublished,
        content: cleaned,
      };
      if (isEditing && course) await updateCourse(course.id, input);
      else await createCourse(input);
      toast({ title: isEditing ? 'Course updated' : 'Course created', description: title });
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : String(e),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!course) return;
    if (!confirm(`Delete "${course.title}"? Enrollments will be removed too. This can't be undone.`)) return;
    setDeleting(true);
    try {
      await deleteCourse(course.id);
      toast({ title: 'Course deleted', description: course.title });
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast({
        title: 'Delete failed',
        description: e instanceof Error ? e.message : String(e),
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Course' : 'New Course'}</DialogTitle>
          <DialogDescription>
            Published courses are visible to everyone in your organisation. Drafts stay
            hidden from staff until you publish.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="c-title">Title</Label>
            <Input id="c-title" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Food Safety Basics" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="c-desc">Description</Label>
            <Textarea id="c-desc" value={description} rows={2}
              onChange={e => setDescription(e.target.value)}
              placeholder="What this course covers." />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COURSE_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map(d => (
                    <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-dur">Duration (min)</Label>
              <Input id="c-dur" type="number" min={0} value={duration}
                onChange={e => setDuration(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-pass">Pass score (%)</Label>
              <Input id="c-pass" type="number" min={0} max={100} value={passingScore}
                onChange={e => setPassingScore(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="space-y-1">
              <Label htmlFor="c-renew">Renewal (months, optional)</Label>
              <Input id="c-renew" type="number" min={0} value={renewalMonths}
                onChange={e => setRenewalMonths(e.target.value)} placeholder="e.g. 12" />
            </div>
            <div className="flex items-center gap-3 pb-2">
              <Switch id="c-req" checked={isRequired} onCheckedChange={setIsRequired} />
              <Label htmlFor="c-req" className="cursor-pointer">Required course</Label>
            </div>
          </div>

          {/* Sections builder */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-base">Course content</Label>
              <div className="flex gap-1">
                <Button type="button" size="sm" variant="outline" className="gap-1"
                  onClick={() => addSection('text')}>
                  <Plus className="h-3 w-3" /> Text
                </Button>
                <Button type="button" size="sm" variant="outline" className="gap-1"
                  onClick={() => addSection('video')}>
                  <Plus className="h-3 w-3" /> Video
                </Button>
                <Button type="button" size="sm" variant="outline" className="gap-1"
                  onClick={() => addSection('quiz')}>
                  <Plus className="h-3 w-3" /> Quiz
                </Button>
              </div>
            </div>

            {sections.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Add at least one section so learners have something to complete.
              </p>
            )}

            {sections.map((s, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    {s.type} · section {i + 1}
                  </span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6"
                    onClick={() => removeSection(i)} aria-label="Remove section">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <Input value={s.title} placeholder="Section title"
                  onChange={e => updateSection(i, { title: e.target.value })} />

                {s.type === 'text' && (
                  <Textarea rows={3} value={s.text ?? ''} placeholder="Section content"
                    onChange={e => updateSection(i, { text: e.target.value })} />
                )}

                {s.type === 'video' && (
                  <div className="grid grid-cols-3 gap-2">
                    <Input className="col-span-2" value={s.url ?? ''} placeholder="https://video-url"
                      onChange={e => updateSection(i, { url: e.target.value })} />
                    <Input type="number" min={0} value={s.duration_minutes ?? ''} placeholder="min"
                      onChange={e => updateSection(i, { duration_minutes: Number(e.target.value) })} />
                  </div>
                )}

                {s.type === 'quiz' && (
                  <div className="space-y-3">
                    {(s.questions ?? []).map((q, qi) => (
                      <div key={qi} className="border rounded p-2 space-y-2 bg-background">
                        <div className="flex items-center gap-2">
                          <Input value={q.question} placeholder={`Question ${qi + 1}`}
                            onChange={e => updateQuestion(i, qi, { question: e.target.value })} />
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => updateSection(i, {
                              questions: s.questions!.filter((_, j) => j !== qi),
                            })} aria-label="Remove question">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input type="radio" checked={q.answer === oi}
                              onChange={() => updateQuestion(i, qi, { answer: oi })}
                              aria-label={`Mark option ${oi + 1} correct`} />
                            <Input value={opt} placeholder={`Option ${oi + 1}`}
                              onChange={e => updateQuestion(i, qi, {
                                options: q.options.map((o, j) => (j === oi ? e.target.value : o)),
                              })} />
                            {q.options.length > 2 && (
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => updateQuestion(i, qi, {
                                  options: q.options.filter((_, j) => j !== oi),
                                  answer: q.answer >= oi && q.answer > 0 ? q.answer - 1 : q.answer,
                                })} aria-label="Remove option">
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" className="gap-1"
                          onClick={() => updateQuestion(i, qi, { options: [...q.options, ''] })}>
                          <Plus className="h-3 w-3" /> Option
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" className="gap-1"
                      onClick={() => updateSection(i, {
                        questions: [...(s.questions ?? []), { question: '', options: ['', ''], answer: 0 }],
                      })}>
                      <Plus className="h-3 w-3" /> Add question
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Select the radio next to the correct option for each question.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Switch id="c-pub" checked={isPublished} onCheckedChange={setIsPublished} />
            <Label htmlFor="c-pub" className="cursor-pointer">
              {isPublished ? 'Published — visible to everyone' : 'Draft — admins only'}
            </Label>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-between">
          <div>
            {isEditing && (
              <Button variant="destructive" onClick={handleDelete}
                disabled={deleting || saving} className="gap-2">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!canSave || saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEditing ? 'Save changes' : 'Create course'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
