import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  LayoutDashboard,
  Shield,
  Server,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(user?.role === "ADMIN"
      ? [
          { to: "/admin", label: "Admin Panel", icon: Shield },
          { to: "/admin/instances", label: "Instances", icon: Server },
        ]
      : []),
  ];

  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 font-semibold text-foreground"
            >
              <Server className="h-5 w-5 text-primary" />
              <span>OdooManager</span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-sm md:flex">
              <span className="text-muted-foreground">{user?.email}</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {user?.role}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {breadcrumbs.length > 1 && (
        <div className="border-b border-border bg-card/50">
          <div className="mx-auto flex h-10 max-w-7xl items-center px-4">
            <nav className="flex items-center gap-1 text-sm">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.path} className="flex items-center gap-1">
                  {i > 0 && (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="font-medium text-foreground">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      to={crumb.path}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}

function getBreadcrumbs(pathname: string) {
  const crumbs: { label: string; path: string }[] = [];

  if (pathname.startsWith("/dashboard")) {
    crumbs.push({ label: "Dashboard", path: "/dashboard" });
  } else if (pathname.startsWith("/admin/instances")) {
    crumbs.push({ label: "Admin", path: "/admin" });
    crumbs.push({ label: "Instances", path: "/admin/instances" });
  } else if (pathname.startsWith("/admin")) {
    crumbs.push({ label: "Admin", path: "/admin" });
  } else if (pathname.startsWith("/projects/")) {
    crumbs.push({ label: "Dashboard", path: "/dashboard" });
    crumbs.push({ label: "Project Details", path: pathname });
  }

  return crumbs;
}
