import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BarChart3, ClipboardList, Package, Tags, Settings, Menu, X, LogOut, Users, Calendar, GraduationCap, Bell, Lightbulb, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUserRole } from "@/hooks/useUserRole";
import { TampaIcon } from "@/components/TampaIcon";
const navigation = [{
  name: "Dashboard",
  href: "/",
  icon: BarChart3
}, {
  name: "Recipes",
  href: "/recipes",
  icon: ClipboardList
}, {
  name: "Labeling",
  href: "/labeling",
  icon: Tags
}, {
  name: "Drafts",
  href: "/drafts",
  icon: FileText
}, {
  name: "Inventory",
  href: "/inventory",
  icon: Package
}, {
  name: "Daily Routines",
  href: "/routines",
  icon: Calendar
}, {
  name: "Training",
  href: "/training",
  icon: GraduationCap
}, {
  name: "People",
  href: "/people",
  icon: Users
}, {
  name: "Notifications",
  href: "/notifications",
  icon: Bell
}, {
  name: "Product Traffic Light",
  href: "/traffic-light",
  icon: Lightbulb
}, {
  name: "Analytics",
  href: "/analytics",
  icon: BarChart3
}, {
  name: "Settings",
  href: "/settings",
  icon: Settings
}];
export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const {
    signOut,
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    highestRole,
    loading: roleLoading
  } = useUserRole();
  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out."
    });
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40">
      {/* Mobile sidebar */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", sidebarOpen ? "block" : "hidden")}>
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-card border-r shadow-modal">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <TampaIcon className="w-8 h-8" />
              <h1 className="font-bold text-lg">Tampa APP</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <nav className="p-4 space-y-2">
            {navigation.map(item => {
            const isActive = location.pathname === item.href;
            return <a key={item.name} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </a>;
          })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:w-64 lg:flex lg:flex-col">
        <div className="flex flex-col flex-1 bg-card border-r shadow-card">
          <div className="flex items-center gap-2 p-6 border-b">
            <TampaIcon className="w-8 h-8" />
            <h1 className="font-bold text-lg">Tampa APP</h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map(item => {
            const isActive = location.pathname === item.href;
            return <a key={item.name} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-primary text-primary-foreground shadow-card" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </a>;
          })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-card/80 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Organization:</span>
                  <span className="font-medium">Demo Restaurant Group</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Location:</span>
                  <span className="font-medium">Main Kitchen</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-2">
                  {!roleLoading && highestRole && <div className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium capitalize">
                      {highestRole.replace('_', ' ')}
                    </div>}
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {user?.email}
                  </span>
                </div>
                <ThemeToggle />
                <Button variant="outline" size="sm" onClick={handleSignOut} className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:block">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>;
}