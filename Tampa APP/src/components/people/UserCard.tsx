import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "@/types/people";
import {
  User,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneNumber } from "@/utils/phoneFormat";

interface UserCardProps {
  user: UserProfile;
  onViewProfile?: (user: UserProfile) => void;
  onEdit?: (user: UserProfile) => void;
  showActions?: boolean;
}

export default function UserCard({
  user,
  onViewProfile,
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
          icon: "👨‍💼",
          label: "Manager",
        };
      case "leader_chef":
        return {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          icon: "👨‍🍳",
          label: "Leader Chef",
        };
      case "cook":
        return {
          color: "bg-purple-100 text-purple-800 border-purple-200",
          icon: "🍳",
          label: "Cook",
        };
      case "barista":
        return {
          color: "bg-amber-100 text-amber-800 border-amber-200",
          icon: "☕",
          label: "Barista",
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
      bgColor: "bg-green-50",
      label: "Active",
    };
  };

  // Calculate compliance status
  const getComplianceStatus = () => {
    if (!user.user_documents || user.user_documents.length === 0) {
      return {
        icon: AlertTriangle,
        color: "text-amber-600",
        label: "No Documents",
      };
    }

    const now = new Date();
    const expiringSoon = user.user_documents.filter((doc) => {
      if (!doc.expiration_date) return false;
      const expiryDate = new Date(doc.expiration_date);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    });

    const expired = user.user_documents.filter((doc) => {
      if (!doc.expiration_date) return false;
      return new Date(doc.expiration_date) < now;
    });

    if (expired.length > 0) {
      return {
        icon: XCircle,
        color: "text-red-600",
        label: `${expired.length} Expired`,
      };
    }

    if (expiringSoon.length > 0) {
      return {
        icon: AlertTriangle,
        color: "text-amber-600",
        label: `${expiringSoon.length} Expiring Soon`,
      };
    }

    return {
      icon: CheckCircle2,
      color: "text-green-600",
      label: "Compliant",
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
  const complianceStatus = getComplianceStatus();
  const StatusIcon = statusConfig.icon;
  const ComplianceIcon = complianceStatus.icon;

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
              <Badge variant="outline" className={statusConfig.bgColor}>
                {statusConfig.label}
              </Badge>
            </div>

            {/* Compliance */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Compliance</span>
              <div className="flex items-center gap-1">
                <ComplianceIcon className={cn("w-4 h-4", complianceStatus.color)} />
                <span className={cn("text-xs font-medium", complianceStatus.color)}>
                  {complianceStatus.label}
                </span>
              </div>
            </div>

            {/* Documents Count */}
            {user.user_documents && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Documents</span>
                <span className="text-xs font-medium">
                  {user.user_documents.length}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-2 w-full pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onViewProfile?.(user)}
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEdit(user)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
