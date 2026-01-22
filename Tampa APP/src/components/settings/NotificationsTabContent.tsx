import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bell, Mail, Smartphone, TestTube } from "lucide-react";

type NotificationFrequency = "instant" | "hourly" | "daily" | "weekly" | "disabled";

interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  mentions_frequency: NotificationFrequency;
  posts_frequency: NotificationFrequency;
  tasks_frequency: NotificationFrequency;
  labels_frequency: NotificationFrequency;
  inventory_frequency: NotificationFrequency;
  recipes_frequency: NotificationFrequency;
}

const defaultPreferences: NotificationPreferences = {
  email_enabled: true,
  push_enabled: false,
  mentions_frequency: "instant",
  posts_frequency: "daily",
  tasks_frequency: "instant",
  labels_frequency: "hourly",
  inventory_frequency: "daily",
  recipes_frequency: "disabled"
};

export function NotificationsTabContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);

  // Load preferences from localStorage (table doesn't exist yet)
  useEffect(() => {
    if (!user?.id) return;
    
    const saved = localStorage.getItem(`notifications_${user.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[NotificationsTab] Failed to parse preferences:', error);
        }
      }
    }
    setLoading(false);
  }, [user?.id]);

  const savePreferences = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      // Save to localStorage (table doesn't exist yet)
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(preferences));

      toast({
        title: "Success",
        description: "Notification preferences saved successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const sendTestNotification = async () => {
    toast({
      title: "Test Notification",
      description: "This is a test notification. You would receive notifications like this based on your preferences.",
      duration: 5000
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* General Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            General Notification Settings
          </CardTitle>
          <CardDescription>
            Configure how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={preferences.email_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, email_enabled: checked })
              }
            />
          </div>

          <Separator />

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Push Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive push notifications on your device
              </p>
            </div>
            <Switch
              checked={preferences.push_enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, push_enabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types Card */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Frequency by Type</CardTitle>
          <CardDescription>
            Choose how often you want to receive different types of notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mentions */}
          <div className="space-y-2">
            <Label>Mentions & Direct Messages</Label>
            <Select
              value={preferences.mentions_frequency}
              onValueChange={(value: NotificationFrequency) =>
                setPreferences({ ...preferences, mentions_frequency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="hourly">Hourly Digest</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Digest</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              When someone mentions you or sends a direct message
            </p>
          </div>

          <Separator />

          {/* Feed Posts */}
          <div className="space-y-2">
            <Label>Feed Posts & Comments</Label>
            <Select
              value={preferences.posts_frequency}
              onValueChange={(value: NotificationFrequency) =>
                setPreferences({ ...preferences, posts_frequency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="hourly">Hourly Digest</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Digest</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Activity on posts you're following or commented on
            </p>
          </div>

          <Separator />

          {/* Tasks */}
          <div className="space-y-2">
            <Label>Task Assignments & Reminders</Label>
            <Select
              value={preferences.tasks_frequency}
              onValueChange={(value: NotificationFrequency) =>
                setPreferences({ ...preferences, tasks_frequency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="hourly">Hourly Digest</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Digest</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              When tasks are assigned to you or due soon
            </p>
          </div>

          <Separator />

          {/* Labels */}
          <div className="space-y-2">
            <Label>Label Printing & Expiration</Label>
            <Select
              value={preferences.labels_frequency}
              onValueChange={(value: NotificationFrequency) =>
                setPreferences({ ...preferences, labels_frequency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="hourly">Hourly Digest</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Digest</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Products expiring soon or label printing alerts
            </p>
          </div>

          <Separator />

          {/* Inventory */}
          <div className="space-y-2">
            <Label>Inventory Alerts</Label>
            <Select
              value={preferences.inventory_frequency}
              onValueChange={(value: NotificationFrequency) =>
                setPreferences({ ...preferences, inventory_frequency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="hourly">Hourly Digest</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Digest</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Low stock warnings and inventory updates
            </p>
          </div>

          <Separator />

          {/* Recipes */}
          <div className="space-y-2">
            <Label>Recipe Updates</Label>
            <Select
              value={preferences.recipes_frequency}
              onValueChange={(value: NotificationFrequency) =>
                setPreferences({ ...preferences, recipes_frequency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="hourly">Hourly Digest</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Digest</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              New recipes added or recipe modifications
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={savePreferences}
          disabled={saving}
          className="flex-1"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
        <Button
          variant="outline"
          onClick={sendTestNotification}
          className="flex-1"
        >
          <TestTube className="w-4 h-4 mr-2" />
          Test Notification
        </Button>
      </div>
    </div>
  );
}
