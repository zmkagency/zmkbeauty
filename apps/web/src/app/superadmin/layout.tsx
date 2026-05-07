"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import {
  LayoutDashboard, Store, Users, Calendar, CreditCard,
  FileText, Settings, LogOut, Menu, Shield, Sparkles
} from "lucide-react";

const navItems = [
  { href: "/superadmin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/superadmin/tenants", label: "Mağazalar", icon: Store },
  { href: "/superadmin/users", label: "Kullanıcılar", icon: Users },
  { href: "/superadmin/appointments", label: "Randevular", icon: Calendar },
  { href: "/superadmin/payments", label: "Ödemeler", icon: CreditCard },
  { href: "/superadmin/logs", label: "Sistem Logları", icon: FileText },
  { href: "/superadmin/settings", label: "Ayarlar", icon: Settings },
];

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loadUser, logout, isAuthenticated, isLoading } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { loadUser(); }, []);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "SUPERADMIN")) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Dark Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2 px-6 h-16 border-b border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-rose flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white" style={{ fontFamily: "var(--font-display)" }}>God Mode</p>
            <p className="text-xs text-gray-500">Superadmin Panel</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? "bg-rose-600/20 text-rose-400" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-rose-500" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-rose flex items-center justify-center text-white text-sm font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4" /> Çıkış Yap
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 lg:ml-64">
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center px-4 lg:px-8 gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-800">
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-white">
            {navItems.find((n) => n.href === pathname)?.label || "Superadmin"}
          </h2>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
