// Backbone Step: Venues
// Lets the operator declare the locations they run. Full multi-venue management
// is a paid/franchise feature (gated by plan once Stripe is live) — for now the
// step is shown to everyone and the venues are captured on the organisation.

import { useState } from "react";
import { Plus, X, MapPin, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { VenuesData, VenueEntry } from "@/types/onboarding";

interface VenuesStepProps {
  data: Partial<VenuesData>;
  onChange: (data: Partial<VenuesData>) => void;
  onNext: () => void;
  onBack: () => void;
  // The primary location (their organisation) — shown as the always-present HQ.
  businessName?: string;
}

// Single hook so plan gating can be wired here once Stripe is live.
const canAddVenues = (): boolean => true;

export default function VenuesStep({
  data,
  onChange,
  onNext,
  onBack,
  businessName,
}: VenuesStepProps) {
  const [venues, setVenues] = useState<VenueEntry[]>(data.venues || []);

  const update = (next: VenueEntry[]) => {
    setVenues(next);
    onChange({ venues: next, skipForNow: false });
  };

  const addVenue = () => update([...venues, { name: "", venueLabel: "" }]);

  const updateVenue = (index: number, patch: Partial<VenueEntry>) =>
    update(venues.map((v, i) => (i === index ? { ...v, ...patch } : v)));

  const removeVenue = (index: number) => update(venues.filter((_, i) => i !== index));

  const handleNext = () => {
    const cleaned = venues.filter((v) => v.name.trim());
    onChange({ venues: cleaned, skipForNow: cleaned.length === 0 });
    onNext();
  };

  const handleSkip = () => {
    onChange({ venues: [], skipForNow: true });
    onNext();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <p className="text-sm text-muted-foreground text-center">
        Operating from more than one location? Add your other venues here. You can always
        manage venues later from settings.
      </p>

      {/* Primary location (the organisation itself) */}
      <Card className="bg-muted/40">
        <CardContent className="p-4 flex items-center gap-3">
          <Building2 className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{businessName || "Your business"}</p>
            <p className="text-xs text-muted-foreground">Primary location (HQ)</p>
          </div>
        </CardContent>
      </Card>

      {/* Additional venues */}
      {canAddVenues() ? (
        <div className="space-y-3">
          {venues.map((venue, index) => (
            <Card key={index}>
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Venue name</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={venue.name}
                      onChange={(e) => updateVenue(index, { name: e.target.value })}
                      placeholder="Downtown Branch"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Short label (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={venue.venueLabel || ""}
                      onChange={(e) => updateVenue(index, { venueLabel: e.target.value })}
                      placeholder="CBD"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeVenue(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button type="button" variant="outline" className="w-full" onClick={addVenue}>
            <Plus className="w-4 h-4 mr-2" />
            Add venue
          </Button>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Multi-venue management is available on higher plans. Upgrade to add more locations.
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="button" variant="ghost" onClick={handleSkip} className="flex-1">
          Skip for now
        </Button>
        <Button type="button" onClick={handleNext} className="flex-1" size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
}
