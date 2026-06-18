// Admin dialog to make a course mandatory for whole departments or for
// specific team members (training obligations). Used from the Training → Manage tab.
import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Building2, User, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTrainingObligations, type TrainingCourse } from '@/hooks/useTraining';
import { useDepartments } from '@/hooks/useUserContext';
import { useTeamMembers } from '@/hooks/useTeamMembers';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: TrainingCourse;
}

export function CourseObligationsDialog({ open, onOpenChange, course }: Props) {
  const { obligations, addObligation, removeObligation } = useTrainingObligations();
  const { departments } = useDepartments();
  const { teamMembers, fetchTeamMembers } = useTeamMembers();
  useEffect(() => { void fetchTeamMembers(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  const [deptId, setDeptId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [busy, setBusy] = useState(false);

  const courseObligations = useMemo(
    () => obligations.filter(o => o.course_id === course.id),
    [obligations, course.id],
  );

  const deptName = (id: string | null) => departments.find(d => d.id === id)?.name ?? 'Department';
  const memberName = (id: string | null) => teamMembers.find(m => m.id === id)?.display_name ?? 'Member';

  const alreadyHasDept = (id: string) => courseObligations.some(o => o.department_id === id);
  const alreadyHasMember = (id: string) => courseObligations.some(o => o.team_member_id === id);

  // Departments already required for this course — their members are implicitly
  // covered, so don't let them be added individually (avoids duplicate obligations).
  const obligatedDeptIds = new Set(
    courseObligations.filter(o => o.department_id).map(o => o.department_id as string),
  );
  const memberDisabled = (m: { id: string; department_id?: string }) =>
    alreadyHasMember(m.id) || (!!m.department_id && obligatedDeptIds.has(m.department_id));

  const add = async (target: { departmentId?: string; teamMemberId?: string }) => {
    setBusy(true);
    try {
      await addObligation(course.id, target);
      // Adding a whole department makes any individual obligations for its
      // members redundant — remove them so there are no duplicates.
      if (target.departmentId) {
        const deptMemberIds = teamMembers
          .filter(m => (m as { department_id?: string }).department_id === target.departmentId)
          .map(m => m.id);
        const redundant = courseObligations.filter(
          o => o.team_member_id && deptMemberIds.includes(o.team_member_id),
        );
        for (const o of redundant) await removeObligation(o.id);
      }
      setDeptId('');
      setMemberId('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to assign');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await removeObligation(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Assign “{course.title}”</DialogTitle>
          <DialogDescription>
            Make this course mandatory for whole departments or for specific team members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Current obligations */}
          <div>
            <p className="text-sm font-medium mb-2">Currently required for</p>
            {courseObligations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not assigned to anyone yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {courseObligations.map(o => (
                  <Badge key={o.id} variant="secondary" className="gap-1">
                    {o.department_id ? (
                      <><Building2 className="h-3 w-3" /> {deptName(o.department_id)}</>
                    ) : (
                      <><User className="h-3 w-3" /> {memberName(o.team_member_id)}</>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(o.id)}
                      disabled={busy}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Add by department */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">By department</label>
              <Select value={deptId} onValueChange={setDeptId}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id} disabled={alreadyHasDept(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="gap-1" disabled={!deptId || busy} onClick={() => add({ departmentId: deptId })}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>

          {/* Add by member */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">By team member</label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                <SelectContent>
                  {teamMembers.map(m => (
                    <SelectItem key={m.id} value={m.id} disabled={memberDisabled(m as any)}>
                      {m.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="gap-1" disabled={!memberId || busy} onClick={() => add({ teamMemberId: memberId })}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
