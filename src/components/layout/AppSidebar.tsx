import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  AlertCircle,
  PlusCircle,
  Search,
  BarChart3,
  Map,
  Settings,
  Users,
  HelpCircle,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Live Monitoring", url: "/monitoring", icon: Video },
  { title: "Violations", url: "/violations", icon: AlertCircle },
  { title: "Add Violation", url: "/add-violation", icon: PlusCircle },
  { title: "Vehicle History", url: "/vehicle-history", icon: Search },
  { title: "Reports & Stats", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: HelpCircle },
];

const adminOnlyItems = [
  { title: "User Management", url: "/users", icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { isAdmin } = useUserRole();
  const { signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;
  const collapsed = state === "collapsed";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-4 border-b border-sidebar-border">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="w-10 h-10" />
              <div>
                <h2 className="text-sm font-semibold text-sidebar-foreground">
                  AI Traffic System
                </h2>
                <p className="text-xs text-sidebar-foreground/60">Violation Detection</p>
              </div>
            </div>
          ) : (
            <img src={logo} alt="Logo" className="w-8 h-8 mx-auto" />
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && adminOnlyItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button onClick={signOut} className="flex items-center gap-3 text-destructive w-full">
                <LogOut className="h-5 w-5" />
                {!collapsed && <span>Logout</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
