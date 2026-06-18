// Details + bulk-edit for a recurring task series. Opened from the Recurring
// tab's "Active Series" cards. Shows every routine task (occurrence) inside the
// recurrence and lets an editor change the whole series at once (icon, title,
// priority, assignees, end date) instead of editing each task one by one.
import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CategoryEmojiPicker } from '@/components/labels/CategoryEmojiPicker';
import { AssigneePicker, type AssigneeUser } from './AssigneePicker';
import { Repeat, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { TaskSeries, TaskOccurrence, TaskSeriesUpdate } from '@/types/recurring-tasks';
import { TASK_PRIORITY_LABELS, type TaskPriority } from '@/types/routineTasks';

const TASK_TYPE_ICONS: Record<string, string> = {
  cleaning_daily: '🧹', cleaning_weekly: '🧼', temperature: '🌡️',
  opening: '🔓', closing: '🔒', maintenance: '🔧', others: '📋',
};

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-700 border-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
  completed: 'bg-green-100 text-green-700 border-green-300',
  skipped: 'bg-yellow-100 text-yellow-700 border-yellow-300',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  series: TaskSeries;
  occurrences: TaskOccurrence[];
  users: AssigneeUser[];
  onSave: (seriesId: string, updates: TaskSeriesUpdate) => Promise<boolean>;
}

export function SeriesDetailModal({ open, onOpenChange, series, occurrences, users, onSave }: Props) {
  const { toast } = useToast();
  const [icon, setIcon] = useState(series.icon || '');
  const [title, setTitle] = useState(series.title);
  const [priority, setPriority] = useState<TaskPriority>(series.priority);
  const [assignees, setAssignees] = useState<string[]>(series.assigned_to || []);
  const [endDate, setEndDate] = useState(series.series_end_date || '');
  const [saving, setSaving] = useState(false);

  // Reset the form whenever a different series is opened.
  useEffect(() => {
    setIcon(series.icon || '');
    setTitle(series.title);
    setPriority(series.priority);
    setAssignees(series.assigned_to || []);
    setEndDate(series.series_end_date || '');
  }, [series]);

  const sortedOccurrences = useMemo(
    () => [...occurrences].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)),
    [occurrences],
  );

  const displayIcon = icon || TASK_TYPE_ICONS[series.task_type] || '📋';

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(series.id, {
      icon: icon || null,
      title: title.trim() || series.title,
      priority,
      assigned_to: assignees,
      series_end_date: endDate || null,
    });
    setSaving(false);
    if (ok) {
      toast({ title: 'Recurrence updated', description: 'Future tasks have been regenerated.' });
      onOpenChange(false);
    } else {
      toast({ title: 'Update failed', description: 'Could not update the recurrence.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl leading-none">{displayIcon}</span>
            {series.title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            <Repeat className="h-3 w-3" /> Recurring series · {sortedOccurrences.length} task{sortedOccurrences.length === 1 ? '' : 's'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tasks in this recurrence */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Tasks in this recurrence</p>
            {sortedOccurrences.length === 0 ? (
              <p className="text-sm text-muted-foreground">No generated tasks in the current window.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-md border">
                <div className="divide-y">
                  {sortedOccurrences.map(o => {
                    const assignedNames = (o.assigned_to || [])
                      .map(id => users.find(m => m.user_id === id)?.display_name)
                      .filter(Boolean) as string[];
                    return (
                      <div key={o.id} className="px-3 py-2 text-sm space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">
                            {format(new Date(o.scheduled_date + 'T00:00:00'), 'EEE, MMM d, yyyy')}
                            {o.scheduled_time ? ` · ${o.scheduled_time.slice(0, 5)}` : ''}
                          </span>
                          <Badge variant="outline" className={STATUS_COLORS[o.status] || ''}>
                            {o.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          {assignedNames.length > 0 && <span>👤 {assignedNames.join(', ')}</span>}
                          {typeof o.estimated_minutes === 'number' && o.estimated_minutes > 0 && (
                            <span>⏱️ {o.estimated_minutes}m</span>
                          )}
                          {o.completed_at && (
                            <span className="text-green-600">
                              ✓ Completed {format(new Date(o.completed_at), "MMM d 'at' h:mm a")}
                            </span>
                          )}
                          {o.status === 'skipped' && o.skip_reason && <span>Skipped: {o.skip_reason}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bulk edit */}
          <div className="space-y-4 border-t pt-4">
            <p className="text-sm font-medium">Edit the whole recurrence</p>

            <div className="space-y-2">
              <Label className="block">Icon</Label>
              <div>
                <CategoryEmojiPicker value={icon} onChange={setIcon} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="series-title">Title</Label>
              <Input id="series-title" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map(p => (
                      <SelectItem key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="series-end">End date (optional)</Label>
                <Input id="series-end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="block">Assigned to</Label>
              <AssigneePicker users={users} value={assignees} onChange={setAssignees} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
