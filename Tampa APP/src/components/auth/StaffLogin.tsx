import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StaffLoginProps {
  open: boolean;
  onStaffSelected: (staff: any) => void;
}

export function StaffLogin({ open, onStaffSelected }: StaffLoginProps) {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchStaff();
    }
  }, [open]);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setStaffList(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: "Failed to load staff list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStaffSelect = (staff: any) => {
    // Store selected staff in localStorage for session
    localStorage.setItem('selectedStaff', JSON.stringify(staff));
    onStaffSelected(staff);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Kitchen Staff Login
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Kitchen Staff Login
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Please select your name to continue to the kitchen dashboard
          </p>

          {staffList.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No active staff members found</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Please contact your administrator to add staff members
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {staffList.map((staff) => (
                <Card 
                  key={staff.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleStaffSelect(staff)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{staff.name}</span>
                        <p className="text-xs text-muted-foreground">{staff.role}</p>
                      </div>
                      <UserCheck className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Your selection will be remembered for this session
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}