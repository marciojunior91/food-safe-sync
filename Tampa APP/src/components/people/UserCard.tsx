import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "@/types/people";
import {
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneNumber } from "@/utils/phoneFormat";

interface UserCardProps {
  user: UserProfile;
  onEdit?: (user: UserProfile) => void;
  showActions?: boolean;
}

export default function UserCard({
  user,
  onEdit,
  showActions = true,
}: UserCardProps) {
  // Get role configuration - updated to match new role types
  const getRoleConfig = () => {
    switch (user.role) {
      case "admin":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: "🔴",
          label: "Admin",
        };
      case "manager":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: "�",
          label: "Manager",
        };
      case "staff":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: "🔵",
          label: "Staff",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: "⚪",
          label: "Unknown",
        };
    }
  };

  // Note: employment_status field removed from database - all users considered active
  const getStatusConfig = () => {
    return {
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
      label: "Active",
    };
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const roleConfig = getRoleConfig();
  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-20 h-20 border-2 border-muted">
              <AvatarImage src={user.avatar_url} alt={user.display_name} />
              <AvatarFallback className="text-xl font-semibold">
                {getInitials(user.display_name)}
              </AvatarFallback>
            </Avatar>
            {/* Status indicator */}
            <div
              className={cn(
                "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center",
                statusConfig.bgColor
              )}
            >
              <StatusIcon className={cn("w-3 h-3", statusConfig.color)} />
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-2 w-full">
            {/* Name */}
            <h3 className="font-semibold text-lg leading-tight">
              {user.display_name}
            </h3>

            {/* Role Badge */}
            <Badge className={cn("border", roleConfig.color)}>
              <span className="mr-1">{roleConfig.icon}</span>
              {roleConfig.label}
            </Badge>

            {/* Position */}
            {user.position && (
              <p className="text-sm text-muted-foreground">{user.position}</p>
            )}

            {/* Department */}
            {user.department_id && (
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Building2 className="w-3 h-3" />
                <span>Department</span>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="w-full space-y-1">
            {user.email && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Mail className="w-3 h-3" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Phone className="w-3 h-3" />
                <span>{formatPhoneNumber(user.phone)}</span>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="w-full pt-3 border-t space-y-2">
            {/* Employment Status */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline" className={cn("text-green-700 border-green-300", statusConfig.bgColor)}>
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          {showActions && onEdit && (
            <div className="flex items-center gap-2 w-full pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit(user)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
