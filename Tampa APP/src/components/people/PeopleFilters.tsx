import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserRole, EmploymentStatus, UserFilters } from "@/types/people";
import { X, Search } from "lucide-react";
import { useState } from "react";

interface PeopleFiltersProps {
  filters: UserFilters;
  onFilterChange: (filters: UserFilters) => void;
  onClearFilters: () => void;
}

export default function PeopleFilters({
  filters,
  onFilterChange,
  onClearFilters,
}: PeopleFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filters.search || "");

  // Count active filters
  const activeFiltersCount = [
    filters.role,
    filters.employment_status,
    filters.search,
  ].filter(Boolean).length;

  const handleRoleChange = (role: string) => {
    onFilterChange({
      ...filters,
      role: role === "all" ? undefined : (role as UserRole),
    });
  };

  const handleStatusChange = (status: string) => {
    onFilterChange({
      ...filters,
      employment_status:
        status === "all" ? undefined : (status as EmploymentStatus),
    });
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onFilterChange({
      ...filters,
      search: value || undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Role Filter */}
        <Select value={filters.role || "all"} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">
              <div className="flex items-center gap-2">
                <span>🔴</span>
                <span>Admin</span>
              </div>
            </SelectItem>
            <SelectItem value="manager">
              <div className="flex items-center gap-2">
                <span>👨‍💼</span>
                <span>Manager</span>
              </div>
            </SelectItem>
            <SelectItem value="leader_chef">
              <div className="flex items-center gap-2">
                <span>👨‍🍳</span>
                <span>Leader Chef</span>
              </div>
            </SelectItem>
            <SelectItem value="cook">
              <div className="flex items-center gap-2">
                <span>🍳</span>
                <span>Cook</span>
              </div>
            </SelectItem>
            <SelectItem value="barista">
              <div className="flex items-center gap-2">
                <span>☕</span>
                <span>Barista</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.employment_status || "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">
              <div className="flex items-center gap-2">
                <span>✅</span>
                <span>Active</span>
              </div>
            </SelectItem>
            <SelectItem value="on_leave">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>On Leave</span>
              </div>
            </SelectItem>
            <SelectItem value="terminated">
              <div className="flex items-center gap-2">
                <span>❌</span>
                <span>Terminated</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="gap-1"
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.role && (
            <Badge variant="secondary" className="gap-1">
              Role: {filters.role.replace("_", " ")}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => handleRoleChange("all")}
              />
            </Badge>
          )}
          {filters.employment_status && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.employment_status.replace("_", " ")}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => handleStatusChange("all")}
              />
            </Badge>
          )}
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: "{filters.search}"
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => handleSearch("")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
