"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to observability in production; no-op in dev
    if (typeof window !== "undefined") {
      console.error("[App Error]", error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 mx-auto flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Bir şeyler ters gitti
        </h1>
        <p className="text-gray-500 mb-6">
          İsteğiniz işlenirken beklenmedik bir hata oluştu. Lütfen tekrar deneyin.
        </p>
        {error?.digest && (
          <p className="text-xs text-gray-400 mb-6 font-mono">Hata kimliği: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => reset()} className="btn btn-primary">
            <RefreshCw className="w-4 h-4" /> Tekrar Dene
          </button>
          <Link href="/" className="btn btn-outline">
            <Home className="w-4 h-4" /> Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
