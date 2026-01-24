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
    <div className="space-y-4 md:space-y-6 px-2 md:px-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 md:w-8 md:h-8" />
          Settings
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'} gap-1`}>
          <TabsTrigger value="profile" className="text-xs md:text-sm py-2 md:py-3">
            <User className="w-4 h-4 md:mr-2" />
            <span className="hidden sm:inline ml-1 md:ml-0">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs md:text-sm py-2 md:py-3">
            <Bell className="w-4 h-4 md:mr-2" />
            <span className="hidden sm:inline ml-1 md:ml-0">Notifications</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin" className="text-xs md:text-sm py-2 md:py-3">
              <Shield className="w-4 h-4 md:mr-2" />
              <span className="hidden sm:inline ml-1 md:ml-0">Admin</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="billing" className="text-xs md:text-sm py-2 md:py-3">
            <CreditCard className="w-4 h-4 md:mr-2" />
            <span className="hidden sm:inline ml-1 md:ml-0">Billing</span>
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
