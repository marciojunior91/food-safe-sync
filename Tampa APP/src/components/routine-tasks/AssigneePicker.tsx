// Shared "Assign to" selector used by the task-creation form AND the recurring
// series detail/bulk-edit modal, so both behave identically: department group
// buttons, All/Clear, selected chips, and a scrollable avatar+role checklist.
import { Building2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useDepartments } from '@/hooks/useUserContext';

export interface AssigneeUser {
  user_id: string;
  display_name: string;
  role?: string;
  department_id?: string;
}

interface Props {
  users: AssigneeUser[];
  value: string[];
  onChange: (ids: string[]) => void;
}

export function AssigneePicker({ users, value, onChange }: Props) {
  const { departments } = useDepartments();
  const selected = value ?? [];

  const toggleUser = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  const selectAll = () => onChange(users.map(u => u.user_id));
  const clearAll = () => onChange([]);

  return (
    <div className="space-y-2">
      {/* Department group buttons */}
      <div className="flex flex-wrap gap-1.5">
        {departments.map(dept => {
          const deptMemberIds = users.filter(u => u.department_id === dept.id).map(u => u.user_id);
          const allSelected = deptMemberIds.length > 0 && deptMemberIds.every(id => selected.includes(id));
          return (
            <Button
              key={dept.id}
              type="button"
              size="sm"
              variant={allSelected ? 'default' : 'outline'}
              className="h-7 text-xs px-2"
              disabled={deptMemberIds.length === 0}
              onClick={() => {
                if (allSelected) {
                  onChange(selected.filter(id => !deptMemberIds.includes(id)));
                } else {
                  onChange(Array.from(new Set([...selected, ...deptMemberIds])));
                }
              }}
            >
              <Building2 className="w-3 h-3 mr-1" />
              {dept.name}
              {deptMemberIds.length > 0 && <span className="ml-1 opacity-70">({deptMemberIds.length})</span>}
            </Button>
          );
        })}
        <Button type="button" size="sm" variant="outline" className="h-7 text-xs px-2" onClick={selectAll}>
          👥 All
        </Button>
        {selected.length > 0 && (
          <Button type="button" size="sm" variant="ghost" className="h-7 text-xs px-2 text-muted-foreground" onClick={clearAll}>
            Clear
          </Button>
        )}
      </div>

      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map(id => {
            const u = users.find(x => x.user_id === id);
            return u ? (
              <Badge key={id} variant="secondary" className="gap-1">
                {u.display_name}
                <button type="button" onClick={() => toggleUser(id)} className="ml-1 text-muted-foreground hover:text-foreground">×</button>
              </Badge>
            ) : null;
          })}
        </div>
      )}

      {/* User checklist */}
      <div className={cn('rounded-md border max-h-48 overflow-y-auto divide-y', selected.length === 0 && 'border-destructive')}>
        {users.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="font-medium">No team members found</p>
            <p className="text-xs mt-1">Please add team members first</p>
          </div>
        ) : (
          users.map(user => (
            <label
              key={user.user_id}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={selected.includes(user.user_id)}
                onCheckedChange={() => toggleUser(user.user_id)}
              />
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold">{user.display_name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-sm">{user.display_name}</span>
              {user.role && (
                <span className="ml-auto text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</span>
              )}
            </label>
          ))
        )}
      </div>
    </div>
  );
}
