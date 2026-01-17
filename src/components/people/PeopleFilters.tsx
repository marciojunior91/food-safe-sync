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
import { Separator } from "@/components/ui/separator";
import { UserRole, EmploymentStatus, UserFilters } from "@/types/people";
import { X, Search, Filter, ArrowUpDown } from "lucide-react";
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Count active filters
  const activeFiltersCount = [
    filters.role,
    filters.employment_status,
    filters.department_id,
    filters.active_only,
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

  const handleActiveOnlyToggle = () => {
    onFilterChange({
      ...filters,
      active_only: !filters.active_only,
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
      {/* Quick Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="relative"
        >
          <Filter className="w-4 h-4" />
          {activeFiltersCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

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

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4" />
                Sort By
              </label>
              <Select defaultValue="name">
                <SelectTrigger>
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department Filter (Placeholder) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="kitchen">
                    <div className="flex items-center gap-2">
                      <span>👨‍🍳</span>
                      <span>Kitchen</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bar">
                    <div className="flex items-center gap-2">
                      <span>☕</span>
                      <span>Bar</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="management">
                    <div className="flex items-center gap-2">
                      <span>💼</span>
                      <span>Management</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Compliance Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Compliance</label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="compliant">
                    <div className="flex items-center gap-2">
                      <span>✅</span>
                      <span>Compliant</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="expiring">
                    <div className="flex items-center gap-2">
                      <span>⚠️</span>
                      <span>Expiring Soon</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="non_compliant">
                    <div className="flex items-center gap-2">
                      <span>❌</span>
                      <span>Non-Compliant</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

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
          {filters.active_only && (
            <Badge variant="secondary" className="gap-1">
              Active Only
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={handleActiveOnlyToggle}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
