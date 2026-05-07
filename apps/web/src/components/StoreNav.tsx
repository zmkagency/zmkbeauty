"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Scissors, User, LogIn } from "lucide-react";
import { useAuthStore } from "@/lib/auth";

interface StoreNavProps {
  storeSlug: string;
  storeName: string;
  themeColor?: string;
}

/**
 * Shared top nav for the public storefront (/[storeSlug]/*).
 * - Anonymous visitors see "Giriş" link.
 * - Signed-in customers see "Hesabım" (links to /[storeSlug]/account).
 * - Everyone sees the primary "Randevu Al" CTA.
 *
 * Uses useAuthStore directly rather than receiving user via props so the
 * component stays drop-in for any storefront page.
 */
export default function StoreNav({ storeSlug, storeName, themeColor }: StoreNavProps) {
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    loadUser();
    setMounted(true);
  }, [loadUser]);

  const brand = themeColor || "#e11d48";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href={`/${storeSlug}`} className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow"
              style={{ backgroundColor: brand }}
            >
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm" style={{ fontFamily: "var(--font-display)" }}>
              {storeName}
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-6 text-sm">
            <Link href={`/${storeSlug}/services`} className="text-gray-600 hover:text-rose-600 transition-colors">Hizmetler</Link>
            <Link href={`/${storeSlug}/profile`} className="text-gray-600 hover:text-rose-600 transition-colors">Hakkımızda</Link>
            <Link href={`/${storeSlug}/contact`} className="text-gray-600 hover:text-rose-600 transition-colors">İletişim</Link>
          </div>

          <div className="flex items-center gap-2">
            {mounted && isAuthenticated && user?.role === "CUSTOMER" ? (
              <Link
                href={`/${storeSlug}/account`}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-rose-600 px-2 py-1 rounded-lg"
              >
                <User className="w-4 h-4" />
                Hesabım
              </Link>
            ) : mounted ? (
              <Link
                href={`/${storeSlug}/login`}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-rose-600 px-2 py-1 rounded-lg"
              >
                <LogIn className="w-4 h-4" />
                Giriş
              </Link>
            ) : null}

            <Link href={`/${storeSlug}/booking`} className="btn btn-primary btn-sm">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Randevu Al</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
