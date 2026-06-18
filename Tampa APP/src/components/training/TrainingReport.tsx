// Admin-only training report: completion + mandatory-course progress grouped by
// department and team member. Mandatory = a training_obligation targeting the
// member directly or their department.
import { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, Loader2, Building2 } from 'lucide-react';
import {
  useAllEnrollments,
  useTrainingObligations,
} from '@/hooks/useTraining';
import { useDepartments } from '@/hooks/useUserContext';
import { useTeamMembers } from '@/hooks/useTeamMembers';

interface MemberRow {
  id: string;
  name: string;
  completed: number;
  mandatoryTotal: number;
  mandatoryDone: number;
}

const NO_DEPT = '__none__';

export function TrainingReport() {
  const { enrollments, loading } = useAllEnrollments();
  const { obligations } = useTrainingObligations();
  const { departments } = useDepartments();
  const { teamMembers, fetchTeamMembers } = useTeamMembers();
  useEffect(() => { void fetchTeamMembers(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const groups = useMemo(() => {
    // Completed course ids per member
    const completedByMember = new Map<string, Set<string>>();
    const enrolledCountByMember = new Map<string, number>();
    enrollments.forEach(e => {
      if (!e.team_member_id) return;
      enrolledCountByMember.set(e.team_member_id, (enrolledCountByMember.get(e.team_member_id) || 0) + 1);
      if (e.completed_at) {
        const set = completedByMember.get(e.team_member_id) ?? new Set<string>();
        set.add(e.course_id);
        completedByMember.set(e.team_member_id, set);
      }
    });

    const obligatedFor = (memberId: string, deptId: string | null): Set<string> => {
      const ids = new Set<string>();
      obligations.forEach(o => {
        if (o.team_member_id && o.team_member_id === memberId) ids.add(o.course_id);
        if (o.department_id && deptId && o.department_id === deptId) ids.add(o.course_id);
      });
      return ids;
    };

    // department id -> { name, members[] }
    const byDept = new Map<string, { name: string; members: MemberRow[] }>();
    teamMembers.forEach((m: any) => {
      const deptId = m.department_id || NO_DEPT;
      const deptName = departments.find(d => d.id === m.department_id)?.name || 'No department';
      const mandatory = obligatedFor(m.id, m.department_id || null);
      const done = completedByMember.get(m.id) ?? new Set<string>();
      const mandatoryDone = [...mandatory].filter(id => done.has(id)).length;
      const row: MemberRow = {
        id: m.id,
        name: m.display_name || 'Unnamed',
        completed: done.size,
        mandatoryTotal: mandatory.size,
        mandatoryDone,
      };
      const bucket = byDept.get(deptId) ?? { name: deptName, members: [] };
      bucket.members.push(row);
      byDept.set(deptId, bucket);
    });

    return [...byDept.entries()]
      .map(([id, g]) => ({ id, ...g }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [enrollments, obligations, departments, teamMembers]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No team members</p>
          <p className="text-sm mt-1">Add team members to track their training.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(group => (
        <Card key={group.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {group.name}
              <Badge variant="outline" className="ml-1 text-xs">{group.members.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.members.map(m => {
              const outstanding = m.mandatoryTotal - m.mandatoryDone;
              const pct = m.mandatoryTotal > 0
                ? Math.round((m.mandatoryDone / m.mandatoryTotal) * 100)
                : 100;
              return (
                <div key={m.id} className="flex items-center gap-4 border-b last:border-0 pb-3 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.completed} course{m.completed === 1 ? '' : 's'} completed
                    </p>
                  </div>
                  <div className="w-40 hidden sm:block">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Mandatory</span>
                      <span>{m.mandatoryDone}/{m.mandatoryTotal}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                  {m.mandatoryTotal === 0 ? (
                    <Badge variant="outline" className="flex-shrink-0">No requirements</Badge>
                  ) : outstanding === 0 ? (
                    <Badge className="flex-shrink-0 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 gap-1">
                      <CheckCircle className="h-3 w-3" /> Compliant
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="flex-shrink-0 gap-1">
                      <AlertTriangle className="h-3 w-3" /> {outstanding} outstanding
                    </Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
