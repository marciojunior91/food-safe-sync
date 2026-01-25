import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { 
  TrainingCategory, 
  TrainingDifficulty,
  TRAINING_CATEGORY_LABELS,
  TRAINING_DIFFICULTY_LABELS 
} from "@/types/training";

export type TrainingFilter = 'all' | 'enrolled' | 'completed' | 'required' | 'expiring';

interface TrainingFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: TrainingFilter;
  onStatusFilterChange: (filter: TrainingFilter) => void;
  categoryFilter: TrainingCategory | 'all';
  onCategoryFilterChange: (category: TrainingCategory | 'all') => void;
  difficultyFilter: TrainingDifficulty | 'all';
  onDifficultyFilterChange: (difficulty: TrainingDifficulty | 'all') => void;
  resultCount?: number;
}

export default function TrainingFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  difficultyFilter,
  onDifficultyFilterChange,
  resultCount
}: TrainingFiltersProps) {
  
  const hasActiveFilters = 
    statusFilter !== 'all' || 
    categoryFilter !== 'all' || 
    difficultyFilter !== 'all' ||
    searchQuery !== '';

  const clearFilters = () => {
    onSearchChange('');
    onStatusFilterChange('all');
    onCategoryFilterChange('all');
    onDifficultyFilterChange('all');
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Courses</Label>
            <Input
              id="search"
              type="search"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Filters Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="required">Required Only</SelectItem>
                  <SelectItem value="enrolled">My Enrollments</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={(value) => onCategoryFilterChange(value as TrainingCategory | 'all')}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(TRAINING_CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Filter */}
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficultyFilter} onValueChange={(value) => onDifficultyFilterChange(value as TrainingDifficulty | 'all')}>
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {Object.entries(TRAINING_DIFFICULTY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters & Results */}
          {(hasActiveFilters || resultCount !== undefined) && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                {resultCount !== undefined && (
                  <span className="text-sm text-muted-foreground">
                    {resultCount} {resultCount === 1 ? 'course' : 'courses'} found
                  </span>
                )}
                {hasActiveFilters && (
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={clearFilters}
                  >
                    Clear filters
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
