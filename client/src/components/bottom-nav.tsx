import { Link, useLocation } from "wouter";
import { LayoutDashboard, Cpu, CreditCard, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/machines", icon: Cpu, label: "Machines" },
  { path: "/payments", icon: CreditCard, label: "Payments" },
];

export function BottomNav() {
  const [location] = useLocation();
  const { logout } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={`
                  flex flex-col items-center justify-center gap-1 px-4 py-2
                  transition-colors duration-200 min-w-[72px]
                  ${
                    isActive
                      ? "text-blue-400"
                      : "text-muted-foreground"
                  }
                `}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "drop-shadow-lg" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute bottom-1 w-8 h-0.5 bg-gradient-to-r from-blue-400 to-amber-400 rounded-full" />
                )}
              </button>
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="flex flex-col items-center justify-center gap-1 px-4 py-2 text-muted-foreground hover:text-destructive transition-colors duration-200"
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}
