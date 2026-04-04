import { Building2, ChevronDown, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useVenues } from '@/hooks/useVenues';

interface VenueSelectorProps {
  className?: string;
}

/**
 * Venue selector dropdown for the header.
 * Only renders when the user's org is part of a franchise group with multiple venues.
 * Should only be shown to admin users.
 */
export function VenueSelector({ className }: VenueSelectorProps) {
  const { venues, currentVenue, selectVenue, hasMultipleVenues, loading } = useVenues();

  // Don't render if not part of a franchise or only one venue
  if (loading || !hasMultipleVenues) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center gap-2 max-w-[280px] h-9",
            className
          )}
        >
          <Building2 className="w-4 h-4 flex-shrink-0 text-primary" />
          <span className="truncate text-sm font-medium">
            {currentVenue?.venue_label || currentVenue?.name || 'Select Venue'}
          </span>
          <ChevronDown className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Switch Venue
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {venues.map((venue) => (
          <DropdownMenuItem
            key={venue.id}
            onClick={() => selectVenue(venue.id)}
            className={cn(
              "flex items-center gap-3 cursor-pointer py-2.5",
              venue.id === currentVenue?.id && "bg-primary/10"
            )}
          >
            <MapPin className={cn(
              "w-4 h-4 flex-shrink-0",
              venue.is_parent ? "text-primary" : "text-muted-foreground"
            )} />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{venue.name}</span>
              {venue.venue_label && (
                <span className="text-xs text-muted-foreground truncate">
                  {venue.venue_label}
                </span>
              )}
            </div>
            {venue.is_parent && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0">
                HQ
              </Badge>
            )}
            {venue.id === currentVenue?.id && (
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
