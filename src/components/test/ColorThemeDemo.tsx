// Color Theme Demo - Tampa Orange Secondary
// Use this to visualize the new color scheme

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ColorThemeDemo() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Tampa APP - Color Theme</h1>
        <p className="text-muted-foreground">
          New secondary color: Tampa Orange
        </p>
      </div>

      {/* Buttons Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button variant="default">Primary Button</Button>
          <Button variant="secondary">Secondary Button (Orange)</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </CardContent>
      </Card>

      {/* Badges Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Badge variant="default">Default Badge</Badge>
          <Badge variant="secondary">Secondary Badge (Orange)</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </CardContent>
      </Card>

      {/* Color Swatches */}
      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Primary (Blue - adapts to theme)</p>
            <div className="flex gap-2">
              <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground text-xs">Primary</span>
              </div>
              <div className="w-20 h-20 bg-primary-light rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground text-xs">Light</span>
              </div>
            </div>
          </div>

          {/* Secondary - Tampa Orange */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Secondary (Tampa Orange - consistent)</p>
            <div className="flex gap-2">
              <div className="w-20 h-20 bg-secondary rounded-lg flex items-center justify-center">
                <span className="text-secondary-foreground text-xs">Orange</span>
              </div>
              <div className="w-20 h-20 bg-secondary-light rounded-lg flex items-center justify-center">
                <span className="text-secondary-foreground text-xs">Light</span>
              </div>
            </div>
          </div>

          {/* Success */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Success (Green - for status)</p>
            <div className="flex gap-2">
              <div className="w-20 h-20 bg-success rounded-lg flex items-center justify-center">
                <span className="text-success-foreground text-xs">Success</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Warning (Amber)</p>
            <div className="flex gap-2">
              <div className="w-20 h-20 bg-warning rounded-lg flex items-center justify-center">
                <span className="text-warning-foreground text-xs">Warning</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gradients */}
      <Card>
        <CardHeader>
          <CardTitle>Gradients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-24 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold">Primary Gradient</span>
          </div>
          <div className="h-24 bg-gradient-secondary rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold">Secondary Gradient (Orange)</span>
          </div>
          <div className="h-24 bg-gradient-hero rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold">Hero Gradient (Blue to Orange)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
