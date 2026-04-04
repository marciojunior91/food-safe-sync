/**
 * DepartmentManager - CRUD interface for managing departments
 * Allows admin/manager to create, edit, delete departments and view assigned team members
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserContext } from "@/hooks/useUserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Users,
  Save,
  UserPlus,
  X,
} from "lucide-react";
import type { Department } from "@/types/organization";
import type { TeamMember } from "@/types/teamMembers";

interface DepartmentWithMembers extends Department {
  members: TeamMember[];
}

interface DepartmentManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DepartmentManager({ open, onOpenChange }: DepartmentManagerProps) {
  const { context } = useUserContext();
  const { toast } = useToast();
  const [departments, setDepartments] = useState<DepartmentWithMembers[]>([]);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit/Create dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState("");
  const [deptDescription, setDeptDescription] = useState("");

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDept, setDeletingDept] = useState<DepartmentWithMembers | null>(null);

  // Assign member dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningToDept, setAssigningToDept] = useState<DepartmentWithMembers | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  const organizationId = context?.organization_id;

  const fetchData = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      // Fetch departments
      const { data: deptData, error: deptError } = await supabase
        .from("departments")
        .select("*")
        .eq("organization_id", organizationId)
        .order("name");

      if (deptError) throw deptError;

      // Fetch all team members
      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("display_name");

      if (memberError) throw memberError;

      const members = (memberData || []) as TeamMember[];
      setAllMembers(members);

      // Group members by department
      const deptsWithMembers: DepartmentWithMembers[] = ((deptData || []) as Department[]).map(
        (dept) => ({
          ...dept,
          members: members.filter((m) => m.department_id === dept.id),
        })
      );

      setDepartments(deptsWithMembers);
    } catch (error: any) {
      console.error("Error fetching departments:", error);
      toast({
        title: "Error",
        description: "Failed to load departments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [organizationId, toast]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setDeptName("");
    setDeptDescription("");
    setEditDialogOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptDescription(dept.description || "");
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!deptName.trim()) {
      toast({ title: "Validation Error", description: "Name is required", variant: "destructive" });
      return;
    }

    try {
      if (editingDept) {
        const { error } = await supabase
          .from("departments")
          .update({ name: deptName.trim(), description: deptDescription.trim() || null })
          .eq("id", editingDept.id);
        if (error) throw error;
        toast({ title: "Updated", description: `Department "${deptName}" updated.` });
      } else {
        const { error } = await supabase.from("departments").insert({
          name: deptName.trim(),
          description: deptDescription.trim() || null,
          organization_id: organizationId,
        });
        if (error) throw error;
        toast({ title: "Created", description: `Department "${deptName}" created.` });
      }
      setEditDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingDept) return;
    try {
      // Unassign all members from this department first
      if (deletingDept.members.length > 0) {
        const { error: unassignError } = await supabase
          .from("team_members")
          .update({ department_id: null })
          .eq("department_id", deletingDept.id);
        if (unassignError) throw unassignError;
      }

      const { error } = await supabase.from("departments").delete().eq("id", deletingDept.id);
      if (error) throw error;

      toast({ title: "Deleted", description: `Department "${deletingDept.name}" deleted.` });
      setDeleteDialogOpen(false);
      setDeletingDept(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAssignMember = async () => {
    if (!assigningToDept || !selectedMemberId) return;

    try {
      const { error } = await supabase
        .from("team_members")
        .update({ department_id: assigningToDept.id })
        .eq("id", selectedMemberId);

      if (error) throw error;

      const member = allMembers.find((m) => m.id === selectedMemberId);
      toast({
        title: "Assigned",
        description: `${member?.display_name} assigned to ${assigningToDept.name}.`,
      });
      setAssignDialogOpen(false);
      setSelectedMemberId("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRemoveMember = async (memberId: string, deptName: string) => {
    try {
      const { error } = await supabase
        .from("team_members")
        .update({ department_id: null })
        .eq("id", memberId);

      if (error) throw error;

      toast({ title: "Removed", description: `Member removed from ${deptName}.` });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Members not assigned to any department
  const unassignedMembers = allMembers.filter(
    (m) => !m.department_id || !departments.some((d) => d.id === m.department_id)
  );

  // Members available to assign (not in the target dept)
  const availableForAssign = allMembers.filter(
    (m) => m.department_id !== assigningToDept?.id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl !flex !flex-col max-h-[85vh] overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Manage Departments
          </DialogTitle>
          <DialogDescription>
            Create, edit, and manage departments. Assign team members to departments.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="space-y-4 pb-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading departments...</div>
            ) : departments.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No departments yet</p>
              </div>
            ) : (
              departments.map((dept) => (
                <Card key={dept.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        {dept.name}
                        <Badge variant="secondary" className="ml-2">
                          {dept.members.length} {dept.members.length === 1 ? "member" : "members"}
                        </Badge>
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setAssigningToDept(dept);
                            setSelectedMemberId("");
                            setAssignDialogOpen(true);
                          }}
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEdit(dept)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeletingDept(dept);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {dept.description && (
                      <p className="text-sm text-muted-foreground">{dept.description}</p>
                    )}
                  </CardHeader>
                  {dept.members.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {dept.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="w-7 h-7">
                                <AvatarFallback className="text-xs">
                                  {member.display_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="text-sm font-medium">{member.display_name}</span>
                                {member.role && (
                                  <span className="ml-2 text-xs text-muted-foreground capitalize">
                                    {member.role}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveMember(member.id, dept.name)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}

            {/* Unassigned Members */}
            {unassignedMembers.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Unassigned Members ({unassignedMembers.length})
                  </h3>
                  <div className="space-y-1">
                    {unassignedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
                      >
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {member.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member.display_name}</span>
                        {member.role && (
                          <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Department
          </Button>
        </DialogFooter>

        {/* Create/Edit Department Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{editingDept ? "Edit Department" : "Create Department"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g., BOH, FOH, Maintenance"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={deptDescription}
                  onChange={(e) => setDeptDescription(e.target.value)}
                  placeholder="Brief description of this department"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Department?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{deletingDept?.name}".
                {deletingDept && deletingDept.members.length > 0 && (
                  <> {deletingDept.members.length} member(s) will be unassigned.</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Assign Member Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Assign Member to {assigningToDept?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent>
                  {availableForAssign.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.display_name}
                      {member.role && ` (${member.role})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAssignMember} disabled={!selectedMemberId}>
                <UserPlus className="w-4 h-4 mr-2" />
                Assign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
