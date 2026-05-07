"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Scissors, Mail, Lock, ArrowRight, Eye, EyeOff, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";

function StoreLoginInner() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") || "";
  const { loginCustomer } = useAuthStore();

  const [store, setStore] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/tenants/slug/${storeSlug}`).then((res) => setStore(res.data)).catch(() => {});
  }, [storeSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginCustomer(email, password);
      const target = redirect === "booking" ? `/${storeSlug}/booking` : `/${storeSlug}/account`;
      router.push(target);
    } catch (err: any) {
      setError(err.response?.data?.message || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  const brandColor = store?.themeColor || "#e11d48";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link href={`/${storeSlug}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> {store?.name || "Mağazaya Dön"}
        </Link>

        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: brandColor }}>
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>Giriş Yap</h1>
              <p className="text-xs text-gray-500">{store?.name || "Mağaza"} hesabınız</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-11" placeholder="ornek@email.com" required />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Şifre</label>
                <Link href={`/${storeSlug}/forgot-password`} className="text-xs text-rose-600 hover:underline">Şifremi unuttum</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-11 pr-11"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn btn-primary btn-lg">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Giriş Yap <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Henüz üye değil misiniz?{" "}
            <Link href={`/${storeSlug}/register${redirect ? `?redirect=${redirect}` : ""}`} className="font-semibold text-rose-600 hover:text-rose-700">
              Kayıt Ol
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function StoreLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>}>
      <StoreLoginInner />
    </Suspense>
  );
}
