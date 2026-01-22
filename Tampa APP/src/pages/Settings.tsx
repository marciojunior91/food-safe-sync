import { AdminPanel } from "@/components/admin/AdminPanel";
import { ProfileTabContent } from "@/components/settings/ProfileTabContent";
import { NotificationsTabContent } from "@/components/settings/NotificationsTabContent";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, User, Bell, Shield, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

export default function SettingsPage() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin">
              <Shield className="w-4 h-4 mr-2" />
              Admin
            </TabsTrigger>
          )}
          <TabsTrigger value="billing">
            <CreditCard className="w-4 h-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4 mt-6">
          <ProfileTabContent />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4 mt-6">
          <NotificationsTabContent />
        </TabsContent>

        {/* Admin Tab */}
        {isAdmin && (
          <TabsContent value="admin" className="space-y-4 mt-6">
            <AdminPanel />
          </TabsContent>
        )}

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Navigate to <a href="/billing" className="text-blue-600 hover:underline">Billing page</a> for full details.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
