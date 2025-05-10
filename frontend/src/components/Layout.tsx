
import { useState } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  File, 
  LogOut, 
  Menu, 
  Search, 
  Shield, 
  Upload, 
  User, 
  Users, 
  X 
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

interface LayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: LayoutProps) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: File },
    { name: "Documents", href: "/documents", icon: File },
    { name: "Upload", href: "/upload", icon: Upload },
    { name: "Search", href: "/search", icon: Search },
    { name: "Profile", href: "/profile", icon: User },
  ];

  const adminNavigation = [
    { name: "User Management", href: "/admin/users", icon: Users },
    { name: "Settings", href: "/admin/settings", icon: Shield },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-card shadow-sm z-40 flex justify-between items-center p-4">
        <button 
          onClick={toggleSidebar} 
          className="text-muted-foreground hover:text-foreground focus:outline-none"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center">
          <span className="font-semibold text-teal-600 dark:text-teal-400">InsureDocs</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 transform w-64 z-50 transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          "dark:neo-blur bg-card dark:bg-gray-900/70 shadow-lg",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-border/30">
            <Link to="/dashboard" className="flex items-center space-x-2" onClick={closeSidebar}>
              <Shield className="h-6 w-6 text-teal-500" />
              <span className="font-bold text-xl">InsureDocs</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button className="md:hidden" onClick={closeSidebar}>
                <X className="h-6 w-6 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeSidebar}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    location.pathname === item.href
                      ? "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-200"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      location.pathname === item.href
                        ? "text-teal-500"
                        : "text-muted-foreground group-hover:text-accent-foreground"
                    )}
                  />
                  {item.name}
                </Link>
              ))}
              
              {isAdmin && (
                <>
                  <div className="mt-8 px-3">
                    <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Admin
                    </h3>
                  </div>
                  
                  {adminNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={closeSidebar}
                      className={cn(
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                        location.pathname === item.href
                          ? "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-200"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-5 w-5",
                          location.pathname === item.href
                            ? "text-teal-500"
                            : "text-muted-foreground group-hover:text-accent-foreground"
                        )}
                      />
                      {item.name}
                    </Link>
                  ))}
                </>
              )}
            </nav>
          </div>

          <div className="p-4 border-t border-border/30">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-teal-500 to-[#4acfb6] flex items-center justify-center text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </p>
              </div>
            </div>
            <Button 
              onClick={logout}
              variant="outline" 
              className="mt-4 w-full justify-start text-muted-foreground hover:text-foreground dark:border-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-0 flex flex-col bg-gradient-to-br from-[#ff9a80]/5 to-[#4acfb6]/5 dark:from-[#072028]/30 dark:to-[#0d3c46]/30">
        <main className="flex-1 pt-16 md:pt-0">
          <div className="py-6 px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;