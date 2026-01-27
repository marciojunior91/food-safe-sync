import { AdminPanel } from "@/components/admin/AdminPanel";
import { ProfileTabContent } from "@/components/settings/ProfileTabContent";
import { NotificationsTabContent } from "@/components/settings/NotificationsTabContent";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, User, Bell, Shield, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [preloadedComponents, setPreloadedComponents] = useState({
    profile: false,
    notifications: false,
    admin: false,
    billing: false
  });

  // Preload all components on mount for faster tab switching
  useEffect(() => {
    // Small delay to ensure page loads smoothly first
    const timer = setTimeout(() => {
      setPreloadedComponents({
        profile: true,
        notifications: true,
        admin: isAdmin,
        billing: true
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isAdmin]);

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
          {preloadedComponents.profile && <ProfileTabContent />}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4 mt-6">
          {preloadedComponents.notifications && <NotificationsTabContent />}
        </TabsContent>

        {/* Admin Tab */}
        {isAdmin && (
          <TabsContent value="admin" className="space-y-4 mt-6">
            {preloadedComponents.admin && <AdminPanel />}
          </TabsContent>
        )}

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4 mt-6">
          {preloadedComponents.billing && (
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
          )}
        </TabsContent>
        
        {/* Hidden preload containers for instant loading */}
        <div className="hidden">
          {!preloadedComponents.profile && <ProfileTabContent />}
          {!preloadedComponents.notifications && <NotificationsTabContent />}
          {isAdmin && !preloadedComponents.admin && <AdminPanel />}
        </div>
      </Tabs>
    </div>
  );
}
