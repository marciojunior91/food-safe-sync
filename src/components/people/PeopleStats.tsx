import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "@/types/people";
import {
  Users,
  UserCheck,
  AlertTriangle,
  Shield,
  ChefHat,
  TrendingUp,
} from "lucide-react";

interface PeopleStatsProps {
  users: UserProfile[];
}

export default function PeopleStats({ users }: PeopleStatsProps) {
  // Calculate statistics
  const totalUsers = users.length;

  // Note: employment_status removed from database - all users are considered active
  const activeUsers = users.length;

  // Count by role - updated to match new role types
  const admins = users.filter((u) => u.role === "admin").length;
  const managers = users.filter((u) => u.role === "manager").length;
  const leaderChefs = users.filter((u) => u.role === "leader_chef").length;
  const staff = users.filter((u) => u.role === "staff").length;

  // Calculate compliance
  const now = new Date();
  const usersWithDocuments = users.filter(
    (u) => u.user_documents && u.user_documents.length > 0
  );

  const compliantUsers = users.filter((user) => {
    if (!user.user_documents || user.user_documents.length === 0) return false;

    const hasExpired = user.user_documents.some((doc) => {
      if (!doc.expiration_date) return false;
      return new Date(doc.expiration_date) < now;
    });

    return !hasExpired;
  });

  const expiringDocuments = users.reduce((count, user) => {
    if (!user.user_documents) return count;

    const expiring = user.user_documents.filter((doc) => {
      if (!doc.expiration_date) return false;
      const expiryDate = new Date(doc.expiration_date);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    });

    return count + expiring.length;
  }, 0);

  const complianceRate =
    usersWithDocuments.length > 0
      ? Math.round((compliantUsers.length / usersWithDocuments.length) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Team Members */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Total Team
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{totalUsers}</p>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <Badge variant="secondary" className="text-xs">
                  ✅ {activeUsers} Active
                </Badge>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By Role Breakdown */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                By Role
              </p>
              <div className="space-y-1">
                {admins > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>🔴</span>
                    <span className="font-medium">{admins}</span>
                    <span className="text-muted-foreground">Admin</span>
                  </div>
                )}
                {managers > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>🟡</span>
                    <span className="font-medium">{managers}</span>
                    <span className="text-muted-foreground">Manager</span>
                  </div>
                )}
                {leaderChefs > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>🟠</span>
                    <span className="font-medium">{leaderChefs}</span>
                    <span className="text-muted-foreground">Leader Chef</span>
                  </div>
                )}
                {staff > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>🔵</span>
                    <span className="font-medium">{staff}</span>
                    <span className="text-muted-foreground">Staff</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Rate */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Compliance
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{complianceRate}%</p>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    complianceRate >= 80
                      ? "bg-green-600"
                      : complianceRate >= 60
                      ? "bg-amber-600"
                      : "bg-red-600"
                  }`}
                  style={{ width: `${complianceRate}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {compliantUsers.length} of {usersWithDocuments.length} users
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expiring Documents */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Expiring Docs
              </p>
              <div className="flex items-baseline gap-2">
                <p
                  className={`text-3xl font-bold ${
                    expiringDocuments > 0 ? "text-amber-600" : "text-green-600"
                  }`}
                >
                  {expiringDocuments}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {expiringDocuments === 0
                  ? "All documents valid"
                  : expiringDocuments === 1
                  ? "Document expiring within 30 days"
                  : "Documents expiring within 30 days"}
              </p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                expiringDocuments > 0 ? "bg-amber-100" : "bg-green-100"
              }`}
            >
              <AlertTriangle
                className={`w-6 h-6 ${
                  expiringDocuments > 0 ? "text-amber-600" : "text-green-600"
                }`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
