import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "@/types/people";
import { Users, Shield } from "lucide-react";

interface PeopleStatsProps {
  users: UserProfile[];
}

// Icon + display label per role. Unknown/future roles fall back to a neutral
// dot and a humanised version of the raw role string, so nobody is ever
// dropped from the breakdown.
const ROLE_META: Record<string, { icon: string; label: string }> = {
  admin: { icon: "🔴", label: "Admin" },
  manager: { icon: "🟡", label: "Manager" },
  staff: { icon: "🔵", label: "Staff" },
};

const humanise = (role: string) =>
  role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function PeopleStats({ users }: PeopleStatsProps) {
  const totalUsers = users.length;

  // Count by role dynamically — every role present in the data shows up,
  // including ones not known ahead of time.
  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    const role = (u.role as string) || "unknown";
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const roleEntries = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Total Team Members */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">
                Total Team
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold leading-none">{totalUsers}</p>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {totalUsers} Active
                </Badge>
              </div>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By Role Breakdown */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                By Role
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {roleEntries.length === 0 ? (
                  <span className="text-sm text-muted-foreground">—</span>
                ) : (
                  roleEntries.map(([role, count]) => {
                    const meta = ROLE_META[role] || { icon: "⚪", label: humanise(role) };
                    return (
                      <div key={role} className="flex items-center gap-1 text-sm">
                        <span>{meta.icon}</span>
                        <span className="font-medium">{count}</span>
                        <span className="text-muted-foreground">{meta.label}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
