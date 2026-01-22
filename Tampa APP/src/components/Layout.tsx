import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { BarChart3, ClipboardList, Package, Tags, Settings, Menu, X, LogOut, Users, Calendar, GraduationCap, Bell, AlertTriangle, BookOpen, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserContext } from "@/hooks/useUserContext";
import { TampaIcon } from "@/components/TampaIcon";
const navigation = [{
  name: "Dashboard",
  href: "/",
  icon: BarChart3
}, {
  name: "Labeling",
  href: "/labeling",
  icon: Tags
}, {
  name: "Expiring Soon",
  href: "/expiring-soon",
  icon: AlertTriangle
}, {
  name: "Inventory",
  href: "/inventory",
  icon: Package
}, {
  name: "Recipes",
  href: "/recipes",
  icon: ClipboardList
}, {
  name: "Routine Tasks",
  href: "/routine-tasks",
  icon: Calendar
}, {
  name: "People",
  href: "/people",
  icon: Users
}, {
  name: "Feed",
  href: "/feed",
  icon: Bell
}, {
  name: "Knowledge Base",
  href: "/knowledge-base",
  icon: BookOpen
}, {
  name: "Training Center",
  href: "/training",
  icon: GraduationCap
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
    role,
    loading: roleLoading
  } = useUserRole();
  const {
    organization,
    department,
    loading: contextLoading
  } = useUserContext();
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
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r shadow-modal">
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
            return <a key={item.name} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </a>;
          })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:w-64 lg:flex lg:flex-col">
        <div className="flex flex-col flex-1 bg-sidebar border-r shadow-card">
          <div className="flex items-center gap-2 p-6 border-b">
            <TampaIcon className="w-8 h-8" />
            <h1 className="font-bold text-lg">Tampa APP</h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map(item => {
            const isActive = location.pathname === item.href;
            return <a key={item.name} href={item.href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </a>;
          })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center gap-4">
                {!contextLoading && (
                  <>
                    {organization && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Organization:</span>
                        <span className="font-medium">{organization.name}</span>
                      </div>
                    )}
                    {department && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Department:</span>
                        <span className="font-medium">{department.name}</span>
                      </div>
                    )}
                  </>
                )}
                {contextLoading && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                
                {/* User Menu Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline">{user?.email?.split('@')[0] || 'User'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.email}</p>
                        {!roleLoading && role && (
                          <p className="text-xs leading-none text-muted-foreground capitalize">
                            {role.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/people" className="flex items-center cursor-pointer">
                        <Users className="w-4 h-4 mr-2" />
                        Team Members
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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