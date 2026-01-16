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
import { FeedChannel, FeedType, FeedPriority, FeedFilters } from "@/types/feed";
import { X, Search, Filter } from "lucide-react";
import { useState } from "react";

interface FeedFiltersProps {
  filters: FeedFilters;
  onFilterChange: (filters: FeedFilters) => void;
  onClearFilters: () => void;
}

export default function FeedFiltersComponent({
  filters,
  onFilterChange,
  onClearFilters,
}: FeedFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Count active filters
  const activeFiltersCount = [
    filters.channel,
    filters.type,
    filters.priority,
    filters.unread_only,
    filters.date_from,
    filters.date_to,
  ].filter(Boolean).length;

  const handleChannelChange = (channel: string) => {
    onFilterChange({
      ...filters,
      channel: channel === "all" ? undefined : (channel as FeedChannel),
    });
  };

  const handleTypeChange = (type: string) => {
    onFilterChange({
      ...filters,
      type: type === "all" ? undefined : (type as FeedType),
    });
  };

  const handlePriorityChange = (priority: string) => {
    onFilterChange({
      ...filters,
      priority: priority === "all" ? undefined : (priority as FeedPriority),
    });
  };

  const handleUnreadToggle = () => {
    onFilterChange({
      ...filters,
      unread_only: !filters.unread_only,
    });
  };

  const handleSearch = () => {
    // Search functionality could be added to the parent component
    console.log("Searching for:", searchQuery);
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
              placeholder="Search feed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
        </div>

        {/* Channel Filter */}
        <Select
          value={filters.channel || "all"}
          onValueChange={handleChannelChange}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="general">
              <div className="flex items-center gap-2">
                <span>📢</span>
                <span>General</span>
              </div>
            </SelectItem>
            <SelectItem value="baristas">
              <div className="flex items-center gap-2">
                <span>☕</span>
                <span>Baristas</span>
              </div>
            </SelectItem>
            <SelectItem value="cooks">
              <div className="flex items-center gap-2">
                <span>👨‍🍳</span>
                <span>Cooks</span>
              </div>
            </SelectItem>
            <SelectItem value="maintenance">
              <div className="flex items-center gap-2">
                <span>🔧</span>
                <span>Maintenance</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Unread Filter */}
        <Button
          variant={filters.unread_only ? "default" : "outline"}
          size="default"
          onClick={handleUnreadToggle}
          className="gap-2"
        >
          {filters.unread_only ? "Unread Only" : "All"}
        </Button>

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
            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={filters.type || "all"}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="task_delegated">
                    <div className="flex items-center gap-2">
                      <span>📋</span>
                      <span>Task Assigned</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pending_docs">
                    <div className="flex items-center gap-2">
                      <span>⚠️</span>
                      <span>Document Alert</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="custom_note">
                    <div className="flex items-center gap-2">
                      <span>📝</span>
                      <span>Announcement</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="maintenance">
                    <div className="flex items-center gap-2">
                      <span>🔧</span>
                      <span>Maintenance</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <span>⚙️</span>
                      <span>System</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={filters.priority || "all"}
                onValueChange={handlePriorityChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2">
                      <span>🔴</span>
                      <span>Critical</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <span>🟡</span>
                      <span>High</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="normal">
                    <div className="flex items-center gap-2">
                      <span>⚪</span>
                      <span>Normal</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <span>⬇️</span>
                      <span>Low</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range (Placeholder) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Button variant="outline" className="w-full justify-start">
                📅 Select Range
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.channel && (
            <Badge variant="secondary" className="gap-1">
              Channel: {filters.channel}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => handleChannelChange("all")}
              />
            </Badge>
          )}
          {filters.type && (
            <Badge variant="secondary" className="gap-1">
              Type: {filters.type.replace("_", " ")}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => handleTypeChange("all")}
              />
            </Badge>
          )}
          {filters.priority && (
            <Badge variant="secondary" className="gap-1">
              Priority: {filters.priority}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => handlePriorityChange("all")}
              />
            </Badge>
          )}
          {filters.unread_only && (
            <Badge variant="secondary" className="gap-1">
              Unread Only
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={handleUnreadToggle}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
