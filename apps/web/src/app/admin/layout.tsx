"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import {
  LayoutDashboard, Scissors, Users, Calendar, Clock,
  UserCircle, Settings, LogOut, Menu, X, Sparkles,
  CalendarOff, CreditCard
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/appointments", label: "Randevular", icon: Calendar },
  { href: "/admin/services", label: "Hizmetler", icon: Scissors },
  { href: "/admin/employees", label: "Çalışanlar", icon: Users },
  { href: "/admin/customers", label: "Müşteriler", icon: UserCircle },
  { href: "/admin/closures", label: "Kapalı Günler", icon: CalendarOff },
  { href: "/admin/payments", label: "Ödemeler", icon: CreditCard },
  { href: "/admin/settings", label: "Ayarlar", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loadUser, logout, isAuthenticated, isLoading } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { loadUser(); }, []);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== "STORE_ADMIN" && user?.role !== "SUPERADMIN"))) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2 px-6 h-16 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-gradient-rose flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ fontFamily: "var(--font-display)" }}>Mağaza Paneli</p>
            <p className="text-xs text-gray-400">ZMK Beauty</p>
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
                  isActive ? "bg-rose-50 text-rose-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-rose-600" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-rose flex items-center justify-center text-white text-sm font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full btn btn-ghost btn-sm text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4" /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:ml-64">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 lg:px-8 gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-gray-900">
            {navItems.find((n) => n.href === pathname)?.label || "Panel"}
          </h2>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
