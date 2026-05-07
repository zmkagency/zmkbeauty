"use client";

import { usePathname } from "next/navigation";
import StoreNav from "./StoreNav";

const NAV_HIDDEN_SEGMENTS = new Set([
  "login",
  "register",
  "forgot-password",
  "reset-password",
]);

/**
 * Renders the shared storefront nav on browsing pages (/[storeSlug],
 * /[storeSlug]/services, /booking, etc.) but hides it on distraction-free
 * auth pages (login, register, password reset).
 */
export default function StoreLayoutShell({
  storeSlug,
  storeName,
  themeColor,
  children,
}: {
  storeSlug: string;
  storeName: string;
  themeColor?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter(Boolean); // e.g. ["xguzellik", "login"]
  const lastSegment = segments[1] || "";
  const hideNav = NAV_HIDDEN_SEGMENTS.has(lastSegment);

  return (
    <>
      {!hideNav && (
        <StoreNav storeSlug={storeSlug} storeName={storeName} themeColor={themeColor} />
      )}
      {/* When the nav is present, reserve vertical space for the h-14 fixed bar.
          Hero sections that already have their own pt- can just rely on this;
          the extra padding is harmless. */}
      <div className={hideNav ? undefined : "pt-14"}>{children}</div>
    </>
  );
}
